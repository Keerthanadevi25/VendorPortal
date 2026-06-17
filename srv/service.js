const cds = require('@sap/cds');
const { SELECT, UPDATE } = cds.ql;

// Single source of truth for testing fallback email address
const MOCK_USER_EMAIL = 'keerthanadevi.natarajan@distrelec.com';

module.exports = cds.service.impl(async function () {

  // External service
  const CE_PURCHASEORDER_0001 = await cds.connect.to('CE_PURCHASEORDER_0001');
  const { PurchaseOrder } = CE_PURCHASEORDER_0001.entities;

  // Local entities
  const { MappingVendors, PurchaseOrder_ERP1 } = this.entities;

  // Helper: get mapped vendor for current user
  async function getMappedVendorForUser(userEmail) {
    return cds.run(
      SELECT.one.from(MappingVendors)
        .columns('VendorERPNumber')
        .where({ Email: userEmail })
    );
  }

  // --------------------------------------------------------------------
  // READ PurchaseOrders (external API)
  // --------------------------------------------------------------------
  this.on('READ', 'PurchaseOrders', async (req) => {
    try {
      // Use live authenticated user ID if it looks like an email, otherwise fallback to mock
      const userEmail = req.user.id.includes('@') ? req.user.id : MOCK_USER_EMAIL;

      const mappedVendor = await getMappedVendorForUser(userEmail);
      if (!mappedVendor) {
        const empty = [];
        empty.$count = 0;
        return empty;
      }

      const pur_orders = await CE_PURCHASEORDER_0001.send({
        query: SELECT.from(PurchaseOrder)
          .columns(
            'PurchaseOrder',
            'Supplier',
            'PurchaseOrderType',
            'PurchaseOrderDate',
            'CreationDate'
          )
          .where({ Supplier: mappedVendor.VendorERPNumber })
          .limit(10),
        headers: { Accept: 'application/json' }
      });

      pur_orders.$count = pur_orders.length;
      return pur_orders;

    } catch (error) {
      req.error(500, `External API Error: ${error.message}`);
    }
  });

  // --------------------------------------------------------------------
  // READ PurchaseOrder_ERP1 (internal DB, draft‑enabled)
  // --------------------------------------------------------------------
  this.before('READ', 'PurchaseOrder_ERP1', async (req) => {
    
    if (req.event !== 'READ') return;
    if (req.target?.isDraft) return;

    // Skip if targeting a specific record payload directly by key parameters
    if (req.data && req.data.ID) return;

    // Refined safety check: Only bypass filter if the incoming request is definitively a single-row lookup
    if (req.query && req.query.SELECT) {
      const selectFrom = req.query.SELECT.from;
      if (selectFrom && selectFrom.ref) {
        const primarySegment = selectFrom.ref[0];
        // If query targets single ID format like PurchaseOrder_ERP1(ID='...') or explicit where key
        if (primarySegment && primarySegment.where) {
          const whereStr = JSON.stringify(primarySegment.where);
          if (whereStr.includes('"ID"') || whereStr.includes('"ref":["ID"]')) return;
        }
      }
      
      if (req.query.SELECT.where) {
        const whereStr = JSON.stringify(req.query.SELECT.where);
        // Do not alter runtime queries looking up exact instance keys or checking draft status layers
        if (whereStr.includes('"ID"') || whereStr.includes('"ref":["ID"]') || whereStr.includes('IsActiveEntity')) {
          return;
        }
      }
    }

    try {
      // FIX: Typo resolved by utilizing unified string variable
      const userEmail = req.user.id.includes('@') ? req.user.id : MOCK_USER_EMAIL;
      const mappedVendor = await getMappedVendorForUser(userEmail);
      
      if (mappedVendor && mappedVendor.VendorERPNumber) {
        // Safe OData query mutation injects vendor runtime filter parameter criteria
        req.query.where({ VendorERPNumber: mappedVendor.VendorERPNumber });
      } else {
        // Force empty collection returns safely if mapping entry does not exist
        req.query.where({ VendorERPNumber: 'NOT_BOUND_USER_MAPPING' });
      }

    } catch (error) {
      req.error(500, `Internal Row Filter Error: ${error.message}`);
    }
  });

  // --------------------------------------------------------------------
  // ACTION: Acknowledge PurchaseOrder_ERP1
  // --------------------------------------------------------------------
  this.on('Acknowledge', 'PurchaseOrder_ERP1', async (req) => {
    try {
      let targetID = null;

      if (req.params) {
        if (Array.isArray(req.params) && req.params.length > 0) {
          targetID = req.params[0].ID;
        } else if (typeof req.params === 'object') {
          targetID = req.params.ID;
        } else if (typeof req.params === 'string') {
          targetID = req.params;
        }
      }

      if (!targetID && req.data && req.data.ID) {
        targetID = req.data.ID;
      }

      if (!targetID) {
        return req.error(400, 'Target Instance Identifier (ID) is missing.');
      }

      await UPDATE(req.target)
        .set({ Status: 'Live' })
        .where({ ID: targetID });

      if (req.target.drafts) {
        await UPDATE(req.target.drafts)
          .set({ Status: 'Live' })
          .where({ ID: targetID });
      }

      return true;

    } catch (error) {     
      req.error(500, `Action Execution Error: ${error.message}`);
    }
  });

});
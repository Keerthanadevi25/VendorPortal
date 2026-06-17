const cds = require('@sap/cds');
const { SELECT, UPDATE } = cds.ql;

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
      // In real life: const userEmail = req.user.id;
      const userEmail = 'keerthanadevi.natarajan@distrelec.com';

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
  //  - Lets CAP handle all draft, navigation, and single-entity reads
  //  - Applies vendor filter strictly to multi-row list queries
  // --------------------------------------------------------------------
  this.before('READ', 'PurchaseOrder_ERP1', async (req) => {
    
    if (req.event !== 'READ') return;

    // 1. Skip if it is explicitly a draft runtime request
    if (req.target?.isDraft) return;

    // 2. Skip if we are targeting a specific record by its primary key payload
    if (req.data && req.data.ID) return;

    // 3. Robust AST checking on the incoming query structure
    if (req.query && req.query.SELECT) {
      const selectFrom = req.query.SELECT.from;
      
      // Look for OData key predicates directly on the entity segments (e.g. ref: [{ id: 'PurchaseOrder_ERP1', where: [...] }])
      if (selectFrom && selectFrom.ref) {
        const primarySegment = selectFrom.ref[0];
        if (primarySegment && (primarySegment.where || (typeof primarySegment === 'object' && primarySegment.id && primarySegment.id.includes('(')))) {
          return;
        }
      }

      // Look for direct key lookups inside standard WHERE or JOIN definitions
      if (req.query.SELECT.where) {
        const whereStr = JSON.stringify(req.query.SELECT.where);
        if (whereStr.includes('"ID"') || whereStr.includes('"ref":["ID"]') || whereStr.includes('IsActiveEntity')) {
          return;
        }
      }
    }

    
    try {
      const userEmail = 'keerthanadevi.natarjan@distrelec.com';
      const mappedVendor = await getMappedVendorForUser(userEmail);
      const vendorNo = mappedVendor ? mappedVendor.VendorERPNumber : 'NOT_FOUND';

      // Inject the vendor scoping parameter onto the collection query safely
      req.query.where({ VendorERPNumber: vendorNo });

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

      // Extract the key parameter safely across alternative variant types
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

      // Cleanly sync status directly into the backup draft state if a draft exists
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
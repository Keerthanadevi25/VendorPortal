const cds = require('@sap/cds');
const { SELECT } = cds.ql;

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
  //  - lets CAP handle all draft + navigation reads
  //  - applies vendor filter only for list reads
  // --------------------------------------------------------------------
this.before('READ', 'PurchaseOrder_ERP1', async (req) => {
    
    if (req.event !== 'READ') {
        return;
    }

      if (req.target?.isDraft || (req.data && req.data.ID)) {
        return; 
    }

  
    if (!req.query || !req.query.SELECT || !req.query.SELECT.from) {
        return;
    }

    const ref = req.query.SELECT.from.ref;
    if (ref && ref.length > 0) {
        const firstSegment = ref[0];
        if (typeof firstSegment === 'object' && firstSegment.id) {
            if (firstSegment.id.includes('(') || firstSegment.id.endsWith('_drafts')) {
                return;
            }
        }
        if (req.query.SELECT.where) {
            const whereStr = JSON.stringify(req.query.SELECT.where);
            if (whereStr.includes('"ID"') || whereStr.includes('IsActiveEntity')) {
                return;
            }
        }
    }
    try {
      const userEmail = 'keerthanadevi.natarajan@distrelec.com';
      const mappedVendor = await getMappedVendorForUser(userEmail);

      const vendorNo = mappedVendor ? mappedVendor.VendorERPNumber : 'NOT_FOUND';

      // Dynamically append your business filtering logic onto the list view
      req.query.where({ VendorERPNumber: vendorNo });

    } catch (error) {
      req.error(500, `Internal Row Filter Error: ${error.message}`);
    }
  });

this.on('Acknowledge', 'PurchaseOrder_ERP1', async (req) => {
    try {
      let targetID = null;

      // 1. Unify parameter object array parsing safely
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
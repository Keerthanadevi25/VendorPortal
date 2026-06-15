const cds = require('@sap/cds');
const { SELECT, UPDATE } = cds.ql;

module.exports = cds.service.impl(async function () {

  // External service (still used for PurchaseOrders)
  const CE_PURCHASEORDER_0001 = await cds.connect.to('CE_PURCHASEORDER_0001');
  const { PurchaseOrder } = CE_PURCHASEORDER_0001.entities;

  // Local entities
  const { MappingVendors, PurchaseOrder_ERP } = this.entities;

  // Helper: get vendor for logged‑in user
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
      const userEmail = 'keerthanadevi.natarajan@distrelec.com';
      const mappedVendor = await getMappedVendorForUser(userEmail);

      if (!mappedVendor) return [];

      const pur_orders = await CE_PURCHASEORDER_0001.send({
        query: SELECT.from(PurchaseOrder)
          .columns(
            'PurchaseOrder',
            'Supplier',
            'PurchaseOrderType',
            'PurchaseOrderDate',
            'CreationDate'
          )
          .where({ Supplier: mappedVendor.VendorERPNumber }),
        headers: { Accept: 'application/json' }
      });

      pur_orders.$count = pur_orders.length;
      return pur_orders;

    } catch (error) {
      req.error(500, `External API Error: ${error.message}`);
    }
  });

  // --------------------------------------------------------------------
  // READ PurchaseOrder_ERP (internal DB)
  // Used by BOTH tabs (New PO + Live PO)
  // Multi‑View filtering is done in CDS annotations
  // --------------------------------------------------------------------
  this.on('READ', 'PurchaseOrder_ERP', async (req) => {
    try {
      const userEmail = 'keerthanadevi.natarajan@distrelec.com';
      const mappedVendor = await getMappedVendorForUser(userEmail);

      if (!mappedVendor) return [];

      const vendor = mappedVendor.VendorERPNumber;

      // Base query
      let query = SELECT.from(PurchaseOrder_ERP).where({
        VendorERPNumber: vendor
      });

      return await cds.run(query);

    } catch (error) {
      req.error(500, `Internal Error: ${error.message}`);
    }
  });

  // --------------------------------------------------------------------
  // Acknowledge Action — moves PO from New → Live
  // --------------------------------------------------------------------
  this.on('Acknowledge', async (req) => {
    try {
      const { ID } = req.data;

      await UPDATE(PurchaseOrder_ERP)
        .set({ Status: 'Live' })
        .where({ ID });

      return true;

    } catch (error) {
      req.error(500, `Acknowledge failed: ${error.message}`);
    }
  });

});
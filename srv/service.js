const cds = require('@sap/cds');
const { SELECT } = require('@sap/cds/lib/ql/cds-ql');

module.exports = cds.service.impl(async function() {
     const CE_PURCHASEORDER_0001 = await cds.connect.to ('CE_PURCHASEORDER_0001');
     const { PurchaseOrder } = CE_PURCHASEORDER_0001.entities; 
        // Get a reference to  local MappingVendors entity
     const { MappingVendors } = this.entities;

     this.on('READ', 'PurchaseOrders', async (req) => {
        try {
           // const userEmail = req.user.id; //to get the logged in user email
           const userEmail = 'keerthanadevi.natarajan@distrelec.com'; // Hardcoded email for testing


           //Fetch VendorERPNumber mapped to this email from the local database
            const mappedVendor = await cds.run(
                SELECT.one.from(MappingVendors)
                      .columns('VendorERPNumber')
                      .where({ Email: userEmail })
            );
            //If no vendors are mapped to this email, return an empty array immediately
            if (!mappedVendor || mappedVendor.length === 0) {
                console.log(`No vendor mapping found for email: ${userEmail}`);
                const emptyResponse = [];
                emptyResponse.$count = 0;
                return emptyResponse;
            }

    //Fetch from external API, filtering 'Supplier' by the retrieved vendor numbers   
    const  pur_orders = await CE_PURCHASEORDER_0001.send({
        query: SELECT.from(PurchaseOrder).columns('PurchaseOrder', 
                        'Supplier', 
                        'PurchaseOrderType', 
                        'PurchaseOrderDate', 
                        'CreationDate').where({ Supplier: mappedVendor.VendorERPNumber }).limit(50),
        headers:{
            Accept: "application/json",
        },
    });
    pur_orders.$count = pur_orders.length; // Add the count of records to the response
    return pur_orders;  
}
catch (error) {   
        req.error(500, `External API Error: ${error.message}`);
    }
    });
    
});
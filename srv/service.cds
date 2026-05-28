using { Vendor_portal as my } from '../db/schema.cds';

using { CE_PURCHASEORDER_0001.PurchaseOrder} from './external/CE_PURCHASEORDER_0001';

@path : '/service/Vendor_portalService'
service Vendor_portalService
{    @odata.draft.enabled
    entity MappingVendors as
        projection on my.MappingVendors;

    entity PurchaseOrders as
        projection on PurchaseOrder;
    
    entity PurchaseOrder_ERP1 as
        projection on my.PurchaseOrder_ERP
    actions{
        action Acknowledge() returns Boolean;
};
}

annotate Vendor_portalService with @requires :
[
    'authenticated-user'
];
annotate Vendor_portalService.PurchaseOrder_ERP1 with @odata.draft.enabled;

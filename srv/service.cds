using { Vendor_portal as my } from '../db/schema.cds';

using { CE_PURCHASEORDER_0001.PurchaseOrder} from './external/CE_PURCHASEORDER_0001';

@path : '/service/Vendor_portalService'
service Vendor_portalService
{
    @odata.draft.enabled
    entity MappingVendors as
        projection on my.MappingVendors;

    entity PurchaseOrders as
        projection on PurchaseOrder;
}

annotate Vendor_portalService with @requires :
[
    'authenticated-user'
];

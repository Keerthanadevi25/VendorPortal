namespace Vendor_portal;
using { CE_PURCHASEORDER_0001 as purchase } from '../srv/external/CE_PURCHASEORDER_0001';

entity MappingVendors
{
    key ID : UUID;
    VendorERPNumber : String(100);
    Name : String(100);
    Email : String(100);
    OpCode : String(100);
    SubrangeVendor : String(100);
};
entity PurchaseOrders as
        projection on purchase.PurchaseOrder
        {
            PurchaseOrder,
            PurchaseOrderType,
            CreationDate,
            PurchaseOrderDate,
            Supplier
        };


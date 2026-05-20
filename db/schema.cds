namespace Vendor_portal;

entity MappingVendors
{
    key ID : UUID;
    VendorERPNumber : String(100);
    Name : String(100);
    Email : String(100);
    OpCode : String(100);
    SubrangeVendor : String(100);
}


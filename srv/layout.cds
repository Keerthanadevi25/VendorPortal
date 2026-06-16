using { Vendor_portalService as srv } from './service';

// ======================================================================
// FIELD PROPERTIES (READ-ONLY + MANDATORY)
// ======================================================================
annotate srv.PurchaseOrder_ERP1 with {
    ID                 @readonly;
    RSPONumber;
    Status;
    RSPOLineItemNumber;
    RSArticleNUmber;
    Pack;
    VendorERPNumber;
    VendorPartNumber;
    Quantity;
    Unit;
    DateCreated;
    DeliverytoSite;
    UnitPrice;
    PricePerLineValue;
    RSPlanner;
    DeliveryDate       @mandatory;
};

// ======================================================================
// LIST REPORT COLUMNS + ACKNOWLEDGE BUTTON
// ======================================================================
annotate srv.PurchaseOrder_ERP1 with @(
    UI.LineItem : [
        { Value : RSPONumber,         Label : 'PO Number' },
        { Value : RSPOLineItemNumber, Label : 'Line Item' },
        { Value : Status,             Label : 'Status' },
        { Value : VendorPartNumber,   Label : 'Vendor Part No' },
        { Value : Quantity,           Label : 'Quantity' },
        { Value : DeliveryDate,       Label : 'Delivery Date' },
        { Value : VendorERPNumber,    Label : 'Vendor ERP Number' },
        { Value : Pack,               Label : 'Pack' },
        { Value : Unit,               Label : 'Unit' },
        { Value : DateCreated,        Label : 'DateCreated' },
        { Value : DeliverytoSite,     Label : 'DeliverytoSite' },
        { Value : UnitPrice,          Label : 'UnitPrice' },
        { Value : PricePerLineValue,  Label : 'PricePerLineValue' },
        { Value : RSPlanner,          Label : 'RSPlanner' },

       
        // --------------------------------------------------------------
        // CUSTOM ACTION BUTTON: ACKNOWLEDGE (BOUND)
        // --------------------------------------------------------------
        {
            $Type              : 'UI.DataFieldForAction',
            // Try this standard CAP OData v4 notation:
            Action             : 'Vendor_portalService.Acknowledge',
            Label              : 'Acknowledge',
            Inline             : false,
            RequiresContext    : false,
            InvocationGrouping : #ChangeSet
        }
    ]
);

// ======================================================================
// FORM LAYOUT (OBJECT PAGE)
// ======================================================================
annotate srv.PurchaseOrder_ERP1 with @(
    UI.FieldGroup #MainDetails : {
        Data : [
            { Value : RSPONumber,         Label : 'PO Number' },
            { Value : DeliveryDate,       Label : 'Delivery Date' },
            { Value : Quantity,           Label : 'Quantity' },
            { Value : RSPOLineItemNumber, Label : 'Line Item Number' },
            { Value : VendorPartNumber,   Label : 'Vendor Part No' },
            { Value : Status,             Label : 'Status' },
            { Value : VendorERPNumber,    Label : 'Vendor ERP Number' },
            { Value : Pack,               Label : 'Pack' },
            { Value : Unit,               Label : 'Unit' },
            { Value : DateCreated,        Label : 'DateCreated' },
            { Value : DeliverytoSite,     Label : 'DeliverytoSite' },
            { Value : UnitPrice,          Label : 'UnitPrice' },
            { Value : PricePerLineValue,  Label : 'PricePerLineValue' },
            { Value : RSPlanner,          Label : 'RSPlanner' }
        ]
    },

    UI.Facets : [
        {
            $Type  : 'UI.ReferenceFacet',
            Label  : 'Purchase Order Details',
            Target : '@UI.FieldGroup#MainDetails'
        }
    ]
);

// ======================================================================
// SIDE EFFECTS — ENSURES STATUS REFRESHES AFTER ACTION
// ======================================================================
annotate srv.PurchaseOrder_ERP1 with @(
    Common.SideEffects #Acknowledge : {
        SourceProperties : ['Status'],
        TargetProperties : ['Status']
    }
);
// ======================================================================
// SIDE EFFECTS: REFRESH TABLE STATUS AFTER ACTION COMPLETES
// ======================================================================
annotate srv.PurchaseOrder_ERP1 with @(
    Common.SideEffects #AfterAcknowledge : {
        // Change: Match the standard CAP bound action naming string path exactly
        TriggerAction    : 'Vendor_portalService.Acknowledge', 
        TargetProperties : [
            'Status'
        ]
    }
);
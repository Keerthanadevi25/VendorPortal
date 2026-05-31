using { Vendor_portalService as srv } from './service';

// ======================================================================
// FIELD PROPERTIES (READ-ONLY + MANDATORY)
// ======================================================================
annotate srv.PurchaseOrder_ERP1 with {
    ID                 @readonly;
    RSPONumber         @readonly;
    Status             @mandatory;
    RSPOLineItemNumber @readonly;
    RSArticleNUmber    @readonly;
    Pack               @readonly;
    VendorERPNumber    @readonly;
    VendorPartNumber   @readonly;
    Quantity           @readonly;
    Unit               @readonly;
    DateCreated        @readonly;
    DeliverytoSite     @readonly;
    UnitPrice          @readonly;
    PricePerLineValue  @readonly;
    RSPlanner          @readonly;
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
            { Value : Status,             Label : 'Status' }
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
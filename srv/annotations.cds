using Vendor_portalService as service from './service';

// ======================================================
// 1. MultiViewDefinition — defines the two tabs
// ======================================================
annotate service.PurchaseOrder_ERP with @(
    UI.MultiViewDefinition : [
        {
            $Type  : 'UI.SelectionPresentationVariant',
            Text   : 'New PO',
            SelectionVariant : {
                $Type : 'UI.SelectionVariantType',
                SelectOptions : [
                    {
                        PropertyName : 'Status',
                        Ranges : [
                            {
                                Sign : 'I',
                                Option : 'EQ',
                                Low : 'New'
                            }
                        ]
                    }
                ]
            },
            PresentationVariant : {
                $Type : 'UI.PresentationVariantType',
                Visualizations : ['@UI.LineItem']
            }
        },
        {
            $Type  : 'UI.SelectionPresentationVariant',
            Text   : 'Live PO',
            SelectionVariant : {
                $Type : 'UI.SelectionVariantType',
                SelectOptions : [
                    {
                        PropertyName : 'Status',
                        Ranges : [
                            {
                                Sign : 'I',
                                Option : 'EQ',
                                Low : 'Live'
                            }
                        ]
                    }
                ]
            },
            PresentationVariant : {
                $Type : 'UI.PresentationVariantType',
                Visualizations : ['@UI.LineItem']
            }
        }
    ]
);

// ======================================================
// 2. LineItem definition (shared by both tabs)
// ======================================================
annotate service.PurchaseOrder_ERP with @(
    UI.LineItem : [
        { Value : RSPONumber, Label : 'PO Number' },
        { Value : Status, Label : 'Status' },
        { Value : DeliveryDate, Label : 'Delivery Date' },

        // Acknowledge button only appears in New PO tab
        {
            $Type  : 'UI.DataFieldForAction',
            Action : 'Vendor_portalService.Acknowledge',
            Label  : 'Acknowledge'
        }
    ]
);
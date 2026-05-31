sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"purchseorder/test/integration/pages/PurchaseOrder_ERP1List",
	"purchseorder/test/integration/pages/PurchaseOrder_ERP1ObjectPage"
], function (JourneyRunner, PurchaseOrder_ERP1List, PurchaseOrder_ERP1ObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('purchseorder') + '/test/flp.html#app-preview',
        pages: {
			onThePurchaseOrder_ERP1List: PurchaseOrder_ERP1List,
			onThePurchaseOrder_ERP1ObjectPage: PurchaseOrder_ERP1ObjectPage
        },
        async: true
    });

    return runner;
});


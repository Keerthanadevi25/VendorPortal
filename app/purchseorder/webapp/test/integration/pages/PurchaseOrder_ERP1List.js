sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'purchseorder',
            componentId: 'PurchaseOrder_ERP1List',
            contextPath: '/PurchaseOrder_ERP1'
        },
        CustomPageDefinitions
    );
});
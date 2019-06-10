sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../model/formatter",
	"sap/ui/model/json/JSONModel"

], function (Controller, formatter, JSONModel) {
	"use strict";

	return Controller.extend("html_mod.html_mod.controller.Splash", {

		formatter: formatter,

		onInit: function () {

			var oData = {
				"SelectedSystem": " ",
				"IBP_Version": [
					{
						"Version": "1905"
					},
					{
						"Version": "1908"
					},
					{
						"Version": "1911"
					}
				]
			};

			// set explored app's demo model on this sample
			var oModel = new JSONModel(oData);
			this.getView().setModel(oModel);
			
			console.log("Splash Controller");

		},
		
		toHomePage: function () {
			
			var system = this.getView().byId("systemName").getValue();
			this.getOwnerComponent().getModel("userInfo").setProperty("/system", system);
			
			var service_url = this.getView().byId("systemPath").getValue();
			this.getOwnerComponent().getModel("userInfo").setProperty("/service_url", service_url);
			
			var ibp_version = this.getView().byId("ibpVersion").getSelectedKey();
			this.getOwnerComponent().getModel("userInfo").setProperty("/ibp_version", ibp_version);
			
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("home");
			
		}
	});
});
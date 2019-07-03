sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../model/formatter",
	"sap/ui/model/json/JSONModel"

], function (Controller, formatter, JSONModel) {
	"use strict";

	return Controller.extend("html_mod.html_mod.controller.Splash", {

			formatter: formatter,

			onInit: function () {

				console.log("Testing delete method");

				

			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.subscribe("systemInfo", "updateTile", this.updateTiles, this);
			oEventBus.subscribe("home", "updateTile", this.updateTiles, this);

		},

		updateTiles: function (sChannel, sEvent, oData) {

			var that = this;

			if (sEvent === "updateTile") {

				for (var i = 0; i < oData["tiles"].length; i++) {

					var tileId = "tile" + String(oData["tiles"][i]);

					that.getView().byId(tileId).setBlocked(false);

				}

			}

		},

		sysInfoSelect: function () {

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("systemInfo");

		},

		homeSelect: function () {

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("home");
		},

		dataAnalysisSelect: function () {

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("postUpgrade");

		},

		manageDataSelect: function () {

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("manageData");

		}

	});
});
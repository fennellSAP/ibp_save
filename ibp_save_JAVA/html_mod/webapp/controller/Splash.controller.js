sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../model/formatter",
	"sap/ui/model/json/JSONModel"

], function (Controller, formatter, JSONModel) {
	"use strict";

	return Controller.extend("html_mod.html_mod.controller.Splash", {

		formatter: formatter,

		onInit: function () {

			var that = this;

			that.loginTileShow();

			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.subscribe("systemInfo", "updateTile", this.updateTiles, this);
			oEventBus.subscribe("home", "updateTile", this.updateTiles, this);

		},

		loginTileShow: function () {
			
			var that = this;
			var foundScenario = that.getOwnerComponent().getModel("userInfo").getProperty("/existingScenario");
			var dataEntered = that.getOwnerComponent().getModel("userInfo").getProperty("/dataEntered");

			if (foundScenario) {

				that.getView().byId("tile2").setBlocked(false);
				that.getView().byId("tile3").setBlocked(false);
				that.getView().byId("tile4").setBlocked(false);

			} else if (dataEntered) {
				that.getView().byId("tile2").setBlocked(false);
			}

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
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../model/formatter",
	"sap/ui/model/json/JSONModel"

], function (Controller, formatter, JSONModel) {
	"use strict";

	return Controller.extend("html_mod.html_mod.controller.GetResults", {

		formatter: formatter,

		onInit: function () {
			
			console.log("Get results controller");
			
			var resultRoute = this.getOwnerComponent().getRouter().getRoute("getResults");
			resultRoute.attachPatternMatched(this.onPatternMatched, this);
			

		},

		onPatternMatched: function () {
			
			this._sysUser = this.getOwnerComponent().getModel("userInfo").getProperty("/sysUser");
			this._businessUser = this.getOwnerComponent().getModel("userInfo").getProperty("/businessUser");
			this._templateName = this.getOwnerComponent().getModel("userInfo").getProperty("/templateName");
			this._ibp_version = this.getOwnerComponent().getModel("userInfo").getProperty("/ibp_version");
		},

		submitData: function () {

			var that = this;

			that.getView().byId("submitData").setEnabled(false);
			
			sap.ui.core.BusyIndicator.show();
			
			setTimeout(function() { 
				sap.ui.core.BusyIndicator.attachEventOnce("Open", that.getDataCall(that));
			},1750);
			
		},

		getDataCall: function (oView) {

			var that = oView;

			var sUrl = "/LOG_SRV/xIBPxC_IBPLOGS_TBL?$filter=LogId eq '000004F0BAE8069F160090240E47B3F4'";

			var jModel = new sap.ui.model.json.JSONModel();

			jModel.loadData(sUrl, null, false);
			var loaded = jModel.dataLoaded();
			loaded.then(function () {
				console.log(jModel.oData["d"]["results"][0]);
				var urlToCall = jModel.oData["d"]["results"][0]["FreeText"];

				var msg1 = jModel.oData["d"]["results"][0]["msgv1"];
				var msg1Split = msg1.split(";");
				that._scenario = msg1Split[0];
				that._version = msg1Split[1];

				var msg2 = jModel.oData["d"]["results"][0]["msgv2"];
				var msg2Split = msg2.split(";");
				that._currtoid = msg2Split[0];
				that._umtoid = msg2Split[1];
				that._timerolling = msg2Split[2];
				that._periodid = msg2Split[3];
				that._periodid4 = msg2Split[4];

				var keyfigures = jModel.oData["d"]["results"][0]["msgv3"];

				that._planninglevel = jModel.oData["d"]["results"][0]["msgv4"];

				var start_pos = urlToCall.indexOf("=");
				var end_pos = urlToCall.indexOf("&");

				that._attrs = urlToCall.substring(start_pos + 1, end_pos);

				var newUrl = "/PT6_GET_DATA/" + urlToCall;

				var encoded_URL = encodeURI(newUrl);

				var jModel2 = new sap.ui.model.json.JSONModel();
				jModel2.loadData(newUrl, null, false);
				var loaded2 = jModel2.dataLoaded();

				loaded2.then(function () {

					var data = jModel2.oData["d"]["results"];

					that._values = {

						Data: [
						{
							attribute: "Planning Area",
							value: that._templateName
						},
						{
							attribute: "Scenario",
							value: that._scenario
						}, {
							attribute: "Version",
							value: that._version
						}, {
							attribute: "CurrToid",
							value: that._currtoid
						}, {
							attribute: "UmToid",
							value: that._umtoid
						}, {
							attribute: "Time Rolling",
							value: that._timerolling
						}, {
							attribute: "PeriodID4",
							value: that._periodid
						}, {
							attribute: "PeriodID4",
							value: that._periodid4
						}, {
							attribute: "Key Figures",
							value: keyfigures
						}, {
							attribute: "Planning Level",
							value: that._planninglevel
						}]
					};

					that.jModel = new sap.ui.model.json.JSONModel();
					that.jModel.setData(that._values);
					that.getView().setModel(that.jModel);
					that.jModel.refresh();

					that.postToDB(data);
				});

			});

		},

		postToDB: function (data) {

			var that = this;

			var oModel = new sap.ui.model.odata.v2.ODataModel("/IBP_GET_JOB_DATA/index.xsodata/");

			var keys = Object.keys(data[0]);

			var time_period_key = keys[1];

			var guids = [];

			for (var i = 2; i < keys.length; i++) {

				var key = keys[i];

				var oEntry = {};

				var guid = that.makeGuid(guids);
				guids.push(guid);

				oEntry.guid = guid;
				oEntry.ibp_version = that._ibp_version;
				oEntry.run_num = 1;
				oEntry.business_user = that._businessUser;
				oEntry.sys_user = that._sysUser;
				oEntry.plan_level = that._planninglevel;
				oEntry.template_id = that._templateName;
				oEntry.curr_to = that._currtoid;
				oEntry.uom_to = that._umtoid;
				oEntry.time_rolling = that._timerolling;
				oEntry.time_period_start = data[0][time_period_key].trim();
				oEntry.time_period_end = data[data.length - 1][time_period_key].trim();
				oEntry.period_id = time_period_key;
				oEntry.key_figure = key;

				oModel.create('/Job_Descriptors', oEntry, {
					success: function (result) {
						//console.log(result);
					},
					error: function (oError) {
						console.log(oError);
					}
				});

				var oEntry2 = {};
				oEntry2.data_id = guid;
				oEntry2.run_num = 1;

				for (var k = 0; k < data.length; k++) {

					var kf_value = data[k][key];

					var time_period = data[k][time_period_key].trim();
					var formatted_data = time_period + ":" + kf_value;
					var column = "val_" + (k + 1);
					oEntry2[column] = formatted_data;
				}

				oModel.create('/Job_Results', oEntry2, {
					success: function (result) {
						//console.log(result);
					},
					error: function (oError) {
						console.log(oError);
					}
				});
			}

			//that.getView().setBusy(false);
			sap.ui.core.BusyIndicator.hide();
			that.getView().byId("attrTable").setVisible(true);

			setTimeout(function () {
				alert("Pre-upgrade process complete. Come back after upgrade");
			}, 2000);

		},

		makeGuid: function (guids) {

			var guid = new Date().getTime();

			var violation = true;

			while (violation) {

				var foundMatch = false;

				for (var j = 0; j < guids.length; j++) {

					if (guids[j] === guid) {

						guid = new Date().getTime();
						foundMatch = true;
					}
				}
				if (!foundMatch) {

					violation = false;
					guids.push(guid);
				}
			}
			return guid;
		}
	});
});
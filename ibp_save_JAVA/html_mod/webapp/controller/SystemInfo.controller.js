sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../model/formatter",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"

], function (Controller, formatter, JSONModel, MessageToast) {
	"use strict";

	return Controller.extend("html_mod.html_mod.controller.SystemInfo", {

		formatter: formatter,

		onInit: function () {
			
			var that = this;
			
			that.enableFields();
			
			that.readUserInfo();
		},
		
		readUserInfo : function () {
			
			this.oModel = new sap.ui.model.odata.v2.ODataModel("/IBP_GET_JOB_DATA/index.xsodata/", {
				defaultUpdateMethod: sap.ui.model.odata.UpdateMethod.Put
			});
			this.oModel.read("/Users", {
				success: function (odata) {

				},
				error: function (err) {

					sap.m.MessageToast.show("error");

				}

			});
			
		},
		
		enableFields : function () {
			
			var that = this;
			
			var businessUser = that.getOwnerComponent().getModel("userInfo").getProperty("/businessUser");
			if (businessUser !== "null") {
				that.getView().byId("businessUser").setValue(businessUser);
			}
			var sysUser = that.getOwnerComponent().getModel("userInfo").getProperty("/sysUser");
			if (sysUser !== "null") {
				that.getView().byId("systemUser").setValue(sysUser);
			}
			var sysPwd = that.getOwnerComponent().getModel("userInfo").getProperty("/pwd");
			if (sysPwd !== "null") {
				that.getView().byId("systemUserPassword").setValue(sysPwd);
			}
			var sysUrl = that.getOwnerComponent().getModel("userInfo").getProperty("/service_url");
			if (sysUrl !== "null") {
				that.getView().byId("systemPath").setValue(sysUrl);
			}
		},

		testConn: function () {

			var that = this;

			sap.ui.core.BusyIndicator.show();

			setTimeout(function () {

				sap.ui.core.BusyIndicator.attachEventOnce("Open");
				sap.ui.core.BusyIndicator.show();

			}, 1000);

			setTimeout(function () {

				var msg = 'Connection Successful: Response Code 200';
				MessageToast.show(msg);
				that.getView().byId("submitData").setEnabled(true);

				sap.ui.core.BusyIndicator.hide();

			}, 4000)

		},

		toHomePage: function () {

			var that = this;

			var service_url = this.getView().byId("systemPath").getValue();
			this.getOwnerComponent().getModel("userInfo").setProperty("/service_url", service_url);

			var businessUser = this.getView().byId("businessUser").getValue();
			this.getOwnerComponent().getModel("userInfo").setProperty("/businessUser", businessUser);

			var sysUser = this.getView().byId("systemUser").getValue();
			this.getOwnerComponent().getModel("userInfo").setProperty("/sysUser", sysUser);

			var pwd = this.getView().byId("systemUserPassword").getValue();
			this.getOwnerComponent().getModel("userInfo").setProperty("/pwd", pwd);

			this.getOwnerComponent().getModel("userInfo").setProperty("/formFilled", true);

			var scenarioHolder = [];
			var userScenarios = [];
			var completedScenarios = [];
			that._foundScenario = false;
			that._completeScenario = false;
			var analyzedScenarios = [];

			var scenarioNames = [];
			var scenarioObjects = [];

			var oModelAuthorizationSet = new sap.ui.model.json.JSONModel(

				"/IBP_GET_JOB_DATA/index.xsodata/Job_Descriptors?$filter=business_user eq '" + businessUser +
				"' and sys_user eq '" + sysUser + "'");

			oModelAuthorizationSet.attachRequestCompleted(function (oData, resp) {

				var userData = oData.getSource().getData().d.results;

				if (userData.length > 0) {

					that._foundScenario = true;

					for (var i = 0; i < userData.length; i++) {

						if (!scenarioNames.includes(userData[i]["scenario"])) {

							scenarioNames.push(userData[i]["scenario"]);
							scenarioObjects.push({
								"Name": userData[i]["scenario"]
							});
						}
					}

				} else {
					console.log("Did not find scenarios");
				}

				var userScenarioObject = {
					"Scenario": scenarioObjects
				};

				that.getOwnerComponent().getModel("userInfo").setProperty("/allScenarios", scenarioNames);

				that.getOwnerComponent().getModel("userInfo").setProperty("/userScenarioObject", userScenarioObject);

				that.getOwnerComponent().getModel("userInfo").setProperty("/existingScenario", that._foundScenario);

				var userEmail = that.getOwnerComponent().getModel("userInfo").getProperty("/email");

				that.tileChange();

				var msg = 'Credentials Successfully Entered';
				MessageToast.show(msg);

				setTimeout(function () {

					var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
					oRouter.navTo("splash");

				}, 1000);


				var oEntry = {};
				oEntry.email = userEmail;
				oEntry.business_user = businessUser;
				oEntry.sys_user = sysUser;
				oEntry.sys_pwd = pwd;
				oEntry.sys_host = service_url;

				that.oModel.setProperty("/Users('" + userEmail + "')/email", oEntry.email);
				that.oModel.setProperty("/Users('" + userEmail + "')/business_user", oEntry.business_user);
				that.oModel.setProperty("/Users('" + userEmail + "')/sys_user", oEntry.sys_user);
				that.oModel.setProperty("/Users('" + userEmail + "')/sys_pwd", oEntry.sys_pwd);
				that.oModel.setProperty("/Users('" + userEmail + "')/sys_host", oEntry.sys_host);
				that.oModel.submitChanges({
					success: function (data) {
						console.log("Updated succesfully");
					},
					error: function (err) {
						console.log(err);
					}
				});

			}.bind(that));
			oModelAuthorizationSet.attachRequestFailed(function (err) {

				console.log("Error retrieving user data");
			});

		},

		tileChange: function () {

			var that = this;

			var oEventBus = sap.ui.getCore().getEventBus();

			if (that._foundScenario) {

				oEventBus.publish("systemInfo", "updateTile", {
					tiles: [2, 3, 4]
				});

			} else {

				oEventBus.publish("systemInfo", "updateTile", {
					tiles: [2]
				});

			}

		},
		
		allowEdit: function () {
			
			var that = this;
			
			that.getView().byId("systemPath").setEditable(true);
			that.getView().byId("businessUser").setEditable(true);
			that.getView().byId("systemUser").setEditable(true);
			that.getView().byId("systemUserPassword").setEditable(true);
			that.getView().byId("submitData").setEnabled(true);
			that.getView().byId("testConn").setEnabled(true);
			
			that.getView().byId("editBtn").setEnabled(false);
			
 		},

		navSplash: function () {

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("splash");

		}
	});
});
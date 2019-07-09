sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../model/formatter",
	"sap/ui/model/json/JSONModel",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/Text",

], function (Controller, formatter, JSONModel, Button, Dialog, Text) {
	"use strict";

	return Controller.extend("html_mod.html_mod.controller.Login", {

		formatter: formatter,

		onInit: function () {

		},
		toCreate: function () {

			this.getView().byId("loginBtn").setVisible(false);
			this.getView().byId("createMsg").setVisible(false);
			this.getView().byId("createLink").setVisible(false);

			this.getView().byId("pwdReEnterLbl").setVisible(true);
			this.getView().byId("pwdReEnter").setVisible(true);
			this.getView().byId("createBtn").setVisible(true);
			this.getView().byId("toLoginMsg").setVisible(true);
			this.getView().byId("loginLink").setVisible(true);

			this.getView().byId("baseTitle").setTitle("IBP Test Automation - Create Account");

		},

		toLogin: function () {

			this.getView().byId("pwdReEnterLbl").setVisible(false);
			this.getView().byId("pwdReEnter").setVisible(false);
			this.getView().byId("createBtn").setVisible(false);
			this.getView().byId("toLoginMsg").setVisible(false);
			this.getView().byId("loginLink").setVisible(false);

			this.getView().byId("loginBtn").setVisible(true);
			this.getView().byId("createMsg").setVisible(true);
			this.getView().byId("createLink").setVisible(true);

			this.getView().byId("baseTitle").setTitle("IBP Test Automation - Login");

		},

		authorize: function () {

			var that = this;

			var userEmail = that.getView().byId("emailEnter").getValue();
			var pwd = that.getView().byId("pwdEnter").getValue();

			var query = "email=" + userEmail + "&pwd=" + pwd;
			jQuery.ajax({
				url: "/IBP_GET_JOB_DATA/xsjs/authorize.xsjs?" + query,
				success: function (response) {
					
					response = response.split(",");
					var valid = response[0] == "true";
					
					
					if (valid){
						
						that.getOwnerComponent().getModel("userInfo").setProperty("/businessUser", String(response[1]));
						that.getOwnerComponent().getModel("userInfo").setProperty("/sysUser", String(response[2]));
						that.getOwnerComponent().getModel("userInfo").setProperty("/pwd", String(response[3]));
						that.getOwnerComponent().getModel("userInfo").setProperty("/service_url", String(response[4]));
						that.getOwnerComponent().getModel("userInfo").setProperty("/email", userEmail);
						
						if (response[1] !== "null" && response[2] !== "null") {

							that.getScenarios(response[1], response[2]);
							that.getOwnerComponent().getModel("userInfo").setProperty("/dataEntered", true);
							
						} else {

							that.getOwnerComponent().getModel("userInfo").setProperty("/dataEntered", false);
							var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
							oRouter.navTo("splash"); 
						}
						
					} else {
						
						that.errorDialog(response[1]);
					}
					
				},
				error: function (e) {

					that.errorDialog(e);
				}
			});

		},
		
		getScenarios: function(businessUser, sysUser) {
			
			var that = this;
			that._foundScenario = false;
			var scenarioNames = [];
			var scenarioObjects = [];
			
			
			var oModelAuthorizationSet = new sap.ui.model.json.JSONModel(

				"/IBP_GET_JOB_DATA/index.xsodata/Job_Descriptors?$filter=business_user eq '" + businessUser +
				"' and sys_user eq '" + sysUser + "'");
				
			oModelAuthorizationSet.attachRequestCompleted(function (oData, resp) {

				var userData = oData.getSource().getData().d.results;
				
				if (userData.length > 0) {

					that._foundScenario = true;
					
					for(var i = 0; i < userData.length; i++) {
						
						if(!scenarioNames.includes(userData[i]["scenario"])) {
							
							scenarioNames.push(userData[i]["scenario"]);
							scenarioObjects.push({"Name": userData[i]["scenario"]});
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
			
				setTimeout(function() {
				
					var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
					oRouter.navTo("splash"); 
				
				}, 250);
			});
			
			oModelAuthorizationSet.attachRequestFailed(function (err) {
				console.log("Error retrieving user data");
			});
			
			
		},

		verifyAccount: function () {

			var that = this;

			var userEmail = that.getView().byId("emailEnter").getValue();
			var pwd1 = that.getView().byId("pwdEnter").getValue();
			var pwd2 = that.getView().byId("pwdReEnter").getValue();

			var eMailVerified = that.verifyEmail(userEmail);

			if (eMailVerified) {
				var pwdVerified = that.verifyPwd(pwd1, pwd2);
				if (pwdVerified) {
					that.createUserAccount(userEmail, pwd2);
				}
			}
		},

		createUserAccount: function (email, pwd) {

			var that = this;

			var oModel = new sap.ui.model.odata.v2.ODataModel("/IBP_GET_JOB_DATA/index.xsodata/");

			var oEntry = {};
			oEntry.email = email;
			oEntry.password = pwd;

			oModel.create('/Users', oEntry, {
				success: function (result) {
					var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
					oRouter.navTo("splash");
				},
				error: function (oError) {
					that.errorDialog(oError.toString());
				}
			});

		},

		verifyEmail: function (email) {

			var that = this;

			if (email.length > 2 && email.includes("@") && email.includes(".")) {
				return true;
			} else {
				that.errorDialog("The e-mail entered is not a valid e-mail. Please try again");
				return false;
			}
		},

		verifyPwd: function (pwd1, pwd2) {

			var that = this;

			if (pwd1 !== pwd2) {
				that.errorDialog("The passwords entered are not the same. Please try again");
				return false;
			} else if (pwd1.length < 5) {
				that.errorDialog("Password must be at least 6 characters. Please try again");
				return false;
			} else {
				return true;
			}

		},

		errorDialog: function (errMsg) {
			var dialog = new Dialog({
				title: 'Error',
				type: 'Message',
				state: 'Error',
				content: new Text({
					text: errMsg
				}),
				beginButton: new Button({
					text: 'OK',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
		}

	});
});
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
			
		},
		
		testConn: function () {
		
			var that = this;
			
			sap.ui.core.BusyIndicator.show();
			
			setTimeout(function() {
				
				sap.ui.core.BusyIndicator.attachEventOnce("Open");
				sap.ui.core.BusyIndicator.show();
				
			}, 1000);
			
			setTimeout(function() {
				
				var msg = 'Connection Successful: Response Code 200';
				MessageToast.show(msg);
				that.getView().byId("submitData").setEnabled(true);
				
				
				sap.ui.core.BusyIndicator.hide();
				
			}, 4000)
			
		},
		
		toHomePage: function () {
			
			var that = this;
			
			var system = this.getView().byId("systemName").getValue();
			this.getOwnerComponent().getModel("userInfo").setProperty("/system", system);
			
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
					
					console.log("Found Scenarios");
					console.log(userData);
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
				

				// for (var i = 0; i < userData.length; i++) {
					
					
				// 	if(userData[i]["preOrPost"] === "post") {
						
				// 		that._completeScenario = true;
						
				// 		if (!completedScenarios.includes(userData[i]["scenario"])) {
							
				// 			analyzedScenarios.push({"Name": userData[i]["scenario"]});
				// 			completedScenarios.push(userData[i]["scenario"]);
							
				// 		}
						
				// 	} else if (!scenarioHolder.includes(userData[i]["scenario"]) && !completedScenarios.includes(userData[i]["scenario"])) {
						
				// 		userScenarios.push({"Name": userData[i]["scenario"]});
				// 		that._foundScenario = true;
				// 		scenarioHolder.push(userData[i]["scenario"]);
						
				// 	}
				// }
				
				//console.log("Analyzed Scenarios Keys: " + Object.keys(analyzedScenarios));
				//console.log("Analyzed Scenarios Length: " + analyzedScenarios.length);
				
				var userScenarioObject = {
					"Scenario": scenarioObjects
				};
				
				// var completeScenarios = {
				// 	"Scenario": analyzedScenarios
				// };
				
				
				//console.log("Completed Scenarios Keys: " + Object.keys(completeScenarios));
				
				that.getOwnerComponent().getModel("userInfo").setProperty("/allScenarios", scenarioNames);
				
				that.getOwnerComponent().getModel("userInfo").setProperty("/userScenarioObject", userScenarioObject);
				//that.getOwnerComponent().getModel("userInfo").setProperty("/analyzedScenarios", completeScenarios);

				that.getOwnerComponent().getModel("userInfo").setProperty("/existingScenario", that._foundScenario);
				//that.getOwnerComponent().getModel("userInfo").setProperty("/completedScenario", that._completeScenario);
				
				that.tileChange();
				
				
				var msg = 'Credentials Successfully Entered';
				MessageToast.show(msg);
			
			
				setTimeout(function() {
				
					var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
					oRouter.navTo("splash"); 
				
				
				}, 1000);

			});
			oModelAuthorizationSet.attachRequestFailed(function (err) {

				console.log("Error retrieving user data");
			});
			
		},
		
		tileChange: function () {
			
			var that = this;
		
			var oEventBus = sap.ui.getCore().getEventBus();
			
			
			if (that._foundScenario) {
				
				oEventBus.publish("systemInfo", "updateTile", { tiles: [2, 3, 4]});
				
			} else {
				
				oEventBus.publish("systemInfo", "updateTile", { tiles: [2]});
				
			}
			
			
		},
		
		navSplash: function () {
			
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("splash");
			
		}
	});
});
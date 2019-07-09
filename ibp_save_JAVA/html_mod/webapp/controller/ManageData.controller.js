sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../model/formatter",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/export/Spreadsheet"
], function (Controller, formatter, JSONModel, MessageToast, Filter, Spreadsheet) {
	"use strict";

	return Controller.extend("html_mod.html_mod.controller.ManageData", {

		formatter: formatter,

		onInit: function () {
			
			this.getProperties();
			this.setControls();
		},
		
		getProperties : function () {
			
			this._allScenarios = this.getOwnerComponent().getModel("userInfo").getProperty("/allScenarios");
			this._sysUser = this.getOwnerComponent().getModel("userInfo").getProperty("/sysUser");
			this._businessUser = this.getOwnerComponent().getModel("userInfo").getProperty("/businessUser");
			this._userScenarios = this.getOwnerComponent().getModel("userInfo").getProperty("/userScenarioObject");
			this._scenarioNum = this._userScenarios["Scenario"].length;
		},
		
		setControls : function () {
			
			var that = this;
			
			if (that._scenarioNum < 1) {
				that.getView().byId("noScenariosFound").setVisible(true);
				that.getView().byId("scenarioLabel").setVisible(false);
				that.getView().byId("scenCheckBox").setVisible(false);
				that.getView().byId("viewDataBtn").setEnabled(false);
				that.getView().byId("deleteDataBtn").setEnabled(false);
			}	
			
			for (var i = 0; i < that._userScenarios["Scenario"].length; i++) {
				that._userScenarios["Scenario"][i]["selected"] = false;
				that._userScenarios["Scenario"][i]["visible"] = true;
			}
			
			that._userScenarios["Scenario"].push({
				"Name": "Select/Deselect All Scenarios",
				"selected": false,
				"visible": true
			});
			
			
			that._scenarioObject = new JSONModel(that._userScenarios);
			that.getView().setModel(that._scenarioObject);
		},
		
		viewData: function() {
			
			sap.ui.core.BusyIndicator.show(10);

			var that = this;
			
			var scenariosToView = [];
			for (var i = 0; i < that._scenarioObject["oData"]["Scenario"].length; i++) {
				
				try {
					
					if (that._scenarioObject["oData"]["Scenario"][i]["Name"] !== "Select/Deselect All Scenarios") {
					
						if (that._scenarioObject["oData"]["Scenario"][i]["selected"]) {
						
							scenariosToView.push(that._scenarioObject["oData"]["Scenario"][i]["Name"]);
						
						}
					
					}
				} catch (err) {
					continue;
				}
			}
			
			var oModel = new sap.ui.model.odata.v2.ODataModel("/IBP_GET_JOB_DATA/index.xsodata/");
			
			var valid_cols = [];
			
			var allFilters = [];
			allFilters.push(new Filter("scenario", "EQ", scenariosToView[0]));
			allFilters.push(new Filter("sys_user", "EQ", that._sysUser));
			allFilters.push(new Filter("business_user", "EQ", that._businessUser));
			
			oModel.read("/Job_Descriptors", {
				
				filters: allFilters,
				
				success: function (result) {
					
					var desc_cols = Object.keys(result["results"][0]);
					
					for (var j = 0; j < desc_cols.length; j++) {
						
						if (desc_cols[j] === "__metadata" || desc_cols[j] === "guid" || desc_cols[j] === "scenario") {
							continue;
						}
						valid_cols.push(desc_cols[j]);
					}
					
					for (var k = 1; k < 999; k++) {
						
						valid_cols.push("val_" + String(k));
					}
					that.generateExcel(scenariosToView, valid_cols);
				}
			});
			
		},
		
		generateExcel: function(scenarios, cols) {
			
			var that = this;
			
			var colObject = that.createColumnConfig(cols);
			
			that.generateRows(scenarios, cols, colObject);

		},
		
		createColumnConfig: function(cols) {
			
			var columns = [];

			var beg_column = {
				label: "Scenario Name",
				property: "ScenName",
				type: 'string',
				width: 50
			};
			columns.push(beg_column);
			
			for (var i = 0; i < cols.length; i++) {

				var one_column = {
					label: cols[i],
					property: cols[i],
					type: 'string'
				};
				columns.push(one_column);
			}

			return columns;
			
		},
		
		generateRows: function(scenarios, cols, colObject) {
			
			var that = this;
			var oModel = new sap.ui.model.odata.v2.ODataModel("/IBP_GET_JOB_DATA/index.xsodata/");
			
			var all_rows = {
				"Rows": []
			};
			
			(function loop(n) {
				
				if (n > scenarios.length) {
					
					that.buildExcel(all_rows, colObject);
					return;
				}                                      
				
				var allFilters = [];
				
				allFilters.push(new Filter("scenario", "EQ", scenarios[n]));
				allFilters.push(new Filter("sys_user", "EQ", that._sysUser));
				allFilters.push(new Filter("business_user", "EQ", that._businessUser));
				
				oModel.read("/Job_Descriptors", {
					filters: allFilters,
					async: false,
					success: function(result) {
						
						var divider_row = {};
						divider_row["ScenName"] = " ";
						all_rows["Rows"].push(divider_row);
						
						var name_row = {};
						name_row["ScenName"] = scenarios[n];
						all_rows["Rows"].push(name_row);
						
						(function loop2(i) {
							
							if (i >= result["results"].length) {
								return;
							}     
							
							var one_row = {};
							
							for (var c = 0; c < cols.length; c++) {
								
								one_row[cols[c]] = result["results"][i][cols[c]];
								
							}
							
							var guid = result["results"][i]["guid"];
							var filter = new Filter("data_id", "EQ", guid);
							
							oModel.read("/Job_Results", {
								filters: [filter],
								async: false,
								success: function(data) {
									
									var data_keys = Object.keys(data["results"][0]);
									
									for (var k = 0; k < data_keys.length; k++) {
										if (data_keys[k] === "data_id" || data_keys[k] === "__metadata") {
											continue;
										}
										one_row[data_keys[k]] = data["results"][0][data_keys[k]];
										
									}
									all_rows["Rows"].push(one_row);
									
								}
							});
							
							loop2(i + 1);
							
						})(0);
						
						loop(n + 1);
						
					}
				});

			})(0);
			
		},
		
		buildExcel: function(all_rows, colObject) {
			
			var oSettings, oSheet;
			
			oSettings = {
				workbook: {
					columns: colObject
				},
				dataSource: all_rows["Rows"]
			};
			
			oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function () {
					MessageToast.show('Spreadsheet export has finished');
					sap.ui.core.BusyIndicator.hide();
				})
				.finally(function () {
					oSheet.destroy();
				});
			
		},
		
		checkBoxClick: function (scenario, selected) {
			
			var that = this;
			
    		if (scenario === "Select/Deselect All Scenarios") {
    			
    			for (var i = 0; i < that._scenarioObject["oData"]["Scenario"].length; i++) {
    			
    				if (!selected) {
    					
    					that._scenarioObject["oData"]["Scenario"][i]["selected"] = false;
    					
    				} else {
    					
    					that._scenarioObject["oData"]["Scenario"][i]["selected"] = true;
    					
    				}
    			
    			that._scenarioObject.refresh();
    			
    			}
    		}
		},

		deleteData: function () {

			var that = this;
			
			sap.ui.core.BusyIndicator.show(10);

			var scenariosToDelete = [];
			for (var i = 0; i < that._scenarioObject["oData"]["Scenario"].length; i++) {
				
				try {
					
					if (that._scenarioObject["oData"]["Scenario"][i]["Name"] !== "Select/Deselect All Scenarios") {
					
						if (that._scenarioObject["oData"]["Scenario"][i]["selected"]) {
						
							scenariosToDelete.push(that._scenarioObject["oData"]["Scenario"][i]["Name"]);
						
						}
					
					}
				} catch (err) {
					continue;
				}
			}
			
			var oModel = new sap.ui.model.odata.v2.ODataModel("/IBP_GET_JOB_DATA/index.xsodata/");
			
			(function loop(n) {
				
				if (n >= scenariosToDelete.length) return;
				
					var scen = scenariosToDelete[n];
					that.deleteScenario(oModel, scen);
					that.deleteLocal(scen);
					that._scenarioNum--;
					
					if (that._scenarioNum === 0){
						
						that.getView().byId("noScenariosFound").setVisible(true);
						that.getView().byId("scenarioLabel").setVisible(false);
						that.getView().byId("checkBoxHolder").setVisible(false);
						that.getView().byId("viewDataBtn").setEnabled(false);
						that.getView().byId("deleteDataBtn").setEnabled(false);
						
					}
				
				loop(n + 1);
				
			})(0);
			
			sap.ui.core.BusyIndicator.hide();
			var deleteMsg = scenariosToDelete.join(", ");
			
			that.showDeleteMessage(deleteMsg);
		},
		
		deleteScenario: function(oModel, scenario) {
			
			var that = this;
			
			var allFilters = [];
			allFilters.push(new Filter("scenario", "EQ", scenario));
			allFilters.push(new Filter("sys_user", "EQ", that._sysUser));
			allFilters.push(new Filter("business_user", "EQ", that._businessUser));
				
			oModel.read("/Job_Descriptors", {
				
				filters : allFilters,
				
				success: function (result) {

					if (result["results"].length > 0) {
						
						(function loop(n) {

							if (n >= result["results"].length) {
								return;
							}
							var guid = result["results"][n]["guid"];
							
							oModel.remove("/Job_Descriptors('" + guid + "')", {
								
								success: function (data) {
									
									console.log("Deleted " + scenario + " from the DB");

								},
								error: function (err) {

									console.log(err);
								}
							});
							loop(n + 1);
						})(0);

					} else {

						console.log("No results");
					}
				},
				error: function (err) {
					console.log("Error Message");
					console.log(err);
				}
			});
			
		},
		
		deleteLocal: function(scenario) {
			
			var that = this;
			
			for (var j = 0; j < that._scenarioObject["oData"]["Scenario"].length; j++) {
				
				try {
					
					if (that._scenarioObject["oData"]["Scenario"][j]["Name"] === scenario) {
				
						that._scenarioObject["oData"]["Scenario"][j]["visible"] = false;
						that._scenarioObject.refresh();
						break;
				
					}
				}
				catch(err) {
					continue;
				}
					
			}
			
		},
		
		showDeleteMessage: function(scenarioName) {
		
			if (scenarioName === "Select/Deselect All Scenarios") {
				var msg = "Successfully deleted data for all scenarios";
			} else {
				var msg = "Successfully delete data for scenario " + scenarioName;
			}
			
			MessageToast.show(msg);
			
		},
		
		navSplash: function () {

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("splash");

		}
	});
});
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../model/formatter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/export/Spreadsheet",
	'sap/m/MessageToast'

], function (Controller, formatter, JSONModel, Spreadsheet, MessageToast) {
	"use strict";

	return Controller.extend("html_mod.html_mod.controller.PostUpgrade", {

		formatter: formatter,

		onInit: function () {

			var resultRoute = this.getOwnerComponent().getRouter().getRoute("postUpgrade");
			resultRoute.attachPatternMatched(this.onPatternMatched, this);

			this._errors = {

				Errors: []
			};

			this._report = {

				Report: []

			};

			var scenarioObject = this.getOwnerComponent().getModel("userInfo").getProperty("/userScenarioObject");
			console.log("Scenario Object: " + scenarioObject);
			var ScenarioModel = new JSONModel(scenarioObject);
			this.byId('scenario1Name').setModel(ScenarioModel);
			this.byId('scenario2Name').setModel(ScenarioModel);

			this._keys = [];

			this.jModel = new sap.ui.model.json.JSONModel();
			this.jModel.setData(this._errors);
			this.getView().setModel(this.jModel, "errors");

			this.reportModel = new sap.ui.model.json.JSONModel();
			this.reportModel.setData(this._report);

			this._invalid_guids = [];
			this._attr_keys = [];
			this._found_attr_keys = false;

			this._result_keys = [];
			this._found_result_keys = false;

			this._total_cells = 0;
			this._corrupt_cells = 0;

			this._row_corrupt = false;
			this._total_rows = 0;
			this._corrupt_rows = 0;

			this._row_gain = false;
			this._extra_rows = 0;

			this._NoRowsLost = false;
		},

		onPatternMatched: function () {

			this._sysUser = this.getOwnerComponent().getModel("userInfo").getProperty("/sysUser");
			this._businessUser = this.getOwnerComponent().getModel("userInfo").getProperty("/businessUser");
			this._templateName = this.getOwnerComponent().getModel("userInfo").getProperty("/templateName");
			this._scenario = this.getOwnerComponent().getModel("userInfo").getProperty("/scenario");

		},

		generateReport: function () {

			var that = this;

			sap.ui.core.BusyIndicator.show(25);

			setTimeout(function () {
				sap.ui.core.BusyIndicator.attachEventOnce("Open");
			}, 1000);

			var descBefore, descAfter;
			that._scenario1Name = that.getView().byId("scenario1Name").getSelectedKey();
			that._scenario2Name = that.getView().byId("scenario2Name").getSelectedKey();

			var oModelAuthorizationSet = new sap.ui.model.json.JSONModel(

				"/IBP_GET_JOB_DATA/index.xsodata/Job_Descriptors?$filter=business_user eq '" + that._businessUser +
				"' and sys_user eq '" + that._sysUser + "' and scenario eq '" + that._scenario1Name + "'");

			oModelAuthorizationSet.attachRequestCompleted(function (oData, resp) {

				descBefore = oData.getSource().getData().d.results;

				var oModelAuthorizationSet2 = new sap.ui.model.json.JSONModel(

					"/IBP_GET_JOB_DATA/index.xsodata/Job_Descriptors?$filter=business_user eq '" + that._businessUser +
					"' and sys_user eq '" + that._sysUser + "' and scenario eq '" + that._scenario2Name + "'");

				oModelAuthorizationSet2.attachRequestCompleted(function (oData2, resp2) {

					descAfter = oData2.getSource().getData().d.results;
					that.analyzeTables(descBefore, descAfter);

				});

				oModelAuthorizationSet2.attachRequestFailed(function (err) {

					console.log("Error retrieving run 1 data");
				});

			});
			oModelAuthorizationSet.attachRequestFailed(function (err) {

				console.log("Error retrieving run 2 data");
			});

		},

		lostRowAnalyze: function (descBefore, descAfter) {

			var that = this;
			that._row_corrupt = true;
			that._total_rows = descBefore.length;
			var rows_lost = descBefore.length - descAfter.length;
			that._corrupt_rows = rows_lost;
			var losses_found = 0;

			for (var i = 0; i < descAfter.length; i++) {

				var keys = Object.keys(descBefore[i]);
				var errorString = "";

				for (var j = 0; j < keys.length; j++) {

					var foundError = false;

					if (keys[j] === "__metadata" || keys[j] === "guid" || keys[j] === "scenario") {

						continue;
					}
					if (descAfter[i][keys[j]] !== descBefore[i + losses_found][keys[j]]) {

						foundError = true;

						for (var k = 0; k < keys.length; k++) {

							if (descBefore[i][keys[k]] === null || keys[k] === "__metadata" || keys[k] === "guid" || keys[k] === "scenario") {

								continue;

							} else {
								if (!that._found_attr_keys) {

									that._attr_keys.push(keys[k]);
								}

								errorString = errorString + String(descBefore[i][keys[k]]) + ",";
							}
						}
						that._found_attr_keys = true;
						errorString = errorString.substring(0, errorString.length - 1);
						that.reportEntry(errorString.split(","), null, "loss", errorString, "Row was lost");

						that._errors.Errors.push({
							"Before": errorString,
							"After": "Row Was Lost"
						});

						that.jModel.refresh();
						that._invalid_guids.push(descBefore[i]["guid"]);
						losses_found++;
						break;
					}

					if (foundError) {

						break;
					}
				}
			}
			while (rows_lost > losses_found) {

				that._invalid_guids.push(descBefore[i]["guid"]);
				var errorString2 = "";

				for (var n = 0; n < keys.length; n++) {

					if (descBefore[i][keys[n]] === null || keys[n] === "__metadata" || keys[n] === "guid" || keys[n] === "scenario") {

						continue;

					} else {

						errorString2 = errorString2 + String(descBefore[i][keys[n]]) + ",";
					}

				}
				errorString2 = errorString2.substring(0, errorString2.length - 1);
				that.reportEntry(errorString2.split(","), null, "loss", errorString2, "Row Was Lost");

				that._errors.Errors.push({
					"Before": errorString2,
					"After": "Row Was Lost"
				});

				that.jModel.refresh();
				that._invalid_guids.push(descBefore[i]["guid"]);
				losses_found++;

			}

		},

		analyzeNoLoss: function (descBefore, descAfter) {

			var that = this;

			that._NoRowsLost = true;

			(function loop(i) {

				if (i >= descBefore.length) return;

				var row_before = [];
				var row_after = [];
				var before_guid = descBefore[i]["guid"];
				var after_guid = descAfter[i]["guid"];
				var valsBefore, valsAfter, keyFigure;
				var keys = Object.keys(descBefore[i]);

				for (var j = 0; j < keys.length; j++) {

					if (keys[j] === "__metadata" || keys[j] === "scenario" || keys[j] === "guid") {

						continue;

					} else {

						if (keys[j] === "key_figure") {
							keyFigure = descBefore[i][keys[j]];
							console.log("Key Figure: " + keyFigure);
						}

						if (descBefore[i][keys[j]] !== null) {

							if (!that._found_attr_keys) {

								that._attr_keys.push(keys[j]);
							}

							row_before.push(descBefore[i][keys[j]]);
						}
						if (descAfter[i][keys[j]] !== null) {

							row_after.push(descAfter[i][keys[j]]);
						}
					}

				}
				that._found_attr_keys = true;

				var oModelAuthorizationSet = new sap.ui.model.json.JSONModel(

					"/IBP_GET_JOB_DATA/index.xsodata/Job_Results?$filter=data_id eq '" + before_guid + "'");

				oModelAuthorizationSet.attachRequestCompleted(function (oData, resp) {

					valsBefore = oData.getSource().getData().d.results;

					var oModelAuthorizationSet2 = new sap.ui.model.json.JSONModel(

						"/IBP_GET_JOB_DATA/index.xsodata/Job_Results?$filter=data_id eq '" + after_guid + "'");

					oModelAuthorizationSet2.attachRequestCompleted(function (oData2, resp2) {

						valsAfter = oData2.getSource().getData().d.results;

						var result_keys = Object.keys(valsBefore[0]);

						for (var k = 0; k < result_keys.length; k++) {

							if (result_keys[k] === "data_id" || result_keys[k] === "scenario" || result_keys[k] === "__metadata") {

								continue;
							}

							if (valsBefore[0][result_keys[k]] !== null) {

								if (!that._found_result_keys) {

									that._result_keys.push(result_keys[k]);
								}

								row_before.push(valsBefore[0][result_keys[k]]);

							}
							if (valsAfter[0][result_keys[k]] !== null) {

								row_after.push(valsAfter[0][result_keys[k]]);

							}

						}
						that._found_result_keys = true;

						if (row_after.length !== row_before.length) {

							console.log("Infected row!");
						}

						for (var m = 0; m < row_before.length; m++) {

							that._total_cells++;

							if (row_before[m] !== row_after[m]) {

								that._corrupt_cells++;
								that.reportEntry(row_before, row_after, "change", row_before[m], row_after[m], keyFigure);

								var err_obj = {

									"Before": row_before[m],
									"After": row_after[m]
								};
								that._errors.Errors.push(err_obj);
								that.jModel.refresh();
							}
						}
						if (that._corrupt_cells === 0 && i === descBefore.length - 1) {
							that._errors.Errors.push({
								"Before": " ",
								"After": "No Errors Found"
							});
							that.jModel.refresh();
						}
					});
					oModelAuthorizationSet2.attachRequestFailed(function (err) {
						console.log("Error retrieving run 1 data");
					});

				});
				oModelAuthorizationSet.attachRequestFailed(function (err) {
					console.log("Error retrieving run 2 data");
				});

				loop(i + 1);

			})(0);
		},

		gainedRowAnalyze: function (descBefore, descAfter, invalidGuids) {

			var that = this;
			that._row_gain = true;
			that._row_corrupt = true;
			var rows_gained = descAfter.length - descBefore.length;
			that._rows_before = descBefore.length;
			that._extra_rows = rows_gained;
			var gains_found = 0;

			for (var i = 0; i < descBefore.length; i++) {

				var keys = Object.keys(descAfter[i]);
				var errorString = "";

				for (var j = 0; j < keys.length; j++) {

					var foundError = false;

					if (keys[j] === "__metadata" || keys[j] === "guid" || keys[j] === "scenario") {

						continue;
					}

					if (descBefore[i][keys[j]] !== descAfter[i + gains_found][keys[j]]) {

						foundError = true;

						for (var k = 0; k < keys.length; k++) {

							if (descAfter[i][keys[k]] === null || keys[k] === "__metadata" || keys[k] === "guid" || keys[k] === "scenario") {
								continue;
							} else {
								if (!that._found_attr_keys) {

									that._attr_keys.push(keys[k]);
								}
								errorString = errorString + String(descAfter[i][keys[k]]) + ",";
							}

						}

						that._found_attr_keys = true;
						errorString = errorString.substring(0, errorString.length - 1);
						that.reportEntry(null, errorString.split(","), "gain", "Row Was Gained", errorString);
						that._errors.Errors.push({
							"Before": errorString,
							"After": "Row Was Gained"
						});
						that.jModel.refresh();
						invalidGuids.push(descAfter[i]["guid"]);
						gains_found++;
						break;
					}
					if (foundError) {
						break;
					}
				}
			}
			while (rows_gained > gains_found) {
				invalidGuids.push(descAfter[i]["guid"]);
				var errorString2 = "";
				for (var n = 0; n < keys.length; n++) {

					if (descAfter[i][keys[n]] === null || keys[n] === "__metadata" || keys[n] === "guid" || keys[n] === "scenario") {
						continue;
					} else {

						if (!that._found_attr_keys) {

							that._attr_keys.push(keys[n]);
						}

						errorString2 = errorString2 + String(descAfter[i][keys[n]]) + ",";
					}

				}
				that._found_attr_keys = true;
				that.reportEntry(null, errorString2.split(","), "gain", "Row Was Gained", errorString2);
				errorString2 = errorString2.substring(0, errorString2.length - 1);
				that._errors.Errors.push({
					"Before": errorString2,
					"After": "Row Was Gained"
				});
				that.jModel.refresh();
				invalidGuids.push(descAfter[i]["guid"]);
				gains_found++;

			}
			return invalidGuids;

		},

		analyzeTables: function (descBefore, descAfter) {

			var that = this;
			var invalidGuids = [];

			if (descAfter.length > 1 && descBefore.length < 1) {
				alert("Error finding pre-upgrade data. Please check your version and make sure your login credentials are the same.");
				return;
			} else if (descAfter.length < 1 && descBefore.length > 1) {
				alert("Error finding post-upgrade data. Please check your version and make sure your login credentials are the same.");
				return;
			} else if (descAfter.length < 1 && descBefore.length < 1) {
				alert("Error finding data. Please check your version and make sure your login credentials are the same");
				return;
			}

			var updateTable = function () {

				that.getView().byId("errorsTable").setVisible(true);
				that.getView().byId("generateExcel").setEnabled(true);
				that.getView().byId("generateReport").setEnabled(false);
				sap.ui.core.BusyIndicator.hide();

				var corrupt_data_perc = (1 - (that._corrupt_cells / that._total_cells).toFixed(2)) * 100;

				if (!isNaN(corrupt_data_perc)) {

					if (corrupt_data_perc > 99) {
						
						that.getView().byId("errorChart").setValueColor("Good");
						
					} else if (corrupt_data_perc >= 90) {
						
						that.getView().byId("errorChart").setValueColor("Critical");
						
					} else {
						
						that.getView().byId("errorChart").setValueColor("Error");
					}

					that.getView().byId("errorChart").setPercentage(corrupt_data_perc);
					that.getView().byId("errorChart").setVisible(true);

				}

			};

			if (descBefore.length === descAfter.length) {

				$.when(that.analyzeNoLoss(descBefore, descAfter)).then(function () {
					setTimeout(function () {

						updateTable();

					}, 2000);
				});

			} else if (descBefore.length > descAfter.length) {

				$.when(that.lostRowAnalyze(descBefore, descAfter, invalidGuids)).then(function () {
					updateTable();
				});

			} else {

				$.when(that.gainedRowAnalyze(descBefore, descAfter, invalidGuids)).then(function () {
					updateTable();
				});
			}

		},

		generateExcel: function () {

			var aCols, aProducts, oSettings, oSheet;

			aCols = this.createColumnConfig();

			this.makeStatusReport();

			aProducts = this.reportModel.getProperty('/Report');
			
			console.log(aProducts);

			oSettings = {
				workbook: {
					columns: aCols
				},
				dataSource: aProducts
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function () {
					MessageToast.show('Spreadsheet export has finished');
				})
				.finally(function () {
					oSheet.destroy();
				});

		},

		createColumnConfig: function () {

			var columns = [];

			for (var k = 1; k < 3; k++) {
				var beg_column = {
					label: " ",
					property: "desc" + String(k),
					type: 'string',
					width: 20 + (3*(k * k * k))
				};
				columns.push(beg_column);
			}
			for (var i = 0; i < this._attr_keys.length; i++) {

				var one_column = {
					label: this._attr_keys[i],
					property: "col" + String(i),
					type: 'string'
				};
				columns.push(one_column);
			}
			if (this._result_keys.length > 0) {
				for (var j = this._attr_keys.length; j < this._result_keys.length + this._attr_keys.length; j++) {

					var a_column = {
						label: this._result_keys[j - this._attr_keys.length],
						property: "col" + String(j),
						type: 'string'
					};
					columns.push(a_column);

				}
			}

			return columns;

		},

		reportEntry: function (rowBefore, rowAfter, errType, correct, error, keyFigure) {

			var before_row = {};

			before_row["desc1"] = this._scenario1Name + " Data";

			if (rowBefore !== null) {

				before_row["desc2"] = " ";

				for (var i = 0; i < rowBefore.length; i++) {

					before_row["col" + String(i)] = rowBefore[i];
				}
			} else {

				before_row["desc2"] = "Row did not exist";

			}
			this._report.Report.push(before_row);
			this.reportModel.refresh();

			var after_row = {};

			after_row["desc1"] = this._scenario2Name + " Data";

			if (rowAfter !== null) {

				after_row["desc2"] = " ";

				for (var a = 0; a < rowAfter.length; a++) {
					after_row["col" + String(a)] = rowAfter[a];
				}
			} else {

				after_row["desc2"] = "Row was lost";

			}
			this._report.Report.push(after_row);
			this.reportModel.refresh();

			if (errType === "change") {
				var correct_data = {};
				var incorrect_data = {};

				correct_data["desc1"] = "Correct Data:";
				incorrect_data["desc1"] = "Incorrect Data:";

				correct_data["desc2"] = keyFigure + ": " + correct;
				incorrect_data["desc2"] = keyFigure + ": " + error;
				this._report.Report.push(correct_data);
				this._report.Report.push(incorrect_data);
				this.reportModel.refresh();

			}

			var filler_row = {};
			filler_row["desc1"] = " ";

			this._report.Report.push(filler_row);
			this._report.Report.push(filler_row);

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
		},

		makeStatusReport: function () {

			var corrupt_data_perc, corrupt_data_perc_string, corrupt_data_perc_row, total_cells_row, corrupt_cells_row;

			if (!this._row_corrupt) {
				corrupt_data_perc = (1 - (this._corrupt_cells / this._total_cells).toFixed(2)) * 100;
				corrupt_data_perc_string = "Data Unharmed: " + String(corrupt_data_perc) + "%";

				corrupt_data_perc_row = {};
				corrupt_data_perc_row["desc1"] = corrupt_data_perc_string;
				this._report.Report.unshift(corrupt_data_perc_row);

				total_cells_row = {};
				total_cells_row["desc1"] = "Total Cells: " + this._total_cells;
				this._report.Report.unshift(total_cells_row);

				corrupt_cells_row = {};
				corrupt_cells_row["desc1"] = "Corrupt Cells: " + this._corrupt_cells;
				this._report.Report.unshift(corrupt_cells_row);

			} else {

				if (this._row_gain) {
					corrupt_data_perc = (1 - (this._corrupt_rows / this._total_rows).toFixed(2)) * 100;
					corrupt_data_perc_string = "Rows Gained: " + this._extra_rows;

					corrupt_data_perc_row = {};
					corrupt_data_perc_row["desc1"] = corrupt_data_perc_string;
					this._report.Report.unshift(corrupt_data_perc_row);

					total_cells_row = {};
					total_cells_row["desc1"] = "Rows After: " + (this._rows_before + this._extra_rows);
					this._report.Report.unshift(total_cells_row);

					corrupt_cells_row = {};
					corrupt_cells_row["desc1"] = "Rows Before: " + this._rows_before;
					this._report.Report.unshift(corrupt_cells_row);
				} else {
					corrupt_data_perc = (1 - (this._corrupt_rows / this._total_rows)) * 100;
					corrupt_data_perc = corrupt_data_perc.toFixed(2);

					corrupt_data_perc_string = "Rows Unharmed: " + String(corrupt_data_perc) + "%";

					corrupt_data_perc_row = {};
					corrupt_data_perc_row["desc1"] = corrupt_data_perc_string;
					this._report.Report.unshift(corrupt_data_perc_row);

					total_cells_row = {};
					total_cells_row["desc1"] = "Total Rows: " + this._total_rows;
					this._report.Report.unshift(total_cells_row);

					corrupt_cells_row = {};
					corrupt_cells_row["desc1"] = "Lost Rows: " + this._corrupt_rows;
					this._report.Report.unshift(corrupt_cells_row);
				}

			}

			var blank_row = {};
			blank_row["desc1"] = " ";
			this._report.Report.splice(3, 0, blank_row);

		},

		navSplash: function () {

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("splash");

		}
	});
});
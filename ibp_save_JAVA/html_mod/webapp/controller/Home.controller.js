sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../model/formatter",
	"sap/ui/model/json/JSONModel",
	'sap/m/MessageToast'
], function (Controller, formatter, JSONModel, MessageToast) {
	"use strict";

	return Controller.extend("html_mod.html_mod.controller.Home", {

		formatter: formatter,

		onInit: function () {
			
			var that = this;
			
			var resultRoute = this.getOwnerComponent().getRouter().getRoute("home");
			resultRoute.attachPatternMatched(this.onPatternMatched, this);
			
			this._sysUser = this.getOwnerComponent().getModel("userInfo").getProperty("/sysUser");
			this._businessUser = this.getOwnerComponent().getModel("userInfo").getProperty("/businessUser");
			this._pwd = this.getOwnerComponent().getModel("userInfo").getProperty("/pwd");
			this._system = this.getOwnerComponent().getModel("userInfo").getProperty("/system");
			this._systemUrl = this.getOwnerComponent().getModel("userInfo").getProperty("/service_url");
			this._allScenarios = this.getOwnerComponent().getModel("userInfo").getProperty("/allScenarios");
			this._scenarioObjects = this.getOwnerComponent().getModel("userInfo").getProperty("/userScenarioObject");
			// if (this._foundScenario) {
				
			// 	var ScenarioModel = new JSONModel(userScenarios);
			// 	this.byId('scenarioSelect').setModel(ScenarioModel);
			
			// 	this._useExistingToggle = false;
			// 	this._newScenario = false;
				
			// } else {
				
			// 	this.getView().byId("scenarioLabel").setVisible(false);
			// 	this.getView().byId("scenarioSelect").setVisible(false);
			// 	this.getView().byId("orText").setVisible(false);
			
			// 	this.getView().byId("newScenarioLabel").setVisible(true);
			// 	this.getView().byId("newScenario").setVisible(true);
			// 	this._newScenario = true;
				
			// 	this.getView().byId("createScenario").setVisible(false);
				
			// 	this._useExistingToggle = true;
				
			// }
			
			

			


			this._data = {
				Jobs: [{
					Name: '',
					Status: '',
					Description: '',
					Start: '',
					Sequence: 0,
					Creator: '',
					StatusIcon: 'sap-icon://pending',
					RunIcon: '',
					Enabled: false,
					StatusIconColor: 'Contrast',
					Completed: false,
					id: 0
				}]
			};

			this.jModel = new sap.ui.model.json.JSONModel();
			this.jModel.setData(this._data);
			this._data.Jobs.shift();

		},
		
		onPatternMatched: function () {
			

		},

		onBeforeRendering: function () {

			this.byId('jobsTable').setModel(this.jModel);
			
		},
		
		tileChange: function (tileNums) {
		
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.publish("systemInfo", "updateTile", { tiles: tileNums});
			
			
		},
		
		// createScenario: function () {
			
		// 	if (!this._useExistingToggle) {
				
		// 		this.getView().byId("scenarioLabel").setVisible(false);
		// 		this.getView().byId("scenarioSelect").setVisible(false);
			
		// 		this.getView().byId("newScenarioLabel").setVisible(true);
		// 		this.getView().byId("newScenario").setVisible(true);
		// 		this._newScenario = true;
				
		// 		this.getView().byId("createScenario").setText("Use Existing Scenario");
				
		// 		this._useExistingToggle = true;
				
		// 	} else {
				
		// 		this.getView().byId("scenarioLabel").setVisible(true);
		// 		this.getView().byId("scenarioSelect").setVisible(true);
			
		// 		this.getView().byId("newScenarioLabel").setVisible(false);
		// 		this.getView().byId("newScenario").setVisible(false);
		// 		this._newScenario = false;
				
		// 		this.getView().byId("createScenario").setText("Create New Scenario");
				
		// 		this._useExistingToggle = false;
				
		// 	}
			
		// },
		
		scenarioSelected: function () {
		
			var newScenario = this.getView().byId("newScenario").getValue();
			this.tileChange([3,4]);
			this._scenario = newScenario;
			
			
			// if (this._newScenario) {
				
			// 	this.getOwnerComponent().getModel("userInfo").setProperty("/scenario", newScenario);
			// 	this.getOwnerComponent().getModel("userInfo").setProperty("/preOrPost", "pre");
			// 	this._scenario = newScenario;
			// 	this._preOrPost = "pre";
			// 	this.tileChange([4]);
				
			// } else {
				
			// 	this.getOwnerComponent().getModel("userInfo").setProperty("/scenario", scenario);
			// 	this.getOwnerComponent().getModel("userInfo").setProperty("/preOrPost", "post");
			// 	this._scenario = scenario;
			// 	this._preOrPost = "post";
			// 	this.tileChange([3,4]);
			// }
			
			this.getView().byId("fileUploader").setEnabled(true);
				
		},

		submitAll: function () {

			var that = this;
			
			that.getView().byId("scenarioSelected").setEnabled(false);

			var sUrl = "/FC2_Connection/JobTemplateSet";

			(function loop(n) {

				if (n >= that._data.Jobs.length) return;

				var oParams = {

					$filter: "JobTemplateName eq '" + that._data.Jobs[n].Name + "'",
					$format: "json"
				};
				var description = $.get(sUrl, oParams)
					.then(function (result) {
						try {
							description = result.d.results[0].JobTemplateText;
						} catch (err) {
							description = "Job Not Found";
						}
						return description;
					});
				description.then(function () {

					if (description === "Job Not Found") {

						var enabled = false;
						var statusIcon = "sap-icon://error";
						var statusIconColor = "Negative";
						var completed = true;

					} else {

						var enabled = true;
						var statusIcon = "sap-icon://pending";
						var statusIconColor = "Default";
						var completed = false;
					}
					that._data.Jobs[n].Description = description;
					that._data.Jobs[n].Enabled = enabled;
					that._data.Jobs[n].StatusIcon = statusIcon;
					that._data.Jobs[n].Creator = that._businessUser;
					that._data.Jobs[n].StatusIconColor = statusIconColor;
					that._data.Jobs[n].Completed = completed;
					that.jModel.refresh();

					if (n === that._data.Jobs.length - 1) {

						that.getView().byId("submitData").setEnabled(false);
						that.getView().byId("runAll").setEnabled(true);
						that.getView().byId("runAllOrder").setEnabled(true);

						that.getMinValidSequence();

					}
				});
				loop(n + 1);
			})(0);

		},

		onChangeFUP: function (e) {

			this._import(e.getParameter("files") && e.getParameter("files")[0]);
			var fileName = e.getParameter("files")[0].name;

		},

		_import: function (file) {

			var that = this;

			if (file && window.FileReader) {

				var reader = new FileReader();

				reader.onload = function (e) {

					var strCSV = e.target.result;

					var namesArray = strCSV.split("\n");

					for (var i = 0; i < namesArray.length; i++) {

						if (i === 0) {
							var temp = namesArray[i];
							that._templateName = temp.substring(0, temp.length - 2);
							that.getOwnerComponent().getModel("userInfo").setProperty("/templateName", that._templateName);
							continue;
						}

						var job_sequence = namesArray[i].split(",");
						var jobName = job_sequence[0].trim();
						var sequence = parseInt(job_sequence[1]);

						if (jobName.length > 0) {
							that._data.Jobs.push({
								Name: jobName,
								Status: '',
								Description: '',
								Start: '',
								Sequence: sequence,
								Creator: '',
								StatusIcon: 'sap-icon://pending',
								RunIcon: 'sap-icon://physical-activity',
								Enabled: false,
								Completed: false,
								id: i
							});
						}
						that.jModel.refresh();

					}

				}
				reader.readAsText(file);
				that.getView().byId("submitData").setEnabled(true);
				that.getView().byId("fileUploader").setEnabled(false);
			}
		},

		runOne: function (name, description, id) {

			function Job(name, desc, id) {
				this.name = name,
				this.desc = desc,
				this.id = id
			};

			var jobsToRun = [];

			let job = new Job(name, description, id);
			jobsToRun.push(job);

			this.runTheseJobsInParallel(jobsToRun);

		},

		runAll: function () {

			var jobsToRun = this.getJobsNotRun();

			this.runTheseJobsInParallel(jobsToRun);
		},

		runSequenceAll: function () {

			var jobsToRun = this.getJobsInMinSequence();

			this.runTheseJobsInParallel(jobsToRun);

		},

		runSequenceOrder: function () {

			var jobsToRun = this.getJobsInMinSequence();

			this.runTheseJobsInOrder(jobsToRun);
		},

		runAllOrder: function () {

			var jobsToRun = this.getJobsNotRun();

			this.runTheseJobsInOrder(jobsToRun);
		},

		runTheseJobsInOrder: function (jobs) {

			var that = this;

			(function loop(n) {

				if (n >= jobs.length) {
					return;
				}

				$.when(that.runJob(jobs[n].name, jobs[n].desc, jobs[n].id, that._sysUser, that._pwd)).done(function (data, status, xhr) {

					var token = xhr.getResponseHeader('x-csrf-token');

					$.when(that.scheduleJob(jobs[n].name, that._businessUser, jobs[n].desc, token, that._sysUser, that._pwd)).done(function (data, status, xhr) {

						var jobRan = data["d"]["JobName"];
						var jobRunCount = data["d"]["JobRunCount"];

						var entity = that._data.Jobs.find(item => item.id === jobs[n].id);
						var correct_description = entity.Description;
						var forward = true;
						var j = 1

						var checkJobStatus = function () {

							entity.Description = correct_description;

							if (j === 1) {
								forward = true;
							}
							if (j === correct_description.length - 1) {
								forward = false;
							}

							var split_desc = correct_description.split('');
							split_desc.splice(j, 0, "  ");
							var new_desc = split_desc.join('');

							if (forward) {
								j++;
							} else {
								j--;
							}

							entity.Description = new_desc;
							that.jModel.refresh();

							$.when(that.getJobStatus(jobRan, jobRunCount, that._sysUser, that._pwd, token)).done(function (data, status, xhr) {

								var jobStatus = data["d"]["JobStatus"];
								console.log("Job Status: " + jobStatus);
								if (jobStatus == "R") {

									setTimeout(checkJobStatus, 50);

								} else {

									var entity = that._data.Jobs.find(item => item.id === jobs[n].id);
									entity.StatusIcon = "sap-icon://accept";
									entity.RunIcon = "sap-icon://complete";
									entity.Enabled = false;
									entity.StatusIconColor = "Positive";
									entity.Completed = true;
									entity.Description = correct_description;
									that.jModel.refresh();
									that.getMinValidSequence();
									that.checkIfAllDone();
									loop(n + 1);
								}
							});
						}
						checkJobStatus();
					});
				});
			})(0);
		},

		runTheseJobsInParallel: function (jobs) {

			var that = this;

			for (var i = 0; i < jobs.length; i++) {

				$.when(that.runJob(jobs[i].name, jobs[i].desc, jobs[i].id)).done(function (data, status, xhr) {

					var token = xhr.getResponseHeader('x-csrf-token');
					var thisId = data["myJobId"];
					var thisJob = data["myJobName"];
					var thisDesc = data["myJobDesc"];

					$.when(that.scheduleJob(thisJob, that._businessUser, thisDesc, token, that._sysUser, that._pwd)).done(function (data, status, xhr) {

						var jobRan = data["d"]["JobName"];
						var jobRunCount = data["d"]["JobRunCount"];

						var entity = that._data.Jobs.find(item => item.id === thisId);
						var correct_description = entity.Description;
						var forward = true;
						var j = 1

						var checkJobStatus = function () {

							entity.Description = correct_description;

							if (j === 1) {
								forward = true;
							}
							if (j === correct_description.length - 1) {
								forward = false;
							}

							var split_desc = correct_description.split('');
							split_desc.splice(j, 0, "  ");
							var new_desc = split_desc.join('');

							if (forward) {
								j++;
							} else {
								j--;
							}

							entity.Description = new_desc;
							that.jModel.refresh();

							$.when(that.getJobStatus(jobRan, jobRunCount, that._sysUser, that._pwd, token)).done(function (data, status, xhr) {

								var jobStatus = data["d"]["JobStatus"];

								if (jobStatus == "R") {

									setTimeout(checkJobStatus, 50);

								} else {

									var entity = that._data.Jobs.find(item => item.id === thisId);
									entity.StatusIcon = "sap-icon://accept";
									entity.RunIcon = "sap-icon://complete";
									entity.Enabled = false;
									entity.StatusIconColor = "Positive";
									entity.Completed = true;
									entity.Description = correct_description;
									that.jModel.refresh();
									that.getMinValidSequence();
									that.checkIfAllDone();

								}
							});
						}
						checkJobStatus();
					});
				});
			}
		},

		runJob: function (job, description, id, sysUser, pwd) {

			var that = this;

			var currentdate = new Date();
			var datetime = currentdate.getMonth() + 1 + "/" + currentdate.getDate() + "/" + currentdate.getFullYear() + " @ " + currentdate.getHours() +
				":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();

			var entity = that._data.Jobs.find(item => item.id === id);

			entity.Start = datetime;
			entity.StatusIcon = "sap-icon://instance";
			that.jModel.refresh();

			var sUrl = "/FC2_Connection/JobTemplateSet";
			var oParams = {

				$format: "json"
			};
			var oHeaders = {

				Username: sysUser,
				Password: pwd,
				"x-csrf-token": "fetch"
			};
			return $.ajax({

				url: sUrl,
				type: 'get',
				data: oParams,
				headers: oHeaders,
				dataType: 'json',
				success: function (data, status, xhr) {

					data["myJobId"] = id;
					data["myJobName"] = job;
					data["myJobDesc"] = description;

				}
			});
		},

		scheduleJob: function (job, user, description, token, sysUser, pwd) {

			var sUrl = "/FC2_Connection/JobSchedule?JobTemplateName='" + job + "'&JobText='" + description + "'&JobUser='" + user +
				"'&$format=json";

			console.log(sUrl);

			var oHeaders = {
				Username: sysUser,
				Password: pwd,
				"x-csrf-token": token
			};

			return $.ajax({
				url: sUrl,
				type: 'post',
				headers: oHeaders,
				success: function (data) {
					console.log(data);
				},
				error: function (err) {
					console.log(err);
				}
			});

		},

		getJobStatus: function (jobName, jobRunCount, user, pwd, token) {

			var sUrl = "/FC2_Connection/JobStatusGet?JobName='" + jobName + "'&JobRunCount='" + jobRunCount + "'";
			var oParams = {

				$format: "json"
			};
			var oHeaders = {

				Username: user,
				Password: pwd,
				"x-csrf-token": token
			};

			return $.ajax({

				url: sUrl,
				type: 'get',
				data: oParams,
				headers: oHeaders,
				dataType: 'json',
				success: function (data) {}
			});
		},

		getMinValidSequence: function () {

			var that = this;
			var min = 999;

			for (var i = 0; i < that._data.Jobs.length; i++) {

				if (that._data.Jobs[i].Sequence < min && !that._data.Jobs[i].Completed) {

					var sequence = that._data.Jobs[i].Sequence;
					var validSequence = true;

					for (var j = 0; j < that._data.Jobs.length; j++) {

						if (that._data.Jobs[j].Completed && that._data.Jobs[j].Sequence === sequence) {

							validSequence = false;
						}
					}
					if (validSequence) {

						min = that._data.Jobs[i].Sequence;
					}
				}
			}

			if (min !== 999) {

				that.getView().byId("runSequenceAll").setEnabled(true);
				that.getView().byId("runSequenceAll").setText("Run Sequence " + min + " in Parallel");

				that.getView().byId("runSequenceOrder").setEnabled(true);
				that.getView().byId("runSequenceOrder").setText("Run Sequence " + min + " in Order");

			} else {

				that.getView().byId("runSequenceAll").setEnabled(false);
				that.getView().byId("runSequenceAll").setText("No Valid Sequences");

				that.getView().byId("runSequenceOrder").setEnabled(false);
				that.getView().byId("runSequenceOrder").setText("No Valid Sequences");
			}
			return min;
		},

		checkIfAllDone: function () {

			var allDone = true;

			for (var i = 0; i < this._data.Jobs.length; i++) {

				if (!this._data.Jobs[i].Completed) {

					allDone = false;
					break;
				}
			}
			if (allDone) {

				this.byId("jobsDone").setEnabled(true);
				this.byId("runAll").setEnabled(false);
				this.byId("runAllOrder").setEnabled(false);
			}
		},

		jobsDone: function (oEvent) {

			var that = this;
			
			this.getOwnerComponent().getModel("userInfo").setProperty("/jobsRan", true);
			
			that.getView().byId("jobsDone").setEnabled(false);
			
			sap.ui.core.BusyIndicator.show(25);
			
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
				that._scen = msg1Split[0];
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
							value: that._scen
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
					that.byId('attrTable').setModel(that.jModel);
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
				oEntry.scenario = that._scenario;
				//oEntry.preOrPost = that._preOrPost;
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

			sap.ui.core.BusyIndicator.hide();
			that.getView().byId("attrTable").setVisible(true);
			that.getView().byId("jobsTable").setVisible(false);
			that.getView().byId("navToSplash").setEnabled(true);
			
			// if (that._preOrPost === "post") {
				
			// 		that.getOwnerComponent().getModel("userInfo").setProperty("/completedScenario", true);
			// 		var completedScenarios = that.getOwnerComponent().getModel("userInfo").getProperty("/analyzedScenarios");
					
			// 		completedScenarios["Scenario"].push({"Name": that._scenario});
			// 		that.getOwnerComponent().getModel("userInfo").setProperty("/analyzedScenarios", completedScenarios);
			// }
			
			var allScenarios = that.getOwnerComponent().getModel("userInfo").getProperty("/allScenarios");
			if (!allScenarios.includes(that._scenario)) {
				
				console.log("Did not find scenario in existing scenarios");
				
				allScenarios.push(that._scenario);
				that.getOwnerComponent().getModel("userInfo").setProperty("/allScenarios", allScenarios);
				
				console.log("Adding new scenario locally");
				console.log("New scenario objects that are local: " + that._scenarioObjects);
				that._scenarioObjects["Scenario"].push({"Name":that._scenario});
				
				that.getOwnerComponent().getModel("userInfo").setProperty("/userScenarioObject", that._scenarioObjects);
			}
			
			

			
			
			
			
			var msg = 'Data successfully submitted for scenario ' + that._scenario;
			MessageToast.show(msg);

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
		
		
		navToSplash: function () {
			
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("splash");
			
		},

		getJobsInMinSequence: function () {

			var that = this;

			function Job(name, desc, id) {
				this.name = name,
					this.desc = desc,
					this.id = id

			};

			var jobsToRun = [];

			var min = that.getMinValidSequence();

			for (var i = 0; i < that._data.Jobs.length; i++) {

				if (that._data.Jobs[i].Sequence === min) {

					let job = new Job(that._data.Jobs[i].Name, that._data.Jobs[i].Description, that._data.Jobs[i].id);
					jobsToRun.push(job);
				}
			}
			return jobsToRun;
		},

		getJobsNotRun: function () {

			var that = this;

			function Job(name, desc, id) {
				this.name = name,
					this.desc = desc,
					this.id = id

			};

			var jobsToRun = [];

			for (var i = 0; i < that._data.Jobs.length; i++) {

				if (!that._data.Jobs[i].Completed) {

					let job = new Job(that._data.Jobs[i].Name, that._data.Jobs[i].Description, that._data.Jobs[i].id);
					jobsToRun.push(job);
				}
			}
			return jobsToRun;
		}
	});
});
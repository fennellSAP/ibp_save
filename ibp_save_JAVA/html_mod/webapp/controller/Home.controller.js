sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../model/formatter",
	"sap/ui/model/json/JSONModel"
], function (Controller, formatter, JSONModel) {
	"use strict";

	return Controller.extend("html_mod.html_mod.controller.Home", {

		formatter: formatter,

		onInit: function () {
			
			
			var resultRoute = this.getOwnerComponent().getRouter().getRoute("home");
			resultRoute.attachPatternMatched(this.onPatternMatched, this);

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
			
			this._ibp_version = this.getOwnerComponent().getModel("userInfo").getProperty("/ibp_version");

		},

		onBeforeRendering: function () {

			this.byId('jobsTable').setModel(this.jModel);
		},

		submitAll: function () {

			var that = this;

			var businessUser = that.getView().byId("businessUser").getValue();

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
					that._data.Jobs[n].Creator = businessUser;
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

			var sysUser = that.getView().byId("systemUser").getValue();
			var pwd = that.getView().byId("systemUserPassword").getValue();
			var businessUser = that.getView().byId("businessUser").getValue();

			(function loop(n) {

				if (n >= jobs.length) {
					return;
				}

				$.when(that.runJob(jobs[n].name, jobs[n].desc, jobs[n].id, sysUser, pwd)).done(function (data, status, xhr) {

					var token = xhr.getResponseHeader('x-csrf-token');

					$.when(that.scheduleJob(jobs[n].name, businessUser, jobs[n].desc, token, sysUser, pwd)).done(function (data, status, xhr) {

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

							$.when(that.getJobStatus(jobRan, jobRunCount, sysUser, pwd, token)).done(function (data, status, xhr) {

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

			var sysUser = that.getView().byId("systemUser").getValue();
			var pwd = that.getView().byId("systemUserPassword").getValue();
			var businessUser = that.getView().byId("businessUser").getValue();

			for (var i = 0; i < jobs.length; i++) {

				$.when(that.runJob(jobs[i].name, jobs[i].desc, jobs[i].id)).done(function (data, status, xhr) {

					var token = xhr.getResponseHeader('x-csrf-token');
					var thisId = data["myJobId"];
					var thisJob = data["myJobName"];
					var thisDesc = data["myJobDesc"];

					$.when(that.scheduleJob(thisJob, businessUser, thisDesc, token, sysUser, pwd)).done(function (data, status, xhr) {

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

							$.when(that.getJobStatus(jobRan, jobRunCount, sysUser, pwd, token)).done(function (data, status, xhr) {

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

			var sysUser = this.getView().byId("systemUser").getValue();
			this.getOwnerComponent().getModel("userInfo").setProperty("/sysUser", sysUser);

			var businessUser = this.getView().byId("businessUser").getValue();
			this.getOwnerComponent().getModel("userInfo").setProperty("/businessUser", businessUser);

			var pwd = this.getView().byId("systemUserPassword").getValue();
			this.getOwnerComponent().getModel("userInfo").setProperty("/pwd", pwd);

			var isSelected = this.byId("postCheck").getSelected();

			if (isSelected) {

				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("postUpgrade");

			} else {

				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("getResults");
			}

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
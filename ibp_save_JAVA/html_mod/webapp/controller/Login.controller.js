sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../model/formatter",
	"sap/ui/model/json/JSONModel"

], function (Controller, formatter, JSONModel) {
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
			
			toLogin: function() {
				
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
			
			createAccount: function () {
				
				var userEmail = this.getView().byId("emailEnter").getValue();
				var pwd1 = this.getView().byId("pwdEnter").getValue();
				var pwd2 = this.getView().byId("pwdReEnter").getValue();
				
				
				
			}

	});
});
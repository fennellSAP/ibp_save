sap.ui.define([], function () {
	"use strict";

	return {

		checkErrorColor: function (desc) {

			if (desc === "Job Not Found") {
				return "Error";
			} else {
				return "None";
			}

		}

	};

});
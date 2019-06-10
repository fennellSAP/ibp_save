/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"html_mod/html_mod/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});
/**
 * Mock implementation of the Core JS API from the Native host app.
 *
 * Will be automatically replaced by native code when running in Hosted mode
 *
 * @version 0.1
 * @author David Lindkvist
 */
	
/*global AIQ:true*/

var AIQ = AIQ || {};
AIQ.Core = AIQ.Core || {};

AIQ._applicationId = -1;

// check for DOM ready - then wait for applicationId to be set
(function() {

	function checkComplete() {
		
		if (document.readyState !== "complete") {
			// wait for DOM to load
			return setTimeout(checkComplete, 0);
		}
		
		var e = document.createEvent("Events");
		e.initEvent("aiq-ready", false, false);
		document.dispatchEvent(e);
	}

	checkComplete();

})();

/**
 * Mock implementation of the Maps JS API from the Native host app.
 *
 * Will be automatically replaced by native code when running in Hosted mode
 *
 * @version 0.1
 * @author Marcin Lukow
 */
    
/*global AIQ:true*/

if (!AIQ.External) {
    AIQ.External = {};
}

if (!AIQ.External.Maps) {

    AIQ.External.Maps = {};

    // AIQ.External.Maps.open(settings)
    AIQ.External.Maps.open = function(settings) {
	// do nothing
    };

}

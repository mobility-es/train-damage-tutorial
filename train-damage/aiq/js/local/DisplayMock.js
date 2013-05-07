/**
 * Mock implementation of the Display JS API from the Native host app.
 *
 * Will be automatically replaced by native code when running in Hosted mode
 *
 * @version 0.1
 * @author Marcin Lukow
 */
    
/*global AIQ:true*/

if (!AIQ.Core.Display) {

    AIQ.Core.Display = {};

    // AIQ.Core.Display.setOrientation(orientation)
    AIQ.Core.Display.setOrientation = function (orientation) {
	// do nothing
    };

}

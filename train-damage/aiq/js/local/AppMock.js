/**
 * Mock implementation of the App JS API from the Native host app.
 *
 * Will be automatically replaced by native code when running in Hosted mode
 *
 * @version 0.1
 * @author Marcin Lukow
 */

/*global AIQ:true*/

if (!AIQ.Core.App) {

    AIQ.Core.App = {};

    // AIQ.Core.App.setTitle(title)
    AIQ.Core.App.setTitle = function (title) {
        document.title = title;
    };

    AIQ.Core.App.close = function() {
	// do nothing
    };

}

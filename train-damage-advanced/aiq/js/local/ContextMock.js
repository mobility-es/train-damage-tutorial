/**
 * Mock implementation of the Context API from the Native host app.
 *
 * Stores data in local storage
 *
 * @version 1.0
 * @author Marcin Lukow, Irina Gudkova
 */

/*global AIQ:false, WO:false */
if (!AIQ.Core.Context) {
    AIQ.Core.Context = {};

    // AIQ.Core.Context.getGlobal(providerName[, settings])
    AIQ.Core.Context.getGlobal = function (providerName, settings) {
        // no callbacks - no getter
        if (!settings) {
            return;
        }

        var callbacks = {
            success: settings.success || function () { },
            failure: settings.failure || function () { }
        };

        var getContextDoc = function (contextType, callbacks) {
            AIQ.Core.DataSync.getDocuments(contextType, {
                success: function (docs) {
                    if (docs.length > 0 && providerName in docs[0]) {
                        callbacks.success(docs[0][providerName]);
                    }
                    else {
                        callbacks.failure();
                    }
                }
            });
        };

        getContextDoc("_clientcontext", {
            success: callbacks.success,
            failure: function () {
                getContextDoc("_backendcontext", callbacks);
            }
        });
    };

    // AIQ.Core.Context.getLocal(key[, settings])
    AIQ.Core.Context.getLocal = function (key, settings) {
        // no callbacks - no getter
        if (!settings) {
            return;
        }

        var callbacks = {
            success: settings.success || function () { },
            failure: settings.failure || function () { }
        };

        AIQ.Core.DataSync.getDocuments("_clientcontext", {
            success: function (docs) {
                if (docs.length > 0) {
                    var doc = docs[0];
                    if ("com.appearnetworks.aiq.apps" in doc) {
                        var appContext = doc["com.appearnetworks.aiq.apps"];
                        if (key in appContext) {
                            callbacks.success(appContext[key]);
                            return;
                        }
                    }
                }

                callbacks.failure();
            }
        });
    };

    // AIQ.Core.Context.getLocal(key, value[, settings])
    AIQ.Core.Context.setLocal = function (key, value, settings) {
        settings = settings || {};

        var callbacks = {
            success: settings.success || function () { },
            failure: settings.failure || function () { }
        };

        AIQ.Core.DataSync.getDocuments("_clientcontext", {
            success: function (docs) {
                var doc;
                if (docs.length > 0) {
                    doc = docs[0];
                    doc["com.appearnetworks.aiq.apps"] = doc["com.appearnetworks.aiq.apps"] || {};
                    doc["com.appearnetworks.aiq.apps"][key] = value;

                    AIQ.Core.DataSync.updateDocument(doc._id, doc, callbacks);
                }
                else {
                    doc = {};
                    doc["com.appearnetworks.aiq.apps"] = {};
                    doc["com.appearnetworks.aiq.apps"][key] = value;

                    AIQ.Core.DataSync.createDocument("_clientcontext", doc, callbacks);
                }
            }
        });
    };
}


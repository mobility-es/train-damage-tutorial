/**
 * Mock implementation of the Core DataSync API from the Native host app.
 *
 * Stores data in local storage
 *
 * @version 0.1
 * @author David Lindkvist
 */

/*global AIQ:false, WO:false */
if (!AIQ.Core.DataSync) {
    AIQ.Core.DataSync = {};
    AIQ.Core.DataSync.registeredCallbacks = [];
    AIQ.Core.DataSync.idCount = 0;

    // AIQ.Core.DataSync.getDocument(id[, settings])
    AIQ.Core.DataSync.getDocument = function (id, settings) {

        // return fake launchable document if requested
        if (id === AIQ._applicationId) {
            return settings.success( {name: 'Mock App name'} );
        }

        var document;
        var docs = localStorage['AIQ.Documents'] ? JSON.parse(localStorage['AIQ.Documents']) : [];
        for (var i = 0; i < docs.length; i++) {
            if (docs[i]._id === id) {
                document = docs[i];
            }
        }

        setTimeout(function () {
            if(document)
                settings.success( document );
            else
                settings.failure();
        }, 500);
    };

    // AIQ.Core.DataSync.getAttachment(id, name[, settings])
    AIQ.Core.DataSync.getAttachment = function(id, name, settings) {
        var result = undefined;
	var store = localStorage['AIQ.Attachments'] ? JSON.parse(localStorage['AIQ.Attachments']) : {};
	var attachments = store[id];
	if (attachments !== undefined) {
	    var attachment = attachments[name];
	    if (attachment !== undefined) {
		result = {
		    name: name,
		    contentType: attachment.contentType,
		    resourceId: attachment.resourceId,
		    state: 'available'
		};
	    }
	}
        setTimeout(function() {
            if (result) {
                settings.success(result);
            } else if (settings.failure) {
                settings.failure();
            }
        }, 500);
    };

    // AIQ.Core.DataSync.getDocuments(type[, settings])
    AIQ.Core.DataSync.getDocuments = function (type, settings) {
        
        var docs = localStorage['AIQ.Documents'] ? JSON.parse(localStorage['AIQ.Documents']) : [];

        var typedDocs = [];
        for (var i = 0; i < docs.length; i++) {
            if (docs[i]._type === type) {
                typedDocs.push( docs[i] );
            }
        }

        setTimeout(function () {
            settings.success( typedDocs );
        }, 500);
    };

    // AIQ.Core.DataSync.getAttachments(id[, settings])
    AIQ.Core.DataSync.getAttachments = function(id, settings) {
        var result = [];
	var store = localStorage['AIQ.Attachments'] ? JSON.parse(localStorage['AIQ.Attachments']) : {};
	var attachments = store[id];
	if (attachments !== undefined) {
	    for (var name in attachments) {
		result.push({
		    name: name,
		    contentType: attachments[name].contentType,
		    resourceId: attachments[name].resourceId,
		    state: 'available'
		});
	    }
	}
        setTimeout(function() {
            settings.success(result);
        }, 500);
    };

    // AIQ.Core.DataSync.createDocument(type, object[, settings])
    AIQ.Core.DataSync.createDocument = function (type, object, settings) {
        var docs = localStorage['AIQ.Documents'] ? JSON.parse(localStorage['AIQ.Documents']) : [];

        object._id = +new Date() + '-' + (++AIQ.Core.DataSync.idCount); // generate simple timestamp ID as string
	object._type = type;
	object._rev = 0;
        docs.push( object );
        localStorage['AIQ.Documents'] = JSON.stringify( docs );
        AIQ.Core.DataSync.triggerDocumentEvent('document-created', type, object._id);
        
        if (settings !== undefined) {
            return settings.success( object );
        }
    };

    // AIQ.Core.DataSync.updateDocument(id, object[, settings])
    AIQ.Core.DataSync.updateDocument = function (id, object, settings) {
        var docs = localStorage['AIQ.Documents'] ? JSON.parse(localStorage['AIQ.Documents']) : [];
        for (var i = 0; i < docs.length; i++) {
            if (docs[i]._id === id) {
		object._id = docs[i]._id;
		object._rev = docs[i]._rev;
		object._type = docs[i]._type;
		object._launchable = docs[i]._launchable;
                docs[i] = object;
                localStorage['AIQ.Documents'] = JSON.stringify( docs );
                AIQ.Core.DataSync.triggerDocumentEvent('document-updated', object._type, id);
                return settings.success( docs[i] );
            }
        }
        if (settings.failure) { settings.failure(); }
    };

    // AIQ.Core.DataSync.deleteDocument(id[, settings])
    AIQ.Core.DataSync.deleteDocument = function (id, settings) {
        var docs = localStorage['AIQ.Documents'] ? JSON.parse(localStorage['AIQ.Documents']) : [];
        for (var i = 0; i < docs.length; i++) {
            if (docs[i]._id === id) {
                var type = docs[i]._type;
                docs.splice(i, 1);
                localStorage['AIQ.Documents'] = JSON.stringify( docs );
                AIQ.Core.DataSync.triggerDocumentEvent('document-deleted', type, id);
                return settings.success();
            }
        }
        if (settings.failure) { settings.failure(); }
    };

    // AIQ.Core.DataSync.deleteAttachment(id, name[, settings])
    AIQ.Core.DataSync.deleteAttachment = function(id, name, settings) {
        var docs = localStorage['AIQ.Documents'] ? JSON.parse(localStorage['AIQ.Documents']) : {};
        for (var i = 0; i < docs.length; i++) {
            if (docs[i]._id === id) {
                if (docs[i]._attachments[name] !== undefined) {
                    delete docs[i]._attachments[name];
                    localStorage['AIQ.Documents'] = JSON.stringify(docs);
                    return settings.success();
                }
            }
        }
        if (settings.failure) { settings.failure(); }
    };

    AIQ.Core.DataSync.synchronize = function () {
        setTimeout(function () {
            AIQ.Core.DataSync.triggerDocumentEvent('synchronization-complete');
        }, 1500);
    };
    

    var _events = {};
    var _documentEvents = {};
    var _attachmentEvents = {};

    var fireCallbacks = function(event, args) {
        for (var c in _events[event]) {
            _events[event][c]();
        }
    };
    
    var fireDocumentCallbacks = function(event, args) {
        var types = _documentEvents[event];
        if (types) {
            var local = (args._caller == AIQ._applicationId);
            var callbacks = types["__all__"];
            if (callbacks) {
                for (var c in callbacks) {
                    callbacks[c](args._id, local);
                }
            }
            callbacks = types[args._type];
            if (callbacks) {
                for (var c in callbacks) {
                    callbacks[c](args._id, local);
                }
            }
        }
    };

    var fireAttachmentCallbacks = function(event, args) {
        var ids = _attachmentEvents[event];
        if (ids) {
            var names = ids["__all__"];
            if (names) {
                var callbacks = names["__all__"];
                if (callbacks) {
                    for (var c in callbacks) {
                        callbacks[c](args._id, args._name);
                    }
                }
                callbacks = names[args._name];
                if (callbacks) {
                    for (var c in callbacks) {
                        callbacks[c](args._id, args._name);
                    }
                }
            }
        }
        
        var names = ids[args._id];
        if (names) {
            var callbacks = names["__all__"];
            if (callbacks) {
                for (var c in callbacks) {
                    callbacks[c](args._id, args._name);
                }
            }
            callbacks = names[args._name];
            if (callbacks) {
                for (var c in callbacks) {
                    callbacks[c](args._id, args._name);
                }
            }
        }
    };

    AIQ.Core.DataSync.triggerDocumentEvent = function (event, type, documentId) {
        fireDocumentCallbacks(event, {_type: type, _id: documentId, _caller: AIQ._applicationId});
    };

    AIQ.Core.DataSync.bindDocumentEvent = function(event, type, callback) {
        var types = _documentEvents[event];
        if (! types) {
            types = {};
            _documentEvents[event] = types;
        }
        if (! type) {
            type = "__all__";
        }
        var callbacks = types[type];
        if (! callbacks) {
            callbacks = [];
            types[type] = callbacks;
        }
        callbacks.push(callback);
    };

    AIQ.Core.DataSync.bindAttachmentEvent = function(event, documentId, name, callback) {
        var ids = _attachmentEvents[event];
        if (! ids) {
            ids = {};
            _attachmentEvents[event] = ids;
        }
        if (! id) {
            id = "__all__";
        }
        var names = ids[id];
        if (! names) {
            names = {};
            ids[id] = names;
        }
        if (! name) {
            name = "__all__";
        }
        var callbacks = names[name];
        if (! callbacks) {
            callbacks = [];
            names[name] = callbacks;
        }
        callbacks.push(callback);
    };

    AIQ.Core.DataSync.bindEvent = function(event, callback) {
        var callbacks = _events[event];
        if (! callbacks) {
            callbacks = [];
            _events[event] = callbacks;
        }
        callbacks.push(callback);
    };

    AIQ.Core.DataSync.unbind = function(callback) {
        for (var event in _events) {
            var callbacks = _events[event];
            var index;
            while ((index = callbacks.indexOf(callback)) > -1) {
                callbacks.splice(index, 1);
            }
            _events[event] = callbacks;
        }
        for (var event in _documentEvents) {
            for (var type in _documentEvents[event]) {
                var callbacks = _documentEvents[event][type];
                var index;
                while ((index = callbacks.indexOf(callback)) > -1) {
                    callbacks.splice(index, 1);
                }
                _documentEvents[event][type] = callbacks;
            }
        }
        for (var event in _attachmentEvents) {
            for (var id in _attachmentEvents[event]) {
                for (var name in _attachmentEvents[event][id]) {
                    var callbacks = _attachmentEvents[event][id][name];
                    var index;
                    while ((index = callbacks.indexOf(callback)) > -1) {
                        callbacks.splice(index, 1);
                    }
                    _attachmentEvents[event][id][name] = callbacks;
                }
            }
        }
    };

    AIQ.Core.DataSync.getConnectionStatus = function(callback) {
	callback(true);
    };
}


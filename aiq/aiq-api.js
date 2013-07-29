/*! aiq-api-mock - v0.0.1-9d155f - 2013-06-11 */

var aiq = aiq || {
    version: '1.0',

    /**
     * Read mocked data from `/mock-data/{{name}}.json
     *
     * @note                    Should not be covered by the unittest
     *                          as exists in the Mocked Api only
     *
     * @param  {String} name    Mock type
     * @return {Object}         Mocked content
     */
    _getMockData: function (name) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'mock-data/' + name + '.json', false);
        xhr.send(null);

        var json;
        if ((xhr.status === 200) ||
            (xhr.status === 0)) { // workaround for iOS simulator returning 0 for local files}
            try {
                json = JSON.parse(xhr.responseText);
            } catch (exception) {
                console.error(name + '.json contains invalid JSON data.');
            }
        }
        return json;
    },

    /**
     *
     * @note                    Should not be covered by the unittest
     *                          as exists in the Mocked Api only
     *
     * @param  {Object} object
     * @param  {String} filter
     * @return {Object}
     */
    _cloneObject: function (object, filter) {
        var target = {};
        for (var key in object) {
            if ((object.hasOwnProperty(key)) &&
                ((! filter) || (! key.match(filter)))) {
                target[key] = object[key];
            }
        }
        return target;
    },

    /**
     *
     * @note                    Should not be covered by the unittest
     *                          as exists in the Mocked Api only
     *
     * @param  {Function} callback
     * @param  {String}   message
     * @param  {Object}   otherFlags
     * @return {Void}
     */
    _failWithMessage: function (callback, message, otherFlags) {
        if (typeof callback === 'function') {
            var arg = (typeof otherFlags === 'object') ? aiq._cloneObject(otherFlags) : {};
            arg.message = message;
            callback(arg);
        }
    }
};

// check for DOM ready - then wait for applicationId to be set
(function() {

    // Extending window.console
    ['debug', 'info', 'warn', 'error', 'trace'].forEach(function (type) {
        if (!console[type]) {
            console[type] = console.log.bind(console);
        }
    });

    function checkComplete() {
        if (document.readyState !== 'complete') {
            // wait for DOM to load
            return setTimeout(checkComplete, 0);
        }

        aiq.datasync.createDocument('_launchable', {
            name: 'Mock application'
        }, {
            setupPartialIOSBridge: function() {
                aiq._executing = false;
                aiq._queue = [];
                aiq._bridge = document.createElement('iframe');
                aiq._bridge.setAttribute('width', '0px');
                aiq._bridge.setAttribute('height', '0px');
                aiq._bridge.setAttribute('frameborder', '0px');
                aiq._bridge.setAttribute('style', 'display: none');
                aiq._getCommandQueue = function() {
                    var json = JSON.stringify(aiq._queue);
                    aiq._queue = [];
                    return json;
                };
                aiq._callBridge = function(type,command) {
                    aiq._queue.push({
                        type: type,
                        command: command
                    });
                    if ((aiq._queue.length === 1) &&
                        (! aiq._executing) &&
                        (aiq._bridge !== null)) {
                        aiq._bridge.src = 'aiqjs://ready';
                    }
                };
                document.documentElement.appendChild(aiq._bridge);
                window.addEventListener('hashchange', function() {
                    var command = {
                        method: 'hashChanged',
                        hash: window.location.hash
                    };
                    aiq._callBridge('management', command);
                },false);
            },
            success: function(doc) {
                aiq._applicationId = doc._id;

                if (aiq.device.os === 'iOS') {
                    this.setupPartialIOSBridge();
                }
                var e = document.createEvent('Events');
                e.initEvent('aiq-ready', false, false);
                document.dispatchEvent(e);
            }
        });

    }

    checkComplete();

})();

(function() {
    'use strict';

    if (! aiq.datasync) {
        aiq.datasync = {
            _documents: [],
            _attachments: {},
            _events: {},
            _documentEvents: {},
            _attachmentEvents: {}
        };

        var triggerEvent = function(event) {
            if (aiq.datasync._events.hasOwnProperty(event)) {
                aiq.datasync._events[event].forEach(function(callback) {
                    callback();
                });
            }
        };

        var triggerDocumentEvent = function(event, id, type) {
            if (aiq.datasync._documentEvents.hasOwnProperty(event)) {
                var types = aiq.datasync._documentEvents[event];
                id = id || '__all__';
                type = type || '__all__';
                if (types.hasOwnProperty(type)) {
                    types[type].forEach(function(callback) {
                        callback(id, true);
                    });
                }
            }
        };

        var triggerAttachmentEvent = function(event, id, name) {
            if (aiq.datasync._attachmentEvents.hasOwnProperty(event)) {
                var ids = aiq.datasync._attachmentEvents[event];
                id = id || '__all__';
                name = name || '__all__';
                if (ids.hasOwnProperty(id)) {
                    var names = ids[id];
                    if (names.hasOwnProperty(name)) {
                        names[name].forEach(function(callback) {
                            callback(id, name);
                        });
                    }
                }
            }
        };

        // aiq.datasync.getDocument(id[, settings])
        aiq.datasync.getDocument = function(id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof settings.success === 'function') {
                var document;
                aiq.datasync._documents.some(function(doc) {
                    if (doc._id === id) {
                        document = aiq._cloneObject(doc);
                        return true;
                    }
                    return false;
                });
                if (document) {
                    settings.success(document);
                } else {
                    aiq._failWithMessage(settings.failure, 'Document not found');
                }
            }
        };

        // aiq.datasync.createDocument(type, fields[, settings])
        aiq.datasync.createDocument = function (type, fields, settings) {
            settings = settings || {};

            if (typeof type !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid type');
            } else if (typeof fields !== 'object') {
                aiq._failWithMessage(settings.failure, 'Invalid fields');
            } else {
                var id = fields._id || Date.now().toString(16) + '_' + aiq.datasync._documents.length;
                var document = aiq._cloneObject(fields, '^_');
                document._id = id;
                document._type = type;
                aiq.datasync._documents.push(document);
                triggerDocumentEvent('document-created', id, type);

                if (typeof settings.success === 'function') {
                    settings.success(document);
                }
            }
        };

        // aiq.datasync.updateDocument(id, fields[, settings])
        aiq.datasync.updateDocument = function(id, fields, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof fields !== 'object') {
                aiq._failWithMessage(settings.failure, 'Invalid fields');
            } else {
                var docIndex = -1;
                aiq.datasync._documents.some(function(doc, index) {
                    if (doc._id === id) {
                        docIndex = index;
                        return true;
                    }
                    return false;
                });
                if (docIndex === -1) {
                    aiq._failWithMessage(settings.failure, 'Document not found');
                } else {
                    var doc = aiq._cloneObject(fields, '^_');
                    doc._id = id;
                    doc._type = aiq.datasync._documents[docIndex]._type;
                    aiq.datasync._documents[docIndex] = doc;
                    triggerDocumentEvent('document-updated', id, doc._type);

                    if (typeof settings.success === 'function') {
                        settings.success(doc);
                    }
                }
            }
        };

        // aiq.datasync.deleteDocument(id[, settings])
        aiq.datasync.deleteDocument = function (id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else {
                var docIndex = -1;
                aiq.datasync._documents.some(function(doc, index) {
                    if (doc._id === id) {
                        docIndex = index;
                        return true;
                    }
                    return false;
                });
                if (docIndex === -1) {
                    aiq._failWithMessage(settings.failure, 'Document not found');
                } else {
                    var type = aiq.datasync._documents[docIndex]._type;
                    aiq.datasync._documents.splice(docIndex, 1);
                    triggerDocumentEvent('document-deleted', id, type);

                    if (typeof settings.success === 'function') {
                        settings.success();
                    }
                }
            }
        };

        // aiq.datasync.getDocuments(type[, settings])
        aiq.datasync.getDocuments = function(type, settings) {
            settings = settings || {};

            if (typeof type !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid type');
            } else if (typeof settings.success === 'function') {
                var docs = [];
                aiq.datasync._documents.forEach(function(doc) {
                    if (doc._type === type) {
                        // Document object has to be copied because our nasty spine
                        // model implementation renames _id fields to id.
                        docs.push(aiq._cloneObject(doc));
                    }
                });
                settings.success(docs);
            }
        };

        // aiq.datasync.getAttachment(id, name[, settings])
        aiq.datasync.getAttachment = function(id, name, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof name !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid name');
            } else if (typeof settings.success === 'function') {
                // Let's make sure that the document exists
                aiq.datasync.getDocument(id, {
                    success: function() {
                        var attachments = aiq.datasync_attachments[id] || {};
                        var attachment = attachments[name];
                        if (attachment) {
                            settings.success({
                                name: name,
                                contentType: attachment.contentType,
                                resourceId: attachment.resourceId,
                                state: 'available'
                            });
                        } else {
                            aiq._failWithMessage(settings.failure, 'Attachment not found');
                        }
                    },
                    failure: settings.failure,
                    error: settings.error
                });
            }
        };

        // aiq.datasync._createAttachment(id, name, data, contentType[, settings]) - private API
        aiq.datasync._createAttachment = function(id, name, data, contentType, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid name');
            } else if (typeof data !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid data');
            } else if (typeof contentType !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid content type');
            } else {
                // Let's make sure that the document exists
                aiq.datasync.getDocument(id, {
                    success: function() {
                        var attachments = aiq.datasync._attachments[id] || {};
                        attachments[name] = {
                            contentType: contentType,
                            resourceId: data
                        };
                        aiq.datasync._attachments[id] = attachments;
                        triggerAttachmentEvent('attachment-available', id, name);

                        if (typeof settings.success === 'function') {
                            settings.success({
                                name: name,
                                contentType: contentType,
                                resourceId: data,
                                status: 'available'
                            });
                        }
                    },
                    failure: settings.failure,
                    error: settings.error
                });
            }
        };

        // aiq.datasync.deleteAttachment(id, name[, settings])
        aiq.datasync.deleteAttachment = function (id, name, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof name !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid name');
            } else {
                // Let's make sure that the document exists
                aiq.datasync.getDocument(id, {
                    success: function() {
                        var attachments = aiq.datasync._attachments[id];
                        if (attachments.hasOwnProperty(name)) {
                            delete attachments[name];

                            if (typeof settings.success === 'function') {
                                settings.success();
                            }
                        } else {
                            aiq._failWithMessage(settings.failure, 'Attachment not found');
                        }
                    },
                    failure: settings.failure,
                    error: settings.error
                });
            }

        };

        // aiq.datasync.getAttachments(id[, settings])
        aiq.datasync.getAttachments = function(id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof settings.success === 'function') {
                // Let's make sure that the document exists
                aiq.datasync.getDocument(id, {
                    success: function() {
                        var attachments = aiq.datasync._attachments[id] || {};
                        var result = Object.keys(attachments).map(function(name) {
                            return {
                                name: name,
                                contentType: attachments[name].contentType,
                                resourceId: attachments[name].resourceId,
                                status: 'available'
                            };
                        });
                        settings.success(result);
                    },
                    failure: settings.failure,
                    error: settings.error
                });
            }
        };

        // aiq.datasync.synchronize()
        aiq.datasync.synchronize = function() {
            setTimeout(function() {
                triggerEvent('synchronization-complete');
            }, 1500);
        };

        // aiq.datasync.bindDocumentEvent()
        aiq.datasync.bindDocumentEvent = function (event, type, callback) {
            if ((typeof event === 'string') && (typeof callback === 'function')) {
                type = type || '__all__';

                var types = aiq.datasync._documentEvents[event] || {};
                var callbacks = types[type] || [];
                callbacks.push(callback);

                types[type] = callbacks;
                aiq.datasync._documentEvents[event] = types;
            }
        };

        // aiq.datasync.bindAttachmentEvent()
        aiq.datasync.bindAttachmentEvent = function (event, id, name, callback) {
            if ((typeof event === 'string') && (typeof callback === 'function')) {
                id = id || '__all__';
                name = name || '__all__';

                var ids = aiq.datasync._attachmentEvents || {};
                var names = ids[id] || {};
                var callbacks = names[name] || [];
                callbacks.push(callback);

                names[name] = callbacks;
                ids[id] = names;
                aiq.datasync._attachmentEvents[event] = ids;
            }
        };

        // aiq.datasync.bindEvent()
        aiq.datasync.bindEvent = function (event, callback) {
            if ((typeof event === 'string') && (typeof callback === 'function')) {
                var callbacks = aiq.datasync._events[event] || [];
                callbacks.push(callback);

                aiq.datasync._events[event] = callbacks;
            }
        };

        // aiq.datasync.unbind()
        aiq.datasync.unbind = function(callback) {
            if (typeof callback === 'function') {
                // var event;
                var index;
                var callbacks;

                Object.keys(aiq.datasync._events).forEach(function(event) {
                    callbacks = aiq.datasync._events[event];
                    while ((index = callbacks.indexOf(callback)) !== -1) {
                        callbacks.splice(index, 1);
                    }
                    aiq.datasync._events[event] = callbacks;
                });

                Object.keys(aiq.datasync._documentEvents).forEach(function(event) {
                    var types = aiq.datasync._documentEvents[event];
                    Object.keys(types).forEach(function(type) {
                        callbacks = types[type];
                        while ((index = callbacks.indexOf(callback)) !== -1) {
                            callbacks.splice(index, 1);
                        }
                        types[type] = callbacks;

                    });
                    aiq.datasync._documentEvents[event] = types;
                });

                Object.keys(aiq.datasync._attachmentEvents).forEach(function(event) {
                    var ids = aiq.datasync._attachmentEvents[event];
                    Object.keys(ids).forEach(function(id) {
                        var names = ids[id];
                        Object.keys(names).forEach(function(name) {
                            callbacks = names[name];
                            while ((index = callbacks.indexOf(callback)) !== -1) {
                                callbacks.splice(index, 1);
                            }
                            names[name] = callbacks;
                        });
                        ids[id] = names;
                    });
                    aiq.datasync._attachmentEvents[event] = ids;
                });
            }
        };

        // aiq.datasync.getConnectionStatus()
        aiq.datasync.getConnectionStatus = function(callback) {
            if (typeof callback === 'function') {
                callback(true);
            }
        };

        var json = aiq._getMockData('datasync');
        if ((json) && (typeof json === 'object') && (json.hasOwnProperty('documents'))) {
            json.documents.forEach(function(doc) {
                aiq.datasync.createDocument(doc._type, doc);
            });

            if (json.hasOwnProperty('attachments')) {
                Object.keys(json.attachments).forEach(function(id) {
                    var attachments = json.attachments[id];
                    Object.keys(attachments).forEach(function(name) {
                        var attachment = attachments[name];
                        if ((typeof attachment.contentType === 'string') &&
                            (typeof attachment.path === 'string')) {
                            aiq.datasync._createAttachment(
                                id,
                                name,
                                'mock-data/attachments/' + attachment.path,
                                attachment.contentType);
                        }
                    });
                });
            }
        }
    }
})();

(function() {
    'use strict';
    
    if (! aiq.client) {

        aiq.client = {
            version: '1.0.0'
        };

        // aiq.client.closeApp()
        aiq.client.closeApp = function() {
            // do nothing
        };

        // aiq.client.getAppArguments()
        aiq.client.getAppArguments = function() {
            var args = {};
            if (window.location.search.length !== 0) {
                window.location.search.substring(1).split('&').forEach(function(param) {
                    var pair = param.split('=');
                    args[pair[0]] = (pair.length === 2) ? pair[1] : null;
                });
            }
            return args;
        };

        // aiq.client.setAppTitle(title)
        aiq.client.setAppTitle = function(title) {
            document.title = title;
        };
    }
})();

(function() {
    'use strict';
    
    if (! aiq.context) {
        aiq.context = {};

        var getContext = function(type, name, success, failure, error) {
            aiq.datasync.getDocuments(type, {
                success: function(docs) {
                    if ((docs.length === 1)&& (docs[0].hasOwnProperty(name))) {
                        success(docs[0][name]);
                    } else {
                        aiq._failWithMessage(failure, 'Provider not found');
                    }
                },
                failure: failure,
                error: error
            });
        };

        // aiq.context.getGlobal(providerName[, settings])
        aiq.context.getGlobal = function(providerName, settings) {
            settings = settings || {};

            if (typeof providerName !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid provider name');
            } else if (typeof settings.success === 'function') {
                // Let's start by trying to retrieve the client context document
                getContext(
                    '_clientcontext',
                    providerName,
                    function(context) {
                        // If it's there and it has the requested key, we just
                        // return it
                        settings.success(context);
                    },
                    function() {
                        // Otherwise let's try to retrieve the backend context document
                        getContext(
                            '_backendcontext',
                            providerName,
                            function(context) {
                                // It has the requested key so let's return it
                                settings.success(context);
                            },
                            settings.failure,
                            settings.error);
                    }, settings.error);
            }
        };

        // aiq.context.getLocal(key[, settings])
        aiq.context.getLocal = function(key, settings) {
            settings = settings || {};

            if (typeof key !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid context key');
            } else if (typeof settings.success === 'function') {
                // Application ('local') context sits under com.appearnetworks.aiq.apps
                // context provider in the client context document so let's try and
                // retrieve it
                getContext(
                    '_clientcontext',
                    'com.appearnetworks.aiq.apps',
                    function(apps) {
                        if (apps.hasOwnProperty(key)) {
                            settings.success(apps[key]);
                        } else {
                            aiq._failWithMessage(settings.failure, 'Context key not found');
                        }
                    },
                    settings.failure,
                    settings.error);
            }
        };

        // aiq.context.setLocal(key, value[, settings])
        aiq.context.setLocal = function(key, value, settings) {
            settings = settings || {};

            if (typeof key !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid context key');
            } else {
                // Let's see if we already have a client context document in
                // the data sync storage
                aiq.datasync.getDocuments('_clientcontext', {
                    success: function(docs) {
                        if (docs.length === 0) {
                            // Nope, let's create one with the new key-value pair
                            var fields = {
                                'com.appearnetworks.aiq.apps': {}
                            };
                            fields['com.appearnetworks.aiq.apps'][key] = value;
                            aiq.datasync.createDocument('_clientcontext', fields, {
                                success: function() {
                                    if (typeof settings.success === 'function') {
                                        settings.success();
                                    }
                                },
                                failure: settings.failure,
                                error: settings.error
                            });
                        } else if (docs.length === 1) {
                            // It looks like we already have it, let's add new key-value
                            // pair to it and update the document
                            var doc = docs[0];
                            doc['com.appearnetworks.aiq.apps'][key] = value;
                            aiq.datasync.updateDocument(doc._id, doc, {
                                success: function() {
                                    if (typeof settings.success === 'function') {
                                        settings.success();
                                    }
                                },
                                failure: settings.failure,
                                error: settings.error
                            });
                        }
                    },
                    failure: settings.failure,
                    error: settings.failure
                });
            }
        };

        var json = aiq._getMockData('context');
        if (json) {
            var cleanupAndPopulate = function(type, fields) {
                aiq.datasync.getDocuments(type, {
                    success: function(docs) {
                        docs.forEach(function(doc) {
                            aiq.datasync.deleteDocument(doc._id);
                        });
                        aiq.datasync.createDocument(type, fields);
                    }
                });
            };
            if ((json.hasOwnProperty('local')) && (typeof json.local === 'object')) {
                var doc = {
                    "com.appearnetworks.aiq.apps": json.local
                };
                cleanupAndPopulate('_clientcontext', doc);
            }
            if ((json.hasOwnProperty('global')) && (typeof json.global === 'object')) {
                cleanupAndPopulate('_backendcontext', json.global);
            }
        }
    }
})();

(function() {
    'use strict';
    
    if (! aiq.device) {
        var android = navigator.userAgent.match(/(Android)\s+([\d.]+)/);
        var ios = navigator.userAgent.match(/AIQ iOS ([\d.]+)/);
        var webos = navigator.userAgent.match(/(webOS|hpwOS)[\s\/]([\d.]+)/);
        var blackberry = navigator.userAgent.match(/(BlackBerry).*Version\/([\d.]+)/);
        var webkit = navigator.userAgent.match(/WebKit\/([\d.]+)/);
        var safari = navigator.userAgent.match(/Safari\/([\d.]+)/);
        var chrome = navigator.userAgent.match(/Chrome\/([\d.]+)/);
        var firefox = navigator.userAgent.match(/Firefox\/([\d.]+)/);

        aiq.device = {};

        if (chrome) {
            aiq.device.os = 'Chrome';
            aiq.device.version = chrome[1];
        } else if (safari) {
            aiq.device.os = 'Safari';
            aiq.device.version = safari[1];
        } else if (firefox) {
            aiq.device.os = 'Firefox';
            aiq.device.version = firefox[1];
        } else if (android) {
            aiq.device.os = 'Android';
            aiq.device.version = android[2];
        } else if (ios) {
            aiq.device.os = 'iOS';
            aiq.device.version = ios[1];
        } else if (webos) {
            aiq.device.os = 'WebOS';
            aiq.device.version = webos[2];
        } else if (blackberry) {
            aiq.device.os = 'BlackBerry';
            aiq.device.version = blackberry[2];
        } else if (webkit) {
            aiq.device.os = 'WebKit';
            aiq.device.version = webkit[1];
        }

        // aiq.device.getNetworkInfo(callback)
        aiq.device.getNetworkInfo = function(callback) {
            if (typeof callback === 'function') {
                callback(true);
            }
        };
    }
})();

(function() {
    'use strict';
    
    if (!aiq.directcall) {
        aiq.directcall = {};

        var call = function(method, args, settings) {
            settings = settings || {};

            if (typeof args !== 'object') {
                aiq._failWithMessage(settings.failure, 'Invalid argument');
            } else if (typeof args.endpoint !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid endpoint');
            } else if ((args.hasOwnProperty('params')) && (typeof args.params !== 'object')) {
                aiq._failWithMessage(settings.failure, 'Invalid params');
            } else if (typeof settings.success === 'function') {
                var json = aiq._getMockData('directcall-' + args.endpoint);
                if (json) {
                    if (json.hasOwnProperty(method)) {
                        var responses = json[method];
                        var found;
                        responses.some(function(response) {
                            if (args.hasOwnProperty('params')) {
                                if ((response.hasOwnProperty('params')) && (typeof response.params === 'object')) {
                                    for (var param in response.params) {
                                        if (response.params.hasOwnProperty(param)) {
                                            var value = '' + args.params[param];
                                            var match = value.match('' + response.params[param]);
                                            if ((! match) ||
                                                (match.length !== 1) ||
                                                (match[0] !== value)) {
                                                return false;
                                            }
                                        }
                                    }
                                    found = response;
                                    return true;
                                } else {
                                    return false;
                                }
                            } else if (! response.hasOwnProperty('params')) {
                                found = response;
                                return true;
                            }
                        });
                        if (found) {
                            if (found.hasOwnProperty('errorCode')) {
                                aiq._failWithMessage(settings.failure, 'Invalid response', { errorCode: found.errorCode });
                            } else if (found.hasOwnProperty('data')) {
                                settings.success(found.data);
                            } else {
                                aiq._failWithMessage(settings.error, 'Invalid mock file');
                            }
                        } else {
                            aiq._failWithMessage(settings.failure, 'No matching responses', { errorCode: 404 });
                        }
                    } else {
                        aiq._failWithMessage(settings.failure, 'Unsupported method', { errorCode: 404 });
                    }
                } else {
                    aiq._failWithMessage(settings.failure, 'Endpoint not found', { errorCode: 404 });
                }
            }
        };

        // aiq.directcall.getResource(args[, settings])
        aiq.directcall.getResource = function(args, settings) {
            call('get', args, settings);
        };

        // aiq.directcall.postResource(args[, settings])
        aiq.directcall.postResource = function(args, settings) {
            call('post', args, settings);
        };

        // aiq.directcall.putResource(args[, settings])
        aiq.directcall.putResource = function(args, settings) {
            call('put', args, settings);
        };

        // aiq.directcall.deleteResource(args[, settings])
        aiq.directcall.deleteResource = function(args, settings) {
            call('delete', args, settings);
        };
    }
})();

(function() {
    'use strict';
    
    if (! aiq.external) {
        aiq.external = {};

        // aiq.external.openMap(settings)
        aiq.external.openMap = function(settings) {
            settings = settings || {};

            if (! settings.hasOwnProperty('latitude')) {
                aiq._failWithMessage(settings.failure, 'Latitude not specified');
            } else if (! settings.hasOwnProperty('longitude')) {
                aiq._failWithMessage(settings.failure, 'Longitude not specified');
            } else {
                var latitude = parseFloat(settings.latitude);
                var longitude = parseFloat(settings.longitude);
                if (isNaN(latitude)) {
                    aiq._failWithMessage(settings.failure, 'Invalid latitude value');
                } else if (isNaN(longitude)) {
                    aiq._failWithMessage(settings.failure, 'Invalid longitude value');
                } else {
                    var url = 'https://maps.google.com/maps?';
                    if (settings.hasOwnProperty('label')) {
                        url += 'q=' + settings.label + '@';
                    } else {
                        url += 'll=';
                    }
                    url += latitude + ',' + longitude;
                    if (settings.hasOwnProperty('zoom')) {
                        var zoom = parseInt(settings.zoom, 10);
                        if (! isNaN(zoom)) {
                            url += '&z=' + zoom;
                        }
                    }
                    var win = window.open(url, '_blank');
                    win.focus();
                }
            }
        };
    }
})();

(function() {
    'use strict';
    if (! aiq.imaging) {
        aiq.imaging = {};

        // aiq.imaging.capture(id[, settings])
        aiq.imaging.capture = function (id, settings) {
            settings = settings || {};

            aiq.datasync._createAttachment(id, id + Date.now() + '.png', 'data:image/png;base64,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', 'image/png', {
                success: settings.success,
                failure: settings.failure,
                error: settings.error
            });
        };
    }
})();

(function() {
    'use strict';
    
    if (! aiq.messaging) {
        aiq.messaging = {
            _messages: [],
            _events: {}
        };

        // aiq.messaging.getMessages(type[, settings])
        aiq.messaging.getMessages = function(type, settings) {
            settings = settings || {};
            
            if (typeof type !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid type');
            } else if (typeof settings.success === 'function') {
                var messages = [];

                aiq.messaging._messages.forEach(function(message) {
                    if (message.type === type) {
                        var copy = aiq._cloneObject(message);
                        copy.relevant = false;
                        messages.push(copy);
                    }
                });

                settings.success(messages);
            }
        };

        // aiq.messaging.getMessage(id[, settings])
        aiq.messaging.getMessage = function(id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithmessage(settings.failure, 'Invalid identifier');
            } else if (typeof settings.success === 'function') {
                var messageIndex = -1;
                aiq.messaging._messages.some(function(message, index) {
                    if (message._id === id) {
                        messageIndex = index;
                        return true;
                    }
                    return false;
                });
                if (messageIndex === -1) {
                    aiq._failWithMessage(settings.failure, 'Message not found');
                } else {
                    var copy = aiq._cloneObject(aiq.messaging._messages[messageIndex]);
                    copy.relevant = false;
                    settings.success(copy);
                }
            }
        };

        // aiq.messaging.markMessageAsRead(id[, settings])
        aiq.messaging.markMessageAsRead = function(id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else {
                var messageIndex = -1;
                aiq.messaging._messages.some(function(message, index) {
                    if (message._id === id) {
                        messageIndex = index;
                        return true;
                    }
                    return false;
                });
                if (messageIndex === -1) {
                    aiq._failWithMessage(settings.failure, 'Message not found');
                } else {
                    aiq.messaging._messages[messageIndex].read = true;

                    if (typeof settings.success === 'function') {
                        var copy = aiq._cloneObject(aiq.messaging._messages[messageIndex]);
                        copy.relevant = false;
                        settings.success(copy);
                    }
                }
            }
        };

        // aiq.messaging.bindMessageEvent(event, type[, callback])
        aiq.messaging.bindMessageEvent = function(event, type, callback) {
            if ((typeof event === 'string') && (typeof callback === 'function')) {
                type = type || '__all__';

                var types = aiq.messaging._events[event] || {};
                var callbacks = types[type] || [];
                callbacks.push(callback);

                types[type] = callbacks;
                aiq.messaging._events[event] = types;
            }
        };

        // aiq.messaging.unbind([callback])
        aiq.messaging.unbind = function(callback) {
            if (typeof callback === 'function') {
                Object.keys(aiq.messaging._events).forEach(function(event) {
                    var types = aiq.messaging._events[event];
                    Object.keys(types).forEach(function(type) {
                        var callbacks = types[type];
                        var index;
                        while ((index = callbacks.indexOf(callback)) !== -1) {
                            callbacks.splice(index, 1);
                        }
                        types[type] = callbacks;
                    });
                    aiq.messaging._events[event] = types;
                });
            }
        };
        
        var json = aiq._getMockData('messaging');
        if (json) {
            aiq.messaging._messages = [];
            json.forEach(function(message) {
                if (typeof message.type === 'string') {
                    aiq.messaging._messages.push({
                        _id: Date.now() + '_' + aiq.messaging._messages.length,
                        type: message.type,
                        created: message.created || 0,
                        activeFrom: message.activeFrom || 0,
                        timeToive: message.timeToLive || 0,
                        urgent: message.urgent || false,
                        read: false,
                        payload: message.payload
                    });
                }
            });
        }
    }
})();

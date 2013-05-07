/**
 * Mock implementation of the Messaging JS API from the Native host app.
 *
 * Will be automatically replaced by native code when running in Hosted mode
 *
 * @version 0.1
 * @author Irina Gudkova
 */

/*global AIQ:true*/

if (!AIQ.Core.Messaging) {
    AIQ.Core.Messaging = {};

    // AIQ.Core.Messaging.getMessages(type[, settings])
    AIQ.Core.Messaging.getMessages = function (type, settings) {
        var messages = localStorage['AIQ.Messages'] ? JSON.parse(localStorage['AIQ.Messages']) : [];
        var typedMessages = [];
        for (var i = 0; i < messages.length; i++) {
            if (messages[i].type === type) {
                typedMessages.push(messages[i]);
            }
        }

        setTimeout(function () {
            settings.success(typedMessages);
        }, 500);
    };

    // AIQ.Core.Messaging.markMessageAsRead(id[, settings])
    AIQ.Core.Messaging.markMessageAsRead = function (id, settings) {
        var messages = localStorage['AIQ.Messages'] ? JSON.parse(localStorage['AIQ.Messages']) : [];
        for (var i = 0; i < messages.length; i++) {
            if (messages[i]._id === id) {
                messages[i].read = true;
                localStorage['AIQ.Messages'] = JSON.stringify(messages);

                return settings.success(messages[i]);
            }
        }
        if (settings.failure) {
            settings.failure();
        }
    };

    var _messageEvents = {};

    // AIQ.Core.Messaging.bindMessageEvent(event, type[, callback])
    AIQ.Core.Messaging.bindMessageEvent = function (event, type, callback) {
        var messageTypes = _messageEvents[event];
        if (!messageTypes) {
            _messageEvents[event] = messageTypes = {};
        }
        if (!type) {
            type = "__all__";
        }
        var callbacks = messageTypes[type];
        if (!callbacks) {
            messageTypes[type] = callbacks = [];
        }
        callbacks.push(callback);
    };

    // AIQ.Core.Messaging.unbind([callback])
    AIQ.Core.Messaging.unbind = function (callback) {
        for (var event in _messageEvents) {
            for (var type in _messageEvents[event]) {
                var callbacks = _messageEvents[event][type];

                for(var index; (index = callbacks.indexOf(callback)) > -1; /* */) {
                    callbacks.splice(index, 1);
                }

                _messageEvents[event][type] = callbacks;
            }
        }
    };
}

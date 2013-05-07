/**
 * Mock implementation of the Imaging JS API from the Native host app.
 *
 * Will be automatically replaced by native code when running in Hosted mode
 *
 * @version 0.1
 * @author Marcin Lukow
 */

/*global AIQ:true*/

if (!AIQ.Core.Imaging) {

    AIQ.Core.Imaging = {};
    AIQ.Core.Imaging.idCount = 0;

    // AIQ.Core.Imaging.getImage(id[, settings])
    AIQ.Core.Imaging.getImage = function (id, settings) {
        AIQ.Core.DataSync.getDocument(id, {
            success: function(doc) {
                var store = localStorage['AIQ.Attachments'] ?
                    JSON.parse(localStorage['AIQ.Attachments']) :
                    {};
                var attachments = store[id];
                if (attachments === undefined) {
                    attachments = {};
                }
                var count = 0;
                for (var name in attachments) {
                    count++;
                }
                var name = 'content_' + count + '.png';
                var resourceId = 'css/assets/picture' + (count % 2 + 1) + '.png';
                var attachment = {
                    contentType: 'image/png',
                    resourceId: resourceId
                };
                attachments[name] = attachment;
                store[id] = attachments;
                localStorage['AIQ.Attachments'] = JSON.stringify(store);
                settings.success({
                    name: name,
                    contentType: 'image/png',
                    state: 'available',
                    resourceId: resourceId
                });
            },
            failure: function() {
                if (settings.failure) {
                    settings.failure({ cancel: false });
                }
            },
            error: function(arg) {
                if (settings.error) {
                    settings.error(arg);
                }
            }
        });
    };

}

/**
 * Mock implementation of the Direct Call API.
 *
 * Takes data from the local filesystem.
 *
 * @version 1.0
 * @author Marcin Lukow
 */

/*global AIQ:false, WO:false */
if (!AIQ.Core.Direct) {
    AIQ.Core.Direct = {};

    AIQ.Core.Direct.call = function(args, settings) {
        settings = settings || {};
        if ((args) && (args.endpoint)) {
            // if method is not specified, API orders us to fall back to GET
            args.method = args.method || "get";
            $.ajax({
                url: args.endpoint + '.' + args.method.toLowerCase(),
                dataType: "json",
                async: true,
                cache: false
            }).done(function(data, textStatus, jqXHR) {
                if (data.errorCode) {
                    // simplest case, errorCode is present in the root
                    if (settings.failure) {
                        settings.failure(data.errorCode);
                    }
                } else {
                    var result = {};
                    if (args.params) {
                        // evaluate mock cases one by one and check which one
                        // matches given params
                        for (var i = 0; i < data.length; i++) {
                            var doc = data[i];
                            var matches = true;
                            for (var param in doc) {
                                if (param !== "data") {
                                    // adding empty strings to the values will ensure
                                    // that calling match doesn't crash the app
                                    var value = "" + args.params[param];
                                    var match = value.match("" + doc[param]);
                                    if ((! match)            ||
                                        (match.length !== 1) || // direct matches only
                                        (match[0] !== value)) {
                                        matches = false;
                                        break;
                                    }
                                }
                            }
                            if (matches) {
                                // if data is not present, you're the one to blame
                                // for the empty response
                                result = doc.data;
                                break;
                            }
                        }
                    } else {
                        // in case no params were specified, let's return the
                        // whole response
                        result = data;
                    }
                    
                    // do we have a forced error code in the response?
                    if (result.errorCode) {
                        if (settings.failure) {
                            settings.failure(result.errorCode);
                        }
                    } else if (settings.success) {
                        settings.success(result);
                    }
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                if (jqXHR.status == 200) {
                    // document was found but there was a parse error in the
                    // JSON file, let's raise an error
                    if (settings.error) {
                        settings.error({
                            message: errorThrown
                        });
                    }
                } else if (settings.failure) {
                    settings.failure(jqXHR.status);
                }
            });
        } else if (settings.failure) {
            settings.failure(-1);
        }
    };
    
}


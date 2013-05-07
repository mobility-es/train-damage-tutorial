/**
 * Main App entry point - manages routes
 * Applications should not need to use this class directly, all required functions can be accessed through the AIQ.Spine.Controller
 *
 * @version 0.1
 * @author David Lindkvist
 */

/*global AIQ:false, WO:false, Spine:false, MBP:false, Modernizr:false, iScroll:false */

AIQ.Spine.App = Spine.Class.extend({

    title: 'undefined app title',
    settings: {},
    pageHash: {},
    controllers: {},
    notificationId: null,
    currentPage: "",
    $viewport: null,
    $pages: null,
    route: null,


    /**
     * This is the main entry point for the App. Called automatically by AIQ.init()
     */
    start: function (route) {

        function runInitChain() {
            this.initSettings(this.proxy(function () {
                this.initLaunchable(this.proxy(function () {
                    this.initApp(route);
                }));
            }));
        }

        // wait for AIQ DataSync before init
        if (AIQ.ready === true) {
            runInitChain.call(this);
        }
        else {
            $(document).on("aiq-ready", this.proxy(function () {
                runInitChain.call(this);
            }));
        }
    },

    /**
     *  Fetch app Launchable document to be able to read it's customized name
     */
    initLaunchable: function (callback) {
        AIQ.Core.DataSync.getDocument(AIQ._applicationId, {
            success: this.proxy(function (doc) {
                this.title = doc.name;
                callback.call(this);
            }),
            failure: this.proxy(function () {
                AIQ.log('APP', 'Failure, no _launchable document found');
            }),
            error: function () {
                AIQ.log('APP', 'Fatal error, unable to load _launchable document');
            }
        });
    },

    /**
     *  Binds create, update and delete events for the _settings document
     *  so that callback registered to global aiq-settings-updated event
     *  will be notified about the changes in application settings
     */
    bindDocumentEvents: function () {
        AIQ.Core.DataSync.bindDocumentEvent(
            'document-created', '_settings', this.proxy(this.onSettingsCreated)
        );
        AIQ.Core.DataSync.bindDocumentEvent(
            'document-updated', '_settings', this.proxy(this.onSettingsUpdated)
        );
        AIQ.Core.DataSync.bindDocumentEvent(
            'document-deleted', '_settings', this.proxy(this.onSettingsDeleted)
        );
    },

    /**
     *  Callback fired when application's _settings document is created. It
     *  retrieves the created settings and notifies callbacks registered for
     *  global aiq-settings-updated event.
     */
    onSettingsCreated: function (documentId, isLocal) {
        this.retrieveSettings(this.proxy(this.dispatchSettingsUpdatedEvent));
    },

    /**
     *  Callback fired when application's _settings document is updated. It
     *  retrieves the updated settings and notifies callbacks registered for
     *  global aiq-settings-updated event.
     */
    onSettingsUpdated: function (documentId, isLocal) {
        this.retrieveSettings(this.proxy(this.dispatchSettingsUpdatedEvent));
    },

    /**
     *  Callback fired when application's _settings document is deleted. It
     *  clears the settings and notifies callbacks registered for global
     *  aiq-settings-updated event.
     */
    onSettingsDeleted: function (documentId, isLocal) {
        this.settings = {};
        this.dispatchSettingsUpdatedEvent();
    },

    /**
     *  Dispatches an event with updated settings
     */
    dispatchSettingsUpdatedEvent: function () {
        var e = document.createEvent('Events');
        e.initEvent('aiq-settings-updated', false, false);
        e.settings = this.settings;
        document.dispatchEvent(e);
    },

    /**
     *  Retrieves the settings from the data sync layer
     */
    retrieveSettings: function (callback) {
        AIQ.Core.DataSync.getDocuments('_settings', {
            success: this.proxy(function (docs) {
                if (docs.length == 1) {
                    this.settings = docs[0];
                }
                if (callback !== undefined) {
                    callback.call(this);
                }
            }),
            failure: function () {
                if (callback !== undefined) {
                    callback.call(this);
                }
            },
            error: function () {
                AIQ.log('APP', 'Fatal error, unable to load _settings document');
            }
        });
    },

    /**
     *  Fetch app settings
     */
    initSettings: function (callback) {
        if (AIQ.ready) {
            this.bindDocumentEvents();
        } else {
            var that = this;
            $(document).bind('aiq-ready', function () {
                that.bindDocumentEvents.call(that);
            });
        }
        this.retrieveSettings(callback);
    },


    /**
     *  Bind global events, init routes and remove loading animation
     */
    initApp: function (route) {

        // inspect application markup
        this.inspectGlobalMarkup();

        Spine.Route.setup();
        if (route) {
            Spine.Route.navigate(route);
        }

        // enable :active psudo class on iOS
        if (typeof MBP !== 'undefined') {
            MBP.enableActive();
        }

        // add delayed .active style class instead of :active
        if (AIQ.Config.useDelayedActiveStyle) {
            var activeTimer;
            $('body').on("touchstart", 'a, button', function () {
                activeTimer = setTimeout(function (el) {
                    el.addClass("active");
                }, AIQ.Config.activeStyleDelay, $(this));
            })
                .on("touchend", 'a, button', function() {
                    clearTimeout(activeTimer);
                    $(this).removeClass("active");
                })
                .on("touchcancel", 'a, button', function() {
                    clearTimeout(activeTimer);
                    $(this).removeClass("active");
                })
                .on("touchmove", 'a, button', function() {
                    clearTimeout(activeTimer);
                    $(this).removeClass("active");
                });
        }

        // show app when loaded
        $('body').addClass('loaded');
    },


    /*
     *  Used internally by AIQ.Spine.Controller to register routes
     */
    registerRoute: function (route) {
        Spine.Route.add(route, this.proxy(this.hashChange));
    },

    /*
     *  Returns the settings object, will not be null/undefined
     *  but may be an empty map.
     */
    getSettings: function () {
        return this.settings;
    },

    getBadge: function (callback) {
        var that = this;
        if (that.notificationId) {
            AIQ.Core.DataSync.getDocument(that.notificationId, {
                success: function (doc) {
                    callback(doc.message);
                }
            });
        } else {
            AIQ.Core.DataSync.getDocuments('_notification', {
                success: function (docs) {
                    if (docs.length == 1) {
                        that.notificationId = docs[0]._id;
                        callback(docs[0].message);
                    } else {
                        callback();
                    }
                },
                failure: function () {
                    callback();
                },
                error: function () {
                    callback();
                }
            });
        }
    },

    setBadge: function (badge) {
        var that = this;
        if (that.notificationId) {
            AIQ.Core.DataSync.updateDocument(that.notificationId, {
                message: badge
            }, {
                success: function () {
                    AIQ.log('App', 'Badge updated with message "' + badge + '"');
                }
            });
        } else {
            AIQ.Core.DataSync.getDocuments('_notification', {
                success: function (docs) {
                    if (docs.length == 0) {
                        AIQ.Core.DataSync.createDocument('_notification', {
                            message: badge
                        }, {
                            success: function (doc) {
                                that.notificationId = doc._id;
                            }
                        });
                    } else {
                        that.notificationId = docs[0]._id;
                        AIQ.Core.DataSync.updateDocument(that.notificationId, {
                            message: badge
                        }, {
                            success: function () {
                                AIQ.log('App', 'Badge updated with message "' + badge + '"');
                            }
                        });
                    }
                }
            });
        }
    },

    /*
     *  Inspect and process global markup in index.html
     *   - adding framework style classes based on content etc.
     */
    inspectGlobalMarkup: function () {

        // make sure we have a viewport for all pages
        this.$viewport = $('#viewport');
        if (!this.$viewport.length) {
            throw 'FATAL ERROR: Application is missing a #viewport';
        }
    },


    /*
     *  Inspect and process page specific markup
     *   - adding framework style classes based on content etc.
     */
    inspectPageMarkup: function ($page) {
        // add style class to pages with local footer
        if ($page.children('footer').length) {
            $page.addClass('hasFooter');
        }
    },


    /**
     *  Renders controller based on route.
     *  This function is called everytime we navigate to a new route.
     */
    hashChange: function (args) {

        try {

            var $prevPage = this.$page || $();
            this.$page = this.pageHash[args.route];
            var previousRoute = this.route || "";
            this.route = args.route;

            if (this.$pages && this._isUsingPageTransitions()) {
                // unbind any lagging animationEnd events from previous page transition
                // in case user clicks faster than transition duration
                this.$pages.unbind(AIQ.UI.Event.animationEnd);
            }

            var wasRenderFunctionCompleted;

            // check if controller needs to be instantiated
            if (!this.$page) {

                // create page
                this.$page = $('<div data-route="' + args.route + '"/>').addClass("AIQ-page");

                // instatiate controller for this route
                this.controllers[args.route] = AIQ.Spine.Controller.fromRoute(args.route, {el: this.$page});

                // add to hash
                this.pageHash[args.route] = this.$page;

                // add page to dom
                this.$page.appendTo(this.$viewport);
                this.$pages = this.$viewport.find('.AIQ-page');

                // inspect page Markup
                this.inspectPageMarkup(this.$page);

                // render
                if (this.controllers[args.route].render) {
                    wasRenderFunctionCompleted = this.controllers[args.route].render(args);
                }
            }
            else {
                // re-render controller
                if (this.controllers[args.route].render) {
                    wasRenderFunctionCompleted = this.controllers[args.route].render(args);
                }
            }


            // reset animation style classes by overwriting them
            if (wasRenderFunctionCompleted !== undefined && previousRoute !== this.route) {
                this.$pages.attr("class", "AIQ-page")
                    // add controller styleclass on current page
                    .filter(this.$page).addClass(this.controllers[args.route].className)
                    .end()
                    // add controller styleclass on previous page
                    .filter($prevPage).addClass((this.previousController ? this.previousController.className : undefined))
                    .end()
                    // hide all other pages, than the one currently showing
                    .not($prevPage).addClass('hidden-page');


                    // setup transitions - don't transition initial page
                    if (this.$pages.length > 1) {

                        // check direction - if back button was pressed or first page
                        if (args.trigger === undefined) {

                            // Back - let previous controller decide transition

                            // Previous page need boosted z-index during transition
                            if (Modernizr.cssanimations && this._isUsingPageTransitions()) {
                                $prevPage.addClass('AIQ-back');
                                $prevPage.one(AIQ.UI.Event.animationEnd, function () {
                                    $prevPage.removeClass('AIQ-back');
                                });
                            }
                            this.previousController.transition(this.$page, $prevPage, true);
                        }
                        else {
                            // Forward - let new controller decide transition
                            this.controllers[args.route].transition(this.$page, $prevPage);
                        }
                    }

                    // Make sure DOM is ready before transitioning
                    setTimeout(this.proxy(function () { // Spine's delay() function is not available at this point

                        // check if animationEnd event will fire or not
                        if (Modernizr.cssanimations && this._isUsingPageTransitions()) {
                            $prevPage.one(AIQ.UI.Event.animationEnd, function () {
                                $prevPage.addClass('hidden-page');
                            });
                            $prevPage.addClass("AIQ-out");
                        }
                        else {
                            $prevPage.addClass("AIQ-out").addClass('hidden-page');
                        }

                        this.$page.addClass("AIQ-in").removeClass('hidden-page');
                    }), 0);

                    // wait for transition to start before updating time consuming things
                    setTimeout(this.proxy(function () { // Spine's delay() function is not available at this point

                        this.previousController = this.controllers[args.route];

                    }), 0);
            }

        } catch (e) {
            console.error(e);
        }

    },

    _isUsingPageTransitions: function() {
        return $('link[href="aiq/css/transitions.css"]').length > 0;
    }

});

// Register Shortcut
AIQ.App = AIQ.Spine.App;

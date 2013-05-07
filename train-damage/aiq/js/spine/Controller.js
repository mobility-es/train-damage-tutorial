/**
 * Base Controller for the AIQ framework
 *
 * @version 0.1
 * @author David Lindkvist
 */

/*global AIQ:false, Spine:false, Mustache:false, iScroll:false*/
AIQ.Spine.Controller = Spine.Controller.sub({

    templateName: null,
    template: null,

    // HorizontalSlide
    transition: AIQ.UI.Transition.horizontalPage,


    /** Utility method for subclass to render template */
    renderTemplate: function (props, selector) {
        props = props || {};

        if (this.template) {
            // Enabling feature toggling inside templates
            if (AIQ.App.getSettings().inDevelopment) {
                props.inDevelopment = true;
            }

            var html = Mustache.render(this.template, props);
            if (selector) {
                this.$(selector).html(html);
            }
            else {
                this.el.html(html);
            }
        }
    },

    /** Utility method for subclass to navigate to other page */
    navigate: function () {
        var opts = [];
        for (var i = 0; i < arguments.length; i++) {
            opts.push(arguments[i]);
        }
        Spine.Route.navigate.apply(Spine.Route, opts);
    },

    /** Simulate back button on browser */
    navigateBack: function () {
        window.back ? back() : history.back();
    },

    destroy: function () {
        delete AIQ.Spine.App.pageHash[this.el.data("route")];
        this.release();
    },

    fromRoute: function (route, attributes) {
        return AIQ.Spine.Controller.fromRoute(route, attributes);
    }
});


AIQ.Spine.Controller.extend({
    controllerHash: [],
    templateHash: [],

    registerAs: function (route, templateName) {

        AIQ.App.registerRoute(route);

        this.controllerHash[route] = this;

        if (templateName) {
            AIQ.log('Registering page route', route, 'using template', templateName);

            $.ajax({
                url: 'templates/' + templateName,
                dataType: 'text',

                // WARNING async doesnt work in Zepto 0.8 - coming in next release: https://github.com/madrobby/zepto/pull/282
                // Always use jquery for now
                async: false, // load templates SYNCHRONOUSLY so we know it's available!

                success: function (templateText) {
                    AIQ.Spine.Controller.templateHash[route] = templateText;
                }
            });
        }
        else {
            AIQ.log('Registering page route', route, 'without template');
        }

        return this;
    },

    fromRoute: function (route, attributes) {
        if (!this.controllerHash[route]) {
            throw 'No controller for route "' + route + '"';
        }
        attributes = attributes || {};
        attributes.template = this.templateHash[route];
        return new this.controllerHash[route](attributes);
    },

    destroyAll: function() {
        for (var route in AIQ.Spine.App.controllers)
            if (AIQ.Spine.App.controllers.hasOwnProperty(route))
                AIQ.Spine.App.controllers[route].destroy();
    }
});

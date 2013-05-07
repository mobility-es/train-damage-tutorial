AIQ.Plugin = AIQ.Plugin || {};

AIQ.Plugin.iScroll = {
    Controller: AIQ.Spine.Controller.sub({
        createScroller: function (options) {
            // The page needs to have a height > 0 otherwise iScroll won't create the scroller
            if (!this.el.is(":visible")) {
                this.delay(function () {
                    this.createScroller(options);
                }, 1);
            }
            else {

                this._destroyScroller();

                // default to scroll first article on page
                var $wrapper = (options !== undefined && options.$wrapperEl !== undefined) ? options.$wrapperEl : this.$('>article');

                // fall back to entire page if no article
                if (!$wrapper.length) {
                    $wrapper = this.el;
                }

                // if scrollable area has content
                if ($wrapper.children().length > 0) {
                    this._initCss($wrapper);

                    this._createScroller(
                        $wrapper,
                        options !== undefined ? options.scrollerOptions : undefined
                    );
                }
            }
        },

        destroy: function () {
            this._destroyScroller();
            AIQ.Plugin.iScroll.Controller.__super__.destroy.apply(this, arguments);
        },

        /**
         *
         * @param delay in milliseconds - optional
         */
        refreshScroll: function (delay) {
            if (delay === undefined)
                delay = 0;

            this.delay(function () {
                if (this.scroller)
                    this.scroller.refresh();
            }, delay);
        },

        _destroyScroller: function () {
            if (this.scroller) {
                this.scroller.destroy();
                this.scroller = null;   // To be garbage collected
            }
        },

        _initCss: function($wrapper) {
            $wrapper.addClass("iscrolled");

            this._initSameLevelCss($wrapper);
            this._initUpperLevelCss($wrapper);
        },

        _initSameLevelCss: function($wrapper) {
            if ($wrapper.parent().children("header").length > 0)
                $wrapper.addClass("with-header");

            if ($wrapper.parent().children("footer").length > 0)
                $wrapper.addClass("with-footer");
        },

        // Bugfix to have the article displayed even if it's embedded in another <article>
        _initUpperLevelCss: function($wrapper) {
            var $parentArticles = $wrapper.parents('article');

            if ($parentArticles.length > 0) {
                // Adding "with-header" on the <article> which has a <header> at the same level
                $parentArticles.addClass("iscrolled-ancestor-article");
                $parentArticles.parent().each(function() {
                    var $element = $(this);
                    var $childFooter = $element.children("header");
                    if ($childFooter.length > 0)
                        $element.children(".iscrolled-ancestor-article").addClass("with-header");
                });

                // Adding "with-footer" on the <article> which has a <footer> at the same level
                $parentArticles.addClass("iscrolled-ancestor-article");
                $parentArticles.parent().each(function() {
                    var $element = $(this);
                    var $childFooter = $element.children("footer");
                    if ($childFooter.length > 0) {
                        $element.children(".iscrolled-ancestor-article").addClass("with-footer");

                        // We need to abslutely position the footer at the bottom
                        $childFooter.addClass("iscrolled-higher-level-footer");
                    }
                });
            }
        },

        _createScroller: function($wrapper, scrollerOptions) {
            var scrollerOptions = scrollerOptions !== undefined ? scrollerOptions :
            {
                useTransition: true,
                hScroll: false,
                bounce: false,
                onBeforeScrollStart: function (e) {
                    var target = e.target;

                    while (target.nodeType != 1)
                        target = target.parentNode;

                    if (target.tagName !== 'SELECT' &&
                        target.tagName !== 'INPUT' &&
                        target.tagName !== 'TEXTAREA' &&
                        target.tagName !== 'BUTTON')
                        e.preventDefault();
                }
            };

            this.scroller = new iScroll($wrapper.get(0), scrollerOptions);
        }
    })
};

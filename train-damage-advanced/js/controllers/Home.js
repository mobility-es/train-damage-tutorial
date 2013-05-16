// Extending class "AIQ.Plugin.iScroll.Controller" enables iScroll, used for when having a fixed header and/or footer
// with a scrollable middle section
AIQ.Plugin.iScroll.Controller.sub({
    events: {
        "click li > a": "onListItemClicked",
        "click #select-button": "onSelectButtonClicked",
        "keyup #query-input": "onQueryKeyup"
    },

    init: function () {
        // Force portrait mode
        AIQ.Core.Display.setOrientation("portrait");

        // Request for older images and destroy them, if any
        TD.TrainDefectImage.bind("refresh", function () {
            TD.TrainDefectImage.unbind("refresh");
            TD.TrainDefectImage.cleanupOrphaned();
        });
        TD.TrainDefectImage.fetch();

        // Render view with no data
        this.renderTemplate({
            main: true
        });

        this.initElements();

        // Refreshing the list of trains when fetched, of changed (created, updated, deleted)
        TD.Train.bind("refresh change", this.proxy(this.renderTrains));
        TD.Train.fetch();
    },

    // Initializes jQuery variables for better performance
    initElements: function () {
        this.$queryWrapper = this.$("#query-wrapper");
        this.$selectButton = this.$('#select-button');
        this.$queryInput = this.$("#query-input");
        this.$trainsUl = this.$("ul");
    },

    destroy: function () {
        // Unbind all Spine and AIQ bindings here
        TD.Train.unbind();

        // Calling parent
        this.constructor.__super__.destroy.apply(this, arguments);
    },

    render: function (params) {
        // When re-rendering the page (such as navigating back to it), we remove any potential "selected" class
        // on list items
        this.$trainsUl.find(".selected").removeClass("selected");

        // iScroll
        this.createScroller();

        // If we don't navigate to another page, we should always end this render function with "return this"
        return this;
    },

    renderTrains: function () {
        // Filtering trains by the search query
        var regex = new RegExp(this.queryText, "gi");
        var html = Mustache.render(this.template, {
                trains: $.grep(TD.Train.allSorted(), function (train) {
                    return train.trainNumber.match(regex);
                })
            });

        // Inserting train list markup into the DOM-tree
        this.$trainsUl.html(html);

        // The content of the iScrolled element is changed, we need to refresh the scroller
        this.refreshScroll();

        // The Select button should only be enabled if the query value matched a train number
        if (TD.Train.findByAttribute("trainNumber", this.queryText)) {
            this.$selectButton.attr("disabled", false);
        }
        else {
            this.$selectButton.attr("disabled", true);
        }
    },

    onQueryKeyup: function () {
        this.queryText = this.$queryInput.val();

        // We only show the Select button if a query has beed entered
        if (this.queryText) {
            this.$queryWrapper.addClass("with-select-wrapper");
        }
        else {
            this.$queryWrapper.removeClass("with-select-wrapper");
        }

        // We display the trains matching the search query
        this.renderTrains();
    },

    clearQuery: function() {
        this.$queryInput.val("");

        // To eventually update the list of trains
        this.onQueryKeyup();
    },

    onListItemClicked: function (e) {
        // Solving a glitch on some devices when the keyboard remains displayed
        if (this.$queryInput.is(":focus")) {
            this.$queryInput.blur();
        }
        else {
            var $target = $(e.currentTarget);
            $target.addClass("selected");
            this.selectTrain($target.text());
        }

    },

    onSelectButtonClicked: function (e) {
        if (this.$queryInput.is(":focus"))
            this.$queryInput.blur();

        this.selectTrain(this.queryText);
    },

    selectTrain: function (trainNumber) {
        // Create a temporary Train Damage report
        // to preserve user data when moving back and forth through the workflow
        TD.MyReport = { "trainNumber": trainNumber.trim() };

        // Delaying navigation slightly for "selected" class on the list item to be visible for a short moment before
        // switching to the next page
        this.delay(function () {
            this.navigate("/DefectList")
        }, 10);
    }

}).registerAs("/", 'Home.tmpl');

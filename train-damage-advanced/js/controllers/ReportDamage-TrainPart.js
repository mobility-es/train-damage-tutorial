/**
 * Report damage view (step 1 - Train Part selection)
 */
AIQ.Plugin.iScroll.Controller.sub({

    events: {
        'click a': 'onListItemClicked'
    },

    init: function () {
        TD.TrainType.bind("refresh change", this.proxy(this.render));
        TD.TrainType.fetch();
    },

    destroy: function() {
        // Unbind all Spine and AIQ bindings here
        TD.TrainType.unbind();

        // Calling parent
        this.constructor.__super__.destroy.apply(this, arguments);
    },

    render: function (params) {
        // Retrieving the temporary report
        if (TD.MyReport) {
            AIQ.Core.App.setTitle("Train " + TD.MyReport.trainNumber);

            var train = TD.Train.findByAttribute("trainNumber", TD.MyReport.trainNumber);
            if (train) {
                // Finding the corresponding Train Type
                var trainType = TD.TrainType.findByAttribute("name", train.trainType);

                // Sorting the Train Parts
                if (trainType) {
                    this.sortedTrainParts = trainType.trainParts.sort(
                        function (a, b) {
                            return a.name.localeCompare(b.name);
                        }
                    );
                }
            }

            this.renderTemplate({
                trainParts: this.sortedTrainParts
            });

            // We reset the selected state
            this.$(".selected").removeClass("selected");

            this.createScroller();

            // If we don't navigate to another page, we should always end this render function with "return this"
            return this;
        }
        else {  // Something went wrong
            console.log("Error: temporary report is missing");
            this.navigate("/");
        }
    },

    onListItemClicked: function (e) {
        var $target = $(e.currentTarget);
        $target.addClass("selected");

        TD.MyReport["trainPart"] = $target.text().trim();

        // Delaying navigation slightly for "selected" class on the list item to be visible for a short moment before
        // switching to the next page
        this.delay(function () {
            this.navigate("/ReportDamage-ErrorType");
        }, 10);
    }

}).registerAs("/ReportDamage-TrainPart", 'ReportDamage-TrainPart.tmpl');

AIQ.Plugin.iScroll.Controller.sub({
    events: {
        'click a[role="pick-train"]': "pickTrain",
        'click a[role="report-damage"]': "reportDamage"
    },

    init: function () {
        TD.VehicleDefectReport.bind("refresh change", this.proxy(this.render));
        TD.VehicleDefectReport.fetch();
    },

    destroy: function() {
        // Unbind all Spine and AIQ bindings here
        TD.VehicleDefectReport.unbind();

        // Calling parent
        this.constructor.__super__.destroy.apply(this, arguments);
    },

    render: function (params) {
        //retrieve temporary report containing user data
        if (TD.MyReport) {
            AIQ.Core.App.setTitle("Train " + TD.MyReport.vehicleNumber);

            var items = TD.VehicleDefectReport.findByAttributeSorted("vehicleNumber", TD.MyReport.vehicleNumber);

            this.renderTemplate({ damageNumber: items.length });

            // For performance, we concatenate the whole list in one variable, before adding it to the DOM in 1 operation
            var list = $('<ul class="AIQ-ui-list"></ul>');

            for (var i = 0; i < items.length; i++) {
                AIQ.Spine.Controller.fromRoute("DefectListItem", {
                    item: items[i],
                    vehicle: TD.MyReport.vehicleNumber
                }).render().appendTo(list);
            }

            // Adding the generated list at the right place in the DOM
            this.$("#defects-list").html(list);
        }

        // When re-rendering the page (such as navigating back to it), we remove any potential "selected" class
        // on list items
        this.$(".selected").removeClass("selected");

        // We have a fixed footer, we (re)create the iScroll here
        this.createScroller();

        // If we don't navigate to another page, we should always end this render function with "return this"
        return this;
    },

    pickTrain: function () {
        // When clicking on this button, we want to clear the search query (unlike when navigating back)
        AIQ.Spine.App.controllers["/"].clearQuery();
        this.navigate("/");
    },

    reportDamage: function () {
        // Destroying older image docs
        TD.VehicleDefectImage.cleanupOrphaned();

        // Resetting temporary Vehicle Damage report
        TD.MyReport = { "vehicleNumber": TD.MyReport.vehicleNumber };

        this.navigate("/ReportDamage-VehiclePart");
    }

}).registerAs("/DefectList", 'VehicleDefectList.tmpl');

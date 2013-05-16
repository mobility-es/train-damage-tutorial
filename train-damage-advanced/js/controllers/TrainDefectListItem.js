AIQ.Spine.Controller.sub({

    tag: 'li',

    events: {
        "click a": "onClick"
    },

    // Bind events to the record
    init: function () {
        if (!this.item) {
            throw "@item required";
        }
    },

    render: function () {
        var defectDate = new Date(this.item.defectDateTime);

        this.renderTemplate({
            ddMmm: $.format.date(defectDate, "dd MMM"),
            yyyy: $.format.date(defectDate, "yyyy"),
            heading: this.item.heading
        });

        // If we don't navigate to another page, we should always end this render function with "return this"
        return this;
    },

    onClick: function (e) {
        var $target = $(e.currentTarget);
        $target.addClass("selected");

        // "delay()" is a Spine controller function combining JavaScript's "setTimeout()" with Spine's "proxy()"
        this.delay(function () {
            this.navigate("/DefectDetails",
                this.train,
                $target.closest("li").index()
            )
        }, 10);
    }

}).registerAs("DefectListItem", 'TrainDefectListItem.tmpl');

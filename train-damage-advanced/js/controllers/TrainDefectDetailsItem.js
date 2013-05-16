/**
 * User: Marcin Lukow
 * Date: 2012-12-10
 **/

AIQ.Spine.Controller.sub({

    tag: "section",

    events: {

    },

    init: function () {
        // do nothing
    },

    render: function (params) {
        var defectDate = new Date(this.dateTime);

        this.renderTemplate({
            date: $.format.date(defectDate, "dd MMM yyyy"),
            time: $.format.date(defectDate, "HH:mm"),
            defect: this.item
        });
        return this;
    }

}).registerAs("detailsItem", "TrainDefectDetailsItem.tmpl");

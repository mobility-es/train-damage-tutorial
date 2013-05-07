/**
 * Report damage view (step 3 - Damage description)
 */
AIQ.Spine.Controller.sub({
    events: {
        'click a[role="next"]': 'onNext'
    },

    init: function () {
    },

    destroy: function() {
        // Unbind all Spine and AIQ bindings here

        // Calling parent
        this.constructor.__super__.destroy.apply(this, arguments);
    },

    render: function (params) {
        if (TD.MyReport) {
            this.renderTemplate({
                description: TD.MyReport.defectText
            });

            this.el.attr("id", "description");

            // If we don't navigate to another page, we should always end this render function with "return this"
            return this;
        }
        else {  // Something went wrong
            console.log("Error: temporary report is missing");
            this.navigate("/");
        }
    },

    onNext: function (e) {
        TD.MyReport.defectText = this.$("textarea").val();
        this.navigate("/ReportDamage-Pictures");
    }
}).registerAs("/ReportDamage-Description", 'ReportDamage-Description.tmpl');

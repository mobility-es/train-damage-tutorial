AIQ.Spine.Controller.sub({
    init: function () {
    },

    render: function (params) {
        if (params !== undefined && params.trainId !== undefined) {
            this.trainId = params.trainId;
        }

        if (this.trainId !== undefined) {
            this.renderTemplate();
        }

        // If we don't navigate to another page, we should always end this render function with "return this"
        return this;
    }
}).registerAs("/add-damage/:trainId", "AddDamage.tmpl");

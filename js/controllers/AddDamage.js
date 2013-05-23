AIQ.Spine.Controller.sub({
    events: {
        "click button": "_onSaveClicked"
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
    },

    _onSaveClicked: function(e) {
        var newDamage = new TD.Damage({
            trainId: this.trainId,
            description: this.$("textarea").val()
        });

        // Persisting the new defect in the Data-sync layer. Since it's a new defect, "save()" will create it.
        // Had it been an existing defect, "save()" would have updated it.
        newDamage.save();

        // Synchronizing with the platform
        AIQ.Core.DataSync.synchronize();

        // Navigating back to the list of damages
        this.navigateBack();
    }
}).registerAs("/add-damage/:trainId", "AddDamage.tmpl");

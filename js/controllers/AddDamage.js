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
        // Request for AIQ context to retrieve username
        // Cf. https://docs.appeariq.com/display/AIQDEV/Context for documentation on the Context API
        AIQ.Core.Context.getGlobal("com.appearnetworks.aiq.user", {
            success: function (context) {
                var newDamage = new TD.DamageReport({
                    trainId: this.trainId,
                    description: this.$("textarea").val(),
                    creationDateTime: new Date().getTime(),
                    reportedBy: context.username
                });

                // Persisting the new defect in the Data-sync layer. Since it's a new defect, "save()" will create it.
                // Had it been an existing defect, "save()" would have updated it.
                newDamage.save();

                // For debugging purposes only, we check that newDamage comes out when calling all()
                console.log(TD.DamageReport.all());

                // Synchronizing with the platform
                AIQ.Core.DataSync.synchronize();
            },
            failure: function () {
                throw("Error while reading the logged-in user from global context");
            }
        });
    }
}).registerAs("/add-damage/:trainId", "AddDamage.tmpl");
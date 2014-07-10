aiq.app.Controller.sub({

	navbarButtons: {
        save: {
            label: 'Save',
            image: 'img/save.png'
        }
    },

    events: {
        'click @save': '_onSave'
    },
	
    render: function (params) {
        if (params !== undefined && params.trainId !== undefined) {
            this.trainId = params.trainId;
        }

        if (this.trainId !== undefined) {
            this.renderTemplate();
        }
		
		this.showNavbarButtons();

        // If we don't navigate to another page, we should always end this render function with "return this"
        return this;
    },

    _onSave: function() {
        var _this = this;

        // Request for the current user to retrieve username
        // Cf. https://appeariq.com/content/aiq-javascript-api#aiq.client.getCurrentUser for documentation on
        // the Client API
        aiq.client.getCurrentUser({
            success: function (user) {
                var newDamage = new TD.DamageReport({
                    trainId: _this.trainId,
                    description: _this.$("textarea").val(),
                    creationDateTime: new Date().getTime(),
                    reportedBy: user.username
                });

                // Persisting the new defect in the Data-sync layer. Since it's a new defect, "save()" will create it.
                // Had it been an existing defect, "save()" would have updated it.
                newDamage.save();

                // Synchronizing with the platform
                aiq.datasync.synchronize();

                // Navigating back to the list of damages
                _this.navigateBack();
            },
            failure: function () {
                throw("Error while reading the logged-in user");
            }
        });
    }
}).registerAs("/add-damage/:trainId", "AddDamage.tmpl");

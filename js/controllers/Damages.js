aiq.app.Controller.sub({
    navbarButtons: {
        addEvent: {
            label: 'Add Damage',
            image: 'img/add.png'
        }
    },

	events: {
        'click @addEvent': "_onAddDamage"
    },

    init: function () {
        this.listenTo(TD.DamageReport, "refresh", this.proxy(this._onDamagesFetched));
    },

    render: function (params) {
        var selectedTrain;

        if (params !== undefined && params.trainId !== undefined) {
            this.trainId = params.trainId;
        }

        if (this.trainId !== undefined) {
            // Spine's "find(id)" function returns the model instance for the specified id.
            // Pre-requisite: the models must have been fetched beforehand
            selectedTrain = TD.Train.find(this.trainId);

            // Set title in nav bar
            aiq.client.setAppTitle("Train " + selectedTrain.number);

            TD.DamageReport.fetch({
                filter: {
                    trainId: this.trainId
                }
            });
        }
		
		this.showNavbarButtons();

        // If we don't navigate to another page, we should always end this render function with "return this"
        return this;
    },

    _onDamagesFetched: function(docs) {
        this.renderTemplate({
            damageCount: docs.length,
            damages: docs
        });
    },

	_onAddDamage: function () {
        this.navigate("/add-damage", this.trainId);
    }


}).registerAs("/damages/:trainId", "Damages.tmpl");

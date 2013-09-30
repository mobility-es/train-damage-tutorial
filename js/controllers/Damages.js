aiq.app.Controller.sub({
    events: {
        "click button": "_onAddClicked"
    },

    init: function () {
        this.listenTo(TD.DamageReport, "create", this.proxy(this._onDamageCreated));
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

            TD.DamageReport.fetch();
        }

        // If we don't navigate to another page, we should always end this render function with "return this"
        return this;
    },

    _onDamageCreated: function() {
        this._renderDamages(TD.DamageReport.findAllByAttribute("trainId", this.trainId));
    },

    _onDamagesFetched: function(docs) {
        var damagesForThisTrain = [];

        docs.forEach(function(doc) {
            if (doc.trainId === this.trainId) {
                damagesForThisTrain.push(doc);
            }
        }, this);

        this._renderDamages(damagesForThisTrain);
    },

    _renderDamages: function(damagesForThisTrain) {
        this.renderTemplate({
            damageCount: damagesForThisTrain.length,
            damages: damagesForThisTrain
        });
    },

    _onAddClicked: function(e) {
        this.navigate("/add-damage", this.trainId);
    }
}).registerAs("/damages/:trainId", "Damages.tmpl");

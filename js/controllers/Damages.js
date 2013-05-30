AIQ.app.controller.sub({
    events: {
        "click button": "_onAddClicked"
    },

    init: function () {
        TD.DamageReport.bind("refresh create", this.proxy(this.render));
        TD.DamageReport.fetch();
    },

    destroy: function() {
        // Unbind all Spine and AIQ bindings here
        TD.DamageReport.unbind();

        // Calling parent
        this.constructor.__super__.destroy.apply(this, arguments);
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
            AIQ.client.setAppTitle("Train " + selectedTrain.number);

            // See http://spinejs.com/api/models for the documentation on Spine Model functions, including "findAllByAttribute(name, value)"
            var trainDamages = TD.DamageReport.findAllByAttribute("trainId", this.trainId);

            this.renderTemplate({
                damageCount: trainDamages.length,
                damages: trainDamages
            });
        }

        // If we don't navigate to another page, we should always end this render function with "return this"
        return this;
    },

    _onAddClicked: function(e) {
        this.navigate("/add-damage", this.trainId);
    }
}).registerAs("/damages/:trainId", "Damages.tmpl");

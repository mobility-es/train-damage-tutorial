AIQ.Spine.Controller.sub({
    init: function () {
    },

    // Don't forget to override "destroy" if you define Spine or AIQ bindings in this controller

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
            AIQ.Core.App.setTitle("Train " + selectedTrain.trainNumber);

            this.renderTemplate();
        }

        // If we don't navigate to another page, we should always end this render function with "return this"
        return this;
    }
}).registerAs("/damages/:trainId", "Damages.tmpl");

aiq.app.Controller.sub({
    events: {
        "click button": "_onAddClicked"
    },

    init: function () {
        TD.DamageReport.bind("refresh create", this.proxy(this.render));
        TD.DamageReport.fetch();

        TD.DamageReport.bind("create", this.proxy(this.forgetScrollPosition));
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
            aiq.client.setAppTitle("Train " + selectedTrain.number);

            // See http://spinejs.com/api/models for the documentation on Spine Model functions, including "findAllByAttribute(name, value)"
            var trainDamages = TD.DamageReport.findAllByAttribute("trainId", this.trainId);

            this.renderTemplate({
                damageCount: trainDamages.length,
                damages: trainDamages
            });

            this._initElements();
            this._reApplyScrollPosition();
        }

        // If we don't navigate to another page, we should always end this render function with "return this"
        return this;
    },

    forgetScrollPosition: function() {
        this.lastScrollPosition = null;
    },

    _initElements: function() {
        this.$body = $('body');
    },

    _onAddClicked: function(e) {
        this.lastScrollPosition = this.$body.scrollTop();

        this.navigate("/add-damage", this.trainId);
    },

    _reApplyScrollPosition: function() {
        if (this.lastScrollPosition) {
            // We need to delay the scrolling down until the DOM is fully rendered
            this.delay(function() {
                this.$body.scrollTop(this.lastScrollPosition);
            }, 50);
        }
    }
}).registerAs("/damages/:trainId", "Damages.tmpl");

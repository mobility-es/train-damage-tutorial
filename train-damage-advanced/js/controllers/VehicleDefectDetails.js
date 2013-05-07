/**
 * User: Ashad
 * Date: 2012-12-04
 */
AIQ.Plugin.iScroll.Controller.sub({

    events: {
        'click a[role="previous-item"]': 'onPreviousBtnClicked',
        'click a[role="next-item"]': 'onNextBtnClicked',
        'click a[role="pick-train"]': "pickTrain"
    },

    init: function () {
        TD.VehicleDefectReport.bind("refresh update", this.proxy(this.doRendering));

        this.renderTemplate();

        this.$article = this.$('> article');
        this.$previousBtn = this.$('a[role="previous-item"]');
        this.$nextBtn = this.$('a[role="next-item"]');
        this.$defectDetailsHeading = this.$("#defect-details-heading");
        this.$defectDetailsIndexAndLength = this.$("#defect-details-index-and-length");
    },

    render: function (params) {
        if ((params) && (params.Index !== undefined) && (params.Vehicle !== undefined)) {
            if ((this.vehicleNumber !== undefined) && (params.Vehicle !== this.vehicleNumber)) {
                delete this.items;
            }
            this.index = parseInt(params.Index, 10);
            this.vehicleNumber = params.Vehicle;
        }
        if (!this.items) {
            this.items = [];
        }
        if (this.items.length === 0) {
            var that = this;
            TD.VehicleDefectReport.eachSorted(function (item) {
                if (item.vehicleNumber === that.vehicleNumber) {
                    that.items.push(item);
                }
            });
        }
        this.item = this.items[this.index];

        if (this.item) {
            this.doRendering();
        } else {
            TD.VehicleDefectReport.fetch();
        }

        return this;
    },

    doRendering: function () {
        if (!this.items) {
            this.items = [];
        }
        if (this.items.length === 0) {
            this.items = TD.VehicleDefectReport.findByAttributeSorted(
                "vehicleNumber",
                this.vehicleNumber);
            if (this.index >= this.items.length) {
                this.index = this.items.length - 1;
            }
            if (this.index != -1) {
                this.item = this.items[this.index];
            }
        }

        this.updateFooter();
        this.displayItem();

        return this;
    },

    displayItem: function (item, transition) {
        var postTransition = function () {
            this.delay(function () {
                this.updateFooter();
            }, 0);
        };
        if (item) {
            this.item = item;
        }

        this.$defectDetailsHeading.html(this.item.heading);
        this.$defectDetailsIndexAndLength.html((this.index + 1) + "/" + this.items.length);

        if (this.oldController) {
            this.oldController.destroy();
        }
        this.oldController = this.itemController;
        var $previousItem = this.$item || $();

        this.itemController = AIQ.Spine.Controller.fromRoute("detailsItem", {
            dateTime: this.item.defectDateTime,
            item: this.item
        }).render();

        this.$item = this.itemController.appendTo(this.$article);

        $previousItem
            .removeClass("AIQ-in")
            .removeClass("AIQ-slideup")
            .removeClass("AIQ-slidedown");
        if (transition) {
            if (Modernizr.cssanimations) {
                $previousItem.one(AIQ.UI.Event.animationEnd, this.proxy(function () {
                    postTransition.call(this);
                }));
            } else {
                postTransition.call(this);
            }

            this.$item
                .addClass(transition)
                .addClass("AIQ-in");
            $previousItem
                .addClass(transition)
                .addClass("AIQ-out");
        } else {
            $previousItem.remove();
            postTransition.call(this);
        }

        this.createScroller();
    },

    toggleButton: function (button, active) {
        button.toggleClass("disabled", !active);
    },

    updateFooter: function () {
        this.toggleButton(this.$previousBtn, this.index > 0);
        this.toggleButton(this.$nextBtn, this.index < this.items.length - 1);
    },

    onPreviousBtnClicked: function (event) {
        event.preventDefault();

        if (this.index > 0) {
            this.index--;
            this.displayItem(this.items[this.index]);
        }
    },

    onNextBtnClicked: function (event) {
        event.preventDefault();

        if (this.index < this.items.length - 1) {
            this.index++;
            this.displayItem(this.items[this.index]);
        }
    },

    pickTrain: function () {
        this.navigate("/");
    }
}).registerAs("/DefectDetails/:Vehicle/:Index", 'VehicleDefectDetails.tmpl');

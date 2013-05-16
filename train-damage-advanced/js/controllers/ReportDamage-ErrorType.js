/**
 * Report damage view (step 2 - Error Type selection)
 */
AIQ.Plugin.iScroll.Controller.sub({

    events: {
        'click a': 'onListItemClicked'
    },

    init: function () {
        TD.TrainType.bind("change", this.proxy(this.render));
    },

    destroy: function () {
        // Unbind all Spine and AIQ bindings here
        TD.TrainType.unbind();

        // Calling parent
        this.constructor.__super__.destroy.apply(this, arguments);
    },

    render: function (params) {
        // Retrieving the temporary report
        if (TD.MyReport) {
            var train = TD.Train.findByAttribute("trainNumber", TD.MyReport.trainNumber);
            var defectCodes = [];
            if (train) {
                var trainType = TD.TrainType.findByAttribute("name", train.trainType);

                //get list of Defect Types
                defectCodes = this.normalizeCodes(trainType.defectCodes);
            }

            // Rendering the list
            this.renderTemplate({
                defectCodes: defectCodes
            });

            this.expandableList = this.$('#error-type-article > ul');

            // Collapsing the whole list
            var _this = this;
            this.expandableList.children().each(function (i, li) {
                _this.collapse($(li), 0);
            });

            // Expanding the selected error type subtree
            if (TD.MyReport.defectCode) {
                var $a = this.$('a[code="' + TD.MyReport.defectCode + '"]');
                if ($a.length > 0) {
                    this.expand($a);
                }
            }

            // We reset the selected state
            this.$(".selected").removeClass("selected");

            this.createScroller();

            // If we don't navigate to another page, we should always end this render function with "return this"
            return this;
        }
        else {  // Something went wrong
            console.log("Error: temporary report is missing");
            this.navigate("/");
        }
    },

    // Sets missing subcodes to an empty array; sorts the names
    normalizeCodes: function (codes) {
        for (var i = 0; i < codes.length; i++) {
            var code = codes[i];
            if (code.subcodes) {
                code.subcodes = this.normalizeCodes(code.subcodes);
            }
            else {
                code.subcodes = [];
            }
        }

        return codes.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });
    },

    onListItemClicked: function (e) {
        var $a = $(e.currentTarget);

        // Finding the collapsable sibling <ul> list, if any
        var $li = $a.parent();
        var $ul = $li.children('ul');

        // The clicked list item is a leaf, i.e. an actual error type has been selected
        if ($ul.length === 0 || $ul.children().length === 0) {
            $a.addClass("selected");

            TD.MyReport["defectCode"] = $a.attr('code');

            // Getting all the item parents to form the heading
            var heading = [];
            this.compileHeading($a, heading);

            TD.MyReport["heading"] = heading.join(' / ');
            TD.MyReport["level1"] = heading[0];
            TD.MyReport["level2"] = heading[1];
            TD.MyReport["level3"] = heading[2];

            // Delaying navigation slightly for "selected" class on the list item to be visible for a short moment before
            // switching to the next page
            this.delay(function () {
                this.navigate("/ReportDamage-Description");
            }, 10);
        }
        // The clicked item is not a leaf, we either expand or collapse it
        else {
            if ($li.hasClass('collapsed')) {
                // Before expanding the list item, we collapse other expanded ones
                var $expandedSibling = $li.siblings('.expanded:first');
                if ($expandedSibling.length !== 0) {
                    this.collapse($($expandedSibling[0]));
                }

                this.expand($li);
            }
            // THe list item was expanded, we collapse it
            else if ($li.hasClass('expanded')) {
                this.collapse($li);
            }

            // We wait 50ms and then refresh the iScroll
            this.refreshScroll(50);
        }
    },

    collapse: function ($el) {
        // Check if the list item is collapsable, i.e. contains non-empty <ul> sublist
        var $ul = $el.children('ul');
        if ($ul.length !== 0) {
            var $ulChildren = $ul.children();
            if ($ulChildren.length !== 0) {
                // Collapse all descendant sublists, if any
                var _this = this;
                $ulChildren.each(function (i, li) {
                    var $li = $(li);
                    if (!$li.hasClass('collapsed')) {
                        _this.collapse($li);
                    }
                });

                // Hide the child sublist
                $ul.hide();

                // Visualize collapsed state
                $el.removeClass('expanded');
                $el.addClass('collapsed');
            }
        }
    },

    // Expanding a list item: displaying its children
    expand: function ($el) {
        // Checking if the list item is expandable, i.e. contains non-empty <ul> sublist
        var $ul = $el.children('ul');
        if ($ul.length !== 0 && $ul.children().length !== 0) {
            // Visualizing expanded state
            $el.removeClass('collapsed');
            $el.addClass('expanded');

            // Expanding the child sublist
            $ul.show();
        }

        // Expanding parent list item
        var $li = $el.parent().closest('li');
        if ($li.length !== 0) {
            if (!$li.hasClass('expanded')) {
                this.expand($li);
            }
        }
    },

    compileHeading: function (a, heading) {
        // Push the node to the stack
        heading.unshift(a.text());

        // Traverse up the tree
        var $ul = a.closest('ul');
        var $aa = $ul.siblings('a');
        if ($aa.length !== 0) {
            this.compileHeading($aa, heading);
        }
    }
}).registerAs("/ReportDamage-ErrorType", 'ReportDamage-ErrorType.tmpl');

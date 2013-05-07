/**
 * Report damage view (step 5 - Summary)
 */
AIQ.Plugin.iScroll.Controller.sub({
    updatedImagesCount: 0,

    events: {
        'click a[role="finish"]': "onFinishClicked"
    },

    init: function () {
        TD.VehicleDefectImage.bind("refresh", this.proxy(this.renderImages));
        TD.VehicleDefectImage.bind("update", this.proxy(this._onImageUpdated));

        TD.VehicleDefectReport.bind("create", this.proxy(this.onReportCreated));
    },

    destroy: function() {
        // Unbind all Spine and AIQ bindings here
        TD.VehicleDefectImage.unbind();
        TD.VehicleDefectReport.unbind();

        // Calling parent
        this.constructor.__super__.destroy.apply(this, arguments);
    },

    render: function () {
        //retrieve temporary report containing user data
        if (TD.MyReport) {
            this.renderTemplate({
                report: TD.MyReport
            });

            TD.VehicleDefectImage.fetch();

            this.createScroller();

            // If we don't navigate to another page, we should always end this render function with "return this"
            return this;
        }
        else {  // Something went wrong
            console.log("Error: temporary report is missing");
            this.navigate("/");
        }
    },

    renderImages: function () {
        //insert attachment markup into the DOM-tree
        var _this = this;
        var renderAttachment = function (attachment) {
            var html = Mustache.render(_this.template, {
                attachment: attachment
            });
            _this.$('#attachments').append(html);
        };

        var imageDocs = TD.VehicleDefectImage.getOrphanedSorted();
        for (var i = 0; i < imageDocs.length; i++) {
            AIQ.Core.DataSync.getAttachments(imageDocs[i].id, {
                success: function (attachments) {
                    renderAttachment(attachments[0]);

                    // We wait a little while for the image to be added to the DOM, then refresh the iScroll
                    _this.refreshScroll(100);
                }
            });
        }
    },

    onFinishClicked: function (e) {
        //set missing Vehicle Defect fields
        TD.MyReport.defectNumber = null;
        TD.MyReport.defectDateTime = new Date().getTime();

        //request for AIQ context to retrieve username; create Vehicle Defect document from the temporary report object
        // Cf. https://docs.appeariq.com/display/AIQDEV/Context for documentation on the Context API
        AIQ.Core.Context.getGlobal("com.appearnetworks.aiq.user", {
            success: function (context) {
                TD.MyReport.reportedBy = context.username;
                new TD.VehicleDefectReport(TD.MyReport).save();
            },
            failure: function () {
                new TD.VehicleDefectReport(TD.MyReport).save();
            }
        });
    },

    onReportCreated: function (reportDoc) {
        //update image documents with actual Vehicle Defect document id
        var images = TD.VehicleDefectImage.getOrphaned();

        this.initialOrphanedCount = TD.VehicleDefectImage.getOrphaned().length;

        for (var i = 0; i < images.length; i++) {
            images[i].updateAttribute("defectId", reportDoc.id);
        }

        this.navigate("/ReportDamage-Confirmation");
    },

    _onImageUpdated: function() {
        this.updatedImagesCount++;

        // Once all images are assigned to the damage report, we synchronize with the platform
        if (this.updatedImagesCount === this.initialOrphanedCount) {
            AIQ.Core.DataSync.synchronize();

            this.updatedImagesCount = 0;
        }
    }
}).registerAs("/ReportDamage-Summary", 'ReportDamage-Summary.tmpl');

/**
 * Report damage view (step 4 - Attaching pictures)
 */
AIQ.Plugin.iScroll.Controller.sub({
    events: {
        "click a[role='take-picture']": "onTakePicture",
        "click a[role='pick-picture']": "onPickPicture",
        "click a[role='modify']": "onModify",
        "click a[role='delete']": "onDelete",
        "click a[role='cancel']": "onCancel",
        "click a[role='next']": "onNext",
        "click li > a": "onImageClicked"
    },

    init: function () {
        TD.TrainDefectImage.bind("refresh", this.proxy(this._displayImages));
        TD.TrainDefectImage.bind("create", this.proxy(this.onImageCreate));
    },

    destroy: function() {
        // Unbind all Spine and AIQ bindings here
        TD.TrainDefectImage.unbind();

        // Calling parent
        this.constructor.__super__.destroy.apply(this, arguments);
    },

    render: function (params) {
        this.renderTemplate();

        this.el.attr("id", "pictures");

        this.initElements();

        this._toggleButton(this.$deleteBtn, false);
        this.$deleteBtn.hide();
        this.$cancelBtn.hide();
        this.$modifyBtn.hide();

        this.$header.hide();

        // This variable stores the information about whether the view is in edit mode.
        // It is used to determine which buttons to display.
        this.editMode = false;

        // This variable stores mapping between auxiliary image document IDs and the controllers used
        // to render images attached to them.
        this.imageControllers = {};

        TD.TrainDefectImage.fetch();

        this.createScroller();

        // If we don't navigate to another page, we should always end this render function with "return this"
        return this;
    },

    initElements: function() {
        this.$article = this.$("#pictures-article");
        this.$pictureList = this.$(".picture-list");
        this.$header = this.$("h2");

        this.$takePictureBtn = this.$("a[role='take-picture']");
        this.$pickPictureBtn = this.$("a[role='pick-picture']");
        this.$modifyBtn = this.$("a[role='modify']");
        this.$deleteBtn = this.$("a[role='delete']");
        this.$cancelBtn = this.$("a[role='cancel']");
        this.$nextBtn = this.$("a[role='next']");
    },

    onTakePicture: function (e) {
        this.imageSource = "camera";
        this._getImage();
    },

    onPickPicture: function (e) {
        this.imageSource = "library";
        this._getImage();
    },

    onImageCreate: function (doc) {
        var that = this;
        AIQ.Core.Imaging.getImage(doc.id, {
            source: this.imageSource,
            success: function (attachment) {
                that._addImage(doc.id, attachment.resourceId);  // "attachment.resourceId" contains the URL to the picture
            },
            failure: function() {
                // Here we have to delete the business document to which the picture would have been attached
                doc.destroy();
            }
        });
    },

    _getImage: function () {
        // Pictures are attachments to a business document, TD.TrainDefectImage in this case.
        // When the document is saved ("create" event), we'll call the bridge JavaScript API to launch:
        // - Either the native photo app (if the "TAKE PIC" button was clicked)
        // - Or the native picture library app (if the "SELECT" button was clicked)
        new TD.TrainDefectImage({
            defectId: null,
            creationDate: new Date().getTime()
        }).save();
    },

    onModify: function (e) {
        this.$takePictureBtn.hide();
        this.$pickPictureBtn.hide();
        this.$deleteBtn.show();
        this.$cancelBtn.show();
        this.$modifyBtn.hide();

        this.$header.show();

        this._toggleEditMode();

        // The size of the content changes because we show a line of text. So we refresh the scroller
        // to avoid the images at the bottom to become cropped
        this.refreshScroll();
    },

    // Count the number of custom object properties, ignoring the intrinsic ones.
    mapLength: function (map) {
        var length = 0;
        for (var key in map) {
            if (map.hasOwnProperty(key)) {
                length++;
            }
        }
        return length;
    },

    onDelete: function (e) {
        var that = this;
        var length = this.mapLength(this.imageControllers);
        var i = 0;

        var onFinished = function (index) {
            if (index === length - 1) {
                that._toggleDeleteButton();
                that._backToViewMode.apply(that);
            }
        };

        // Each "key" is actually the id of a TD.TrainDefectImage business document
        for (var key in this.imageControllers) {
            if (this.imageControllers.hasOwnProperty(key) && this.imageControllers[key].isSelected()) {
                (function (index) {
                    var controller = that.imageControllers[key];
                    AIQ.Core.DataSync.deleteDocument(key, {
                        success: function () {
                            // remove the markup of the deleted image controller from the view
                            controller.release();

                            that.refreshScroll();

                            // remove the controller from the map, it is no longer needed
                            delete that.imageControllers[key];
                            onFinished(index);
                        },
                        failure: function () {
                            onFinished(index);
                        },
                        error: function () {
                            onFinished(index);
                        }
                    });
                })(i++);
            } else {
                onFinished(i++);
            }
        }
    },

    onCancel: function (e) {
        for (var key in this.imageControllers)
            if (this.imageControllers.hasOwnProperty(key))
                this.imageControllers[key].toggleSelection(false);

        this._backToViewMode();
    },

    _backToViewMode: function () {
        this.$takePictureBtn.show();
        this.$pickPictureBtn.show();
        this.$deleteBtn.hide();
        this.$cancelBtn.hide();
        if (this.mapLength(this.imageControllers) !== 0) {
            this.$modifyBtn.show();
        }
        this.$header.hide();

        this._toggleEditMode();
    },

    onNext: function (e) {
        this.navigate("/ReportDamage-Summary");
    },

    _toggleDeleteButton: function () {
        var selected = false;
        for (var key in this.imageControllers) {
            if (this.imageControllers.hasOwnProperty(key) && this.imageControllers[key].isSelected()) {
                selected = true;
                break;
            }
        }
        this._toggleButton(this.$deleteBtn, selected);
    },

    onImageClicked: function (e) {
        if (this.editMode) {
            var controllerId = this.$(e.currentTarget).data("id");
            var controller = this.imageControllers[controllerId];
            controller.toggleSelection(!controller.isSelected());
        }
        this._toggleDeleteButton();
    },

    _toggleButton: function (button, active) {
        button.toggleClass("disabled", !active);
    },

    _displayImages: function () {
        this.$pictureList.empty();

        var that = this;
        var images = TD.TrainDefectImage.getOrphanedSorted();

        for (var i = 0; i < images.length; i++) {
            (function (index) {
                AIQ.Core.DataSync.getAttachments(images[index].id, {
                    success: function (attachments) {
                        that._addImage(
                            images[index].id,
                            attachments[0].resourceId); // The URL to the picture
                    }
                });
            })(i);
        }
    },

    _addImage: function (id, pictureUrl) {
        var appended = AIQ.Spine.Controller.fromRoute("pictureListItem", {
            id: id,
            picture: pictureUrl
        });
        appended.render();
        appended.appendTo(this.$pictureList);

        // We store the current image controller in an array, with the business document id as array key.
        // Cf. function "onDelete()" to see when it is used.
        this.imageControllers[id] = appended;

        this.$modifyBtn.show();

        // We wait a bit for the image to be added to the DOM, and then refresh the iScroll
        this.delay(this.refreshScroll, 10);
    },

    _toggleEditMode: function () {
        this.editMode = !this.editMode;
        this.$article.toggleClass("modifying", this.editMode);
    }

}).registerAs("/ReportDamage-Pictures", 'ReportDamage-Pictures.tmpl');

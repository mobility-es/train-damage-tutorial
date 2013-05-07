AIQ.Spine.Controller.sub({

    tag: "li",

    init: function(args) {
        if (args.picture && args.id) {
            this.picture = args.picture;
            this.id = args.id;
        }
    },

    render: function() {
        if (this.picture !== undefined) {
            this.renderTemplate({
                picture: this.picture,
                id: this.id
            });
        }

        // If we don't navigate to another page, we should always end this render function with "return this"
        return this;
    },

    isSelected: function() {
        return this.$("a").hasClass("selected");
    },

    toggleSelection: function(selected) {
        this.$("a").toggleClass("selected", selected);
    }
    
}).registerAs("pictureListItem", "PictureListItem.tmpl");

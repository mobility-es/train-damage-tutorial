aiq.app.Controller.sub({
    // "init()" is called the first time the controller is executed
    init: function () {
    },

    // Don't forget to override "destroy" if you define Spine or AIQ bindings in this controller

    // "render()" is called every time this page is displayed
    render: function () {
        this.renderTemplate({ welcomeMsg: "Hello World!" });

        // If we don't navigate to another page, we should always end this render function with "return this"
        return this;
    }
}).registerAs("/", "Home.tmpl");

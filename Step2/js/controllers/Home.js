aiq.app.Controller.sub({
    // "init()" is called the first time the controller is executed
    init: function () {
        // Fetching model instances is asynchronous. The "refresh" event is fired on the Model class when fetch completes.
        // Here we wrap our "render()" function (mapped to the "refresh" event) in Spine's "proxy()" function to avoid
        // losing the context of our controller instance. See http://spinejs.com/api/controllers for more details on
        // Spine controller functions, including "proxy()" */
        this.listenTo(TD.Train, "refresh", this.proxy(this.render));

        // We retrieve all business documents of type "TD.Train" via Spine's Model API
        TD.Train.fetch();
    },

    // "render()" is called every time this page is displayed
    render: function () {
        var allTrains = TD.Train.all();

        this.renderTemplate({ trains: allTrains });

        // If we don't navigate to another page, we should always end this render function with "return this"
        return this;
    }
}).registerAs("/", "Home.tmpl");

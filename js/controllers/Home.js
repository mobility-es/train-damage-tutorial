AIQ.app.controller.sub({
    events: {
        "click a": "_onListItemClicked"
    },

    // "init()" is called the first time the controller is executed
    init: function () {
        // Fetching model instances is asynchronous. The "refresh" event is fired on the Model class when fetch completes.
        // Here we wrap our "render()" function (mapped to the "refresh" event) in Spine's "proxy()" function to avoid
        // losing the context of our controller instance. See http://spinejs.com/api/controllers for more details on
        // Spine controller functions, including "proxy()" */
        TD.Train.bind("refresh", this.proxy(this.render));

        // We retrieve all business documents of type "TD.Train" via Spine's Model API
        TD.Train.fetch();
    },

    destroy: function() {
        // Unbind all Spine and AIQ bindings here
        TD.Train.unbind();    // When unbind() is called without argument, it unbinds all events for that model

        // Calling parent
        this.constructor.__super__.destroy.apply(this, arguments);
    },

    // "render()" is called every time this page is displayed
    render: function () {
        var allTrains = TD.Train.all();

        this.renderTemplate({ trains: allTrains });

        // If we don't navigate to another page, we should always end this render function with "return this"
        return this;
    },

    // Functions mapped to events come with the event "e" as parameter
    _onListItemClicked: function(e) {
        // We get the DOM element which was clicked. Using the "this.$()" jQuery selector instead of simply "$()"
        // limits the scope of search to the current page, therefore is higher performance for accessing DOM elements
        // located inside the current page (which is what you'll want to do 99% of the time)
        var $target = this.$(e.currentTarget);

        var trainId = $target.data("id");

        // Function "this.navigate()" takes at least 1 argument: the URL of the page to navigate. Subsequent arguments
        // will be added to the URL, separated by slashes, and therefore will be defined in the target controller's
        // "registerAs()" function. See it for Damages.js for example.
        this.navigate("/damages", trainId);
    }
}).registerAs("/", "Home.tmpl");

// Always subclass AIQ.Spine.Model for App models
TD.Vehicle = AIQ.Spine.Model.sub();

// Configure Name (1:1 mapping of Document type) and attributes (Document format)
TD.Vehicle.configure("TD.Vehicle",
    "vehicleNumber",
    "vehicleType"
);

TD.Vehicle.extend({
    comparator: function (left, right) {
        return left.vehicleNumber - right.vehicleNumber;
    },

    findByAttributeSorted: function (field, value) {
        return this.findAllByAttribute(field, value).sort(this.comparator);
    }
});



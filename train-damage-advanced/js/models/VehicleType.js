// Always subclass AIQ.Spine.Model for App models
TD.VehicleType = AIQ.Spine.Model.sub();

// Configure Name (1:1 mapping of Document type) and attributes (Document format)
TD.VehicleType.configure("TD.VehicleType",
    "name",
    "defectCodes",
    "vehicleParts"
);

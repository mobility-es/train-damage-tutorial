// Always subclass AIQ.Spine.Model for App models
TD.TrainDefectReport = AIQ.Spine.Model.sub();

// Configure Name (1:1 mapping of Document type) and attributes (Document format)
TD.TrainDefectReport.configure("TD.TrainDefectReport",
    "trainNumber",
    "level1",
    "level2",
    "level3",
    "defectCode",
    "trainPart",
    "heading",
    "defectText",
    "reportedBy",
    "defectDateTime", // timestamp as number of milliseconds since 1970-01-01 00:00:00 UTC
    "defectCause",
    "operation"
);

// override default sort comparator
TD.TrainDefectReport.extend({
    comparator: function(a, b) {
        return b.defectDateTime - a.defectDateTime;
    },

    findByAttributeSorted: function(field, value) {
        return this.findAllByAttribute(field, value).sort(this.comparator);
    }
    
});

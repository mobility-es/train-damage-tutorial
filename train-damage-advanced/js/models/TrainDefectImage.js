TD.TrainDefectImage = AIQ.Spine.Model.sub();

TD.TrainDefectImage.configure(
    "TD.TrainDefectImage",
    "defectId",
    "creationDate");

TD.TrainDefectImage.extend({
    docType: "TD.TrainDefectImage"
});

TD.TrainDefectImage.extend({
    comparator: function(left, right) {
        return Date.parse(left.creationDate) - Date.parse(right.creationDate);
    },

    findByAttributeSorted: function(field, value) {
        return this.findAllByAttribute(field, value).sort(this.comparator);
    },

    getOrphaned: function () {
        return this.findAllByAttribute("defectId", null);
    },

    getOrphanedSorted: function () {
        return this.findByAttributeSorted("defectId", null);
    },

    cleanupOrphaned: function () {
        this.getOrphaned().forEach(function(doc) { doc.destroy(); });
    }
});

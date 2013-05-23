// To create models based on AIQ's Data-sync, we extending "AIQ.Spine.Model"
TD.Train = AIQ.Spine.Model.sub();

// As indicated in the Spine Model documentation (http://spinejs.com/docs/models), Models are written by an empty "sub()"
// Followed by a call to "configure()".
// Here, we declare the 3 attribute of the "TD.Train" business document that we will use in our app.
// But before that, the first argument of "configure()" is always the type of the business document.
TD.Train.configure("TD.Train",
    "trainNumber",
    "trainType"
);

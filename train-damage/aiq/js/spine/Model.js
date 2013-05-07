/**
 * Generic AIQ Model base class
 *
 * All App-specific Models should inherit from
 * this to get DataSync functionality
 *
 * @version 0.2
 * @author David Lindkvist
 * @author Marcin Lukow
 */

/*global AIQ:false, Spine:false */
AIQ.Spine.Model = Spine.Model.sub({

    /** 
     *  Returns the model after this one in the collection 
     *  Note: since Spine stores models in a hash, the order is not guaranteed between browser implementations
     */
    after: function () {
        var i = this.index();
        if (i > -1 && i < this.constructor.count()-1) {
            return this.constructor.recordsValues()[i+1];
        }

        return false;
    },

    /** 
     *  Returns the model before this one in the collection 
     *  Note: since Spine stores models in a hash, the order is not guaranteed between browser implementations
     */
    before: function () {
        var i = this.index();
        if (i > 0) {
            return this.constructor.recordsValues()[i-1];
        }

        return false;
    },

    /** 
     *  Returns current index of this model in the collection 
     *  Note: since Spine stores models in a hash, the order is not guaranteed between browser implementations
     */
    index: function () {
        for(var i = 0; i < this.constructor.count(); i++) {
            var model = this.constructor.recordsValues()[i];
            if (this.id === model.id) {
                return i;
            }
        }
        return -1;
    },


    /** 
     *  Returns current index of this model in the sorted collection
     *  Collection is sorted using the static comparator() method
     */
    indexSorted: function () {
        var sorted = this.constructor.allSorted();
        for(var i = 0; i < sorted.length; i++) {
            var model = sorted[i];
            if (this.id === model.id) {
                return i;
            }
        }
        return -1;
    },


    /*  Internal Framework method
     *  Transforms "id" property to "_id" to support backend 
     */
    toAIQRecord: function() {

        // Transform "id" to "_id"
        var attrs = this.attributes();
        attrs._id = attrs.id;
        delete attrs.id;
        return attrs;
    }

});

// Overriding instance methods
AIQ.Spine.Model.include({

    changeID: function(id) {
        // Data Sync does disallows changing document IDs
        throw "ID cannot be changed.";
    },

    destroy: function(options) {
        if (options === null) {
            options = {};
        }
        this.trigger('beforeDestroy', options);

        var that = this;
        AIQ.Core.DataSync.deleteDocument(this.id, {
            success: function() {
                // using that.constructor here because destroy
                // method is called on behalf of a model instance
                // and both records and crecords are class properties
                delete that.constructor.records[that.id];
                delete that.constructor.crecords[that.cid];
                that.destroyed = true;
                that.trigger('destroy', options);
                that.trigger('change', 'destroy', options);
                that.unbind();
            }
        });

        return this;
    },

    update: function(options) {
        this.trigger('beforeUpdate', options);
        var records = this.constructor.records;
        records[this.id].load(this.attributes());

        var that = this;

        var fields = this.attributes();
        // neither id nor cid should make it into the
        // document which we store in the Data Sync
        delete fields.id;
        delete fields.cid;
        
        AIQ.Core.DataSync.updateDocument(this.id, fields, {
            success: function(document) {
                that.trigger("update", options);
                that.trigger("change", "update", options);
            }
        });

        return this;
    },

    create: function(options) {
        this.trigger('beforeCreate', options);

        var that = this;
        // this.constructor.className because className is a class
        // property, so it must be accessed from the class context.
        AIQ.Core.DataSync.createDocument(this.constructor.className, this.attributes(), {
            success: function(document) {
                that.id = document._id;
                that.cid = document._id;
                var record = that.dup(false);
                // using that.constructor here because create
                // method is called on behalf of a model instance
                // and both records and crecords are class properties
                that.constructor.records[that.id] = record;
                that.constructor.crecords[that.cid] = record;
                that.trigger("create", options);
                that.trigger("change", "create", options);
            }
        });

        // This is where our implementation of the model is incosistent
        // with Spine. Spine returns a model instance already populated
        // with its ID but we cannot wait for #createDocument to finish
        // because javascript disallows passive waiting (like thread
        // yielding in hava) and active waiting performed on a processor
        // with only one core prevents the processor from preempting and
        // switching to new context for asynchronous #createDocument
        // call which freezes the whole application. Workaround for that
        // is not to wait for it here and return model instance without
        // its ID as a result.
        return this;
    }

});

AIQ.Spine.Model.extend({

    configure: function() {
        // We cannot call this.constructor.__super__.configure here
        // because configure is static and static methods cannot be
        // inherited and as a result, cannot change context to our
        // inherited class. As a workaround, we call apply on it and
        // pass our class as its context. "this" in our context points
        // to a model class, not model instance.
        var instance = Spine.Model.configure.apply(this, arguments);
        instance.bindServerEvents.apply(instance);
        return instance;
    },

    bindServerEvents: function() {
        AIQ.Core.DataSync.bindDocumentEvent("document-created",
                                            this.className,
                                            this.proxy(this.documentCreated));
        AIQ.Core.DataSync.bindDocumentEvent("document-updated",
                                            this.className,
                                            this.proxy(this.documentUpdated));
        AIQ.Core.DataSync.bindDocumentEvent("document-deleted",
                                            this.className,
                                            this.proxy(this.documentDeleted));
    },

    documentCreated: function(documentId, local) {
        AIQ.log("Model", "SERVER CREATED DOCUMENT", this.className, documentId, local);
        if (! local) {
            var that = this;
            AIQ.Core.DataSync.getDocument(documentId, {
                success: function(document) {
                    that.records[documentId] = new that(that.fromAIQRecord(document));
                    that.trigger("create", that.records[documentId]);
                    that.trigger("change", "create", {
                        changeComesFromServer: true
                    });
                },
                failure: function() {
                    AIQ.log("Model", "documentCreated", "Failure", "Model(" + documentId + ") not found")
                },
                error: function(arg) {
                    AIQ.log("Model", "documentCreated", "Error", err.message);
                }
            });
        }
    },

    documentUpdated: function(documentId, local) {
        AIQ.log("Model", "SERVER UPDATED DOCUMENT", this.className, documentId, local);
        if (! local) {
            var that = this;
            AIQ.Core.DataSync.getDocument(documentId, {
                success: function(document) {
                    var record = that.records[documentId];
                    if (record) {
                        record.load(that.fromAIQRecord(document));
                        record.trigger("update");
                        record.trigger("change", "update", {
                            changeComesFromServer: true
                        });
                    } else {
                        // calling "new" on "this" (or "that" in this case) is
                        // totally legal in javascript. We don't know which model
                        // we are in but "this" points exactly to this inherited
                        // model so calling new this() creates an instance of this
                        // inherited model. Neat!
                        that.trigger("create", new that(that.fromAIQRecord(document)));
                        that.trigger("change", "create", {
                            changeComesFromServer: true
                        });
                    }
                },
                failure: function() {
                    AIQ.log("Model", "documentUpdated", "Failure", "Model (" + documentId + ") not found")
                },
                error: function(arg) {
                    AIQ.log("Model", "documentUpdated", "Error", err.message);
                }
            })
        }
    },

    documentDeleted: function(documentId, local) {
        AIQ.log("Model", "SERVER DELETED DOCUMENT", this.className, documentId, local);
        if (! local) {
            var document = this.records[documentId];
            if (document) {
                delete this.records[documentId];
                document.trigger("destroy");
                document.trigger("change", "destroy", {
                    changeComesFromServer: true
                });
            }
        }
    },

    fetch: function() {
        var that = this;
        AIQ.Core.DataSync.getDocuments(this.className, {
            success: function(docs) {
                that.refresh(that.fromAIQRecord(docs), {
                    clear: true
                });
            }
        });
    },

    /*
     *  Internal Framework method
     *  Transforms "_id" property from backend to "id" to support Spine 
     */
    fromAIQRecord: function (records) {
        if ($.isArray(records)) {
            for (var i in records) {
                if (records[i]._id !== undefined) {
                    records[i].id = records[i]._id;
                    delete records[i]._id;
                }
                if (records[i]._type !== undefined) {
                    records[i].className = records[i]._type;
                    delete records[i]._type;
                }
            }
        } else {
            if (records._id !== undefined) {
                records.id = records._id;
                delete records._id;
            }
            if (records._type !== undefined) {
                records.className = records._type;
                delete records._type;
            }
        }
        return records;
    },
    

    /** each() in custom sorted order */
    eachSorted: function(callback) {
        var sorted = this.all().sort(this.comparator);
        for (var key in sorted) {
            callback(sorted[key].clone());
        }
    },

    /** all() in custom sorted order */
    allSorted: function(callback) {
        return this.all().sort(this.comparator);
    },

    /**
     *  Default comparator used to sort collection
     *          - sorts by default on id attribute. Override in subclass for custom sorting.
     *  @param {Object} a first element to order in relation to b
     *  @param {Object} b second element to order in relation to a
     */
    comparator: function (a, b){
        return a.id - b.id;
    }
    
});

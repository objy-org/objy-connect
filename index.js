var _nodejs = (typeof process !== 'undefined' && process.versions && process.versions.node);
if (_nodejs) var SPOO = require('spooclient').SpooClient; 
else SPOO = SPOO_Client;

var Mapper = function(OBJY, options) {
    return Object.assign(new OBJY.StorageTemplate(OBJY, options), {

        spoo: null,
        currentWorkspace: null,

        connect: function(credentials, success, error, options) {
            this.currentWorkspace = credentials.workspace;

            this.spoo = new SPOO(credentials.workspace)
            return this;
        },

        getConnection: function() {
            return this.spoo;
        },

        useConnection: function(spoo, success, error) {
            this.spoo = spoo;
            return this;
        },

        getDBByMultitenancy: function(client) {

        },

        createClient: function(client, success, error) {

        },


        listClients: function(success, error) {

        },

        getById: function(id, success, error, app, client) {
            var spoo = new SPOO(client);
            if(app) spoo.AppId(app);

            spoo.io()[this.objectFamily](id).get((data, err) => {
                if(err) return error(err)
                success(data)
            })
        },

        getByCriteria: function(criteria, success, error, app, client, flags) {
            var spoo = new SPOO(client);
            if(app) spoo.AppId(app);

            // TODO: plural name!
            spoo.io()[this.objectFamily](criteria).get((data, err) => {
                if(err) return error(err)
                success(data)
            })
        },

        count: function(criteria, success, error, app, client, flags) {
            var spoo = new SPOO(client);
            if(app) spoo.AppId(app);

            // TODO: plural name!
            spoo.io()[this.objectFamily](criteria).count((data, err) => {
                if(err) return error(err)
                success(data)
            }) 
        },

        update: function(spooElement, success, error, app, client) {
            var spoo = new SPOO(client);
            if(app) spoo.AppId(app);

            spoo.io()[this.objectFamily](spooElement._id).update(spooElement, (data, err) => {
                if(err) return error(err)
                success(data)
            })
        },

        add: function(spooElement, success, error, app, client) {
            var spoo = new SPOO(client);
            if(app) spoo.AppId(app);

            spoo.io()[this.objectFamily](spooElement).add((data, err) => {
                if(err) return error(err)
                success(data)
            })  
        },

        remove: function(spooElement, success, error, app, client) {
            var spoo = new SPOO(client);
            if(app) spoo.AppId(app);

            spoo.io()[this.objectFamily](spooElement._id).delete((data, err) => {
                if(err) return error(err)
                success(data)
            })
           
        }
    })
}

if(_nodejs) module.exports = Mapper; 
else var SPOOMapper = Mapper;
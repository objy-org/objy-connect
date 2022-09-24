var _nodejs = (typeof process !== 'undefined' && process.versions && process.versions.node);
if (_nodejs) var fetch = require('node-fetch'); 

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

if (typeof sessionStorage === "undefined" || sessionStorage === null) {
    sessionStorage = require('sessionstorage');
}

function objToQueryString(obj) {
    const parts = [];
    let _i;

    obj = JSON.parse(JSON.stringify(obj));
    for (const i in obj) {
        if (obj.hasOwnProperty(i)) {
            if (typeof obj[i] == 'object') obj[i] = JSON.stringify(obj[i]);
            if (i.indexOf('properties') != -1 && i.indexOf('.value') == -1) _i = i + '.value';
            else _i = i;

            parts.push(encodeURIComponent(_i) + '=' + encodeURIComponent(obj[i]));
        }
    }
    return parts.join('&');
}

var Mapper = function(OBJY, options) {

    return Object.assign(new OBJY.StorageTemplate(OBJY, options), {

        spoo: null,
        currentWorkspace: null,
        currentUrl:null,

        _genericApiCall: function(urlPart, method, body, success, error, app, count){
            
            var url;
            if(!app) url = this.currentUrl + '/client/' + this.currentWorkspace + '/' + urlPart;
            else url = this.currentUrl + '/client/' + this.currentWorkspace + '/app/' + app + '/' + urlPart;

           // if(count) url += '/count'
            fetch(url, {
                method: method,
                body: body,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': 'Baerer '+sessionStorage.getItem('accessToken') }
              }).then(res => res.json())
              .then(json => {
                console.log(url, json)
                success(json)
              });
        },

        connect: function(credentials, success, error, options) {
            this.currentWorkspace = credentials.client;
            this.currentUrl = credentials.url;

            fetch(credentials.url + '/client/' + credentials.client + '/auth', {
                method: 'POST',
                body: JSON.stringify({
                    permanent: true,
                    username: credentials.username,
                    password: credentials.password
                }),
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
              }).then(res => res.json())
              .then(json => {
                localStorage.setItem('clientId', credentials.client);
                sessionStorage.setItem('accessToken', json.token.accessToken);
                localStorage.setItem('refreshToken', json.token.refreshToken)
                success(json)
              });

            return this;
        },

        getConnection: function() {
            return this;
        },

        useConnection: function(spoo, success, error) {
            return this;
        },

        getDBByMultitenancy: function(client) {

        },

        createClient: function(client, success, error) {

        },

        listClients: function(success, error) {

        },

        getById: function(id, success, error, app, client) {
            this._genericApiCall(this.objectFamily + '/' + id, 'GET', {}, success, error, app)
        },

        getByCriteria: function(criteria, success, error, app, client, flags) {
            this._genericApiCall(this.objectFamily + 's/?' + objToQueryString(criteria), 'GET', {}, success, error, app)
        },

        count: function(criteria, success, error, app, client, flags) {
            this._genericApiCall(this.objectFamily + 's/count?' + objToQueryString(criteria), 'GET', {}, success, error, app, true)
        },

        update: function(spooElement, success, error, app, client) {
            // chain ???
            this._genericApiCall(spooElement.role + '/' + spooElement._id, 'PUT', spooElement, success, error, app)
        },

        add: function(spooElement, success, error, app, client) {
            this._genericApiCall(spooElement.role, 'POST', JSON.stringify(spooElement), success, error, app)
        },

        remove: function(spooElement, success, error, app, client) {
            this._genericApiCall(spooElement.role + '/' + spooElement._id, 'DELETE', {}, success, error, app)
        }
    })
}

if(_nodejs) module.exports = Mapper; 
else var SPOOMapper = Mapper;
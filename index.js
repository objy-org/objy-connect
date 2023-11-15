var _fetch = null;
var _nodejs = typeof process !== 'undefined' && process.versions && process.versions.node;
var mainStorage = null;

if (_nodejs) _fetch = require('node-fetch');
else _fetch = fetch;

if (typeof localStorage === 'undefined' || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    mainStorage = new LocalStorage('./scratch');
}

if (typeof sessionStorage === 'undefined' || sessionStorage === null) {
    sessionStorage = require('sessionstorage');
}

function objToQueryString(obj, flags) {
    const parts = [];
    let _i;

    obj = JSON.parse(JSON.stringify(Object.assign(obj, flags)));
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

var ConnectMapper = function (OBJY, options) {
    return Object.assign(new OBJY.StorageTemplate(OBJY, options), {
        spoo: null,
        currentWorkspace: null,
        currentUrl: null,

        _relogin: function (urlPart, method, body, success, error, app, count) {
            _fetch(this.currentUrl + '/client/' + this.currentWorkspace + '/token', {
                method: 'POST',
                body: JSON.stringify({
                    refreshToken: mainStorage.getItem('refreshToken'),
                }),
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            })
                .then((res) => {
                    if (res.status == 401) {
                        error({ error: 'refreshing token failed' });
                    }
                    return res.json();
                })
                .then((json) => {
                    console.log('json', json);
                    sessionStorage.setItem('accessToken', json.token.accessToken);
                    mainStorage.setItem('refreshToken', json.token.refreshToken);
                    this._genericApiCall(urlPart, method, body, success, error, app, count);
                })
                .catch((err) => {});
        },

        _genericApiCall: function (urlPart, method, body, success, error, app, count) {
            var url;
            if (!app) url = this.currentUrl + '/client/' + this.currentWorkspace + '/' + urlPart;
            else url = this.currentUrl + '/client/' + this.currentWorkspace + '/app/' + app + '/' + urlPart;

            // if(count) url += '/count'
            var headers = { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: 'Baerer ' + sessionStorage.getItem('accessToken') };
            if(body instanceof FormData) headers = { Authorization: 'Baerer ' + sessionStorage.getItem('accessToken') }

            _fetch(url, {
                method: method,
                body: body,
                headers: headers,
            })
                .then((res) => {
                    //if (res.status == 400) res.errStatus = 400;
                    if (res.status == 401) {
                        if (mainStorage.getItem('refreshToken')) this._relogin(urlPart, method, body, success, error, app, count);
                    }
                    return res.json();
                })
                .then((json) => {
                    success(json);
                })
                .catch((err) => {});
        },

        connect: function (credentials, success, error, options) {
            this.currentWorkspace = credentials.client;
            this.currentUrl = credentials.url;
            return this;
        },

        // SPECIAL OBJY PLATFORM OPERATIONS

        login: function (credentials, success, error) {
            return new Promise((resolve, reject) => {
                _fetch(this.currentUrl + '/client/' + this.currentWorkspace + '/auth', {
                    method: 'POST',
                    body: JSON.stringify({
                        permanent: credentials.permanent,
                        username: credentials.username,
                        password: credentials.password,
                    }),
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                })
                    .then((res) => res.json())
                    .then((json) => {
                        mainStorage.setItem('clientId', this.currentWorkspace);
                        sessionStorage.setItem('accessToken', json.token.accessToken);
                        mainStorage.setItem('refreshToken', json.token.refreshToken);
                        if (success) success(json);
                        else resolve(json);
                    })
                    .catch((err) => {
                        if (error) error(err);
                        else reject(err);
                    });
            });
        },

        relogin: function (success, error) {
            return new Promise((resolve, reject) => {
                _fetch(this.currentUrl + '/client/' + this.currentWorkspace + '/token', {
                    method: 'POST',
                    body: JSON.stringify({
                        refreshToken: mainStorage.getItem('refreshToken')
                    }),
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                })
                    .then((res) => res.json())
                    .then((json) => {
                        mainStorage.setItem('clientId', this.currentWorkspace);
                        sessionStorage.setItem('accessToken', json.token.accessToken);
                        mainStorage.setItem('refreshToken', json.token.refreshToken);
                        if (success) success(json);
                        else resolve(json);
                    })
                    .catch((err) => {
                        if (error) error(err);
                        else reject(err);
                    });
            });
        },

        authenticated: function (callback) {
            return new Promise((resolve, reject) => {
                _fetch(this.currentUrl + '/client/' + this.currentWorkspace + '/authenticated?token=' + sessionStorage.getItem('accessToken'), {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                })
                    .then((res) => res.json())
                    .then((json) => {
                        if (callback) callback(json.authenticated || json.auth);
                        else resolve(json.authenticated || json.auth);
                    })
                    .catch((err) => {
                        if (error) error(err);
                        else reject(err);
                    });
            });
        },

        logout: function (success, error) {
            return new Promise((resolve, reject) => {
                _fetch(this.currentUrl + '/client/' + this.currentWorkspace + '/token/reject', {
                    method: 'POST',
                    body: JSON.stringify({
                        accessToken: sessionStorage.getItem('accessToken'),
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: 'Baerer ' + sessionStorage.getItem('accessToken'),
                    },
                })
                    .then((res) => res.json())
                    .then((json) => {
                        sessionStorage.removeItem('accessToken');
                        mainStorage.removeItem('refreshToken');
                        if (success) success(json);
                        else resolve(json);
                    })
                    .catch((err) => {
                        if (error) error(err);
                        else reject(err);
                    });
            });
        },

        path: function(app) {
            var url;
            if (!app) url = this.currentUrl + '/client/' + this.currentWorkspace + '/' + this.objectFamily;
            else url = this.currentUrl + '/client/' + this.currentWorkspace + '/app/' + app + '/' + this.objectFamily;

            url += '/stream';
            return url + '?token=' + getAccessToken();
        },

        requestUserKey: function (data, success, error) {
            return new Promise((resolve, reject) => {
                _fetch(this.currentUrl + '/client/' + this.currentWorkspace + '/user/requestkey', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: data.email,
                    }),
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                })
                    .then((res) => res.json())
                    .then((json) => {
                        if (success) success(json);
                        else resolve(json);
                    })
                    .catch((err) => {
                        if (error) error(err);
                        else reject(err);
                    });
            });
        },

        requestPasswordReset: function (data, success, error) {
            return new Promise((resolve, reject) => {
                _fetch(this.currentUrl + '/client/' + this.currentWorkspace + '/user/requestpasswordreset', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: data.email,
                        username: data.username,
                    }),
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                })
                    .then((res) => res.json())
                    .then((json) => {
                        if (success) success(json);
                        else resolve(json);
                    })
                    .catch((err) => {
                        if (error) error(err);
                        else reject(err);
                    });
            });
        },

        resetPassword: function (data, success, error) {
            return new Promise((resolve, reject) => {
                _fetch(this.currentUrl + '/client/' + this.currentWorkspace + '/user/resetpassword', {
                    method: 'POST',
                    body: JSON.stringify({
                        resetKey: data.resetKey,
                        password: data.password,
                        password2: data.password2,
                    }),
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                })
                    .then((res) => res.json())
                    .then((json) => {
                        if (success) success(json);
                        else resolve(json);
                    })
                    .catch((err) => {
                        if (error) error(err);
                        else reject(err);
                    });
            });
        },

        requestClientKey: function (email, success, error) {
            return new Promise((resolve, reject) => {
                _fetch(this.currentUrl + '/client/register', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: data.email,
                    }),
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                })
                    .then((res) => res.json())
                    .then((json) => {
                        if (success) success(json);
                        else resolve(json);
                    })
                    .catch((err) => {
                        if (error) error(err);
                        else reject(err);
                    });
            });
        },

        createClient: function (data, success, error) {
            return new Promise((resolve, reject) => {
                _fetch(this.currentUrl + '/client', {
                    method: 'POST',
                    body: JSON.stringify({
                        registrationKey: data.registrationKey,
                        clientname: data.clientname,
                    }),
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                })
                    .then((res) => res.json())
                    .then((json) => {
                        if (success) success(json);
                        else resolve(json);
                    })
                    .catch((err) => {
                        if (error) error(err);
                        else reject(err);
                    });
            });
        },

        getById: function (id, success, error, app, client) {
            this._genericApiCall(this.objectFamily + '/' + id, 'GET', undefined, success, error, app);
        },

        getByCriteria: function (criteria, success, error, app, client, flags) {
            this._genericApiCall(this.objectFamily + 's/?' + objToQueryString(criteria, flags), 'GET', undefined, success, error, app);
        },

        count: function (criteria, success, error, app, client, flags) {
            this._genericApiCall(this.objectFamily + 's/count?' + objToQueryString(criteria, flags), 'GET', undefined, success, error, app, true);
        },

        update: function (spooElement, success, error, app, client) {
            var alterData = [];
            OBJY.alterSequence.forEach((a) => {
                if (a[Object.keys(a)[0]].length > 1) a[Object.keys(a)[0]] = Object.values(a[Object.keys(a)[0]]);
                else a[Object.keys(a)[0]] = Object.values(a[Object.keys(a)[0]])[0];
                alterData.push(a);
            });
            this._genericApiCall(this.objectFamily + '/' + spooElement._id, 'PATCH', JSON.stringify(alterData), success, error, app);
        },

        add: function (spooElement, success, error, app, client) {
            var data = JSON.stringify(spooElement);

            // Check if object is file (formdata)
            if(spooElement.data) {
                if(spooElement.data instanceof FormData) {
                    data = spooElement;
                }
            } else if((spooElement.properties || {}).data) {
                if(spooElement.properties.data instanceof FormData) {
                    data = spooElement;
                }
            }
            this._genericApiCall(this.objectFamily, 'POST', data, success, error, app);
        },

        remove: function (spooElement, success, error, app, client) {
            this._genericApiCall(this.objectFamily + '/' + spooElement._id, 'DELETE', undefined, success, error, app);
        },

        turnOnSessionOnly: function () {
            mainStorage = sessionStorage;
        },
    });
};

if (_nodejs) module.exports = ConnectMapper;
else if (typeof window !== 'undefined') {
    window.CONNECT = ConnectMapper;
}

if(0)typeof await/2//2; export default ConnectMapper;
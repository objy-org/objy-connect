import dexie from 'dexie';
import moment from 'moment';

let mainStorage = null;
let offline = false;
let OBJY = null;
let db = null;
let storeFamilies = ['objects', 'users', 'templates'];
let syncedCb = null;

const newLogTemplate = {
    name: '',
    properties: {
        fields: {
            properties: {},
            type: 'bag',
        },
        object: {
            properties: {
                name: {
                    value: '',
                    type: 'shortText',
                },
                id: {
                    value: '',
                    type: 'shortText',
                },
                inherits: {
                    value: [],
                    type: 'array',
                },
                role: {
                    value: '',
                    type: 'shortText',
                },
            },
            type: 'bag',
        },
        user: {
            properties: {
                name: {
                    value: '',
                    type: 'shortText',
                },
                id: {
                    value: '',
                    type: 'shortText',
                },
            },
            type: 'bag',
        },
        comment: {
            value: '',
            type: 'longText',
        },
        time: {
            value: '',
            type: 'date',
        },
    },
    role: 'eventlog',
};

const property_blacklist = [
    'piles',
    'defaultForm',
    'forms',
    'attachmentContents',
    'attachments',
    'tags',
    'default',
    'color',
    'icon',
    'availablestatus',
    'rules',
    'numberCycle',
    'incNumber',
    'backRefs',
    'status',
    'literals',
    'nameMeta',
    'usernameMeta',
    'emailMeta',
    'isUser',
    '_imported',
    'offline',
    'createdBy',
    'emailTemplates',
    'triggers',
    '_importId',
    '_avatar',
];

function createLog(obj, user, opts = { app: null, mode: 'update', initObj: null, cloneId: null }) {
    let log = JSON.parse(JSON.stringify(newLogTemplate));
    let time = new Date().toISOString();
    let currentValue = '';
    let initialValue = '';
    let specialFields = [];

    if (obj.role == 'user') {
        specialFields.push('username');
        specialFields.push('email');
    } else {
        specialFields.push('name');
    }

    log.properties.fields = {
        properties: {},
        type: 'bag',
    };

    log.name = 'changelog_' + time;

    log._synced = false;

    log.applications = [];

    if (opts?.app) log.applications.push(opts?.app);

    if (opts?.mode == 'delete') {
        log.type = 'changelog_remove';
    } else if (opts?.mode == 'new' || opts?.mode == 'clone') {
        log.type = 'changelog_add';
    } else {
        log.type = 'changelog_update';
    }

    /*
    for (var fieldId of Object.keys(obj.properties)) {
        if (
            property_blacklist.indexOf(fieldId) == -1 &&
            obj.properties[fieldId].type != 'event' &&
            (obj.properties[fieldId]?.meta || {}).type != 'localAction'
        ) {
            currentValue = getPropValueString(obj.properties[fieldId], fieldId);

            if (opts?.mode == 'update') {
                initialValue = getPropValueString((opts?.initObj?.properties || {})[fieldId], fieldId);
            }

            //if (currentValue != initialValue || opts?.mode == "delete" || opts?.mode == "new" || opts?.mode == "clone") {
            if (true) {
                log.properties.fields.properties[fieldId] = {
                    properties: {},
                    type: 'bag',
                    meta: {
                        updated: (currentValue || initialValue) && currentValue != initialValue ? true : false,
                    },
                };

                if (obj.properties[fieldId]?.meta?.advancedType == 'multiref' || obj.properties[fieldId]?.meta?.advancedType == 'filesref') {
                    log.properties.fields.properties[fieldId].properties.value = {
                        properties: obj.properties[fieldId]?.properties || {},
                        type: obj.properties[fieldId].type,
                    };
                } else {
                    log.properties.fields.properties[fieldId].properties.value = {
                        value: currentValue,
                        type: obj.properties[fieldId].type,
                    };
                }
            }
        }
    }

    specialFields.forEach(function (specialField) {
        //if (obj[specialField] != (opts?.initObj || {})[specialField] || opts?.mode == "delete" || opts?.mode == "new" || opts?.mode == "clone") {
        if (true) {
            currentValue = obj[specialField];

            log.properties.fields.properties['_' + specialField] = {
                properties: {
                    value: {
                        value: currentValue,
                        type: 'shortText',
                    },
                },
                type: 'bag',
            };
        }
    });

    log.properties.object.properties.name.value = obj.name;

    if (opts?.mode == 'clone') log.properties.object.properties.id.value = opts?.cloneId;
    else log.properties.object.properties.id.value = obj._id;

    if (obj.inherits) {
        log.properties.object.properties.inherits.value = obj.inherits;
    }

    if (obj.role) {
        log.properties.object.properties.role.value = obj.role;
    }

    log.created = moment().utc().toDate().toISOString();
    log.lastModified = log.created;

    log.properties.user.properties.name.value = user.username;
    log.properties.user.properties.id.value = user._id;
    log.properties.time.value = time;
    */

    return log;
}

function getMultiRefsString(refs) {
    var refsArray = [];

    for (var refId of refs) {
        refsArray.push(refId);
    }

    return refsArray.join(' ');
}

function getPropValueString(prop, propRef, resolved) {
    var value = '';

    if ((prop || {}).value || (prop || {}).value == false) {
        if ((prop || {}).type == 'date' && typeof prop != 'string') {
            try {
                value = moment(prop.value).toDate().toISOString();
            } catch {}
        } else {
            value = prop.value;
        }
    } else if (prop?.meta?.advancedType == 'multiref' || prop?.meta?.advancedType == 'filesref') {
        value = getMultiRefsString(JSON.parse(JSON.stringify(prop.properties)));
    }

    return value;
}
function init(_OBJY, objFamilies, opts = {}) {
    let stores = {};

    console.log('init offline modus');

    OBJY = _OBJY;

    if (opts?.synced) {
        syncedCb = opts.synced;
    }

    db = new dexie('offline');

    storeFamilies = objFamilies;

    objFamilies.forEach((objFamily) => {
        stores[objFamily] = '&_id,inherits,type,created';
    });

    stores['logs'] = '++_id';

    db.version(1).stores(stores);

    if (typeof localStorage === 'undefined' || localStorage === null) {
        var LocalStorage = require('node-localstorage').LocalStorage;
        mainStorage = new LocalStorage('./scratch');
    } else mainStorage = localStorage;

    if (window) {
        offline = !window.navigator.onLine;

        window.addEventListener('online', () => {
            offline = false;

            syncOfflineData();
        });

        window.addEventListener('offline', () => {
            offline = true;
        });
    }

    console.log('is not offline: ', !offline, window.navigator.onLine);

    //if (!offline) loadOfflineData();
}

function resolveGenericQuery(query, model, user = {}) {
    if (typeof query == 'string') query = JSON.parse(query);
    else query = JSON.parse(JSON.stringify(query));

    let resolvedQuery = JSON.parse(JSON.stringify(query));
    let propName = null;
    let tempQueryPart = null;

    Object.keys(query).forEach((qKey, qKeyIndex) => {
        if (qKey == '$and' || qKey == '$or') {
            resolvedQuery[qKey].forEach((queryArrayPart, queryArrayPartIndex) => {
                resolvedQuery[qKey][queryArrayPartIndex] = resolveGenericQuery(queryArrayPart, model, user);
            });
        } else {
            if (qKey == '_id' && query[qKey] == '@me') {
                resolvedQuery[qKey] = user._id;
            } else if (qKey.indexOf('properties.') != -1 && query[qKey] == '@me') {
                resolvedQuery[qKey] = user._id;
            } else if (typeof query[qKey] === 'string' && query[qKey].indexOf('%') == 0) {
                //let appSettingsValue = getSettingsLiteralVal(query[qKey]);
                //resolvedQuery[qKey] = appSettingsValue;
            } else if (qKey.indexOf('properties.@me') != -1) {
                resolvedQuery[qKey.slice(0, -3) + user._id] = query[qKey];
                delete resolvedQuery[qKey];
            } else if (
                (String(query[qKey]) || '').includes('@_now') ||
                (query[qKey] !== null && typeof query[qKey] == 'object' && String(query[qKey][Object.keys(query[qKey] || '{}')[0]] || '').includes('@_now'))
            ) {
                let currentMoment = moment();
                let key = 'days';
                let qValue = String(query[qKey]);

                if (typeof query[qKey] == 'object') qValue = String(query[qKey][Object.keys(query[qKey] || '{}')[0]] || '');

                let momentParts = qValue.trim().split(' ');

                if ((momentParts[0] = '@_nowDay')) currentMoment = moment().startOf('day').set('hour', 12);

                if (momentParts[3]) key = momentParts[3].toLowerCase();

                if (momentParts[1] == '+' && momentParts[2]) {
                    currentMoment.add(momentParts[2], key);
                } else if (momentParts[1] == '-' && momentParts[2]) {
                    currentMoment.subtract(momentParts[2], key);
                }

                if (typeof query[qKey] != 'object') resolvedQuery[qKey] = currentMoment.utc().toDate().toISOString();
                else resolvedQuery[qKey][Object.keys(query[qKey])[0]] = currentMoment.utc().toDate().toISOString();
            } else if (
                typeof query[qKey] !== 'object' &&
                (qKey.includes('properties.') || qKey == 'name' || qKey == 'username' || qKey == 'email') &&
                (String(query[qKey]) || '').includes('@') &&
                !(String(query[qKey]) || '').includes('properties.@')
            ) {
                if (query[qKey].includes('@_name') || query[qKey].includes('@_username') || query[qKey].includes('@_email')) {
                    resolvedQuery[qKey] = user[query[qKey].slice(2)];
                } else {
                    resolvedQuery[qKey] = (user.properties[query[qKey].slice(1)] || {}).value;
                }
            } else if ((String(query[qKey]) || '').includes('properties.@')) {
                resolvedQuery[qKey] = (user.properties[query[qKey].split('.')[1].slice(1)] || {}).value;
            }

            if (qKey.includes('properties.') && model?.properties) {
                propName = qKey.match(/\.([\s\S]*?)\./g)[0];
                propName = propName.slice(1);
                propName = propName.slice(0, -1);

                if (propName && (model.properties[propName] || {}).type == 'boolean') {
                    if (typeof resolvedQuery[qKey] != 'object') {
                        resolvedQuery[qKey] = Boolean(resolvedQuery[qKey]);
                    } else {
                        if (resolvedQuery[qKey].$ne) resolvedQuery[qKey].$ne = Boolean(resolvedQuery[qKey].$ne);
                    }
                }
            }

            if (query[qKey] === '') {
                if (!resolvedQuery.$or) resolvedQuery.$or = [];

                tempQueryPart = {};
                tempQueryPart[qKey] = null;
                resolvedQuery.$or.push(tempQueryPart);

                tempQueryPart = {};
                tempQueryPart[qKey] = '';
                resolvedQuery.$or.push(tempQueryPart);

                delete resolvedQuery[qKey];
            } else if (
                query[qKey] !== null &&
                typeof query[qKey] === 'object' &&
                query[qKey][Object.keys(query[qKey])[0]] === '' &&
                Object.keys(query[qKey])[0] == '$ne'
            ) {
                if (!resolvedQuery.$and) resolvedQuery.$and = [];

                tempQueryPart = {};
                tempQueryPart[qKey] = { $ne: null };
                resolvedQuery.$and.push(tempQueryPart);

                tempQueryPart = {};
                tempQueryPart[qKey] = { $ne: '' };
                resolvedQuery.$and.push(tempQueryPart);

                delete resolvedQuery[qKey];
            }
        }
    });

    return resolvedQuery;
}

async function getOfflineData(query, objFamily, page = 1) {
    let res = null;
    let results = [];
    let objRole = objFamily.slice(0, 1).toLowerCase() + objFamily.slice(1);

    let queryWrapper = { $query: query, $page: page };

    try {
        res = await OBJY[objRole](queryWrapper).get();
    } catch (err) {
        console.log('Error loading offline objects by query: ', err, objRole, queryWrapper);
    }

    if (res?.length > 0) {
        results.push(...res);

        if (res.length == 20) {
            res = await getOfflineData(query, objRole, ++page);
            results.push(...res);
        }
    }

    return results;
}

async function syncOfflineData() {
    let syncTypeMap = {
        add: '_added',
        update: '_updated',
        remove: '_removed',
    };

    console.log('syncOfflineData');

    for (var objFamily of storeFamilies) {
        let res = null;
        let objRole = objFamily.slice(0, -1).toLowerCase();

        for (var syncType of ['add', 'update', 'remove']) {
            let dexieQuery = { _synced: false };
            let synced = true;

            dexieQuery[syncTypeMap[syncType]] = true;

            try {
                res = await db[objFamily].filter((obj) => filterObj(obj, dexieQuery)).toArray();
            } catch (err) {
                console.log(err);
            }

            for (var obj of res) {
                var objId = obj._id;
                var eventlogs = [];
                //delete obj._id;

                try {
                    await OBJY[objRole](obj)[syncType]();
                } catch (err) {
                    console.log(err);
                    synced = false;
                }

                if (synced) {
                    obj._synced = true;

                    try {
                        await db[objFamily].put(obj);
                    } catch (err) {
                        console.log(err);
                    }

                    try {
                        eventlogs = await db.logs
                            //.orderBy(orderBy)
                            .filter((obj) => filterObj(obj, { 'properties.object.properties._id.value': objId }))
                            .toArray();
                    } catch (err) {
                        console.log(err);
                    }

                    for (var eventlog of eventlogs) {
                        eventlog._synced = true;

                        try {
                            await db.logs
                                //.orderBy(orderBy)
                                .put(eventlog);
                        } catch (err) {
                            console.log(err);
                        }
                    }
                }
            }
        }

        if (syncedCb) syncedCb();
    }
}

async function loadOfflineData(success, error) {
    let offlineStorageMap = null;

    if (!mainStorage.offlineStorageMap) return;

    console.log('loadOfflineData: ', mainStorage.offlineStorageMap);

    offlineStorageMap = JSON.parse(mainStorage.offlineStorageMap);

    for (var objFamily of storeFamilies) {
        let objs = [];

        for (var app of Object.keys(offlineStorageMap)) {
            if (!offline) {
                for (var queryObj of offlineStorageMap[app]) {
                    if (!offline) {
                        let query = resolveGenericQuery(JSON.parse(queryObj?.query || '{}'));
                        let res = null;

                        if (query.$regex == '(.*?)') {
                            query.$regex = '';
                        } else if ((query?.$and || [])[0]?.$regex == '(.*?)') {
                            query.$and[0].$regex = '';
                        }

                        query.applications = { $in: [app] };

                        res = await getOfflineData(query, objFamily);

                        if (res?.length > 0) {
                            let resolvedObjs = resolveObjs(res);

                            objs.push(...resolvedObjs);
                        }
                    }
                }
            }
        }

        if (!offline) {
            if (objs?.length > 0) {
                await db[objFamily].bulkPut(objs);
            }
        }
    }

    if (success) success();
}

function resolveObj(obj) {
    let resolvedObj = JSON.parse(JSON.stringify(obj));

    /*
    Object.keys(obj).forEach((propKey) => {
        if (typeof obj[propKey] == 'function') {
            delete resolveObj[propKey];
        }
    });
    */

    return resolvedObj;
}

function resolveObjs(objs) {
    let resolvedObjs = [];

    objs.forEach((obj) => {
        let resolvedObj = resolveObj(obj);

        resolvedObjs.push(resolvedObj);
    });

    return resolvedObjs;
}

function getObjValueByPropKey(obj, propKey) {
    let objValue = JSON.parse(JSON.stringify(obj));
    let propKeyParts = propKey.split('.');
    let propKeyNotFound = false;

    propKeyParts.forEach((propKeyPart) => {
        if (!propKeyNotFound && (objValue[propKeyPart] || objValue[propKeyPart] === false)) {
            objValue = objValue[propKeyPart];
        } else propKeyNotFound = true;
    });

    return objValue;
}

function filterObj(obj, query) {
    let likeFilter = true;

    Object.keys(query).forEach((key) => {
        if (likeFilter) {
            if (key == '$and' || key == '$or') {
                query[key].forEach((subQuery) => {
                    if (likeFilter) {
                        likeFilter = filterObj(obj, subQuery);
                    }
                });
            } else {
                let objValue = getObjValueByPropKey(obj, key);

                if (typeof query[key] == 'object') {
                    if (query[key]?.$regex) {
                        if (!(objValue || '').toLowerCase().includes((query[key].$regex || '')?.toLowerCase())) likeFilter = false;
                    } else if (query[key]?.$gt) {
                        if (!(objValue > query[key]?.$gt)) likeFilter = false;
                    } else if (query[key]?.$gte) {
                        if (!(objValue >= query[key]?.$gte)) likeFilter = false;
                    } else if (query[key]?.$lt) {
                        if (!(objValue < query[key]?.$lt)) likeFilter = false;
                    } else if (query[key]?.$lte) {
                        if (!(objValue <= query[key]?.$lte)) likeFilter = false;
                    } else if (query[key]?.$in) {
                        if (Array.isArray(objValue) && !objValue.includes(query[key]?.$in[0])) likeFilter = false;
                    } else if (query[key]?.$exists) {
                        if (!objValue) likeFilter = false;
                    }
                } else {
                    if (query[key] != objValue) likeFilter = false;
                }
            }
        }
    });

    return likeFilter;
}

async function getById(id, objFamily, app) {
    let res = null;

    if (!storeFamilies.includes(objFamily + 's')) return null;

    try {
        res = await db[objFamily + 's'].get({ _id: id });
    } catch (err) {
        console.log(err);
        return null;
    }

    return res || null;
}

async function getByCriteria(criteria, objFamily, app, flag) {
    let res = null;
    let orderBy = 'created';
    let page = flag?.$page || 1;
    let pageSize = flag?.$pageSize || 20;

    if (!storeFamilies.includes(objFamily + 's')) return [];

    try {
        res = await db[objFamily + 's']
            //.orderBy(orderBy)
            .offset((page - 1) * 20)
            .limit(pageSize)
            .filter((obj) => filterObj(obj, criteria?.$query || criteria))
            .toArray();
    } catch (err) {
        console.log(err);
        return [];
    }

    return res || [];
}

async function count(criteria, objFamily, app, flag) {
    let res = null;
    let orderBy = 'created';

    if (!storeFamilies.includes(objFamily + 's')) return [];

    try {
        res = await db[objFamily + 's']
            //.orderBy(orderBy)
            .filter((obj) => filterObj(obj, criteria?.$query || criteria))
            .count();
    } catch (err) {
        console.log(err);
        return [];
    }

    return res || [];
}

async function update(updatedObj, objFamily, app) {
    let res = null;
    let orgObj = null;
    let log = null;

    try {
        orgObj = await db[objFamily + 's'].get({ _id: updatedObj._id });
    } catch (err) {
        console.log(err);
    }

    if (orgObj) {
        log = createLog(updatedObj, { username: 'local', _id: '123' }, { app, initObj: orgObj, mode: 'update' });

        if (log) {
            try {
                await db.logs.put(resolveObj(log));
            } catch (err) {
                console.error(err);
            }
        }
    }

    updatedObj._synced = false;
    updatedObj._updated = true;

    try {
        res = await db[objFamily + 's'].put(resolveObj(updatedObj));
    } catch (err) {
        console.log(err);
        return null;
    }

    return res || null;
}

async function add(addedObj, objFamily, app) {
    let res = null;
    let log = createLog(addedObj, { username: 'local', _id: '123' }, { app, mode: 'new' });

    if (log) {
        try {
            await db.logs.put(resolveObj(log));
        } catch (err) {
            console.error(err);
        }
    }

    addedObj._synced = false;
    addedObj._added = true;

    try {
        res = await db[objFamily + 's'].put(resolveObj(addedObj));
    } catch (err) {
        console.log(err);
        return null;
    }

    try {
        res = await db[objFamily + 's'].get({ _id: res });
    } catch (err) {
        console.log(err);
        return null;
    }

    return res || null;
}

async function remove(removedObj, objFamily, app) {
    let res = null;
    let log = createLog(removedObj, { username: 'local', _id: '123' }, { app, mode: 'delete' });

    if (log) {
        try {
            await db.logs.put(resolveObj(log));
        } catch (err) {
            console.log(err);
        }
    }

    removedObj._synced = false;
    removedObj._removed = true;

    try {
        res = await db[objFamily + 's'].put(resolveObj(removedObj));
    } catch (err) {
        console.log(err);
        return null;
    }

    return res || null;
}

function isOffline() {
    return offline;
}

export default {
    init,
    isOffline,
    loadOfflineData,
    getById,
    getByCriteria,
    count,
    update,
    add,
    remove,
};

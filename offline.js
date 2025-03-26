const dexie = require('dexie');
const { getObjsByQuery } = require('../script-lib/lib/simpleObjy');

let mainStorage = null;
let offline = false;
let OBJY = null;
let db = null;

function init(_OBJY, objFamilies, opts = {}) {
    let OBJY = _OBJY;
    let stores = {};

    db = new Dexie('FriendDatabase');

    objFamilies.forEach((objFamily) => {
        stores[objFamilies] = '&_id,inherits,type';
    });

    db.version(1).stores(stores);

    if (typeof localStorage === 'undefined' || localStorage === null) {
        var LocalStorage = require('node-localstorage').LocalStorage;
        mainStorage = new LocalStorage('./scratch');
    } else mainStorage = localStorage;

    if (window) {
        window.addEventListener('online', () => {
            offline = false;
        });

        window.addEventListener('offline', () => {
            offline = true;
        });
    }

    loadOfflineData();
}

async function getOfflineData(query, objFamily = 'Objects', page = 1) {
    let res = null;
    let results = [];
    let objRole = objFamily.slice(0, 1).toLowerCase() + objFamily.slice(1);

    let queryWrapper = { $query: query, $page: page };

    try {
        res = await OBJY[objRole](queryWrapper).get();
    } catch (err) {
        console.log('Error loading Objects by query: ', err);
    }

    if (res) {
        results.push(...res);

        if (res.length == 20) {
            res = await getOfflineData(query, objRole, ++page);
            results.push(...res);
        }
    }

    return results;
}

async function loadOfflineData() {
    let offlineStorageMap = null;

    if (!mainStorage.offlineStorageMap) return;

    console.log(mainStorage.offlineStorageMap);

    offlineStorageMap = JSON.parse(mainStorage.offlineStorageMap);

    for (var objFamily of Object.keys(offlineStorageMap)) {
        objs = [];

        for (var query of offlineStorageMap[objFamily]) {
            let res = await getOfflineData(query, objFamily);

            if (res?.length > 0) {
                objs.push(...res);
            }
        }

        if (objs?.length > 0) {
            await db[objFamily].bulkPut(objs);
        }
    }
}

function getById() {
    return {};
}

function getByCriteria() {
    return {};
}

function count() {
    return {};
}

function update() {
    return {};
}

function add() {
    return {};
}

function remove() {
    return {};
}

function isOffline() {
    return offline;
}

module.exports = {
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

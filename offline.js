let mainStorage = null;
let offline = false;
let OBJY = null;
function init(_OBJY) {
    let OBJY = OBJY;

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
}

async function loadOfflineData() {}

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

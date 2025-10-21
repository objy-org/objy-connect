import connect from './lib/connect.js';
import fetch from 'node-fetch';
import { LocalStorage } from 'node-localstorage';
import sessionstorage from 'sessionstorage';

const getMapper = (OBJY, options) => {
    let _fetch = fetch;
    let _localStorage = new LocalStorage('./scratch');
    let _sessionStorage = sessionstorage;

    connect.setup(_fetch, _localStorage, _sessionStorage);

    return connect.ConnectMapper(OBJY, options);
};

export default function(OBJY, options) {
    let mapper = getMapper(OBJY, options);

    return mapper;
};

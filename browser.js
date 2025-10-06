import connect from './lib/connect.js';

const getMapper = (OBJY, options) => {
    let _fetch = fetch;
    let _localStorage = localStorage;
    let _sessionStorage = sessionStorage;

    connect.setup(_fetch, _localStorage, _sessionStorage);

    return connect.ConnectMapper(OBJY, options);
};

export default function (OBJY, options) {
    let mapper = getMapper(OBJY, options);

    if (typeof window !== 'undefined') {
        window.CONNECT = mapper;
    }

    return mapper;
}

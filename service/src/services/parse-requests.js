export function parseCreateUser(req) {
    return req.body ?? {}
}

export function parseLogin(req) {
    return req.body ?? {}
}

export function parseLogout(req) {
    const body = req.body ?? {};
    body.auth = getAuthToken(req);
    return body
}

export function parseEditUser(req) {
    const body = req.body ?? {};
    body.auth = getAuthToken(req);
    return body;
}

export function parseGetUser(req) {
    const body = req.body ?? {};
    body.auth = getAuthToken(req);
    body.userID = req.params.userID;
    return body
}

export function parseValidateUser(req) {
    const body = req.body ?? {};
    body.auth = getAuthToken(req);
    return body;
}

export function parseGetRoom(req) {
    const body = req.body ?? {};
    body.auth = getAuthToken(req);
    body.roomID = req.params.roomID;
    return body
}

export function parseCreateRoom(req) {
    const body = req.body ?? {};
    body.auth = getAuthToken(req);
    return body
}

import { Sort, Filter } from "./room-services.js";
export function parseDiscover(req) {
    const body = req.body ?? {};
    body.auth = getAuthToken(req);
    body.filterType = req.query.filterType ?? Filter.ROOM;
    body.filterVal = req.query.filterVal ?? null;
    body.sortType = req.query.sortType ?? Sort.TIME_STAMP;
    body.page = parseInt(req.query.p ?? "0");
    return body
}

export function parseChatHistory(req) {
    const body = req.body ?? {};
    body.auth = getAuthToken(req);
    body.threadID = req.params.chatThreadID;
    return body
}


function getAuthToken(req) {
    return req.cookies.token;
}
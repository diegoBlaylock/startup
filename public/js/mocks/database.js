export const Table = Object.freeze({
    USER: "user_table",
    TOKEN: "token_table",
    ROOM: "room_table",
    CREDENTIALS: "credentials",
    MESSAGE_THREAD: "message_thread_table",
    MESSAGE: "message"
});

export function getTable(name) {
    const table = JSON.parse(localStorage.getItem(name));
    if (table === null) return [];
    return table;
}

export function safeTable(name, table) {
    localStorage.setItem(name, JSON.stringify(table));
}

export function findByColumn(table, attribute, value) {
    for(obj of table) {
        if(obj[attribute] === value) {
            return obj;
        }
    }

    return null;
}
import {Search, GetUserRequest} from "./request.js";

export async function login(credentials) {

    const response = await fetch(
        '/users/login/', 
        addBody(credentials, {method: "POST"})
    );

    const json = await response.json();
    
    if(response.status != 201) handleError(json, response); 

    const user = await getUser(new GetUserRequest(json.userID));
    return user;
}

export async function getUser(request) {
    const userID = request.userID;
    const response = await fetch(
        '/users/'+userID+'/', 
        {method: "GET"}
    );

    const json = await response.json();
    if(response.status !== 200) return undefined;
    else return json;
}

export async function validateToken() {
    const response = await fetch(
        '/token/validate/', 
        {}
    );
    
    const authToken = await response.json();

    if (response.status != 200) {
        throw authToken;
    }
    return authToken;
}

export async function createUser(userDetails) {
    const response = await fetch(
        '/users/create/', 
        addBody(userDetails, {method: "POST"})
    );

    const json = await response.json();
    
    if(response.status != 201) handleError(json, response); 

    const user = await getUser(new GetUserRequest(json.userID));
    return user;
}

export async function logout() {
    const response = await fetch(
        '/users/logout/', 
        {method: "DELETE"}
    );
    
    if(response.status != 204) {
        const json = await response.json();
        handleError(json, response); 
    }
}

export async function editUserPicture(url) {
    const response = await fetch(
        '/users/edit/', 
        addBody({profile: url}, {method: "PATCH"})
    );

    const json = await response.json();
    
    if(response.status != 200) {
        handleError(json, response); 
    }
    
    return json;
}

export async function editUserBio(bio) {
    const response = await fetch(
        '/users/edit/', 
        addBody({description: bio}, {method: "PATCH"})
    );

    const json = await response.json();
    
    if(response.status != 200) {
        handleError(json, response); 
    }
    
    return json;
}

export async function getRoomStats(roomID) {
    const response = await fetch(
        '/rooms/'+roomID+'/', 
        {method: "GET"}
    );
    
    const json = await response.json();
    if(response.status !== 200) return undefined;
    else return json;
}

const PAGE_SIZE = 9
export async function discoverRooms(room_request) {
    let query = [];
    if(room_request.filterVal) {
        const filterType = room_request.filterType ?? Search.USER;
        query.push(`filterType=${encodeURIComponent(filterType)}`);
        query.push(`filterVal=${encodeURIComponent(room_request.filterVal)}`);
    }

    if(room_request.sortType) {
        query.push(`sortType=${encodeURIComponent(room_request.sortType)}`);
    }

    if (room_request.page) {
        query.push(`p=${encodeURIComponent(room_request.page)}`);
    }

    const url = "/rooms/discover/?" + query.join('&'); 
    const response = await fetch(url);
    const json = await response.json();

    if(response.status != 200) {
        handleError(json, response); 
    }

    return json;
}

export async function createRoom(createRoomRequest) {

    const response = await fetch(
        '/rooms/create/', 
        addBody(createRoomRequest, {method: "POST"})
    );

    const json = await response.json();
    
    if(response.status != 201) handleError(json, response); 

    return json; 
}

export async function getChatHistory(roomID) {
    const response = await fetch(
        '/chat/'+roomID +'/', 
        {method: "GET"}
    );

    const json = await response.json();
    
    if(response.status != 200) handleError(json, response); 
    return json;
}

export function openWebsocket() {
    const protocol = window.location.protocol === 'http:' ? 'ws' : 'wss';
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);
    return socket
}

function addBody(body, options) {
    if (options == null) options = {}
    options['body'] = JSON.stringify(body);
    if(options.headers == null)
        options.headers = {} 
    options.headers["Content-Type"] = "application/json";
    return options;
}

function handleError(err, res) {
    if(err.redirect != null) {
        window.location.replace(err.redirect);
        throw {message: err.message}
    }
    
    const error = {
        status: res.status,
        response: res,
        message: err.error
    };
    console.log(error);
    throw error;
}
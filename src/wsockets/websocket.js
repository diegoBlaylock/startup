
/*
  Chat Methods

  Client -> Server

    Auth?
    Write Message

  server -> Client

    Notification
    Message
    
*/

import { WebSocketServer } from 'ws';
import { checkToken, findToken } from '../services/service-utils';
import { addWS, connectWSToRoom, removeWS } from './socket-pool';

const wss = new WebSocketServer({ noServer: true });

const EventType = Object.freeze({ 
  JOIN_ROOM: "join_room",
  NOTE: "note",
  MESSAGE: "message"
});

export function setupWebsockets(server) {
  
  server.on('upgrade', async (request, socket, head) => {
    const token = request.headers.token;
    await checkToken(token);
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  });
}

wss.on("connection", async (ws, request)=>{
  const token = await findToken(request.headers.token);
  
  const connection = {
    token: token,
    alive: true,
    ws: ws,
    room: null
  }
  
  addWS(connection);

  ws.on('message', (data) => onMessage(connection, data));
  ws.on('close', () => onClose(connection));
  ws.on('pong', () => onPong(connection));

});

function onMessage(connection, message) {
  
  function onJoinRoomEvent(data) {
    connectWSToRoom(connection._id, data.roomID);
  }
  
  function onNoteEvent(data) {

  }

  function onChatEvent(data) {
    
  }

  const json = JSON.parse(message);
  switch(json.type) {
    case EventType.JOIN_ROOM:
      onJoinRoomEvent(json);
      break;
    case EventType.MESSAGE:
      onChatEvent(json);
      break;
    case EventType.NOTE:
      onNoteEvent(json);
      break;
  }
}

function onClose(connection) {
  removeWS(connection._id);
}

function onPong(connection) {
  connection.alive = true;
}

setInterval(() => {
  connections.forEach((c) => {
    if (!c.alive) {
      c.ws.terminate();
    } else {
      c.alive = false;
      c.ws.ping();
    }
  });
}, 10000);
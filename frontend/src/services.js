const API_URL = "http://localhost:8000/api";
const WS_URL = "ws://localhost:8000/ws";

export const createRoom = async (userId) => {
    const response = await fetch(`${API_URL}/create-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
    });
    return response.json();
};

export const joinRoom = async (roomId, userId) => {
    const response = await fetch(`${API_URL}/join-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, user_id: userId })
    });
    return response.json();
};

export class GameSocket {
    constructor(roomId, userId, onMessage) {
        this.socket = new WebSocket(`${WS_URL}/${roomId}/${userId}`);
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onMessage(data);
        };
    }

    send(type, payload = {}) {
        console.log(`[WS SEND] ${type}`, payload);
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, ...payload }));
        } else {
            console.error(`[WS SEND] FAILED - Socket not open. State: ${this.socket.readyState}`);
        }
    }

    close() {
        this.socket.close();
    }
}

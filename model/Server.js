module.exports = class Server {
    constructor(name) {
        this.name = name;
        this.users = [];
        this.streamOptions = { seek: 0, volume: 1 };
        this.queue = [];
    }

    setConnectedRoom(room) {
        this.room = room.name;
    }

    leaveRoom() {
        delete this.room;
    }

    isConnectedToRoom() {
        return this.room !== undefined;
    }
}
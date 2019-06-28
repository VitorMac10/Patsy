module.exports = class Room {
    constructor(name, max_connections) {
        this.name = name;
        this.max_connections = max_connections;
        this.connections = [];
    }

    addGuild(guildId) {
        if (!this.isFull()) {
            this.connections.push(guildId);
        } else {
            return false;
        }
        return true;
    }

    getConnectedGuilds() {
        return this.connections.length;
    }

    containsGuild(id) {
        return this.connections.includes(id);
    }

    removeServer(server, id) {
        server.leaveRoom();
        this.connections.splice(this.connections.indexOf(id), 1);
    }

    isFull() {
        return this.connections.length >= this.max_connections;
    }
}
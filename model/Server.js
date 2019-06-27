module.exports = class Server {
    constructor(name) {
        this.name = name;
        this.users = [];
        this.streamOptions = { seek: 0, volume: 1 };
        this.queue = [];
    }
}
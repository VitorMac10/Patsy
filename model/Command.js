module.exports = class Command {
    constructor(desc, executor) {
        this.desc = desc;
        this.executor = executor;
    }
};
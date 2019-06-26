const BasicTrack = require('./BasicTrack.js');

module.exports = class SoundCloudTrack extends BasicTrack {
    constructor(title, author, artwork_url, stream_url) {
        super(title, author, artwork_url);
        this.stream_url = stream_url;
    }
}
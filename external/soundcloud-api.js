const SoundCloudTrack = require('../model/SoundCloudTrack.js');
const request = require('requestretry').defaults({ maxAttempts: 2147483647, retryDelay: 1000, timeout: 8000 });

module.exports = class SoundCloud {
	constructor(api_key) {
		this.api_url = 'https://api.soundcloud.com'
		this.api_key = api_key;
	}

	async getTrack(song_url) {
		const res = await request.get({
			url: `${this.api_url}/resolve.json`,
			qs: {
				client_id: this.api_key,
				url: song_url
			},
			json: true,
			strictSSL: false
		});
		return new SoundCloudTrack(res.body.title, res.body.user.username, res.body.artwork_url, `${res.body.stream_url}?client_id=${this.api_key}`);
		//return new SoundCloudSong(res.body.id, res.body.title, res.body.user.username, res.body.permalink_url, (res.body.artwork_url != 'null' ? res.body.artwork_url : res.body.user.avatar_url), res.body.stream_url + "?client_id=" + this.CLIENT_ID);
	}

	async searchTrack(query) {
		const res = await request.get({
			url: `${this.api_url}/tracks/`,
			qs: {
				client_id: this.api_key,
				q: encodeURIComponent(query)
			},
			json: true,
			strictSSL: false
		});
		var tracks = [];
		if (res.body.length) {
			res.body.forEach(e => {
				tracks.push(new SoundCloudTrack(e.title, e.user.username, e.artwork_url, `${e.stream_url}?client_id=${this.api_key}`));
			});
			return { result: tracks };
		} else {
			return { result: 'No results found for this query' };
		}
	}

}



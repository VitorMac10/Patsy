const { ReadableStreamBuffer } = require('stream-buffers');
const buffer_options = { frequency: 10, chunkSize: 2048 };

module.exports = {
    createReadableStream: async function (data) {
        var stream = new ReadableStreamBuffer(buffer_options);
        stream.put(data);
        return await stream;
    }
}

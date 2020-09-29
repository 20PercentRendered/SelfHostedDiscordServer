//why to zlib's you may ask? Well, I can't seem to get zlib to behave nicely with chunk sizes and sync flushes.
const pako = require("pako");
const zlib = require('zlib');

const erlpack = require("erlpack");

class Connection {
    constructor (args, connection) {
        this.encoder = new Encoder();
        if (args.encoding == "etf") {
            this.encoder.AddStep(erlpack,"pack")
            this.encoder.AddBStep(erlpack,"unpack");
        }
        if (args.compression == "zlib-stream" || args.JsonCompress) {
            this.encoder.AddStep(new ZlibStep(
                new pako.Deflate({
                    level: -1,
                    method: 8,
                    chunkSize: 16384,
                    windowBits: 15,
                    memLevel: 8,
                    strategy: 0,
                })
            ),"Deflate");
        }
        this.encoder.AddBStep(new ZlibBStep());
        this.wsConnection = connection;
    }
    sendMessage(message) {
        this.WsConnection.sendBytes(this.encoder.Encode(message));
    }
    decodeMessage(message) {
        return this.encoder.Decode(message);
    }
}
class ZlibStep {
    constructor(deflate) {
        this._deflate = deflate;
    }
    Deflate(data) {
        this._deflate.push(data, zlib.Z_SYNC_FLUSH);
        return Buffer.from(this._deflate.result);
    }
}
class ZlibBStep {
    constructor() {
        
    }
    Inflate(data) {
        return zlib.inflateSync(data);
    }
}

//called encoder because that's 90% of what it does
class Encoder {
    constructor () {
        this.steps = [];
        this.bsteps = [];
    }
    AddStep(step, forward) {
        this.steps.push(step[forward]);
    }
    AddBStep(step, backward) {
        this.bsteps.push(step[backward]);
    }
    Encode(data) {
        var finished = data;
        for (i in steps) {
            var step = steps[i];
            finished = step(finished);
        }
        return finished;
    }
    Decode(data) {
        var finished = data;
        for (i in bsteps.reverse()) {
            var step = bsteps[i];
            finished = step(finished);
        }
        return finished;
    }
}
module.exports = Connection;
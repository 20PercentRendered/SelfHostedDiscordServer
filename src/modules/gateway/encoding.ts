import pako from "pako";
import zlib from "zlib";
import lz4 from "lz4";
import erlpack from "erlpack";
export interface IEncoder {
	encode(data: any): any;
	decode(data: any): Object;
}

export class PassthroughEncoder implements IEncoder {
	encode(data: any) {
		return data;
	}
	decode(data: any): Object {
		return data;
	}
}
export class ErlangEncoder implements IEncoder {
	encode(data: any) {
		return erlpack.pack(data);
	}
	decode(data: any): Object {
		return erlpack.unpack(data);
	}
}
export class ZlibCompressor implements IEncoder {
	deflate: pako.Deflate;
	inflate: pako.Inflate;
	encode(data: any): Buffer {
		this.deflate.push(data, 2 ); // 2 = ZLIB_SYNC_FLUSH
		return Buffer.from(this.deflate.result);
	}
	decode(data: any): pako.Data {
		this.inflate.push(data);
		return this.inflate.result;
	}
	constructor() {
		this.deflate = new pako.Deflate({
			level: -1,
			chunkSize: 16384,
			windowBits: 15,
			memLevel: 8,
			strategy: 0,
		});
		this.inflate = new pako.Inflate();
	}
}
export class LZ4Compressor implements IEncoder {
	encode(data: any) {
		return lz4.encode(data);
	}
	decode(data: any): Object {
		return lz4.decode(data);
	}
}
export function getSuitableEncoder(encoding: string): IEncoder {
	switch (encoding) {
		case "etf":
			return new ErlangEncoder();
		case "json":
			return new PassthroughEncoder();
		default: 
			return new PassthroughEncoder();
	}
}
export function getSuitableCompressor(compression: string): IEncoder {
	switch (compression) {
		case "zlib-stream":
			return new ZlibCompressor();
		case "lz4-stream":
			return new LZ4Compressor();
		default: 
			return new ZlibCompressor();
	}
}

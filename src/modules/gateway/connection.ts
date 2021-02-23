import { Logger } from "@main/logger";
import ws from "ws";
import http from "http";
import url from "url";
import {
	getSuitableCompressor,
	getSuitableEncoder,
	IEncoder,
} from "./encoding";

var erlpack = require("erlpack");
var zlib = require("zlib");
var pako = require("pako");

export class Connection {
	public encoder: IEncoder;
	public compressor: IEncoder;
	public hasToken: boolean;
	public WsConnection: ws;
	public ip: string;
	private logger: Logger;
	constructor(wsconn: ws, incomingmessage: http.IncomingMessage) {
		var args = url.parse(incomingmessage.url);
		this.hasToken = false;
		this.encoder = getSuitableEncoder(args.query["encoding"]);
		this.compressor = getSuitableCompressor(args.query);
		this.logger = new Logger(
			"GWClient (" + incomingmessage.socket.remoteAddress + ")"
		);
		this.WsConnection = wsconn;
		this.ip = incomingmessage.connection.remoteAddress;
	}
	sendMessage(message) {
		this.logger.debug("Sending opcode " + message.op);
		this.WsConnection.send(this.encodeMessage(message), (err) => {
			if (err) {
				// It might cause performance problems to log all requests, as well as taking up a lot of disk space.
				this.logger.debugerror(err.stack);
			}
		});
	}
	encodeMessage(message): Buffer {
		return this.compressor.encode(this.encoder.encode(message));
	}
	decodeMessage(message, useZlib): any {
		if (useZlib) {
			return this.encoder.decode(this.compressor.decode(message));
		} else {
			return this.encoder.decode(message);
		}
	}
	onIdentify(message) {
		//this.token = message.token;
	}
}

import { Logger } from "@main/logger";
import ws from "ws";
import http from "http";
import url from "url";
import querystring from "querystring";
import { Session } from "@main/classes/Session"
import { ServerData } from "@main/serverdata"
import SessionModule from "@main/modules/sessions/main"
import {
	ErlangEncoder,
	getSuitableCompressor,
	getSuitableEncoder,
	IEncoder,
} from "./encoding";
import StorageModule from "../storage/main";
import { Heartbeater } from "@main/utils/heartbeater";

export class Connection {
	public encoder: IEncoder;
	public compressor: IEncoder;
	public session: Session;
	public WsConnection: ws;
	public ip: string;
	private logger: Logger;
	constructor(wsconn: ws, incomingmessage: http.IncomingMessage) {
		try {
			this.logger = new Logger(
				`GWClient (${incomingmessage.socket.remoteAddress})`
			);
			var args = querystring.parse(url.parse(incomingmessage.url).query);
			this.logger.debug("encoding "+args["encoding"].toString())
			this.logger.debug("compress "+args["compress"].toString())
			if (args["encoding"]) {

			} else {
				this.logger.debugerror("No encoding specified.");
				// set encoding if not defined
				args["encoding"] = "";
			}

			if (args["compress"]) {
				
			} else {
				this.logger.debugerror("No compression specified.");
				// set compression if not defined
				args["compress"] = "";
			}

			this.encoder = getSuitableEncoder(args["encoding"].toString());
			this.compressor = getSuitableCompressor(args["compress"].toString());
			this.WsConnection = wsconn;
			this.ip = incomingmessage.connection.remoteAddress;
		} catch (e) {
			this.logger.debugerror("Error occurred while initializing a new connection.");
			this.logger.debugerror(e);
		}
	}
	/**
	 * @param message A message as a Message object.
	 * @description Sends a message, encodes and compresses it.
	 */
	sendMessage(message: Message) {
		this.logger.debug("Sending opcode " + message.op);
		this.WsConnection.send(this.encodeMessage(message.ToObject()), (err) => {
			if (err) {
				// It might cause performance problems to log all requests, as well as taking up a lot of disk space.
				this.logger.debugerror(err.stack);
			}
		});
	}
	encodeMessage(message): Buffer {
		if (this.encoder instanceof ErlangEncoder) {
			return this.compressor.encode(this.encoder.encode(message));
		} else {
			return this.compressor.encode(this.encoder.encode(JSON.stringify(message)));
		}
	}
	decodeMessage(message): Message {
		// yes, it's terrible
		try {
			return Message.FromObject(JSON.parse(message));
		} catch (e) {
			try {
				return Message.FromObject(this.encoder.decode(this.compressor.decode(message)));
			} catch (e) {
				this.logger.debugerror(e);
				try {
					return Message.FromObject(this.encoder.decode(message));
				} catch (e2) {
					this.logger.debugerror(e2);
					return null;
				}
			}
		}
	}
	onIdentify(message) {
		this.session = ServerData.getInstance().modules.getModule<SessionModule>("sessions").sessions.getOrCreate(message.token);
		this.session.user = ServerData.getInstance().modules.getModule<StorageModule>("storage").userDatabase.database.find((value)=>{
			if (message.token.includes(value.tokenFirstPart)) {
				return value;
			}
 		})
		this.session.gatewayConnection = this;
	}
}
export enum MessageType {
	event,
	heartbeat,
	identify,
	presence,
	voice_state,
	reserved,
	resume,
	reconnect,
	guild_member_request,
	invalid_session,
	hello,
	heartbeat_ack,
}
export class Message {
	op: MessageType;
	eventName?: string;
	sequence?: number;
	data: any;
	constructor(op: MessageType, data: any, sequence?: number, event?: string) {
		this.op = op
		this.data = data
		this.sequence = sequence
		this.eventName = event;
	}
	static FromObject(obj) {
		return new Message(obj.op, obj.d, obj.s,obj.t);
	}
	ToObject(): any {
		return {
			op: this.op, 
			d: this.data, 
			s: this.sequence, 
			t: this.eventName
		}
	}
	static CheckValidity(message) {
		var successfulChecks = 0;
		if (message.d != undefined) {
			successfulChecks++;
		}
		if (message.op != undefined) {
			successfulChecks++;
		}
		if (message.t != undefined) {
			successfulChecks++;
		}
		if (message.s != undefined) {
			successfulChecks++;
		}
		if (successfulChecks >= 0) {
			return true;
		} else {
			return false;
		}
	}
}

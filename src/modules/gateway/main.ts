import { ServerData } from "@main/serverdata";
import RestModule from "@main/modules/rest/main";
import { BaseModule } from "@main/classes/modules/BaseModule";
import ws from "ws";
import { Connection } from "./connection";
import { Logger } from "@main/logger";
export default class GatewayModule implements BaseModule {
	public readonly name?: string = "Gateway Module";
	public readonly intName: string = "gateway";
	public readonly version?: number = 1;
	public readonly dependencies = new Array<string>("rest", "sessions");
	public wss: ws.Server;
	private logger: Logger;
	init(next: () => void) {
		this.logger = new Logger("Gateway");
		this.wss = new ws.Server({
			server: ServerData.getInstance().modules.getModule<RestModule>("rest")
				.httpsServer,
			perMessageDeflate: false, // disabling permessagedeflate as we handle compression ourselves
			path: "/gateway"
		});
		this.wss.on("connection", (ws, request) => {
			var conn = new Connection(ws, request);
			ws.on("message", (message: any) => {
				console.log(message);
				if (!Message.checkIsValid(message)) {
					this.logger.debugerror(
						"Message from client: " + conn.ip + " is invalid."
					);
				} else {
					console.log("received: %s", message);
					message = conn.decodeMessage(message, false);
					switch (message.op) {

					}
				}

			});
		});
		next();
	}
	stop(next: () => void) {
		this.wss.clients.forEach((client) => {
			client.close();
		});
		next();
	}
}
enum MessageType {
	event,
	heartbeat,
	identify,
	presence,
	voice_state,
	resume,
	reconnect,
	guild_member_request,
	invalid_session,
	hello,
	heartbeat_ack,
}
class Message {
	op: MessageType;
	eventName: string;
	sequence: number;
	data: any;
	constructor(obj) {
		this.op = obj.op;
		this.sequence = obj.s;
		this.eventName = obj.t;
		this.data = obj.d;
	}
	static checkIsValid(message) {
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
class ReadyPayload {}

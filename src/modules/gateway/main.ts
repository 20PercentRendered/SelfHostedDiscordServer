import { ServerData } from "@main/serverdata";
import RestModule from "@main/modules/rest/main";
import { BaseModule } from "@main/classes/modules/BaseModule";
import ws from "ws";
import { Connection, Message, MessageType } from "./connection";
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
			path: '/gateway/'
		});
		this.wss.on("connection", (ws, request) => {
			var conn = new Connection(ws, request);
			this.logger.debug("Client "+ conn.ip+ " connected.");
			conn.sendMessage(Message.FromObject({
				op: MessageType.hello,
				d: {
					heartbeat_interval:10000
				}
			}));
			ws.on("message", (message: any) => {
				this.logger.debug("m1:"+message);
				message = conn.decodeMessage(message);
				this.logger.debug("m2:"+message);

				if (!Message.CheckValidity(message)) {
					this.logger.debugerror(
						"Message from client: " + conn.ip + " is invalid."
					);
				} else {
					console.log("received: %s", message);
					switch (message.op) {
						case MessageType.heartbeat: 
							conn.sendMessage(new Message(MessageType.heartbeat_ack, {}));
						break;
						case MessageType.identify:
							conn.onIdentify(message.data)
						break;
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

class ReadyPayload {}

import { ServerData } from "@main/serverdata";
import RestModule from "@main/modules/rest/main";
import { BaseModule } from "@main/classes/modules/BaseModule";
import ws from "ws";
import { Connection, Message, MessageType } from "./connection";
import { Logger } from "@main/logger";
import { NitroType, Tutorial, User, UserSettings } from "@main/classes/User";
import StorageModule, { Database } from "../storage/main";
import SessionModule from "../sessions/main";
import SSLModule from "../ssl/main";
import { Guild, GuildMember, JoinedGuild, UnavailableGuild } from "@main/classes/Guild";
import { VoiceServerUpdatePayload, VoiceState } from "@main/classes/Voice";
import { Heartbeater } from "@main/utils/heartbeater";
export default class GatewayModule implements BaseModule {
	public readonly name?: string = "Gateway Module";
	public readonly intName: string = "gateway";
	public readonly version?: number = 1;
	public readonly dependencies = new Array<string>("sessions", "storage", "voice");
	public wss: ws.Server;
	private logger: Logger;
	private guilddb: Database<Guild>;
	init(next: () => void) {
		this.logger = new Logger("Gateway");
		this.guilddb = ServerData.getInstance().modules.getModule<StorageModule>("storage").guildDatabase;
		this.wss = new ws.Server({
			noServer: true,
			perMessageDeflate: false, // disabling permessagedeflate as we handle compression ourselves
		});
		this.wss.on("connection", (ws, req) => {
			var conn = new Connection(ws, req);
			var heartbeater = new Heartbeater(30000,5000)
			this.logger.debug("Client "+ conn.ip+ " connected.");
			conn.sendMessage(Message.FromObject({
				op: MessageType.hello,
				d: {
					heartbeat_interval:30000
				}
			}));
			heartbeater.on("timeout",()=>{
				this.logger.debug("timed out")
				conn.WsConnection.close(4009)
			})
			heartbeater.on("send",()=>{
				conn.sendMessage(new Message(MessageType.heartbeat_ack, {}));
				this.logger.debug("sent hb")
				heartbeater.sent();
			})
			ws.on("message", (message: any) => {
				this.logger.debug("m1:"+message);
				message = conn.decodeMessage(message);

				if (!Message.CheckValidity(message)) {
					this.logger.debugerror(
						"Message from client: " + conn.ip + " is invalid."
					);
				} else {
					this.logger.debug("received: "+JSON.stringify(message));
					switch (message.op) {
						case MessageType.heartbeat: 
							this.logger.debug("receved hb")
							heartbeater.received();
							break;
						case MessageType.voice_state:
							var voiceState = new VoiceState(
								new GuildMember(conn.session.user.safe), 
								message.data.guild_id, 
								message.data.channel_id);
							voiceState.self_deaf = message.data.self_deaf;
							voiceState.self_video = message.data.self_video;
							voiceState.self_mute = message.data.self_mute;
							voiceState.session_id = conn.session.sessionId
							conn.sendMessage(new Message(MessageType.event, voiceState, null, "VOICE_STATE_UPDATE"))
							conn.sendMessage(new Message(MessageType.event, 
								new VoiceServerUpdatePayload(
									conn.session.token, `${req.headers.host}/voice`, 
									message.data.guild_id), 
								null, "VOICE_SERVER_UPDATE"))
							break;
						case MessageType.identify:
							try {
							conn.onIdentify(message.data)
							if (!conn.session.user)  {
								conn.sendMessage(new Message(MessageType.event, {
									v: 8,
									user_settings: new UserSettings(),
									user_guild_settings: {
										entries: []
									},
									user: {
										bot: true // will make discord's official client logout
									},
									tutorial: new Tutorial(),
									users: [],
									session_id: "",
									required_action: "LOGOUT",
									relationships: [],
									read_state: {
										entries: []
									},
									private_channels: [],
									presences: [],
									notes: {},
									guilds: [],
									guild_join_requests: [],
									guild_experiments: [],
									geo_ordered_rtc_regions: [],
									friend_suggestion_count: 0,
									experiments: [],
									country_code: "",
									consents: {
										personalization: {
											consented: false
										}
									},
									connected_accounts: [],
									analytics_token: ""
								}, null, "READY"))
							} else {
								conn.session.sessionId = SSLModule.generateSecureRandom(20);
								conn.sendMessage(new Message(MessageType.event, {
									v: 8,
									user_settings: conn.session.user.settings,
									user_guild_settings: {
										entries: []
									},
									user: conn.session.user.unsafe,
									tutorial: conn.session.user.tutorial,
									users: [],
									session_id: conn.session.sessionId,
									required_action: "",
									relationships: [],
									read_state: {
										entries: []
									},
									private_channels: [],
									presences: [],
									notes: {},
									guilds: (() => {
										var guilds = [];
										conn.session.user.guilds.forEach(uGuild => {
											guilds.push(this.guilddb.database.find((value)=>{
												if (value.id == uGuild.id) {
													return value;
												}
											}))
										});
										return guilds;
									})(),
									guild_join_requests: [],
									guild_experiments: [],
									geo_ordered_rtc_regions: ["internal"],
									friend_suggestion_count: 0,
									experiments: [],
									country_code: "FI",
									consents: {
										personalization: {
											consented: false
										}
									},
									connected_accounts: [],
									analytics_token: SSLModule.generateSecureRandom(20)
								}, null, "READY"))
							}	
							break;
							} catch (e) {
								console.error(e)
							}
							
					}
				}

			});
		});
		next();
	}
	stop(next: () => void) {
		this.wss.clients.forEach((client) => {
			client.close();
			setTimeout(()=>{
				client.terminate();
			}, 1000)
		});
		next();
	}
}
import { BaseModule } from "@main/classes/modules/BaseModule";
import { Logger } from "@main/logger";
import ws from "ws";
import { createWorker, getSupportedRtpCapabilities } from 'mediasoup';
import { Router, Worker } from "mediasoup/lib/types";
import * as sdpTransform from 'sdp-transform';
import SSLModule from "../ssl/main";
import Turn from 'node-turn';
import { VoiceConnection } from "./VoiceConnection";
import { ServerData } from "@main/serverdata";
export default class InternalVoiceModule implements BaseModule {
    public readonly name?: string = "Internal Voice Module";
    public readonly intName: string = "voice";
    public readonly version?: number = 1;
    public readonly dependencies = new Array<string>("core");
    public wss: ws.Server;
    public worker: Worker;
	private logger: Logger;
    public router: Router;
    public roomList = new Map()
    public connections: VoiceConnection[];
    public turnserver: any;
    async init(next: () => void) {
        this.logger = new Logger("Voice Gateway");
		this.wss = new ws.Server({
			noServer: true
        });
        this.turnserver = new Turn({
            // set options
            authMech: 'none'
        });
        this.turnserver.start();
        this.connections = new Array<VoiceConnection>();
        this.worker = await createWorker({logLevel: "debug", logTags: [
            "rtcp",
            "message",
            "rtp",
            "ice",
            "dtls",
            "info",
            "rtx",
            "sctp"
        ]});
        this.router = await this.worker.createRouter({
            mediaCodecs :
			[
				{
					kind      : 'audio',
					mimeType  : 'audio/opus',
					clockRate : 48000,
                    channels  : 2
				},
				{
					kind       : 'video',
					mimeType   : 'video/VP8',
					clockRate  : 90000,
					parameters :
					{
						'x-google-start-bitrate' : 1000
					}
				},
				{
					kind       : 'video',
					mimeType   : 'video/VP9',
					clockRate  : 90000,
					parameters :
					{
						'profile-id'             : 2,
						'x-google-start-bitrate' : 1000
					}
				},
				{
					kind       : 'video',
					mimeType   : 'video/h264',
					clockRate  : 90000,
					parameters :
					{
						'packetization-mode'      : 1,
						'profile-level-id'        : '4d0032',
						'level-asymmetry-allowed' : 1,
						'x-google-start-bitrate'  : 1000
					}
				},
				{
					kind       : 'video',
					mimeType   : 'video/h264',
					clockRate  : 90000,
					parameters :
					{
						'packetization-mode'      : 1,
						'profile-level-id'        : '42e01f',
						'level-asymmetry-allowed' : 1,
						'x-google-start-bitrate'  : 1000
					}
				}
			]
        });
		this.wss.on("connection", async (ws, req) => {
            var conn = await VoiceConnection.create(this.router);
            this.connections.push(conn);
            setInterval(()=>{
                console.log(this.connections.map((value)=>{
                    return value.params.id;
                }))
            },5000)
            ws.send(this.encodeMessage({op:8,d:{v:5,heartbeat_interval:999999999}}));
            ws.on("message", async (message: any) => {
                message = JSON.parse(message);
                console.log("voice received: %s", JSON.stringify(message));
                switch (message.op) {
                    case RTCMessageType.heartbeat:
                        ws.send(this.encodeMessage({op: RTCMessageType.heartbeat_ack, d: message.d}));
                        break;
                    case RTCMessageType.protocol:
                        var clientSdp = sdpTransform.parse(message.d.sdp)
                        console.log(message.d)
                        var fingerprint = {
                            type: conn.params.dtlsParameters.fingerprints[0].algorithm,
                            hash: conn.params.dtlsParameters.fingerprints[0].value
                        };
                        console.log(clientSdp)
                        conn.sdp = {
                            fingerprint: fingerprint,
                            media: [{ 
                                fmtp: [],
                                port: 50002,
                                payloads: '111',
                                type: 'audio',
                                protocol: 'RTP/SAVPF',
                                rtp: [
                                    { payload: 111, codec: 'opus', rate: 48000, encoding: 2 }
                                ],
                                rtcp: { port: 50003 },
                                candidates: conn.params.iceCandidates.map((value)=>{
                                    var candidate = {
                                        foundation: value.foundation,
                                        component: 1,
                                        transport: value.protocol,
                                        priority: value.priority,
                                        ip: value.ip,
                                        port: value.port,
                                        type: value.type
                                    };
                                    return candidate;
                                }),
                                fingerprint: fingerprint,
                                mid: conn.params.id,
                                connection: { version: 4, ip: (()=>{
                                    var ip = req.headers.host;
                                    if (req.headers.host.includes(":")) {
                                        ip = req.headers.host.split(":")[0];
                                    }
                                    return ip;
                                })()},
                                iceUfrag: conn.params.iceParameters.usernameFragment,
                                icePwd: conn.params.iceParameters.password,
                            }]
                        }
                        ws.send(this.encodeMessage({
                            op: 4,
                            d: {
                                video_codec: "VP8",
                                audio_codec: "opus",
                                sdp: sdpTransform.write(conn.sdp)
                            }
                        }))
                        try {
                            await conn.connectTransport(conn.transport.id, {
                                role: "server",
                                fingerprints: [
                                {
                                    algorithm: conn.sdp.fingerprint.type,
                                    value: conn.sdp.fingerprint.hash
                                }]
                            })
                            await conn.createProducer(conn.transport.id, {
                                    mid: "1",
                                    codecs: [
                                        {
                                            mimeType: 'audio/opus',
                                            clockRate: 48000,
                                            channels: 2,
                                            parameters: {},
                                            payloadType: conn.sdp.media[0].rtp[0].payload
                                        }
                                    ]
                                }, "audio");
                            conn.producers.forEach(async (value)=>{
                                await conn.createConsumer(conn.transport.id, value.id, {
                                    codecs: [
                                        {
                                            mimeType: 'audio/opus',
                                            kind: "audio",
                                            clockRate: 48000,
                                            channels: 2,
                                            parameters: {}
                                        }
                                    ]
                                })
                            })
                        } catch (e) {
                            console.error(e);
                        }
                        break;
                    case RTCMessageType.identify: 
                        SSLModule.generateRandomNumbers(6).then((value)=>{
                            ws.send(this.encodeMessage({
                                op: 2,
                                d: {
                                    ssrc: value,
                                    port: 50001,
                                    modes: [
                                        "aead_aes256_gcm",
                                        "xsalsa20_poly1305_lite",
                                        "xsalsa20_poly1305_suffix",
                                        "xsalsa20_poly1305"
                                    ],
                                    ip: ServerData.getInstance().publicIp,
                                    experiments: null
                                }
                            }
                        ));
                    })
                    break;
                }
            });    
		});
        next();
    }
    encodeMessage(msg: any): any {
        return JSON.stringify(msg);
    }
    stop(next: () => void) {
        this.wss.close();
        this.router.close();
        this.worker.close();
        next();
    }

}

enum RTCMessageType {
    identify,
    protocol,
    ready,
    heartbeat,
    session_description,
    speaking,
    heartbeat_ack,
    resume,
    hello,
    resumed,
    disconnect = 13
}
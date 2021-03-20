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

// i have no idea how this even connects
// i mean, i know nothing about webrtc and yet i have "voice connected"
// but that's only for the browser client
// noone knows how the official client does it
// all i know is they've cloned the chromium webrtc code and done things to it
// because if i delete discord_voice it connects fine
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
    private debugDumpIntervalHandle: NodeJS.Timeout;
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
        var { transport, params } = await InternalVoiceModule.createWebRtcTransport(this.router);
        var rtpTransport = await this.router.createPlainTransport({ 
            listenIp: '192.168.0.106',
            rtcpMux: true,
            enableSctp: true
        });
       
        rtpTransport.on('trace', (trace) => {
            console.log('trace', trace);
        });
        rtpTransport.on('tuple', (tuple) => {
            console.log('tuple', tuple);
        });
        rtpTransport.on('rtcptuple', (rtcptuple) => {
            console.log('rtcptuple', rtcptuple);
        });
        this.debugDumpIntervalHandle = setInterval(()=>{
            this.logger.debug("Connected voice id's:")
            this.logger.debug(this.connections.map((value)=>{
                return value.params.id;
            }))
        },5000)
		this.wss.on("connection", async (ws, req) => {
            var conn = await VoiceConnection.create(this.router,transport,params);
            conn.addTransport(rtpTransport)
            this.connections.push(conn);
            ws.send(this.encodeMessage({op:8,d:{v:5,heartbeat_interval:999999999}}));
            ws.on("message", async (message: any) => {
                message = JSON.parse(message);
                this.logger.debug("voice received: "+JSON.stringify(message));
                switch (message.op) {
                    case RTCMessageType.heartbeat:
                        ws.send(this.encodeMessage({op: RTCMessageType.heartbeat_ack, d: message.d}));
                        break;
                    case RTCMessageType.protocol:
                        var clientSdp = sdpTransform.parse(message.d.sdp)
                        this.logger.debug("protocolMessageD\n"+message.d)
                        var fingerprint = {
                            type: conn.params.dtlsParameters.fingerprints[0].algorithm,
                            hash: conn.params.dtlsParameters.fingerprints[0].value
                        };
                        this.logger.debug("clientSdp\n"+clientSdp)
                        conn.sdp = {
                            fingerprint: fingerprint,
                            media: [{ 
                                fmtp: [],
                                port: 50000,
                                payloads: '111',
                                type: 'audio',
                                protocol: 'RTP/SAVPF',
                                rtp: [
                                    { payload: 111, codec: 'opus', rate: 48000, encoding: 2 }
                                ],
                                rtcp: { port: 50000 },
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
                                    var ip = undefined;
                                    if (req.socket.remoteAddress == "127.0.0.1") {
                                        ip = req.socket.remoteAddress;
                                    }
                                    if (ServerData.getInstance().internalIps.includes(req.socket.remoteAddress)) {
                                        ip = req.socket.remoteAddress;
                                    }
                                    if (ip==undefined) {
                                        ip = ServerData.getInstance().publicIp;
                                    }
                                    return ip;
                                })()},
                                iceUfrag: conn.params.iceParameters.usernameFragment,
                                icePwd: conn.params.iceParameters.password,
                            }]
                        }
                        SSLModule.generateRandomArray(31,3).then(async (value)=>{
                            ws.send(this.encodeMessage({
                                op: 4,
                                d: {
                                    video_codec: "H264",
                                    audio_codec: "opus",
                                    mode: "aead_aes256_gcm",
                                    media_session_id: "0289fe0515f0674af1d125dddb35543a",
                                    secret_key: value,
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
                                this.logger.error(e);
                            }
                        })
                        break;
                    case RTCMessageType.identify: 
                        SSLModule.generateRandomNumbers(6).then((value)=>{
                            ws.send(this.encodeMessage({
                                op: 2,
                                d: {
                                    ssrc: value,
                                    port: (()=>{
                                        return conn.params.iceCandidates[0].port;
                                    })(),
                                    modes: [
                                        "aead_aes256_gcm",
                                        "xsalsa20_poly1305", 
                                        "xsalsa20_poly1305_suffix", 
                                        "xsalsa20_poly1305_lite"
                                    ],
                                    ip: (()=>{
                                        return conn.params.iceCandidates[0].ip;
                                        if (req.socket.remoteAddress == "127.0.0.1") {
                                            return req.socket.remoteAddress;
                                        }
                                        if (req.socket.remoteAddress == "::ffff:127.0.0.1") {
                                            return req.socket.remoteAddress;
                                        }
                                        if (ServerData.getInstance().internalIps.includes(req.socket.remoteAddress)) {
                                            return req.socket.remoteAddress;
                                        }
                                        return ServerData.getInstance().publicIp;
                                    })(), //ServerData.getInstance().publicIp,
                                    experiments: null
                                }
                            }
                        ));
                    })
                    break;
                }
            });    
            ws.on("close", (code,reason)=>{
                this.connections.splice(this.connections.indexOf(conn), 1)
                clearInterval(this.debugDumpIntervalHandle);
            })
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
    static async createWebRtcTransport(router: Router) {
        const transport = await router.createWebRtcTransport({
            listenIps: (()=>{
                var ips = new Array<{ip: string, announcedIp?: string }>();
                //ips.push({ip: "0.0.0.0", announcedIp: ServerData.getInstance().publicIp})
                ips.push({ip: "192.168.0.106"}) // use this if running locally, switch to your own private ipv4
                return ips;
            })(),
            enableUdp: true,
            enableTcp: true,
            enableSctp: true
        });
        return {
          transport,
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters
          },
        };
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
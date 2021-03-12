import { ServerData } from '@main/serverdata';
import { Consumer, DtlsParameters, IceCandidate, IceParameters, MediaKind, Producer, Router, RtpCapabilities, RtpParameters, WebRtcTransport } from 'mediasoup/lib/types';
import { stringify } from 'querystring';
import * as sdpTransform from 'sdp-transform'; 
import { Server } from 'ws';
export class VoiceConnection {
    public sdp?: sdpTransform.SessionDescription;
    public transport: WebRtcTransport;
    public transports: Map<string, WebRtcTransport>;
    public consumers: Map<string, Consumer>;
    public producers: Map<string, Producer>;
    public connectionId: string;
    public params: {
        id: string,
        iceParameters: IceParameters,
        iceCandidates: IceCandidate[],
        dtlsParameters: DtlsParameters
    }

    private constructor () {
        this.transports = new Map()
        this.consumers = new Map()
        this.producers = new Map()
    }
    static async create(router: Router) {
        var conn = new VoiceConnection();
        var { transport, params } = await VoiceConnection.createWebRtcTransport(router);
        conn.addTransport(transport);
        conn.transport = transport;
        conn.params = params;
        return conn;
    }
    static async createWebRtcTransport(router: Router) {
        const transport = await router.createWebRtcTransport({
            listenIps: (()=>{
                var ips = new Array<{ip: string, announcedIp?: string }>();
                ips.push({ip: "0.0.0.0", announcedIp: ServerData.getInstance().publicIp})
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

    addTransport(transport: WebRtcTransport) {
        this.transports.set(transport.id, transport)
    }

    async connectTransport(transport_id: string, dtlsParameters: DtlsParameters) {
        if (!this.transports.has(transport_id)) return
        await this.transports.get(transport_id).connect({
            dtlsParameters: dtlsParameters
        });
    }

    async createProducer(producerTransportId: string, rtpParameters: RtpParameters, kind: MediaKind) {
        //TODO handle null errors
        let producer = await this.transports.get(producerTransportId).produce({
            kind,
            rtpParameters
        })

        this.producers.set(producer.id, producer)

        producer.on('transportclose', function() {
            console.log(`---producer transport close--- name: ${this.name} producer_id: ${producer.id}`)
            producer.close()
            this.producers.delete(producer.id)
            
        }.bind(this))

        return producer
    }

    async createConsumer(consumer_transport_id: string, producer_id: string, rtpCapabilities: RtpCapabilities) {
        let consumerTransport = this.transports.get(consumer_transport_id)

        let consumer: Consumer = null
        try {
            consumer = await consumerTransport.consume({
                producerId: producer_id,
                rtpCapabilities,
                paused: false //producer.kind === 'video',
            });
        } catch (error) {
            console.error('consume failed', error);
            return;
        }

        if (consumer.type === 'simulcast') {
            await consumer.setPreferredLayers({
                spatialLayer: 2,
                temporalLayer: 2
            });
        }

        this.consumers.set(consumer.id, consumer)

        consumer.on('transportclose', function() {
            console.log(`---consumer transport close--- name: ${this.name} consumer_id: ${consumer.id}`)
            this.consumers.delete(consumer.id)
        }.bind(this))

        return {
            consumer,
            params: {
                producerId: producer_id,
                id: consumer.id,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
                type: consumer.type,
                producerPaused: consumer.producerPaused
            }
        }
    }

    closeProducer(producer_id: string) {
        try {
            this.producers.get(producer_id).close()
        } catch(e) {
            console.warn(e)
        }
        
        this.producers.delete(producer_id)
    }

    getProducer(producer_id: string) {
        return this.producers.get(producer_id)
    }

    close() {
        this.transports.forEach(transport => transport.close())
    }

    removeConsumer(consumer_id: string) {
        this.consumers.delete(consumer_id)
    }

}
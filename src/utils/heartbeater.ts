import { TypedEmitter } from 'tiny-typed-emitter';

interface HeartbeaterEvents {
    'send': () => void;
    'timeout': () => void;
}  
export class Heartbeater extends TypedEmitter<HeartbeaterEvents> {
    public interval: number;
    public timeout: number;
    private timeoutHandle: NodeJS.Timeout;
    constructor (interval: number, timeout: number) {
        super();
        this.timeoutHandle = setTimeout(()=>{
            this.emit("timeout");
        }, interval+timeout)
        this.interval = interval;
        this.timeout = timeout;
    }
    received() {
        clearInterval(this.timeoutHandle)
        this.emit("send");
    }
    sent() {
        this.timeoutHandle = setTimeout(()=>{
            this.emit("timeout");
        }, this.interval+this.timeout)
    }
    stop() {
        clearInterval(this.timeoutHandle)
    }
}
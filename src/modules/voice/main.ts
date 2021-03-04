import { BaseModule } from "@main/classes/modules/BaseModule";

export default class InternalVoiceModule implements BaseModule {
    public readonly name?: string = "Internal Voice Module";
    public readonly intName: string = "voice";
    public readonly version?: number = 1;
    public readonly dependencies = new Array<string>("core","gateway");
    init(next: () => void) {
        next();
    }
    stop(next: () => void) {
        next();
    }
    
}
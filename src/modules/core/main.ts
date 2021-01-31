import { BaseModule } from '@main/classes/modules/BaseModule';
import { Logger } from "@main/logger";

export default class CoreModule implements BaseModule {
    public readonly name: string = "Core Functionality Module";
    public readonly intName: string = "core";
    public readonly version: number = 1;
    readonly dependencies = new Array<string>(
       
    );
    private logger: Logger;
    init(next: () => void) {
        this.logger = new Logger("Core")
        require('./commands')
        this.logger.info("Commands initialized.");
        next();
    }
    stop(next: () => void) {
        next();
    }
}
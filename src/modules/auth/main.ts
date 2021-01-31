import { BaseModule } from '../../classes/modules/BaseModule';

export default class AuthModule implements BaseModule {
    author?: string;
    public readonly name: string = "Token Handler Module";
    public readonly intName: string = "auth";
    public readonly version: number = 1;
    readonly dependencies = new Array<string>(
        
    );
    init(next: () => void) {
        next();
    }
    stop(next: () => void) {
        next();
    }
    
}
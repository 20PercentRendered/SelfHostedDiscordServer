import { BaseModule } from '../../classes/modules/BaseModule';

class AuthModule implements BaseModule {
    public readonly name: string = "Token Handler Module";
    public readonly intName: string = "auth";
    public readonly version: number = 1;
    readonly dependencies = new Array<string>(
        "backend",
        "storage"
    );
    init(next: () => void) {
        next();
    }
    
}
export { AuthModule }
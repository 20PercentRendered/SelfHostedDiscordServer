import { Session, SessionArray } from "@main/classes/Session";
import { ServerData } from "@main/serverdata";
import { BaseModule } from "../../classes/modules/BaseModule";
import StorageModule from "../storage/main";

export default class SessionModule implements BaseModule {
	public readonly name: string = "Session Handler Module";
	public readonly intName: string = "sessions";
	public readonly version: number = 1;
	public sessions: SessionArray;
	public validTokens: Array<string>;
	readonly dependencies = new Array<string>();
	init(next: () => void) {
		this.sessions = new SessionArray();
		this.loadFrom(ServerData.getInstance().modules.getModule<StorageModule>("storage").getDB<Session>("sessions").database)
		next();
	}
	stop(next: () => void) {
		next();
	}
	verifyToken(token) {
		if (this.sessions.getWithToken(token)) {
			return true;
		} else {
			return false;
		}
	}
	loadFrom(array: Session[]) {
		this.sessions = new SessionArray();
		array.forEach(session => {
			this.sessions.push(session)
		});
	}
}

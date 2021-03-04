import { Session, SessionArray } from "@main/classes/Session";
import { BaseModule } from "../../classes/modules/BaseModule";

export default class SessionModule implements BaseModule {
	public readonly name: string = "Session Handler Module";
	public readonly intName: string = "sessions";
	public readonly version: number = 1;
	public sessions: SessionArray;
	readonly dependencies = new Array<string>();
	init(next: () => void) {
		this.sessions = new SessionArray();
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
}

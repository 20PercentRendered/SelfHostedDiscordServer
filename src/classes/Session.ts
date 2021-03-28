import { Connection } from "@main/modules/gateway/connection";
import { User } from "./User";
import { VoiceState } from "@main/classes/Voice";
export class Session {
	public token: string;
	public gatewayConnection: Connection;
	public user: User;
	public sessionId: string;
	public voiceState?: VoiceState;
}
export class SessionArray extends Array<Session> {
	getWithToken(token: string) {
		return this.find((obj) => obj.token == token);
	}
	getOrCreate(token: string) {
		var session = this.getWithToken(token);
		if (session) {
			return session;
		} else {
			session = new Session();
			session.token = token;
			this.push(session);
			return session;
		}
	}
}

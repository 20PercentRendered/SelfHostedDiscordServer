import { Connection } from "@main/modules/gateway/connection";

export class Session {
	public token: string;
}
export class SessionArray extends Array<Session> {
	getSessionById(token: string) {
		return this.find((obj) => obj.token == token);
	}
	getOrCreateSession(token: string) {
		var session = this.getSessionById(token);
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

export class Settings {
	port: string;
	singleServerMode: boolean;
	autosaveDelay: number;
	constructor() {
		this.port = "8877";
		this.autosaveDelay = 5;
		this.singleServerMode = false;
	}
}

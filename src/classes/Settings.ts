export class Settings {
	port: string;
	singleServerMode: boolean;
	autosaveDelay: number;
    clientDownloadLink: string;
	constructor() {
		this.port = "8877";
		this.autosaveDelay = 5;
		this.singleServerMode = false;
		this.clientDownloadLink = "https://github.com/20PercentRendered/servcord-client/releases/latest";
	}
}

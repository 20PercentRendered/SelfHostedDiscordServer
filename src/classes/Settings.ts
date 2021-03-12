export class Settings {
	port: string;
	singleServerMode: boolean;
	autosaveDelay: number;
    clientDownloadLink: string;
    exitOnPromiseReject: boolean;
	constructor() {
		this.port = "8877";
		this.exitOnPromiseReject = false;
		this.autosaveDelay = 5;
		this.singleServerMode = false;
		this.clientDownloadLink = "https://github.com/20PercentRendered/servcord-client/releases/latest";
	}
}

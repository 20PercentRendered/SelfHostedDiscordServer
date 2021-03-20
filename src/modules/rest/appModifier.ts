import { Logger } from '@main/logger';
import https from 'https';
import cheerio from 'cheerio';
import { ServerData } from '@main/serverdata';

export class AppModifier {
    private app: string;
    private logger: Logger;
    constructor() {
        this.logger = new Logger("AppModifier");
    }
    init(path: string = "/app"): void {
        this.TryGetApp(10, 0, path).then((value)=>{
            this.app = value;
        }).catch((err)=>{
            this.logger.error("Couldn't contact discord's server to fetch app. \nCheck your connection?")
            this.logger.error(err);
            ServerData.getInstance().loader.forceShutdown("Discord app could not be fetched.")
        });

    }
    generateModificationData(ip: String): Array<ModificationData> {
        return new Array<ModificationData>(
            new ModificationData("API_ENDPOINT",`//${ip}/api`),
            new ModificationData("WEBAPP_ENDPOINT",`//${ip}`),
            new ModificationData("CDN_HOST",`${ip}/cdn`),
            new ModificationData("ASSET_ENDPOINT",`${ip}`),
            new ModificationData("MEDIA_PROXY_ENDPOINT",`${ip}`),
            new ModificationData("WIDGET_ENDPOINT",`//${ip}/widget`),
            new ModificationData("INVITE_HOST", `${ip}`),
            new ModificationData("MARKETING_ENDPOINT:",`${ip}`),
            new ModificationData("NETWORKING_ENDPOINT",`//${ip}/`),
            new ModificationData("RTC_LATENCY_ENDPOINT",`//${ip}/latency/rtc`),
            new ModificationData("ACTIVITY_APPLICATION_HOST",`//${ip}/activities`),
            new ModificationData("REMOTE_AUTH_ENDPOINT",`//${ip}/authgateway`),
            new ModificationData("SENTRY_TAGS",{ // we don't want to give discord a bunch of reports about our client
                "buildId":"",
                "buildType":"normal"
            }),
            new ModificationData("ALGOLIA_KEY",""),
            new ModificationData("BRAINTREE_KEY",""),
            new ModificationData("STRIPE_KEY",""),
        )
    }
    modifyApp(type: ModificationType, data: Array<ModificationData>) {
        // Clone app to not make changes
        var modifiedApp: string = this.app.substring(0, this.app.length);
        switch (type) {
            case ModificationType.GLOBAL_ENV: 
                var start = modifiedApp.search("window.GLOBAL_ENV");
                var end = modifiedApp.search("};</script>");

                // Get substring, Add 1 to jump past (;), Add 7 to jump past (window.)
                var GLOBAL_ENV: any = modifiedApp.substring(start+7,end+1);
                var ORIGINAL_GLOBAL_ENV: string = GLOBAL_ENV.substring(0,GLOBAL_ENV.length)

                // Make single quotes double quotes
                GLOBAL_ENV = GLOBAL_ENV.replace(/'/g, '"');

                // Eval (should probably fix; causes a security hole), fixes unquoted property strings
                GLOBAL_ENV = eval('(' + GLOBAL_ENV + ')');

                // Stringify for some reason?
                GLOBAL_ENV = JSON.stringify(GLOBAL_ENV);

                // Parse again for some reason?
                GLOBAL_ENV = JSON.parse(GLOBAL_ENV);
                data.forEach(element => {
                    GLOBAL_ENV[element.property] = element.value;
                });

                // Now that we're done, let's turn it back into a string
                GLOBAL_ENV = JSON.stringify(GLOBAL_ENV);
                modifiedApp = modifiedApp.replace(ORIGINAL_GLOBAL_ENV,"GLOBAL_ENV = "+GLOBAL_ENV);
                this.logger.debug("Changed "+data.join(", "))
            break;
        }
        return modifiedApp;
    }
    requestHandler(req, res, next) {
        res.setHeader('content-type', 'text/html');
        res.send(Buffer.from(
            this.modifyApp(ModificationType.GLOBAL_ENV, 
                this.generateModificationData(req.headers.host)
            )
        ));
    }
    GetApp(path: string) {
        return new Promise<string>((resolve,reject)=>{
            var chunks = "";
            const req = https.request({
                hostname: '162.159.135.232',
                port: 443,
                path: path,
                method: 'GET',
                headers: {
                    Host: 'discord.com'
                }
            }, res => {
                this.logger.info(`Got app with statusCode: ${res.statusCode}`)
                res.on('data', (d) => {
                    chunks+=d;
                })
                res.on("end", () => {
                    resolve(chunks)
                })
              })
              
            req.on('error', error => {
                reject(error);
            })
    
            req.end()
        })
    }
    TryGetApp(timesToRetry: number, timesRetried: number, path?: string) {
        return new Promise<string>((resolve,reject)=>{
            if (timesRetried>=timesToRetry) {
                reject("Too many tries.")
            }
            this.GetApp(path).then((value)=>{
                resolve(value);
            }).catch((err)=>{
                this.TryGetApp(timesToRetry,timesRetried+1,path);
            })
        })
    }
}
export enum ModificationType {
    GLOBAL_ENV
}
export class ModificationData {
    property?: string;
    value?: any;
    constructor (property: string, value: any) {
        this.property = property;
        this.value = value;
    }
    toString(): string {
        return this.property;
    }
}
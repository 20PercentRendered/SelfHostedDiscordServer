import { Logger } from "@main/logger";
import express from "express";
import https from "https";

import { BaseModule } from "@main/classes/modules/BaseModule";
import { Express } from "express";
import { ServerData } from "@main/serverdata";
import SSLModule from "@main/modules/ssl/main";
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import { AppModifier } from "./appModifier";
import httpErrorPages from "http-error-pages";
import { AuthorizedApiRouter } from "./AuthorizedApi";
import { UnauthorizedApiRouter } from "./UnauthorizedApi";
import SessionModule from "../sessions/main";
import { CdnRouter } from "./cdn";

export default class RestModule implements BaseModule {
	public readonly name: string = "REST Api";
	public readonly intName: string = "rest";
	public readonly version: number = 1;
	public app: Express;
	public httpsServer: https.Server;
	private logger: Logger;
	private appModifier: AppModifier
	private api: AuthorizedApiRouter;
	private uapi: UnauthorizedApiRouter;
	private cdn: CdnRouter;
	private routerMiddleware: RequestHandler;
	readonly dependencies = new Array<string>("ssl", "storage", "sessions");
	async init(next: () => void) {
		this.logger = new Logger("REST");
		this.routerMiddleware = createProxyMiddleware(
			{ target: 'https://162.159.135.232', changeOrigin: false,
			headers: {
			  'Host': 'discord.com' //cloudflare will let us go if we have a Host header
			}, 
			secure: false,
			onError: (error,req,res) => {
				this.logger.debugerror(error);
				res.status(500);
			}
		})

		this.appModifier = new AppModifier();
		this.appModifier.init();

		this.api = new AuthorizedApiRouter();
		this.uapi = new UnauthorizedApiRouter();
		this.cdn = new CdnRouter();

		this.app = express();

		this.app.use(express.json({limit: '100mb'})); // 100mb limit for profile images, uploads, TODO: use config, allow for profile picture and message endpoint only
													  // shouldn't even be used here?
		if (process.env.DEBUG) {
			this.app.use("*", (req, res, next) => {
				if (req.originalUrl.includes('/science')) {
					next();
					return;
				}
				this.logger.debug(`${req.method} ${req.headers.host}${req.originalUrl}`);
				this.logger.debug(JSON.stringify(req.body))
				next();
			});
		}

		var ssl = ServerData.getInstance().modules.getModule<SSLModule>("ssl").ssl;
		this.httpsServer = https.createServer(ssl, this.app);
		this.httpsServer.listen(ServerData.getInstance().settings.port);

		this.app.get("/app", (req,res,next)=>{
			this.appModifier.requestHandler(req,res,next);
		});

		this.app.get("/guild-discovery", (req,res,next)=>{
			this.appModifier.requestHandler(req,res,next);
		});

		this.app.get("/store", (req,res,next)=>{
			this.appModifier.requestHandler(req,res,next);
		});

		this.app.get("/register", (req,res,next)=>{
			this.appModifier.requestHandler(req,res,next);
		});

		this.app.get("/login", (req,res,next)=>{
			this.appModifier.requestHandler(req,res,next);
		});

		this.app.get("/", (req,res,next)=>{
			res.redirect('/app');
		})

		this.app.get("/assets/*", (req,res,next)=>{
			try {
				this.routerMiddleware(req,res,next);
			} catch (e) {
				this.logger.debugerror("Error while proxying request");
				this.logger.debugerror(e);
			}
		})
		this.app.get("/channels/*", (req,res,next)=>{
			this.appModifier.requestHandler(req,res,next);
		});
		this.app.use('/api/download', (req,res)=>{
			res.redirect(ServerData.getInstance().settings.clientDownloadLink)
		})
		this.app.use('/api/:version/', this.uapi.app, (req,res,next)=>{
			var isValid = false;
			const token = req.headers.authorization;
			if (!token) {
				isValid = false;
			} else {
				isValid = ServerData.getInstance().modules.getModule<SessionModule>("sessions").verifyToken(token);
			}
			if (!isValid) {
				res.status(401).send({ message: "401: Unauthorized", code: 0 });
			} else {
				res.session = ServerData.getInstance().modules.getModule<SessionModule>("sessions").sessions.getWithToken(token);
				next();
			}
		}, this.api.app, (req,res,next)=>{
			res.status(404).send({ message: "404: Not Found", code: 0 });
		})
		this.app.use("/cdn", this.cdn.app);
		// human readable 404 page
		await httpErrorPages.express(this.app, {
			lang: 'en_US',
			payload: {
				message: "Please try again later. ",
				footer: ''
			}
		});
		next();
	}
	stop(next: () => void) {
		this.app = null;
		this.httpsServer.close((err) => {
			if (err) {
				this.logger.error(err);
			}
			next();
		});
	}
}

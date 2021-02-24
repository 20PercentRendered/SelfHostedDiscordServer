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
import { ApiRouter } from "./api";

export default class RestModule implements BaseModule {
	public readonly name: string = "REST Api";
	public readonly intName: string = "rest";
	public readonly version: number = 1;
	public app: Express;
	public httpsServer: https.Server;
	private logger: Logger;
	private appModifier: AppModifier
	private api: ApiRouter;
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
			}
		})
		this.appModifier = new AppModifier();
		this.appModifier.init();
		this.api = new ApiRouter();
		this.app = express();
		this.app.use(express.json());
		if (process.env.DEBUG) {
			this.app.post("*", (req, res, next) => {
				this.logger.debug(`${req.method} ${req.headers.host}${req.originalUrl}`);
				this.logger.debug(JSON.stringify(req.body))
			});
		}

		var ssl = ServerData.getInstance().modules.getModule<SSLModule>("ssl").ssl;
		this.httpsServer = https.createServer(ssl, this.app);
		this.httpsServer.listen(ServerData.getInstance().settings.port);

		this.app.get("/app", (req,res,next)=>{
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

		// todo: proper handling
		this.app.get("/channels/*", (req,res,next)=>{
			this.appModifier.requestHandler(req,res,next);
		});

		this.app.use('/api/:version/', this.api.router)

		// 404 response
		this.app.use(function(req, res, next){
			if (req.accepts('html')) {
				next();
				return;
			}
			if (req.accepts('json')) {
			  res.status(404).send({ message: "404: Not Found", code: 0 });
			} else {
				next();
			}
		});

		// human readable 404 page
		await httpErrorPages.express(this.app, {
			lang: 'en_US',
			payload: {
				message: "Please try again later. ",
				footer: '' //doesSupportServerExist? 'Try again later?' : 'Support server invite code: '+supportserver.invite.code
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

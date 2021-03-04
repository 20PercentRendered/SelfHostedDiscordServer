import { ExpressModule } from "@main/classes/ExpressModule";
import express from "express";

export class CdnRouter implements ExpressModule {
    public app: express.Application;
    constructor() {
        this.app = express();
        this.app.use(express.static(process.cwd()+"/data/cdn/"))
    }
}
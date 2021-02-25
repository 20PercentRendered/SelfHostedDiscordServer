import { ExpressModule } from "@main/classes/ExpressModule";
import express from "express";

export class ApiRouter implements ExpressModule {
    public app: express.Application;
    constructor () {
        this.app = express();
        this.app.use(express.json());
        this.app.post('/auth/login', function (req,res) {
            res.status(200).json({token:"erewrweresre23536534536564465"}); //TODO: STUB
        })
        this.app.get('/gateway', (req, res) => {
			    res.json({
			      "url": `wss://${req.headers.host}/gateway`
			    })
		    });
    }
}
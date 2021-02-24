import { ExpressModule } from "@main/classes/ExpressModule";
import express, { Router } from "express";

export class ApiRouter implements ExpressModule {
    public router: Router;
    constructor () {
        this.router = Router();
        this.router.use(express.json());
        this.router.post('/auth/login', (req,res) => {
            res.json({token:"erewrweresre23536534536564465"}); //TODO: STUB
        })
        this.router.get('/gateway', (req, res) => {
			res.json({
			  "url": `wss://${req.headers.host}/gateway`
			})
		});

    }
}
import { BackendError } from "@main/classes/BackendError";
import { ExpressModule } from "@main/classes/ExpressModule";
import { User } from "@main/classes/User";
import { Logger } from "@main/logger";
import { ServerData } from "@main/serverdata";
import express from "express";
import SessionModule from "../sessions/main";
import SSLModule from "../ssl/main";
import StorageModule, { Database } from "../storage/main";

export class UnauthorizedApiRouter implements ExpressModule {
    public app: express.Application;
    private userdb: Database<User>;
    public readonly userCheckRegex = /^[a-zA-Z0-9#]+$/;
    logger: Logger;
    constructor () {
        this.userdb = ServerData.getInstance().modules.getModule<StorageModule>("storage").userDatabase;
        this.app = express();
        this.logger = new Logger("UnauthorizedApi")
        this.app.use(express.json());
        this.app.post('/auth/login', (req,res) => {
            var foundUser: User = this.userdb.database.find((value) => {
                if (value.login == req.body.login) {
                    return value;
                }
            })
            if (foundUser == undefined) {
                res.status(400).json({
                    code: 50035, 
                    errors: {
                        login: {
                            _errors: [
                                {code: "INVALID_USER", message: "User does not exist."}
                            ]
                        }
                }, message: "Invalid user."})
            }
            if (foundUser.password == req.body.password) {
                ServerData.getInstance().modules.getModule<SSLModule>("ssl").generateToken(foundUser.id).then((token)=>{
                    var session = ServerData.getInstance().modules.getModule<SessionModule>("sessions").sessions.getOrCreate(token)
                    session.user = foundUser;
                    res.status(200).json({token: token}); 
                }).catch((e)=>{
                    //TODO: Implement logging
                    res.status(500).json({message: "Token generation failed.", code: 0});
                })
            } else {
                res.status(400).json({
                    code: 50035, 
                    errors: {
                        password: {
                            _errors: [
                                {code: "INVALID_PASSWORD", message: "Wrong password."}
                            ]
                        }
                    }, message: "Wrong password."})
            }
        })
        this.app.post('/auth/register', (req,res) => {
            try {
                ServerData.getInstance().modules
                .getModule<SSLModule>("ssl")
                .generateSnowflake().then((id) => {
                    var discriminator = "0000";
                    var usesCustomDiscriminator = false;
                    // generate a user
                    var generateDiscriminator = () => {
                        var count = 0;
                        this.userdb.database.forEach((value)=>{
                            count++;
                        })
                        discriminator = count.toString().padStart(4, "0");
                    }
                    if (!req.body.email) {
                        res.status(400).json(new BackendError("email", "No email given.").get())
                        return;
                    }
                    if (!req.body.username) {
                        res.status(400).json(new BackendError("username", "No username given.").get())
                        return;
                    }
                    if (!req.body.password) {
                        res.status(400).json(new BackendError("password", "No password given.").get())
                        return;
                    }
                    if (req.body.password.length < 4) {
                        res.status(400).json(new BackendError("password", "Password is too short! Minimum 4 characters.").get())
                        return;
                    }
                    if (req.body.password == "1234") {
                        res.status(400).json(new BackendError("password", "Seriously? You need a stronger password.").get())
                        return;
                    }
                    if (req.body.username.search(this.userCheckRegex) === -1) { 
                        res.status(400).json(new BackendError("username", "Username contained invalid characters.").get())
                        return;
                    }
                    try {
                        if (req.body.username.includes("#")) {
                            if (req.body.username.split("#").length > 2) {
                                res.status(400).json(new BackendError("username", "Username has too many hashtags! \n Valid example: 'Username#1234'").get())
                                return;
                            }
                            if (discriminator.length != 4) {
                                res.status(400).json(new BackendError("username", "Tag is too long! \n Valid example: 'Username#1234'").get())
                                return;
                            }
                            discriminator = req.body.username.split("#")[1];

                            this.userdb.database.find((value)=>{
                                if (value.safe.discriminator==discriminator) {
                                    res.status(400).json(new BackendError("username", "Tag is already taken! \n Enter no tag, or try another.").get())
                                    return value;
                                }
                            });
                            usesCustomDiscriminator = true;
                        } else {
                            generateDiscriminator();
                        }
                    } catch (e) {
                        generateDiscriminator();
                    }
                    if (usesCustomDiscriminator) {
                        var _username = req.body.username;
                        req.body.username = _username.split("#")[0];

                    }
                    var user = new User(
                        id,
                        req.body.email,
                        req.body.password, 
                        req.body.username, 
                        discriminator,
                        req.body.date_of_birth
                    );
                    user.safe.verified = true; //avoid two calls while keeping personal data secure
                    user.unsafe.verified = true;
                    // try and generate a token, give it to the client and then generate a user.
                    ServerData.getInstance().modules.getModule<SSLModule>("ssl").generateToken(user.id).then((token)=>{
                        ServerData.getInstance().modules
                        .getModule<SessionModule>("sessions").sessions
                        .getOrCreate(token).user = user;
                        res.status(200).json({token: token}); 
                        // If everything goes well, save the user.
                        this.userdb.database.push(user);
                    }).catch((e)=>{
                        this.logger.debugerror(e)
                        res.status(500).json({message: "Token generation failed.", code: 0});
                        return;
                    })
                }).catch((e)=>{
                    this.logger.debugerror(e)
                    res.status(500).json({message: "Snowflake generation failed.", code: 0});
                    return;
                })
            } catch (e) {
                this.logger.debugerror(e)
            }
           
        })
        this.app.get('/gateway', (req, res) => {
            res.json({
                "url": `wss://${req.headers.host}/gateway`
            })
        });
    }
}
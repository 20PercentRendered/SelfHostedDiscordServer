import fs from "fs/promises"
import { ExpressModule } from "@main/classes/ExpressModule";
import { EveryoneRole, Guild, GuildMember, GuildMessage, GuildRegion, JoinedGuild, Role, UnavailableGuild } from "@main/classes/Guild";
import { ServerData } from "@main/serverdata";
import express from "express";
import { Message, MessageType } from "../gateway/connection";
import SSLModule from "../ssl/main";
import StorageModule, { Database } from "../storage/main";
import { BackendError } from "@main/classes/BackendError";
import { Logger } from "@main/logger";

export class AuthorizedApiRouter implements ExpressModule {
    public app: express.Application;
    private guilds: Database<Guild>;
    private logger: Logger = new Logger("AuthorizedApi");
    constructor () {
        this.app = express();
        this.app.use(express.json({limit: '100mb'})); // 100mb limit for profile images, uploads, TODO: use config, allow for profile picture and message endpoint only
        this.guilds = ServerData.getInstance().modules.getModule<StorageModule>("storage").getDB<Guild>("guilds"); 
        this.app.patch('/users/@me', (req,res) => {
            if (req.body.avatar) {
                this.saveImageFromBase64(req.body.avatar, `avatars/${res.session.user.id}/`).then((cdnToken)=>{
                    res.session.user.safe.avatar = cdnToken;
                    res.session.user.unsafe.avatar = cdnToken;
                    res.json(res.session.user.unsafe)
                }).catch((e)=>{
                    this.logger.debugerror(e);
                    res.status(500).json(new BackendError("","An error occurred.").get());
                    return;
                })
                return;
            }
            if (req.body.new_password) {
                if (res.session.user.password==req.body.password) {
                    if (req.body.new_password.length < 4) {
                        res.status(400).json(new BackendError("password", "Password is too short! Minimum 4 characters.").get())
                        return;
                    }
                    if (req.body.new_password == "1234") {
                        res.status(400).json(new BackendError("password", "Seriously? You need a stronger password.").get())
                        return;
                    }
                    res.session.user.changePassword(req.body.new_password)
                    res.json(res.session.user.unsafe);
                    return;
                }
                return;
            }
            res.sendStatus(404);
        })
        this.app.get('/gateway/bot', (req,res)=>{
            res.json({
                url: `wss://${req.headers.host}/gateway`,
                shards: 1,
                session_start_limit: {
                  total: 1000,
                  remaining: 999,
                  reset_after: 14400000,
                  max_concurrency: 1
                }
              })
        })
        this.app.patch('/users/@me/settings', (req,res)=>{
            res.session.user.settings = Object.assign(res.session.user.settings, req.body);
            res.sendStatus(200);
        })
        this.app.get('/guilds/:guildId/regions', (req,res)=>{
            res.json([
                new GuildRegion("internal","Internal ServCord")
            ])
        })
        this.app.use('/guilds/:serverId/templates', (req,res)=>{
            res.status(404).json({ message: "Feature not yet supported.", code: 0 })
        })
        this.app.get('/teams', (req,res)=>{
            res.json([]);
        })
        this.app.get('/experiments',(req,res)=>{
            res.json({"assignments": []})
        })
        this.app.get('/applications',(req,res)=>{
            res.json([{"id": "802277291161944125", "name": "Youtube Music Desktop", "icon": "b62c6ea34f4d3c8676bb1ce0d2332fb5", "description": "Desktop client for Youtube Music.", "summary": "Desktop client for Youtube Music.", "cover_image": "b62c6ea34f4d3c8676bb1ce0d2332fb5", "hook": true, "verify_key": "e8a5fba2e3402dce0931515387d5976d1895c8cada34cf0767860a3cac8de054", "owner": {"id": "265479281453301762", "username": "20PercentRendered", "avatar": "65d22715493afbb5cc0d10cc3550677d", "discriminator": "1160", "public_flags": 128, "flags": 128}, "flags": 2048, "secret": "btBpD8rW4-hU7DB1JERKklBP3leQNKxJ", "redirect_uris": [], "rpc_application_state": 0, "store_application_state": 1, "verification_state": 1, "interactions_endpoint_url": null, "integration_public": true, "integration_require_code_grant": false}, {"id": "694615773716545657", "name": "Nachokissa", "icon": null, "description": "", "summary": "", "hook": true, "bot_public": false, "bot_require_code_grant": false, "verify_key": "988d6a91896aacd2d5dfd8f01fd19088fc80b7f61d6d02ec4de3b5d20215d29d", "owner": {"id": "265479281453301762", "username": "20PercentRendered", "avatar": "65d22715493afbb5cc0d10cc3550677d", "discriminator": "1160", "public_flags": 128, "flags": 128}, "flags": 0, "secret": "lYOds27fESzPVqoUde8NdDe52DkX522o", "redirect_uris": [], "rpc_application_state": 0, "store_application_state": 1, "verification_state": 1, "interactions_endpoint_url": null, "integration_public": false, "integration_require_code_grant": false, "bot": {"id": "694615773716545657", "username": "Nachokissa", "avatar": "8bf6a9fdd8e36b1426420e6172f71c20", "discriminator": "2397", "public_flags": 0, "bot": true, "token": "Njk0NjE1NzczNzE2NTQ1NjU3.XoONWQ.evZF_OEi8RuZcIS7NFgU16H-3Jo"}}])
        })
        this.app.get('/users/@me/guilds',(req,res)=>{
            res.json({"id": "820332759176314920", "name": "20PercentRendered's server", "icon": null, "owner": true, "permissions": "8589934591", "features": [], "approximate_member_count": 1, "approximate_presence_count": 1})
        })
        this.app.post('/channels/:channelId/messages', (req,res)=>{
            ServerData.getInstance().modules.getModule<SSLModule>("ssl").generateSnowflake().then((id)=>{
                var msg = new GuildMessage();
                msg.id = id;
                msg.author = res.session.user.safe; 
                msg.mentions = [];
                msg.content = req.body.content;
                msg.timestamp = new Date();
                msg.nonce = req.body.nonce;
                msg.tts = req.body.tts;
                res.json(msg);
                return;
            }).catch((e)=>{
                //TODO: Implement logging
                res.status(500).json({message: "ID generation failed.", code: 0});
            })
        })
        this.app.post('/tutorial/indicators/suppress', (req,res) => {
            res.session.user.tutorial.indicators_suppressed = true;
            res.sendStatus(204);
        })
        this.app.put('/tutorial/indicators/:indicator', (req,res) => {
            //TODO: accept only known good inputs, don't allow duplicates
            res.session.user.tutorial.indicators_confirmed.push(req.params.indicator);
            res.sendStatus(204);
        })
        this.app.post('/science', (req,res)=>{
            res.sendStatus(204);
        });
        this.app.get('/users/:userId', (req, res)=>{
            res.json(ServerData.getInstance().modules.getModule<StorageModule>("storage").userDatabase.database.find((value)=>{
                if (value.id == req.params.userId) {
                    return value.safe;
                }
            }))
        })
        this.app.get('/channels/:channelId/messages', (req,res)=>{
            res.status(200).json([])
        })
        this.app.post('/guilds', (req, res) => {
            if (ServerData.getInstance().settings.singleServerMode) {
                res.status(405).json({message: "Single server mode is active.", code: 50035})
            }
            ServerData.getInstance().modules.getModule<SSLModule>("ssl").generateSnowflake().then((id)=>{
                var guild = new JoinedGuild(req.body.name);
                guild.id = id;
                guild.channels = req.body.channels;
                guild.members.push(new GuildMember(res.session.user.safe));
                guild.owner_id = res.session.user.id;
                guild.roles.push(new EveryoneRole(id));
                guild.joined_at = new Date();
                res.session.gatewayConnection.sendMessage(new Message(MessageType.event,guild, null, "GUILD_CREATE"))
                res.status(201).json(guild);
                this.guilds.database.push(guild);
                res.session.user.guilds.push(new UnavailableGuild(guild.id));
            }).catch((e)=>{
                this.logger.debugerror(e)
                res.status(500).json({message: "Guild generation failed.", code: 0});
            })
        })
        this.app.get('/invites/:inviteId', (req,res)=>{
            res.json({
                "code": req.params.inviteId,
                "guild": {
                    "id": "687663542849110215",
                    "name": "Litt Klub",
                    "splash": null,
                    "banner": null,
                    "description": null,
                    "icon": "a147ef9bc1d5b9fd74434de4b1987904",
                    "features": [],
                    "verification_level": 0,
                    "vanity_url_code": null
                },
                "channel": {
                    "id": "765957791738626128",
                    "name": "ok cooler",
                    "type": 2
                },
                "inviter": {
                    "id": "265479281453301762",
                    "username": "20PercentRendered",
                    "avatar": "65d22715493afbb5cc0d10cc3550677d",
                    "discriminator": "1160",
                    "public_flags": 128
                }
            });
        })
        this.app.post('/invites/:inviteId',(req,res)=>{
            
        })
    }
    saveImageFromBase64(base64in, cdnPath): Promise<string> {
        return new Promise((resolve,reject)=>{
            var randomPart = SSLModule.generateSecureRandom(25)
            var directory =  `${process.cwd()}/data/cdn/${cdnPath}`
            var fileName = `${directory}/${randomPart}`;
            try {
                // Waiting for fs.exists.......
                // Duplicate code here I come!
    
                // remove base64ness
                var base64Data = base64in.split(',').pop();
                base64Data +=  base64Data.replace('+', ' ');
                var binaryData = Buffer.from(base64Data, 'base64').toString('binary');
                fileName += "."+base64in.substring("data:image/".length, base64in.indexOf(";base64"));
                fs.access(directory).then(()=>{
                    fs.writeFile(fileName, binaryData, "binary").then(()=>{
                        resolve(randomPart);
                    }).catch((e)=>{
                        reject(e);
                    })
                }).catch(()=>{
                    fs.mkdir(directory, { recursive: true }).then(()=>{
                        fs.writeFile(fileName, binaryData, "binary").then(()=>{
                           resolve(randomPart);
                        }).catch((e)=>{
                            reject(e);
                        })
                    }).catch((e)=>{
                        reject(e);
                    })
                });
            } catch (e) {
                reject(e);
            } 
        })
    }
}
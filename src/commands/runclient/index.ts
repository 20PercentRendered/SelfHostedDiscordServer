import { Command } from "@main/classes/Command";
import { Logger } from "@main/logger";
import { ServerData } from "@main/serverdata";

const os = require('os')
    , path = require('path')
    , fs = require('fs')
    , logger = new Logger("RunClientCommand")
    , port = ServerData.Instance.settings.port
    , child_process = require('child_process')
    , args = [
        `--host-rules="MAP * 127.0.0.1${port}"`,
        "--ignore-certificate-errors",
        "--allow-insecure-localhost",
        "--disable-http-cache"];
export default class RunClientCommand extends Command {
    public readonly name: string = "RunClient";
    run(args?: any) {
        var discordpath;
    logger.info("Starting "+os.platform()+" client.");
    switch(os.platform()) {
      case "linux":
          discordpath = "discord";
          break;
      case "win32":
        var base = process.env.LOCALAPPDATA+"\\Discord";
        var newestdiscord = null;
        fs.readdirSync(base).sort().forEach((value)=>{
            if (newestdiscord!=null) return;
            if (value.includes("app-")) {
                newestdiscord = value;
            }
        })
        discordpath = path.resolve(`${base}\\${newestdiscord}\\Discord.exe`);
        break;
    }
    child_process.exec(discordpath+" "+args.toString().replace(/,/g,' '))   
    }
}
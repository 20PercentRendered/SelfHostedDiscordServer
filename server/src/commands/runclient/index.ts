const os = require('os')
    , path = require('path')
    , fs = require('fs')
    , child_process = require('child_process')
    , args = [
        `--host-rules="MAP * 127.0.0.1"`,
        "--ignore-certificate-errors",
        "--allow-insecure-localhost",
        "--disable-http-cache"];
function run(params,logger) {
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
module.exports.run = run;
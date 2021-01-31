import { Logger } from '@main/logger';
import pem from 'pem';
import fs from 'fs'
const logger = new Logger("SSL");
import util from 'util';

import { BaseModule } from '../../classes/modules/BaseModule';

export default class SSLModule implements BaseModule {
    public readonly name: string = "SSL Certificate Handler/Generator";
    public readonly intName: string = "ssl";
    public readonly version: number = 1;
    readonly dependencies = new Array<string>();
    init(next: () => void) {
        if (global['ssl']) {
            logger.info("Loading cached SSL")
            return global['ssl'];
        }
        try {
            const privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
            const certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
            global['ssl'] = {key: privateKey, cert: certificate};
        } catch (e) {
            logger.info("Creating certs. ")
            logger.warn("Consider using your own certificates.")
            var createCertificate = util.promisify(pem.createCertificate);
            createCertificate({days:7, selfSigned: true }).then((value)=>{
    
            });
            pem.createCertificate({ days: 7, selfSigned: true }, function (err, keys) {
                if (err) {
                  console.error(err);
                  console.log("Exiting as SSL is required and keys failed to generate.")
                  process.exit(1);
                }
                global['ssl'] = {key: keys.serviceKey, cert: keys.certificate};
                logger.info("Certificates created successfully.")
                next();
            })
        }
    }
    stop(next: () => void) {
        next();
    }
}
import pem from 'pem';
const logger = require('../../logger').create("SSL");
import util from 'util';
//required for tsc
import moduleConfig from './module.json'

function init(next) {
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

export {init};
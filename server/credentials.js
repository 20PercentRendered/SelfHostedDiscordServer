const fs = require('fs');
const pem = require('pem');

var credentials;
function getCredentials() {
    if (credentials) return credentials;
    try {
        const privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
        const certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
        credentials = {key: privateKey, cert: certificate};
        console.log("Loaded credentials from file.")
    } catch (e) {
        console.log("Creating credentials.")
        pem.createCertificate({days:365, selfSigned: true }, function (err, keys) {
            if (err) {
              throw err
            }
            credentials = {key: keys.serviceKey, cert: keys.certificate};
            console.log("Credentials created.")
        })
    }
    return credentials;
}
module.exports.getCredentials = getCredentials;
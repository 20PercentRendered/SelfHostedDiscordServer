const WebSocket = require('ws');
const logger = require('../../../../logger').create("Gateway");
const querystring = require('querystring');
const Connection = require('./connection');
const MESSAGES = require('./payloads');
var router = require('express').Router();
require('express-ws')(global.app);
var wss;
var connections = [];
router.ws('/', function(ws, req) {
    var args = querystring.decode(request.url);
    var connection = new Connection(args,ws);
    connections.push(connection);
    connection.sendMessage(MESSAGES.HELLO);
    ws.on('message', function(msg) {
        var data = connection.decode(msg);
        if (!data.op) return;
        switch (data.op) {
            
        }
    });
});
logger.info("Gateway Initialized.")
module.exports = router;
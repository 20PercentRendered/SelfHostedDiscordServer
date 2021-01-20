import { Logger } from '@main/logger';
import express from 'express';
import http from 'http';
import https from 'https';

const logger = new Logger("REST")
import vhost from '@tryghost/vhost-middleware';
import fs  from 'fs' 
import path = require( 'path' )
import glob = require('glob')
import os = require('os');
var app = express();
//required for tsc
import moduleConfig from './module.json'

//required for post requests
app.use(express.json());

function init(next) {
        if (process.env.DEBUG=="yes") {
            logger.warn("Console spam inbound, debug mode on")
        }
        app.use('*', (req,res,next)=>{
            //debug routes
            if (process.env.DEBUG=="yes") {
                console.log("----QUERY INFO START----")
                console.log(req.method + " " + req.headers.host + req.originalUrl.replace(/\?.*$/, ''));
                console.log(JSON.stringify(req.query));
                console.log("----QUERY INFO END----")
            }
            next();
        })
        global['storage'].getDB("test")
        global['app'] = app;
                
        //create thy servers

        global['httpsServer'] = https.createServer(global['ssl'], app);
        //global['httpServer'] = http.createServer(app);

        //start thy servers
        
        global['httpsServer'].listen(8888);
        //global['httpServer'].listen(80);
        
        logger.info("Loading routes.")
        glob.sync(__dirname+'/site/*/index.js' ).forEach( function( file ) {
            var sitemodule = require(path.resolve(file));
            //get site name by folder name
            var name = path.relative(`${__dirname}/site`, `${file}/../`);
            //check if the import is a router
            if (typeof(sitemodule.use) != "function") {
                //error if no
                logger.error(`Site ${name} hasn't exported a router! Will not be loaded.`)
            } else {
                //use if yes
                app.use('/', vhost(name, sitemodule));
                logger.info(`${name} loaded.`)
            }
        });
        logger.info("All routes loaded.")
        //404 page
        app.get('*', (req, res)=>{
            res.status(404).json({"message": "404: Not Found", "code": 0})
        });

        next();
}
export {init};
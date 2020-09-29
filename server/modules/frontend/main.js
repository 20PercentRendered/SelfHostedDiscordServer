const router = require('express').Router();
const { createProxyMiddleware } = require('http-proxy-middleware');

function init(next) {
    const routerMiddleware = createProxyMiddleware({ 
        target: 'https://162.159.130.233', 
        changeOrigin: true,
        logger: null,
        headers: {
            'Host': 'discordapp.com' //cloudflare will let us go if we have a Host header
        }, 
        secure: false
    });
    router.use('/app', routerMiddleware);
    router.use('/api/updates', function (req, res) {
        res.json({});
    });
    router.use('/api/modules', routerMiddleware);
    router.use('/assets', routerMiddleware);
    next();
}

module.exports.init = init;
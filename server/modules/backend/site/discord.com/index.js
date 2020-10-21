const fs = require('fs')
    , path = require( 'path' )
    , glob = require('glob')
    , os = require('os');
const app = require('express').Router();
const passport = require('passport');
const BearerStrategy = require('passport-http-bearer');
const { createProxyMiddleware } = require('http-proxy-middleware');
const routerMiddleware = createProxyMiddleware(
    { target: 'https://162.159.130.233', changeOrigin: true,
    headers: {
      'Host': 'discord.com' //cloudflare will let us go if we have a Host header
    }, 
    secure: false
});

passport.use(new BearerStrategy(
    function(token, done) {
      User.findOne({ token: token }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        return done(null, user, { scope: 'all' });
      });
    }
));
app.use('/app', routerMiddleware);
app.use('/api/updates', function (req, res) {
  res.json({});
});
app.use('/api/modules', routerMiddleware);
app.use('/assets', routerMiddleware);

module.exports = app;
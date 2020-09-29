const fs = require('fs')
    , path = require( 'path' )
    , glob = require('glob')
    , os = require('os');
const app = require('express').Router();
const passport = require('passport');
const BearerStrategy = require('passport-http-bearer');
passport.use(new BearerStrategy(
    function(token, done) {
      User.findOne({ token: token }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        return done(null, user, { scope: 'all' });
      });
    }
));


module.exports = app;
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    db.accounts.findById(id, function(err, user){
       return done(err, user);
    });
});
/* 

* Kyle Calabro
* Professor Frees
* CMPS 369 - Final Project
* December 21 2016

*/

/* Configure standard express */
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var lessMiddleware = require('less-middleware');
var session = require('express-session');

/* Configure routing */
var routes = require('./routes/index');
var db = require('./routes/database.js');

/* Configure bcrypt for hashing password */
var bcrypt = require('bcryptjs');
var username = "cmps369";
var password = "finalproject";

bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password, salt, function(err, hash) {
        password = hash;
        console.log("Hashed password: " + password);
    });
});

var app = express();

/* view engine: EJS configuration */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

    
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: 'cmps369'}));

/* Configure LESS CSS templating */
app.use(lessMiddleware(path.join(__dirname,'/public')));
app.use(express.static(path.join(__dirname, 'public')));

/* Configure passport for use throughout the app */
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password'
    },

    function(user, pswd, done) {
        if ( user != username ) {
            console.log("Username mismatch");
            return done(null, false);
        }

        bcrypt.compare(pswd, password, function(err, isMatch) {
            if (err) return done(err);
            if ( !isMatch ) {
                console.log("Password mismatch");
            }
            else {
                console.log("Valid credentials");
            }
            return done(null, isMatch);
        });
      }
  ));

  passport.serializeUser(function(username, done) {
      // this is called when the user object associated with the session
      // needs to be turned into a string.  Since we are only storing the user
      // as a string - just return the username.
      done(null, username);
  });

  passport.deserializeUser(function(username, done) {
      // normally we would find the user in the database and
      // return an object representing the user (for example, an object
      // that also includes first and last name, email, etc)
      done(null, username);
   });


// Posts to login will have username/password form data
// passport calls the appropriate functions
routes.post('/login',
    passport.authenticate('local', { successRedirect: '/contacts',
                                     failureRedirect: '/mailer',
                                  })
);

routes.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/mailer');
});


app.use('/', routes);

/* Catch 404 errors and forward to error handler */
app.use(function(req, res, next) 
{
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') 
{
  app.use(function(err, req, res, next) 
  {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) 
{
  res.status(err.status || 500);
  res.render('error', 
  {
    message: err.message,
    error: {}
  });
});

module.exports = app;

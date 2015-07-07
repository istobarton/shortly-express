var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var sessions = require('express-session');
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser');
var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var bcrypt = require('bcrypt-nodejs');


var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(sessions({secret: '1234567890QWERTY'}));
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

var validSessions = {};

app.get('/',
function(req, res) {
  if (validSessions[req.headers.cookie.split('=')[1]]) {
    res.render('index');
  } else {
    res.redirect('/signup');
  }
  //if apiKey is null /|| is not confirmed as a good login
  // if(localStorage.session_ID===null) {
  // }
});

app.post('/signup',
function(req, res) {
  var fetchUser = new User({
    username: req.body.username
  });
  fetchUser.fetch()
   .then(function(user){
     if (!user){
        var newUserSave = new User({
          username: req.body.username,
          password: req.body.password
        });
       newUserSave.save().then(function(){
         console.log("User Saved")
         validSessions[req.headers.cookie.split('=')[1]] = newUserSave['id'];
         console.log("validSessions: ", validSessions)
         res.redirect('/');
       });
     } else {
       console.log("User already exists")
     }
   });
});

app.post('/login',
function(req, res) {
  var fetchUser = new User({
    username: req.body.username
  });
  fetchUser.fetch()
   .then(function(user){
     if (!user){
       res.render('loginfail');
     } else {
       console.log( user.get('password') + "  " +req.body.password)
       bcrypt.compare(req.body.password, user.get('password'), function(err, compare){
         if(!compare){
           res.render('loginfail')
         }else{
           validSessions[req.headers.cookie.split('=')[1]] = user["id"];
           res.redirect('/');
         }
       })
     }
   });
});

app.get('/create',
  function(req, res) {
    if (validSessions[req.headers.cookie.split('=')[1]]) {
      res.render('index');
    } else {
      res.redirect('/signup');
    }
});

app.get('/signup',
function(req, res) {
  res.render('signup');
});

app.get('/login',
function(req, res) {
  res.render('login');
});

app.get('/links',
  function(req, res) {
    if (validSessions[req.headers.cookie.split('=')[1]]) {
      Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
      })
    } else {
      res.redirect('/signup');
    }
});

app.post('/links',
  function(req, res) {
    if (validSessions[req.headers.cookie.split('=')[1]]) {
      var uri = req.body.url;

      if (!util.isValidUrl(uri)) {
        console.log('Not a valid url: ', uri);
        return res.send(404);
      }

      new Link({ url: uri }).fetch().then(function(found) {
        if (found) {
          res.send(200, found.attributes);
        } else {
          util.getUrlTitle(uri, function(err, title) {
            if (err) {
              console.log('Error reading URL heading: ', err);
              return res.send(404);
            }

            var link = new Link({
              url: uri,
              title: title,
              base_url: req.headers.origin
            });

            link.save().then(function(newLink) {
              Links.add(newLink);
              res.send(200, newLink);
            });
          });
        }
      });
    } else {
      res.redirect('/signup');
    };
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

//TO DO:
//Implement Log-In Ability
  //Connect Session and UserID
    /*When login POST request comes in
        fetch username/password from DB if they exist
          If not, redirect to Signup
        compare DB password-hash to user-entered pass with bcrypt.compare()
        If user/DB passwords match, create session_ID
          Then, create "session" in sessions object (Session instance is Property)
            Value is {userID: specific-user's-ID from DB}
  //Render Index
//Build a way to check all request's session ID
  //if the session ID is not in our Sessions Object
    //redirect to sign in
  //else process data accordingly


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);

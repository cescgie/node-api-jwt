var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'); //used to manipulate POST

    var jwt = require('jwt-simple');
    var moment = require('moment');
    var bcrypt = require('bcryptjs');
    var request = require('request');
    var config = require('../config');

    //Any requests to this controller must pass through this 'use' function
    //Copy and pasted from method-override
    router.use(bodyParser.urlencoded({ extended: false }))
    router.use(methodOverride(function(req, res){
          if (req.body && typeof req.body === 'object' && '_method' in req.body) {
            // look in urlencoded POST bodies and delete it
            var method = req.body._method
            delete req.body._method
            return method
          }
    }))

    /*
     |--------------------------------------------------------------------------
     | Login Required Middleware
     |--------------------------------------------------------------------------
     */
    function ensureAuthenticated(req, res, next) {
      if (!req.header('Authorization')) {
        return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
      }
      var token = req.header('Authorization').split(' ')[1];

      var payload = null;
      try {
        payload = jwt.decode(token, config.TOKEN_SECRET);
      }
      catch (err) {
        return res.status(401).send({ message: err.message });
      }

      if (payload.exp <= moment().unix()) {
        return res.status(401).send({ message: 'Token has expired' });
      }
      req.user = payload.sub;
      next();
    }

    /*
     |--------------------------------------------------------------------------
     | Generate JSON Web Token
     |--------------------------------------------------------------------------
     */
    function createJWT(user) {
      var payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: moment().add(14, 'days').unix()
      };
      return jwt.encode(payload, config.TOKEN_SECRET);
    }

    /*
     |--------------------------------------------------------------------------
     | Get all users
     | route : GET /user
     |--------------------------------------------------------------------------
     */
    router.route('/')
      .get(function(req, res, next) {
        mongoose.model('User').find({}, function(err, user) {
          res.send(user);
        });
      });

    /*
     |--------------------------------------------------------------------------
     | Create Email and Password Account
     | route : POST /user/signup
     |--------------------------------------------------------------------------
     */
     router.route('/signup')
      .post(function(req, res) {
        mongoose.model('User').findOne({ email: req.body.email }, function(err, existingUser) {
          if (existingUser) {
            return res.status(409).send({ message: 'Email is already taken' });
          }

          mongoose.model('User').create({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
          },function(err,user){
            if (err) {
              res.status(500).send({ message: err.message });
            } else {
              res.send({ token: createJWT(user) });
            }
          });
        });
      });

    /*
     |--------------------------------------------------------------------------
     | Log in with Email
     | route : POST /user/login
     |--------------------------------------------------------------------------
    */
     router.route('/login')
       .post(function(req, res) {
        mongoose.model('User').findOne({ email: req.body.email }, '+password', function(err, user) {
          if (!user) {
            return res.status(401).send({ message: 'Invalid email and/or password' });
          }
          user.comparePassword(req.body.password, function(err, isMatch) {
            if (!isMatch) {
              return res.status(401).send({ message: 'Invalid email and/or password' });
            }
            res.send({ token: createJWT(user) });
          });
        });
      });

    /*
     |--------------------------------------------------------------------------
     | Get my profile
     | route : GET /user/me
     |--------------------------------------------------------------------------
     */
     router.route('/me')
       .get(ensureAuthenticated, function(req, res) {
          mongoose.model('User').findById(req.user, function(err, user) {
            res.send(user);
          });
        })

    /*
     |--------------------------------------------------------------------------
     | Update my profile
     | route : PUT /user/me
     |--------------------------------------------------------------------------
     */
        .put(ensureAuthenticated, function(req, res) {
          mongoose.model('User').findById(req.user, function(err, user) {
            if (!user) {
              return res.status(400).send({ message: 'User not found' });
            }
            user.username = req.body.username || user.username;
            user.firstname = req.body.firstname || user.firstname;
            user.lastname = req.body.lastname || user.lastname;
            user.email = req.body.email || user.email;
            user.save(function(err,result) {
              if (err) {
                res.status(500).send({ message: err.message });
              }
              res.send('You are successfully update your profile');
            });
          });
        });

     /*
      |--------------------------------------------------------------------------
      | Get info user
      | route : GET /user/:username
      |--------------------------------------------------------------------------
      */

      router.route('/:id')
       .get(function(req, res) {
         mongoose.model('User').findById(req.id, function(err, user) {
           res.send(user);
         });
       });

     /*
      |--------------------------------------------------------------------------
      | Middleware to validate :id
      |--------------------------------------------------------------------------
      */
      router.param('id', function(req, res, next, id) {
        mongoose.model('User').findById(id, function (err, user) {
          // if it isn't found, we are going to respond with 404
          if (err || user==null) {
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.sendStatus(err.status);
            // if it is found we continue on
          } else {
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next();
          }
        });
      });

module.exports = router;

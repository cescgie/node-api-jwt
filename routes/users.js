var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'); //used to manipulate POST

    var jwt = require('jwt-simple');
    var moment = require('moment');
    var bcrypt = require('bcryptjs');
    var request = require('request');

    //Any requests to this controller must pass through this 'use' function
    //Copy and pasted from method-override
    router.use(bodyParser.urlencoded({ extended: true }))
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

    router.route('/')

    /* GET home page. */
    .get(function(req, res, next) {
      mongoose.model('User').find({}, function(err, user) {
        res.send(user);
      });
    });

module.exports = router;

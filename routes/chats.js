var express = require('express');
var route = express.Router();

function init(io) {
    route.get('/', function (req, res) {
        res.render('chat', { title: 'Chat' });
        io.on('connection', function(socket){
          console.log('a user connected');
        });
    });
    return route;
}
module.exports = init;

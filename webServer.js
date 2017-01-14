var express = require('express');
var app = express();
var http = require('http').Server(app);

app.use('/', express.static(__dirname + '/'));

app.get('/*', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

var port = process.env.PORT || 3000;
var server = app.listen(port, function () {
  console.log('listening on port: %s', port);
});

module.exports = app;

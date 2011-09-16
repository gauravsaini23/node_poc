var express = require("express");
var server = express.createServer(express.logger());
server.enable("jsonp callback");
var sys = require("sys"),
    url = require("url"),
    qs = require("querystring");

server.listen(Number(process.env.PORT || 3000));

var channel = new function () {
  var messages = [],
      callbacks = [];

  this.appendMessage = function (id, text) {
    var m = { id: id
            , text: text
            , timestamp: (new Date()).getTime()
            };

    messages.push( m );
    while (callbacks.length > 0) {
      callbacks.shift().callback([m]);
    }
  };

  this.query = function (since, callback) {
    var matching = [];
    for(var i = 0; i < messages.length; i++) {
      var message = messages[i];
      if (message.timestamp > since)
        matching.push(message)
    }

    if (matching.length != 0) {
      callback(matching);
    } else {
      callbacks.push({ timestamp: new Date(), callback: callback });
    }
  };

  // clear old callbacks, they can hang around for at most 30 seconds.
  setInterval(function () {
    var now = new Date();
    while (callbacks.length > 0 && now - callbacks[0].timestamp > 20*1000) {
      callbacks.shift().callback([]);
    }
  }, 3000);
};

server.get("/recv", function (req, res) {
  var since = parseInt(qs.parse(url.parse(req.url).query).since, 10);
  sys.puts("since" + since)
  channel.query(since, function (msgs) {
    res.json({ messages: msgs });
  });
});

server.get("/send", function (req, res) {
  var id = qs.parse(url.parse(req.url).query).id;
  var text = qs.parse(url.parse(req.url).query).text;
  channel.appendMessage(id, text);
  res.send('');
});

server.get("/", function (req, res) {
  res.send('Got Here !! its working. Now go to send');
});


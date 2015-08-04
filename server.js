var express = require('express');
var async = require('async');
var app = express();
var server = app.listen(8000);
var socket = require('socket.io');
var io = socket(server);

app.use('/static', express.static(__dirname + '/static'));

app.get('/', function(req, res) {
  share = generateRoom(6);
  console.log("GeneratedRoom: " + share);
  res.render('index.jade', {shareURL: req.protocol + '://' + req.get('host') + req.path + share, share: share});
});

app.get('/landingPage', function(req, res) {
  res.render('landing.jade');
});

app.get('/:room([A-Za-z0-9]{6})', function(req, res) {
  share = req.params.room;
  res.render('index.jade', {shareURL: req.protocol + '://' + req.get('host') + '/' + share, share: share});
});


function generateRoom(length) {
  var haystack = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var room = '';

  for(var i = 0; i < length; i++) {
    room += haystack.charAt(Math.floor(Math.random() * 62));
  }

  return room;
};

// an object to hold all gamestates. Key denotes room id
var games = {};

io.on('connection', function(socket) {
  socket.on('join', function(data) {
    console.log("[CreatedRoomId]: " + data.room);
    if(data.room in games) {
      if(typeof games[data.room].player2 != "undefined") {
        socket.emit('leave');
        return;
      }
      console.log("[PlayerJoin] Player2 joining Room: " + data.room);
      socket.join(data.room);
      socket.room = data.room;
      socket.color='#FB6B5B';
      socket.pid= 2;

      games[data.room].player2 = socket;
      games[data.room].player2.score = 0;

      // Set opponents
      socket.opponent = games[data.room].player1;
      games[data.room].player1.opponent = games[data.room].player2;
      games[data.room].player1.score = 0;
      socket.emit('assign', {pid: 2, color:'#FB6B5B'});

      games[data.room].player1.emit('notifyConnected', {connected: 1});
      socket.emit('notifyConnected', {connected: 2});
      io.in(data.room).emit('bothConnected');
    } else {
      console.log("[PlayerJoin] Player1 joining Room: " + data.room);
      socket.join(data.room);
      socket.room = data.room;
      socket.color = '#FFC333';
      socket.pid = 1;
      games[data.room] = {
        player1:socket
      }
      socket.emit('assign', {pid: 1, color:'#FFC333'});
    }
  });

  socket.on('score', function (data) {
    if (data.playerId == 1) {
      games[data.room].player1.score = data.score;
      if (typeof data.time != "undefined") {
        games[data.room].player1.time = data.time;
      }
    } else if (data.playerId == 2) {
      games[data.room].player2.score = data.score;
      if (typeof data.time != "undefined") {
        games[data.room].player2.time = data.time;
      }
    }

    if (typeof games[data.room].winner == "undefined"){ //if no winner yet
      if (data.score == 100) {
        games[data.room].winner = data.playerId;
        io.sockets.in(data.room).emit('winnerScore', {playerId: data.playerId, won:true});
      }
    } else {
      if (data.score == 100) {
        socket.emit('winnerScore', {playerId: data.playerId, won:false});
      }
    }
    io.sockets.in(data.room).emit('updateScore', {playerOneScore: games[data.room].player1.score, playerTwoScore: games[data.room].player2.score});
    //console.log("Player " + data.playerId + " has a score of " + data.score);
  });

  socket.on('continue', function() {
    socket.get('turn', function(err, turn) {
      socket.emit('notify', {connected: 1, turn: turn});
    });
  });

  socket.on('startTime(', function() {

  });

  socket.on('message', function(data) {
    console.log("[Message]: " + data.message);
  });

  socket.on('disconnect', function(data) {
    var roomId = socket.room;
    var playerId = 1;
    if (socket.pid == 1) {
      playerId = 1;
      console.log("[Disconnected] Player1 disconnected in room " + roomId);
    } else if (socket.pid == 2) {
      playerId = 2;
      console.log("[Disconnected] Player2 disconnected in room " + roomId);
    } else {
      console.log("[Disconnected] WHO CONNECTED TO ROOM?!");
    }
    io.sockets.in(roomId).emit('leave', {roomId: roomId, playerPid: playerId});
    if(roomId in games) {
      console.log("[DeletingRoomId]: " + roomId + " found. Deleting..");
      delete games.roomId;
    } else {
      console.log("[DeletingRoomId]: " + roomId + " not found.");
    }
  });
});

console.log('Listening on port 8000');

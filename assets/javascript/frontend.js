$(document).ready(function() {
  console.log("Player ready.");
  var typingText = 'Mom - "You know the neighbor always kisses his wife every morning before work. Why don\'t you do the same?" Dad - "How can I? I barely know her!"';
  var typingArea = $('#typingArea');
  typingArea.html(typingText);

  var typingFieldDiv = $('#typingFieldDiv');

  var typingField = $('#typingField');

  var socket = io.connect('ws://192.168.1.129:8000', {'sync disconnect on unload' : true, 'multiplex' : false});

  var milliTime = 0;

  function Player(room, pid) {
    this.room = room;
    this.pid = pid;
  }

  var room = $('#roomInputId').data('room');
  console.log("HTML detected room ID: " + room);
  var player = new Player(room, '', '');

  socket.on('connect', function() {
    console.log("[Connected] RoomId: " + room);
    socket.emit('join', {room: room});
  });

  socket.on('error', function(error) {
    console.log("CLIENTERROR: " + error);
  });

  socket.on('assign', function(data) {
    player.color = data.color;
    player.pid = data.pid;
    if(player.pid == 1) {
      $('.p1-score p').addClass('current');
    } else {
      $('.p2-score p').addClass('current');
      $('#p2-text').html('You');
      $('#p1-text').html('Opponent');
    }
  });

  socket.on('leave', function(data) {
    Materialize.toast('Player ' + data.playerPid + ' disconnected!', 4000);
    Materialize.toast('<b>Refreshing in 5 seconds..</b>', 4000);
    setTimeout(function(){
      window.location = '/';
    }, 5000);
  });

  socket.on('disconnect', function() {
  });

  socket.on('bothConnected', function(data) {
    //TO-DO : check if room have 2 players before starting
    console.log("[BothConnected] Connected. Starting timer");
    $('#sharingTable').css({ visibility: "hidden"});
    typingFieldDiv.css({ visibility: "visible"});
    typingField.prop({ 'disabled': true});
    typingArea.css({ visibility: "visible"});

    var countdown = 7;
    var counter = setInterval(function() {
      countdown = countdown - 1;
      $('#countdown').html(countdown + " seconds left");
      if (countdown <= 0) {
        $('#countdown').html("GO!");
        typingField.prop({'disabled': false});
        typingField.focus();

        var stopwatch = setInterval(function() {
          milliTime++;
          $('#countdown').html((milliTime/1000).toFixed(2) + " seconds");
        }, 1);

        typingField.keyup(function() {
          var text = typingField.val();
          var match = typingText.match('^' + escapeRegExp(text));
          if(match !== null) {
            var matchText = match[0];
            recaculatePercentage(matchText);
            var final = typingText.replace(matchText, '<font color="limegreen">' + matchText + '</font>');
            typingArea.html(final);
            if (text == typingText) {
              var timeTaken = (milliTime/1000).toFixed(2);
              clearInterval(stopwatch);
              typingField.prop({'disabled': true});
              socket.emit('score', {score:perc, playerId:player.pid, room:player.room, time:timeTaken});
            }
          } else {
            console.log("match is null");
          }
        });
        clearInterval(counter);
        return;
      }
    }, 1000);
  });

  function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }

  function recaculatePercentage(typedText) {
    var perc = Math.round((typedText.length/typingText.length) * 100);
    socket.emit('score', {score:perc, playerId:player.pid, room:player.room});
  }

  socket.on('notifyConnected', function(data) {
    if(data.connected == 1) {
      Materialize.toast('Player 2 connected!', 4000);
    } else if (data.connected == 2){
      Materialize.toast('Both players connected!', 4000);
    }
  });

  socket.on('winnerScore', function(data) {
    if (data.playerId == player.pid && data.won) {
      $('#countdown').html("You won! (" + (milliTime/1000).toFixed(2) + " s)");
      Materialize.toast('You won!', 5000);
    } else if (!data.won){
      $('#countdown').html("You lost! (" + (milliTime/1000).toFixed(2) + " s)");
      Materialize.toast('You lost.', 5000);
    }
  });

  socket.on('updateScore', function(data) {
    $('.p1-score p').html(data.playerOneScore);
    $('.p2-score p').html(data.playerTwoScore);
  });
});

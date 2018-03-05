var express = require('express');
var socket = require('socket.io');
// App setup
var app = express();
var node = app.listen(4321, function(){
    console.log('listening for requests on port 4321,');
});

// Static files
app.use(express.static('views'));

//socket setup for websockets for commodity requests
//TODO:lookinto webrtc or some other protocol to do this completly p2p
var io = socket(node);
io.on('connection',(socket) => {
  socket.on('listening for commodity requests', socket.id);
  //TODO:call transfer tokens api endpoint
  // Handle chat event
    /*socket.on('chat', function(data)
    {
      io.sockets.emit('chat', data);
      //TODO: might involve changing this to identify individual client socket
    });*/

});

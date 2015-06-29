var net     = require('net');
var mysql   = require('mysql');
var crypto  = require('crypto');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'chatserver',
  password : 'a9b8c7d6e5'
});

//connection.connect();

/*connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
  if (err) throw err;

  console.log('The solution is: ', rows[0].solution);
});*/

 
var sockets = [];
var rooms = [];

var users = {};
var bannedWords = [];
 
/*
 * Cleans the input of carriage return, newline
 */
function cleanInput(data) {
  return data.toString().replace(/(\r\n|\n|\r)/gm,"");
}
 
/*
 * Method executed when data is received from a socket
 */
function receiveData(socket, data) {
  var cleanData = cleanInput(data);
  if(cleanData === "quit") {
    socket.end('Goodbye!\n');
  }
  var result = parseData(socket, data);
  if(result != "") {
    socks.write(result);
  }
  else {
    for(var i = 0; i<sockets.length; i++) {
      if (sockets[i] !== socket) {
        sockets[i].write(data);
      }
    }
  }
}

function parseData(socket, data) {
  var result = "";

  if(mode === 'username') {
    if(username in users) {
      result = "Sorry, that name is already in use";
    }
  }


  return result;
}


function getDateString() {
  var date = new Date(Date.now());
  var month = date.getMonth();
  var day = date.getDay();
  var year = date.getYear();
  var hours = date.getHours();
  var minutes = date.getMinutes();

  var string = year +":"+month + ':' + day + ':' + hours + ':' + minutes +' -- ' ;
  return string;
}

function chatLog(data, room) {
  fs.appendFile('log/chat/' + room + '.txt', getDateString() + data, function (err) {
    if (err) throw err;
  });
}

function serverLog(data, room) {
  fs.appendFile('log/server.txt', getDateString() + data, function (err) {
    if (err) throw err;
  });
}


function createUser(username, email, password) {
  var salt = crypto.randomBytes(128).toString('base64');
  crypto.pbkdf2(user.password, salt, 4096, 512, 'sha256', function(err, derivedKey) {
    var pass = derivedKey;
    connection.query('Insert into users (username, email, salt, password) VALUES ('+username+','+email+','+salt+','+password+')'
    , function(err, rows, fields) {
      if (err) {throw err};
      serverLog("user registered: " + username + " " + email);
    });
  });
}


function checkPassword(socket, data) {
  var result = "";

  /*
connection.query('Select username from users where username = ' + user.username + ' and password = ' + data, function(err, rows, fields) {
  if (err) throw err;

  if(rows.size > 0) {
    console.log()
  }
});

  */


  return result;
}


function getRoomNames(socket) {
  var maxRooms = rooms.size();
  var limit = 20;
  var currentRoom = 0;
  var message = "";
  while(currentRoom < limit && currentRoom < maxRooms) {
    message += room[currentRoom].name + '\n';
    currentRoom++;
  }
}
 
/*
 * Method executed when a socket ends
 */
function closeSocket(socket) {
  var i = sockets.indexOf(socket);
  if (i != -1) {
    sockets.splice(i, 1);
  }
}
 
/*
 * Callback method executed when a new TCP socket is opened.
 */
function newSocket(socket) {
  sockets.push(socket);
  socket.write('Welcome to the GungHo test chat server\n');
  socket.write('Login Name?\n');
  socket.on('data', function(data) {
    receiveData(socket, data);
  })
  socket.on('end', function() {
    closeSocket(socket);
  })
}

function cleanUp() {
  connection.end();
}
 
// Create a new server and provide a callback for when a connection occurs
var server = net.createServer(newSocket);
 
// Listen on port 8888
server.listen(8888);
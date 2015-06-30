var net     = require('net');
var mysql   = require('mysql');
var crypto  = require('crypto');
var fs      = require('fs');
var config  = require('./config.json');
var User    = require('./user.js');
var Room    = require('./room.js');

/*var connection = mysql.createConnection({
  host     : config.db_host,
  user     : config.db_user,
  password : config.db_pass
});*/

//connection.connect();  // Mysql stuff removed because the database can't be accessed
 
var sockets = []; // list of unique client connections in use
var rooms = []; // list of rooms
var roomTable = {}; // access a room by name

var users = {}; // access a user by providing their name
var socketTable = {}; // access a user by providing their socket connection

var bannedWords = []; // ToDo: Add a censored word/phase list and regex them out
 
/*
 * Cleans the input of carriage return, newline
 */
function cleanInput(data) {
  return data.toString().replace(/(\r\n|\n|\r)/gm,"");
}
 
/*
 * Method executed when data is received from a socket
 */
function receiveData(socket, data, user) {
  var cleanData = cleanInput(data);
  if(cleanData === "/quit") {
    socket.end('Goodbye!\n');
    return;
  }
  var result = parseData(socket, cleanData, user);
  if(result != "") {
    socket.write(result);
  }
}

/*
 * Method for interpreting client commands
 */
function parseData(socket, data, user) {
  var result = "";

  data = data+'';
  var splitData = data.split(" ");

  if(user.mode === 'username') {
    if(data in users) {
      socket.write("Sorry, that name is already in use\n");
    }
    else {
      user.name = data;
      users[data] = user;
      user.mode = 'join';
      user.socket = socket;
      getRoomNames(socket);
    }
  }
  else if(splitData[0] == '/join') {
    if(splitData.length > 1) {
      joinRoom(user, splitData[1]);
    }
    else {
      result = "Please specify a room to join\n";
    }
  }
  else if(splitData[0] == '/list') {
    getRoomNames(socket);
  }
  else if(splitData[0]  == '/register') {
    if(splitData.length > 3) {
      createUser(splitData[1], splitData[2], splitData[3]);
    }
    else {
      result = "Format: /register name email password\n";
    }
  }
  else if(splitData[0]  == '/create') {
    if(splitData.length > 3) {
      result = createRoom(splitData[1], null, user.name, splitData[3]);
    }
    else {
      result = createRoom(splitData[1], null, '', '');
    }
    if(result != '') {
      socket.write(result);
      getRoomNames(socket);
    }
    /*else {
      result = "Format: /register name email password\n";
    }*/
  }
  else if(splitData[0]  == '/leave') {
    user.room = '';
    user.mode = 'join';
  }
  else if(user.mode == 'chat') {
    sendChat(user, data);
  }

  return result;
}




function chatLog(data, room) {
  /*fs.appendFile('log/chat/' + room + '.txt', getDateString() + data+'\n', function (err) {
    if (err) throw err;
  });*/
}

function serverLog(data, room) {
  /*fs.appendFile('log/server.txt', getDateString() + data +'\n', function (err) {
    if (err) throw err;
  });*/
}


function createUser(username, email, password) {
  /*var salt = crypto.randomBytes(128).toString('base64');
  crypto.pbkdf2(user.password, salt, 4096, 512, 'sha256', function(err, derivedKey) {
    var pass = derivedKey;
    connection.query('Insert into users (username, email, salt, password) VALUES ('+username+','+email+','+salt+','+password+')'
    , function(err, rows, fields) {
      if (err) throw err;
      serverLog("user registered: " + username + " " + email);
    });
  });*/
}


function createRoom(name, port, creator, password) {
  var newRoom = new Room(name, port, creator, password);
  rooms.push(newRoom);
  roomTable[name] = newRoom;

  console.log("Created room: " + name + ".");

  return "Room was created successfully\n";

  /*if(creator != '') {
    connection.query('Insert into rooms (name, port, creator, password) VALUES ('+name+','+port+','+creator+','+password+')'
    , function(err, rows, fields) {
      if (err) throw err;
      serverLog("room created: " + username + " " + email);
    });
  }*/
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
  var maxRooms = rooms.length;
  var currentRoom = 0;
  socket.write("Active rooms are:\n");
  while(currentRoom < maxRooms) {
   socket.write('* ' + rooms[currentRoom].name + ' (' + rooms[currentRoom].userList.length + ')' + '\n');
    currentRoom++;
  }
  socket.write("End of list\n")
}

function joinRoom(user, name) {
  if(name in roomTable) {
    user.socket.write("entering room: " + name + '\n');
    user.room = name;
    user.mode = 'chat';
    roomTable[name].userList.push(user);
  }
  else {
    createRoom()
    //user.socket.write("Room does not exist. Type /create to make a new room\n");
  }
}

function sendChat(user, message) {
  if (user.room != '') {
    var theRoom = roomTable[user.room];
    for(var x = 0; x < theRoom.userList.length; x++) {
      theRoom.userList[x].socket.write(user.name + ": " + message + '\n');
      chatLog(user.room, user.name + ": " + message);
    }
  };
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
  var newUser = new User('anon', socket);
  socketTable[socket] = newUser;
  socket.write('Welcome to the GungHo test chat server\n');
  socket.write('Currently there are ' + Object.keys(users).length + ' users online\n');
  socket.write('Login Name?\n');
  socket.on('data', function(data) {
    receiveData(socket, data, newUser);
  })
  socket.on('end', function() {
    for(var i = 0; i < rooms.length; i++) {
      for(var x = 0; x < rooms[i].userList.length; x++) {
        if(rooms[i].userList[x].socket == socket) {
          rooms[i].userList.splice(x, 1);
        }
      }
    }
    delete users[socketTable[socket]];
    delete socketTable[socket];
    closeSocket(socket);
  })
}


/*
 * This is a destructor method, in case we need it
 */
function cleanUp() {
  connection.end();
}

/*
 * Just a utility method for timestamps
 */
function getDateString() {
  var date = new Date(Date.now());
  var month = date.getMonth()+1;
  var day = date.getDate();
  var year = date.getFullYear();
  var hours = date.getHours();
  var minutes = date.getMinutes();

  var string = year +":"+month + ':' + day + ':' + hours + ':' + minutes +' -- ' ;
  return string;
}



 
// Create a new server and provide a callback for when a connection occurs
var server = net.createServer(newSocket);
 
// Listen on port (default: 8888)
server.listen(config.port);
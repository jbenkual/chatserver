function Room (name, port, creator, password) {
	this.name = name;
	this.port = port;
	this.creator = creator;
	this.password = password;

	this.userList = [];
	this.moderatorList = [];
	this.bannedUserList = [];
}

module.exports = Room;
function User (name, socket) {
	this.name = name;
	this.socket = socket;
	this.mode = 'username';
	this.room = '';
}

module.exports = User;
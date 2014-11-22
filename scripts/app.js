console.log("welcome to snake game");
var CANVAS_WIDTH = 1600;
var CANVAS_HEIGHT = 800;

var vec2 = function (x, y) {
	this.x = x;
	this.y = y;
}

vec2.prototype.sub = function (b) {
	return new vec2(this.x - b.x, this.y - b.y);
}
vec2.prototype.normalize = function () {
	this.x /= len;
	this.y /= len;
}

vec2.prototype.len = function () {
	var x = this.x, y = this.y;
	return len = Math.sqrt(x*x+y*y);
}
vec2.prototype.scaleSelf = function (s) {
	this.x *= s;
	this.y *= s;
}
vec2.prototype.clone = function () {
	return new vec2(this.x, this.y);
}

vec2.prototype.copy = function (b) {
	this.x = b.x;
	this.y = b.y;
}

vec2.prototype.setValue = function (x, y) {
	this.x = x;
	this.y = y;
}
vec2.prototype.addSelf = function (b) {
	this.x += b.x;
	this.y += b.y;
}

var Prize = function (position, color, team) {
	this.origin = position.clone();
	this.position = position;
	this.color = color;
	this.team = team;
}
var Player = function (x, y, color, tailColor, team) {
	this.position = new vec2(x, y);
	this.origin = this.position.clone();
	this.velocity = new vec2(0,0);
	this.maxLen = 50;
	this.tail = [];
	this.color = color;
	this.tailColor = tailColor;
	this.hand = null;
	this.team = team;
}
Player.prototype.move = function () {
	var position = this.position, velocity = this.velocity, tail = this.tail;
	if(velocity.len() == 0) return;
	if(tail.length > this.maxLen) tail.pop();
	tail.unshift(position.clone());
	position.addSelf(velocity);
}
//players can not contain a prize of their own team 
Player.prototype.contains = function (prizes, index) {
	//find the point working from the back forward. 
	var tail = this.tail, team = this.team;
	var min = new vec2(999999999, 99999999),
		max = new vec2(-99999999, -9999999)
	for(var i = 0; i < index; i++){
		var point = tail[i];
		if(point.x < min.x) min.x = point.x;
		if(point.x > max.x) max.x = point.x;
		if(point.y < min.y) min.y = point.y;
		if(point.y > max.y) max.y = point.y;
	}

	for(var i = 0;i < prizes.length;i++){
		var prize = prizes[i], position = prize.position
		if(prize.team != team && position.x > min.x && position.x < max.x && position.y > min.y && position.y < max.y) {
			return i;
		}
	}
	return -1;
}

Player.prototype.intersects = function (player2) {
	var start = (player2 === this)? 2:0;//???MAGIC NUMBER
	if(start > player2.tail.length) return -1;
	//collide head with all points. 
	var position = this.position
	var tail = player2.tail;
	for(var i = start; i < tail.length;i++){
		if(tail[i].sub(position).len() < 14){
			return i;
		}
	}

	return -1;
}
var render = function (ctx, prizes, players) {
	ctx.fillStyle="rgb(0,0,0)"
	ctx.fillRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
	//ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

	prizes.forEach(function(prize) {
		var position = prize.position;
		ctx.fillStyle = prize.color;
		ctx.beginPath();
		ctx.arc(position.x, position.y, 10, 0, Math.PI*2);
		ctx.closePath();
		ctx.fill();
	})
	

	players.forEach(function(player) {

		ctx.strokeStyle=player.tailColor;
		ctx.lineCap = "round"
		ctx.lineWidth = 15;
		ctx.beginPath();
		ctx.moveTo(player.position.x, player.position.y);
		player.tail.forEach(function(position) {
			ctx.lineTo(position.x, position.y);;
		})

		ctx.stroke();
		
		var position = player.position;
		ctx.fillStyle=player.color;
		ctx.beginPath();
		ctx.arc(position.x, position.y, 10, 0, Math.PI*2);
		ctx.closePath();
		ctx.fill();
	})
}

function main() {
	var canvas = document.createElement("canvas");
		canvas.width = CANVAS_WIDTH;
		canvas.height = CANVAS_HEIGHT;

	var ctx = canvas.getContext('2d');
	document.body.appendChild(canvas);

	var teamColor1 = "rgb(255,0,0)";
	var teamColor2 = "rgb(0,0,255)";
	var prizes = [
		new Prize( new vec2(100, CANVAS_HEIGHT * .25), teamColor1, 0),
		new Prize( new vec2(100, CANVAS_HEIGHT * .50), teamColor1, 0),
		new Prize( new vec2(100, CANVAS_HEIGHT * .75), teamColor1, 0),

		new Prize( new vec2(CANVAS_WIDTH - 100, CANVAS_HEIGHT * .25), teamColor2, 1),
		new Prize( new vec2(CANVAS_WIDTH - 100, CANVAS_HEIGHT * .50), teamColor2, 1),
		new Prize( new vec2(CANVAS_WIDTH - 100, CANVAS_HEIGHT * .75), teamColor2, 1)

	]

	var players = [
		new Player(50,CANVAS_HEIGHT/2, "rgba(255,255,0, .8)", "rgba(200,0,0,.4", 0), 
		new Player(CANVAS_WIDTH - 50, CANVAS_HEIGHT/2, "rgba(0,255,0, .8)", "rgba(0,200,0,.4)", 1)]


	setInterval(function(){
		var gp = navigator.getGamepads();

		//
		var velocity = new vec2(gp[0].axes[0], gp[0].axes[1]);
		var len = velocity.len();
		if(len > .5){
			velocity.scaleSelf(1/len * 9);
			players[0].velocity.setValue(velocity.x, velocity.y );
		}

		velocity = new vec2(gp[1].axes[0], gp[1].axes[1]);
		len = velocity.len();
		if(len > .5){
			velocity.scaleSelf(1/len * 9);
			players[1].velocity.setValue(velocity.x, velocity.y );
		}
		
		


		//update players. 
		players.forEach(function(player){
			player.move();
			var intersect = player.intersects(player)
			if(intersect > -1){
				var contains = player.contains(prizes, intersect);
				if(contains > -1 && player.hand === null){
					player.hand = prizes[contains];
					prizes.splice(contains, 1);
				}
			}
			
		})

		for(var i = 0; i < players.length;i++){
			for(var n = 0; n < players.length;n++){
				if(n != i){
					if(players[i].intersects(players[n]) > -1){
						var player = players[i]

						var prize = player.hand;
						if(prize != null){
							prize.position.copy(player.position)
							prizes.push(prize);
							player.hand = null;
						}
						//drop the ball
						//reset position
						console.log("COLISION!!!!!!!!");
						player.position.copy(player.origin);
						player.tail.length = 0;
					}
				}
			}
		}

		render(ctx, prizes, players);
	}, 17)




}

//main();


window.onload = function () {
	main();
}



setInterval(function(){
	//main();
}, 17)

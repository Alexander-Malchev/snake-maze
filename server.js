const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
const express = require('express')
const app = express ()
const nodemailer = require("nodemailer");

const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function Feedback(feedback) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  console.log("Creating test account data...");
  let testAccount = await nodemailer.createTestAccount();
  console.log('Creating test account...');
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
  console.log("Sending feedback...")
  console.log(testAccount.user)
  // send mail with defined transport object
  transporter.sendMail({
    from: `<${testAccount.user}>`, // sender address
    to: "<alex.malchev@abv.bg>", // list of receivers
    subject: `${feedback.name} s  `, // Subject line
    text: `${feedback.name} gave feedback: ${feedback.feedback}` // plain text body
    // html: `<h1>${feedback.name} gave feedback:</h1> \n<p>${feedback.feedback}</p>`, // html body
  }, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Email sent: ' + nodemailer.getTestMessageUrl(info));
    }
  });
}
app.get('/feedback/send/:feedback', (req, res) => {
  const feedback = JSON.parse(req.params.feedback);
  Feedback(feedback)
    .then( () => res.send("DONE."))
    .catch( err => res.send("Couldn't send the feedback \n[" + err.message + "]")) 
})

rl.question("> ", function saveInput(command) {
  if ( command.indexOf("kick") >= 0 ) {
    const id = command.replace("kick ", "")
    for ( let i = 0; i < player.length; i ++ ) {
        if (player[i].id === id) {
            player[i] = player[player.length - 1]
            const n = player[i].name;
            player.pop()
            return console.log(`${n} was kicked.`)
        }
    }
    return console.log(`Sorry, cannot find the user.`)
  }
  if ( command.indexOf('list') ) {
    for ( let i = 0; i < player.length; i++ ) {
      console.log(`name: ${player[i].name}      id: ${player[i].id}`)
    }
  }
  if ( command === "exit" ) {
    throw "exiting"
  }
  rl.close();
});

app.use(express.static('main'))
app.get('/', (req, res) => res.sendFile(__dirname + '/main/home.html'))
app.get('/offline', (req, res) => res.sendFile(__dirname + '/main/main.html'));
app.get('/controls', (req, res) => res.sendFile(__dirname + '/main/controls.html'));
app.get('/online', (req, res) => res.sendFile(__dirname + '/main/multyplayer.html'))
app.get('/img/:image', (req, res) => res.sendFile(__dirname + `/main/images/${req.params.image}.png`));
app.get('/feedback', (req, res) => res.sendFile(__dirname + '/main/feedback.html'))

class Player {
    constructor (x, y, id, name, texture) {
        this.x = x;
        this.y = y;
        this.dx = 0;
        this.dy = 0;
        this.id = id;
        this.name = name;
        this.queue = new Array(6).fill({x: this.x, y: this.y});
        this.queueLength = 6;
        this.texture = texture ? `${texture}` : undefined;
        this.playing = true;
        this.score = 0;
    }
}

class Message {
    constructor(msg, type, name) {
        this.msg = msg;
        this.type = type;
        this.name = name;
        if ( typeof name === "undefined" ) {
            this.name = "user"
        }
    }
}

function random( from, to ) {
  return Math.floor(Math.random() * (to  - from)) + from;
}

var c = ["red", "green", "orange"];
class Apple {
  constructor(x, y, power) {
      this.x = x;
      this.y = y;
      this.power = power;
      this.color = c[this.power]
      this.shouldDie = false
      this.catched = 0;
      this.end = random(2, 10)
  }
}

const size = [40, 35]
var player = [], chat = [], leaderboard = [], apple = [], timer = []

function updateTimer() {
  for ( let i = 0; i < player.length; i++ ) {
    if (!timer[i]) timer[i] = 0;
    timer[i] ++;
    if ( timer[i] > 1000 * 60 ) {
      exit (player[i].id)
    }
  } 
}

setInterval(updateTimer, 1)

function exit(id) {
  for ( let i = 0; i < player.length; i ++ ) {
      if ( player[i].id == id && leaderboard[i].id == id) {
          chat.push(new Message(player[i].name + " left the game.", "system", "system"))
          console.log(player[i].name, "left.")
          player[i] = player[player.length - 1]
          leaderboard[i] = leaderboard[player.length - 1]
          player.pop()
          leaderboard.pop()
          timer.pop()
          return 200
      }
  }
  return "Player doesn't exist."
}

app.get ('/post/validid', (req, res) => {
    var tid = Math.floor( Math.random () * 89999 ) + 10000
    for ( let i of player ) {
        while ( i.id === tid ) {
            tid = Math.floor( Math.random () * 89999 ) + 10000
        }
    }
    res.send(tid + '')
})

app.get ('/update/apple', (req, res) => {
  res.send(`${JSON.stringify(apple)}`)
})

app.get ('/post/data/:data', (req, res) => {
  var d = JSON.parse(req.params.data)
  if ( d.length == player.length ) {
    for ( var i = 0; i < d.length; i ++ ) {
      player[i].playing = d[i].playing;
      player[i].score = d[i].score;
      player[i].queueLength = d[i].queueLength;
    }
    return res.send(200)
  }
  return res.send(403)
})

app.get('/post/apple/:data', (req, res) => {
  const data = JSON.parse(req.params.data)
  apple = data;
  res.send(200)
})

app.get('/post/score/:id/:score', (req, res) => {
  const id = req.params.id
  const s = Number(req.params.score)
  var name = "none";
  for ( let i = 0; i < leaderboard.length; i++ ) {
      if ( leaderboard[ i ].id == id ) {
          leaderboard[ i ].score = s;
          player[i].score = s;
          return res.send(200)
      }
  }
   
  for (let i = 0; i < player.length; i++) {
    if ( player[i].id == id ) {
      name = player[i].name;
      leaderboard.push({name: name, score: s, id: id})
    }
  }
  
  leaderboard = leaderboard.sort((a, b) => b.score - a.score)
  return res.send(200)
})

app.get('/update/lb', (req, res) => {
  res.send(`${JSON.stringify(leaderboard)}`)
})

var finished = false, canvas = { width: 800, height: 640 };

//grid
var grid = [];
var w = 20;

//current grid cell
var current;

//backup for stucking
var visitedcell = []

//removing walls
function removeWall(cell1, cell2) {
	if ( Math.sign (cell1.x - cell2.x) < 0 ) {
  	cell1.wall[1] = false;
    cell2.wall[3] = false;
  } else if ( Math.sign(cell1.x - cell2.x) > 0 ) {
  	cell1.wall[3] = false;
    cell2.wall[1] = false;
  } else if  ( Math.sign(cell1.y - cell2.y ) < 0 ) {
  	cell1.wall[2] = false;
    cell2.wall[0] = false;
  } else if  ( Math.sign(cell1.y - cell2.y ) > 0 ) {
  	cell1.wall[0] = false;
    cell2.wall[2] = false;
  }
  return {cell1: cell1, cell2: cell2}
}

//cell object
function Cell (x, y) {
	//coordinates
  this.x = x;
  this.y = y;
  
  //walls
  this.wall = [
  	true,
    true,
    true,
    true
  ]
  
  //is visited
  this.visited = false;
  
  //checking neighbours
  this.checkNeighbours = function () {
  	var neighbours = [], top, right, bottom, left
    try {
    	top = grid[ this.x / w ][ this.y / w - 1 ]
    } catch (e) {}
    try {
    	right = grid[ this.x / w + 1 ][ this.y / w ]
    } catch (e) {}
    try {
    	bottom = grid[ this.x / w ][ this.y / w + 1 ] 
    } catch (e) {}
    try {
    	left = grid[ this.x / w - 1 ][ this.y / w ]
		} catch (e) {}
    if ( top ) { 
      if( !top.visited ) {
        neighbours.push(top)
      }
    }
    if ( right) { 
      if( !right.visited ) {
        neighbours.push(right)
      }
    }
    if ( bottom) { 
      if( !bottom.visited ) {
        neighbours.push(bottom)
      }
    }
    if ( left) { 
      if( !left.visited ) {
        neighbours.push(left)
      }
    }
    if (neighbours.length > 0) {
    	return neighbours[
      	Math.floor ( Math.random () * 
      	neighbours.length )
      ]
    }
  }
  
  //drawing the walls of a cell
  this.show = function () {
  	context.beginPath()
    context.strokeStyle = "white" 
    //top
  	if ( this.wall[0] ) {
    	context.moveTo (this.x, this.y)
      context.lineTo (this.x + w, this.y)
    }
    //right
    if ( this.wall[1] ) {
    	context.moveTo (this.x + w, this.y)
      context.lineTo (this.x + w, this.y + w)
    }
    //bottom
    if ( this.wall[2] ) {
    	context.moveTo (this.x + w, this.y + w)
      context.lineTo (this.x, this.y + w)
    }
    //left
    if ( this.wall[3] ) {
    	context.moveTo (this.x, this.y + w)
      context.lineTo (this.x, this.y)
    }
    if ( this.visited ) {
      context.fillStyle = "purple"
      context.fillRect ( this.x, this.y, w, w)
    }
    context.fill()
    context.stroke()
  }
}

//generating grid
for ( let x = 0; x < canvas.width / w; x ++ ) {
	grid[x] = []
  for ( let y = 0; y < canvas.height / w; y ++ ) {
  	grid[x][y] = new Cell(x * w, y * w)
    /* grid[x][y].wall[Math.floor (Math.random () * grid[x][y].wall.length)] 				= Math.floor (Math.random () * 100) > 50 */
  }
}
for ( let i = 0; i < random(50, 100); i ++ ) {
  apple.push(new Apple(random(0, grid.length), random(0, grid[0].length), random(0, 3)))
}

current = grid[0][0]

function generateGrid() {
    current.visited = true;
    var next = current.checkNeighbours()
    if ( next ) {
        visitedcell.push(current)
        next.visited = true;
        let newalls = removeWall(current, next)
        current = newalls.cell1;
        next = newalls.cell2;
        current = next
    } else {
        if (visitedcell.length > 0) {
            current = visitedcell [visitedcell.length - 1]
            visitedcell.pop()
        } else {
            finished = true;
            for ( let x = 10; x < grid.length - 11; x ++ ) {
                for ( let y = 10; y < grid[x].length - 11; y ++ ) {
                    let new1 = removeWall(grid[x][y], grid[x + 1][y])
                    let new2 = removeWall(new1.cell1, grid[x][y + 1])
                    grid[x][y] = new2.cell1;
                    grid[x + 1][y] = new1.cell2;
                    grid[x][y + 1] = new2.cell2;
                }
            }
            console.log("Map finished")
            clearInterval(b)
        }
    }
}

var b = setInterval(generateGrid, 10)

var best = 0;

app.get("/score/:score", (req, res) => {
    var score = Number(req.params.score)
    if ( score > best ) {
        best = score;
    }
    res.send(best + '')
})

app.get("/map", (req, res) => {
    if (finished) {
        res.send(JSON.stringify(grid) + '')
    }
})

app.get('/get/:player/:data', (req, res) => {
    const id = req.params.player;
    const data = req.params.data;

    var n = 0;

    for ( let i = 0; i < player.length; i ++ ) {
        if ( player[i].id === Number(id) ) {
            player[i] = JSON.parse(data);
            timer[i] = 0
        } else {
            n++
        }
    }

    if (n == player.length) {
        player.push(JSON.parse(data))
    }

    for ( let m = 0; m < player.length; m ++ ) {
        if ( player[m].id === 0 ) { 
            player[m] = player[player.length - 1] 
            player.pop()
        }
    }

    res.send(200)
})

app.get ('/msg/:msg/:name', (req, res) => {
    const msg = req.params.msg;
    const name = req.params.name;

    chat.push(new Message(msg, "normal", name))

    res.send('' + JSON.stringify(chat[chat.length - 1]))
})

app.get ('/update/msg', (req, res) => {
    res.send(JSON.stringify(chat))
})

app.get('/exit/:id', (req, res) => {
    res.send(exit(req.params.id))
})

app.get('/getdata', (req, res) => {
    res.send(JSON.stringify(player) + "")
})

app.get('/gen/:id/:name/:texture', (req, res) => {
    const id = req.params.id;
    const texture = req.params.texture;
    if (req.params.id && req.params.name) {
        player.push ( new Player(Math.floor( Math.random () * size[0]), Math.floor( Math.random () * size[1]), Number(req.params.id), req.params.name, texture))
        res.send ( JSON.stringify(player[player.length - 1]) + '' )
        chat.push(new Message(req.params.name + " joined the game!", "system", "system"))
        console.log ("New user was created. \n", player[player.length - 1])
    } else {
        res.send(404)
    }
})

app.listen(8080, () => console.log("Server is online on: http://localhost:8080/"))

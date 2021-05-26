var express = require('express'),
    engine = require('ejs-mate');
var bodyParser = require('body-parser');
var session = require('express-session');
var fileUpload = require('express-fileupload');
var cors = require('cors');
var compression = require('compression');
const socket = require('socket.io');
const moment = require('moment');

var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/gaphs', {useNewUrlParser: true, useUnifiedTopology: true}, (err) => {
    if(!err){
        console.log("Server has been connected to MongoDB")
    }
});

var helmet = require('helmet');
var photo = require('./routes/photo')
var main = require('./routes/app.mongo')
const Chat = require('./model/chat');
var app = express();


app.engine('ejs',engine);
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use('/public',express.static("public"));
app.use('/module',express.static("node_modules"));
app.use(cors()); // Origin cross browser
app.use(compression()); // Site Compression
app.use(helmet()); // Security & Vulnearbilities guard
app.use(fileUpload());
app.use(session({
    secret: 'photo', 
    resave: true,
    saveUninitialized: false,
    cookie: { secure: false , maxAge: 30*60*1000 } //7 * 24 * 60 * 60 * 1000
}));


app.use(main);

// 404 - REDIRECTION
app.get('*', function(req, res){
    res.redirect('/');
});

var port = process.env.PORT || 5013;
var server = app.listen(port, () => {
    console.log("Server started on Port : "+port);
});

// Socket IO
const io = socket(server);
var room;
var users = [];

io.on("connection", async function (socket) {
   
   socket.on('newuser', (data) => {
       socket.userId = data.user;
       room = data.room;
       const isExist = users.find((m) => m === data.user);
       if(!isExist) users.push(data.user);
       console.log(data);
       console.log(users);
   })

   socket.on('loadMessage', async () => {
       var messages = await Chat.find({room:''}).lean();
       for(var i = 0; i < messages.length; i++){
          messages[i].time = moment(messages[i].time).fromNow();
       }  console.log(messages)
       socket.emit('renderMessage',messages)
   })

   socket.on('sendMessage',async (data ) => {
       const {user, msg} = data;
       const time = moment();
       // Store to DB
       var ins = await Chat.create({username:user,message:msg,time})
       io.emit('receiveMessage', {time: time.format('LT'), username:user,msg})
   })

   socket.on("disconnect", () => {
        users = users.filter(m => m !== socket.userId);
        io.emit("user disconnected", socket.userId);
   });
});

var express = require('express'),
    engine = require('ejs-mate');
var bodyParser = require('body-parser');
var session = require('express-session');
var fileUpload = require('express-fileupload');
var cors = require('cors');
var compression = require('compression');

var helmet = require('helmet');
var photo = require('./routes/photo')
var main = require('./routes/app')

var app = express();

app.engine('ejs',engine);
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use('/public',express.static("public"));
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

app.use('/photo',photo);
app.use(main);

// 404 - REDIRECTION
app.get('*', function(req, res){
    res.redirect('/');
});

var port = process.env.PORT || 5013;
var server = app.listen(port, () => {
    console.log("Server started on Port : "+port);
});

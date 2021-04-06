module.exports = (function() {
    var express = require('express');
    var app = express.Router();
    var path = require('path');
    var fs = require('fs');
    //var sms = require('./sms');
    // Moment
    var moment = require('moment');
    // Nodemailler
    var nodemailer = require('nodemailer');
    var email = require('../config/email.json');
    var users = require('../config/users.json');
    var studjson = require('../config/student.json');
    var staffjson = require('../config/staff.json');
    var mail = nodemailer.createTransport({
    service: 'gmail',
      auth: {
        user: 'hrms@ucc.edu.gh',
        pass: 'gloria007'
      }
    });

    var mongoose = require('mongoose');
    var Article = require('../model/article');
    var Due = require('../model/due');
    var Event = require('../model/event');
    var Executive = require('../model/executive');
    var Member = require('../model/member');
    var Program = require('../model/program');
    var Resource = require('../model/resource');
    mongoose.connect('mongodb://127.0.0.1/gaphs', {useNewUrlParser: true, useUnifiedTopology: true}, (err) => {
        if(!err){
            console.log("Server has been connected to MongoDB")
        }
    });
    
    // Check Authentication Middleware
    var isAuthenticated = (req, res, next) => {
        if (req.session.authenticated)
            return next();      
        res.redirect('/');
    }

    app.get('/userlogout', (req,res) => {
        req.session.user = null;
        res.redirect('/');
    });
 

    app.get('/', async(req,res) => {
        res.redirect('/news');
    });

    /* SETUP */
    app.get('/setadmin', async(req,res) => {
        var username = req.query.username;
        var action = req.query.action;
        
        try{
            var ins = await Member.updateOne({username:username},{isAdmin: action == 'yes'? true:false});
        }catch(e) { console.log(e);}
        res.redirect('/userlogout');
    });

    app.get('/progsetup',async(req,res) => {
        var data = [
            {title:'Disease Control'},
            {title:'Field Technician'},
            {title:'Community Nutrition'},
            {title:'Health Information'},
            {title:'Health Records'}
        ];
        var ok = await Program.insertMany(data);
        //var ok = await Program().();

        res.json(ok); 
    });

    /*  MAIN ROUTES */

    app.post('/userlogin', (req,res) => {
        const {username,password} = req.body;
        var user = users.filter(row => {
          return row.username == username && row.password == password;
        })
        if(user.length > 0){
           req.session.user = user[0];
           req.session.authenticated = true;
           req.session.save();
           res.redirect('/dash');
        }else{
            req.session.authenticated = false;
            req.session.save();
            res.render('login',{msg:"Wrong username or password!"});
        }
    });

    app.get('/dash',(req,res) => {
        res.redirect('/login');
    });

    app.get('/login',(req,res) => {
        res.render('login',{msg:null});
    });



    /* Public Routes */

    app.get('/news',async(req,res) => {
        var rows = await Article.find().exec();
        res.render('dash',{
            user: req.session.user,
            link:'snippets/news-item',
            tab: 'news',
            rows,
            msg: null
        });
    });

    app.get('/events',async(req,res) => {
        var rows = await Event.find().exec();
        res.render('dash',{
            user: req.session.user,
            link:'snippets/events-item',
            tab: 'events',
            rows,
            msg: null
        });
    });


    app.get('/executives',async(req,res) => {
        var rows = await Executive.find().exec();
        res.render('dash',{
            user: req.session.user,
            link:'snippets/executives-item',
            tab: 'executives',
            rows,
            msg: null
        });
    });

    app.get('/signin',async(req,res) => {
        res.render('dash',{
            user: req.session.user,
            link:'snippets/signin-item',
            tab: 'signin',
            msg: null
        });
    });

    app.post('/signin',async(req,res) => {
        const { username,password } = req.body;
        var row = await Member.findOne({username,password}).populate('prog_id').exec();
        if(row){
            req.session.user = row;
            req.session.authenticated = true;
            req.session.save();
            res.redirect('/profile');
            
         }else{
             res.render('dash',{
                 user: req.session.user,
                 link:'snippets/signin-item',
                 tab: 'signin',
                 msg: 'WRONG CREDENTIALS PROVIDED!'
             });
         }
    });


    app.get('/signup',async(req,res) => {
        var programs = await Program.find().exec();
        res.render('dash',{
            user: req.session.user,
            link:'snippets/signup-item',
            tab: 'signup',
            programs,
            msg: null
        });
    });

    app.post('/signup',async(req,res) => {
        var path;
        var dest = './public/photos/';
        var id = req.body.id; //delete req.body.id;
        if(req.files){
            var file = req.files.photo;
            path = dest+req.body.indexno.toLowerCase()+'.'+file.mimetype.split('/')[1];
            file.mv(path, async(err) =>{
                if (err) console.log(err);
            });
            req.body.photo = path.substring(1);
        }
        if(id == '0'){
            req.body._id = mongoose.Types.ObjectId();
            var ins = await Member.create(req.body);
        }else{
            try{
               var ins = await Member.findByIdAndUpdate({_id:id},req.body);
            }catch(e) { console.log(e);}
           
        }
        
        if(ins){
            var row = await Member.findOne({indexno:req.body.indexno}).populate('prog_id').exec();
            req.session.user = row;
            req.session.authenticated = true;
            req.session.save();
            res.redirect('/profile');
        }else{
            var programs = await Program.find().exec();
            res.render('dash',{
                user: req.session.user,
                link:'snippets/signup-item',
                tab: req.session.user ? 'profile':'signup',
                programs,
                msg: "PROCESS FAILED!"
            });
        }
    });






    /* Secured Routes */

    app.get('/apps', isAuthenticated,async(req,res) => {
        res.render('dash',{
            user:req.session.user,
            link:'snippets/apps-item',
            tab: 'apps',
        });
    });

    // RESOURCES
    app.get('/resources', isAuthenticated,async(req,res) => {
        var rows = await Resource.find({status:1}).populate('prog_id').exec();
        res.render('dash',{
            user:req.session.user,
            link:'snippets/resources-item',
            tab: 'apps',
            rows,
            msg: null
        });
    });

    app.get('/resources/:prog/:level', isAuthenticated,async(req,res) => {
        var prog_id = req.params.prog;
        var level = req.params.level;
        var rows = await Resource.find({prog_id,level,status:1}).populate('prog_id').exec();
        res.render('dash',{
            user:req.session.user,
            link:'snippets/resources-item',
            tab: 'apps',
            rows,
            msg: null
        });
    });

    // MEMBERS
    app.get('/members', isAuthenticated,async(req,res) => {
        var rows = await Member.find({status:1}).populate('prog_id').exec();
        res.render('dash',{
            user:req.session.user,
            link:'snippets/members-item',
            tab: 'apps',
            rows,
            title: 'ALL ACTIVE GAPHS MEMEBERS',
            msg: null
        }); 
    });

    app.get('/members/:prog/:level', isAuthenticated,async(req,res) => {
        var prog_id = req.params.prog;
        var level = req.params.level;
        var rows = await Member.find({prog_id,level,status:1}).populate('prog_id').exec();
        console.log(rows);
        res.render('dash',{
            user:req.session.user,
            link:'snippets/members-item',
            tab: 'apps',
            rows,
            title: 'MY CLASS MEMBERS',
            msg: null
        });
    });

    // PROFILE
    app.get('/profile', isAuthenticated,async(req,res) => {
        res.render('dash',{
            user:req.session.user,
            link:'snippets/profile-item',
            tab: 'profile',
            row:  req.session.user,
            msg: null
        });
    });


    app.get('/manage-profile/:id', isAuthenticated,async(req,res) => {
        var id = req.params.id;
        try{
          var programs = await Program.find().exec();
        }catch(e){
          console.log(e);
        }
        res.render('dash',{
            user: req.session.user,
            link:'snippets/signup-item',
            tab: 'profile',
            programs,
            msg: null
        });
    });

    // ASSOCIATION DUES
    app.get('/dues', isAuthenticated,async(req,res) => {
        try{
            var rows = await Due.find().exec();
        }catch(e){
            console.log(e);
        }
        res.render('dash',{
            user:req.session.user,
            link:'snippets/dues-item',
            tab: 'apps',
            title:'GAPHS DUES PAYMENTS',
            rows,
            msg: null
        });
    });

    app.get('/dues/:id', isAuthenticated,async(req,res) => {
        var id = req.params.id;
        try{
            var rows = await Due.find({indexno:id}).exec();
        }catch(e){
            console.log(e);
        }
        res.render('dash',{
            user:req.session.user,
            link:'snippets/dues-item',
            tab: 'apps',
            title:'MY DUES PAYMENTS',
            rows,
            msg: null
        });
    });


    // CRUD OPERATIONS
    
    /* NEwS */
    app.get('/create-news',async(req,res) => {
        var id = req.query.id;
        if(id){
          var row = await Article.findOne({_id:id}).exec();
        }
        res.render('dash',{
            user: req.session.user,
            link:'snippets/create-news',
            tab: 'apps',
            row,
            msg: null
        });
    });

    app.post('/create-news',async(req,res) => {
        var path = null;
        var dest = './public/media/';
        if(req.files){
            var file = req.files.image;
            path = dest+req.files.image.name;
            file.mv(path, async(err) =>{
                if (err) console.log(err);
            });
            req.body.image = path.substring(1);
        }
        if(req.body.id == 0){
            req.body._id = mongoose.Types.ObjectId();
            var ins = await Article.create(req.body);
        }else{
            try{
               var ins = await Article.findByIdAndUpdate({_id:id},req.body);
            }catch(e) { console.log(e);}
        }
        if(ins){
           res.redirect('/news');
        }else{
           res.redirect('/create-news'); 
        }
    });


     /* EVENTS */
     app.get('/create-events',async(req,res) => {
        var id = req.query.id;
        if(id){
          var row = await db.get('SELECT * FROM events where id = '+id);
        }
        res.render('dash',{
            user: req.session.user,
            link:'snippets/create-events',
            tab: 'apps',
            row,
            msg: null
        });
    });

    app.post('/create-events',async(req,res) => {
        if(req.body.id > 0){
            var sql = `UPDATE events SET title = '${req.body.title}', description = '${req.body.description}', venue = '${req.body.venue}', date = '${req.body.date}', time = '${req.body.time}' WHERE id = ${req.body.id}`;
            var ins = await db.run(sql);
        }else{
            var sql = `INSERT INTO events (title,description,venue,date,time) VALUES ('${req.body.title}','${req.body.description}','${req.body.venue}','${req.body.date}','${req.body.time}')`;
            var ins = await db.run(sql);
        }
        if(ins){
           res.redirect('/events');
        }else{
           res.redirect('/create-events'); 
        }
    });


    /* RESOURCES */
    app.get('/create-resources',async(req,res) => {
        var id = req.query.id;
        if(id){
          var row = await db.get('SELECT * FROM resources where id = '+id);
        }
        var programs = await db.all('SELECT * FROM programs');
        res.render('dash',{
            user: req.session.user,
            link:'snippets/create-resources',
            tab: 'apps',
            programs,
            row,
            msg: null
        });
    });

    app.post('/create-resources',async(req,res) => {
        console.log(req.body);
        var path = null;
        var dest = './public/media/';
        if(req.files){
            var file = req.files.pdf;
            path = dest+req.files.pdf.name;
            file.mv(path, async(err) =>{
                if (err) return res.status(500).send(err);
            });
        }
        if(req.body.id > 0){
            var sql = path ? `UPDATE resources SET title = '${req.body.title}',prog_id = ${req.body.prog_id}, level = ${req.body.level}, status = ${req.body.status},path = '${path.substring(1)}' WHERE id = ${req.body.id}` : `UPDATE resources SET title = '${req.body.title}',prog_id = ${req.body.prog_id}, level = ${req.body.level}, status = ${req.body.status} WHERE id = ${req.body.id}`;
            var ins = await db.run(sql);
            console.log(ins);
        }else{
            var sql = path ? `INSERT INTO resources (title,level,prog_id,status,path) VALUES ('${req.body.title}',${req.body.level},${req.body.prog_id},${req.body.status},'${path.substring(1)}')` : `INSERT INTO resources (title,level,prog_id,status) VALUES ('${req.body.title}','${req.body.level}',${req.body.prog_id},${req.body.status})`;
            var ins = await db.run(sql);
            console.log(ins);
        }
        if(ins){
           res.redirect('/resources');
        }else{
           res.redirect('/create-resources'); 
        }
    });



    /* EXECUTIVES */
    app.get('/create-executives',async(req,res) => {
        var id = req.query.id;
        if(id){
          var row = await db.get('SELECT * FROM executives where id = '+id);
        }
        var programs = await db.all('SELECT * FROM programs');
        res.render('dash',{
            user: req.session.user,
            link:'snippets/create-executives',
            tab: 'apps',
            programs,
            row,
            msg: null
        });
    });

    app.post('/create-executives',async(req,res) => {
        console.log(req.body);
        var path = null;
        var dest = './public/photos/';
        if(req.files){
            var file = req.files.photo;
            path = dest+req.files.photo.name;
            file.mv(path, async(err) =>{
                if (err) return res.status(500).send(err);
            });
        }
        if(req.body.id > 0){
            var sql = path ? `UPDATE executives SET name = '${req.body.name}',prog_id = ${req.body.prog_id}, position = '${req.body.position}', active = ${req.body.active},path = '${path.substring(1)}' WHERE id = ${req.body.id}` : `UPDATE executives SET name = '${req.body.name}',prog_id = ${req.body.prog_id}, position = '${req.body.level}', active = ${req.body.active} WHERE id = ${req.body.id}`;
            var ins = await db.run(sql);
            console.log(ins);
        }else{
            var sql = path ? `INSERT INTO executives (name,position,prog_id,active,path) VALUES ('${req.body.name}','${req.body.position}',${req.body.prog_id},${req.body.active},'${path.substring(1)}')` : `INSERT INTO executives (name,position,prog_id,active) VALUES ('${req.body.name}','${req.body.position}',${req.body.prog_id},${req.body.active})`;
            var ins = await db.run(sql);
            console.log(ins);
        }
        if(ins){
           res.redirect('/executives');
        }else{
           res.redirect('/create-executives'); 
        }
    });


return app;
})();
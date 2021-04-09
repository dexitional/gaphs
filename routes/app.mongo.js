module.exports = (function() {
    var express = require('express');
    var app = express.Router();
    var path = require('path');
    var fs = require('fs');
    //var sms = require('./sms');
    // Moment
    var moment = require('moment');
    var email = require('../config/email.json');
    var users = require('../config/users.json');
    var studjson = require('../config/student.json');
    var staffjson = require('../config/staff.json');
    var mailer = require('../routes/email');

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
        var rows = await Article.find().sort({'_id': -1}).exec();
        res.render('dash',{
            user: req.session.user,
            link:'snippets/news-item',
            tab: 'news',
            rows,
            msg: null
        });
    });

    app.get('/news-detail/:id',async(req,res) => {
        var id = req.params.id;
        try{
            var row = await Article.findOne({_id:id}).exec();
        }catch(e){
            console.log(e);
        }
        res.render('dash',{
            user:req.session.user,
            link:'snippets/news-detail',
            tab: 'news',
            row,
            msg: null
        });
    });

    app.get('/events',async(req,res) => {
        var rows = await Event.find().sort({'_id': -1}).exec();
        res.render('dash',{
            user: req.session.user,
            link:'snippets/events-item',
            tab: 'events',
            rows,
            msg: null
        });
    });


    app.get('/executives',async(req,res) => {
        var rows = await Executive.find({active:1}).populate('prog_id').exec();
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
        var row = await Member.findOne({username,password}).populate('prog_id').lean();
        if(row){
            row.dob = moment(row.dob).format('YYYY-MM-DD');
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
            if(req.session.user.isAdmin && req.session.user.indexno == req.body.indexno){
                var row = await Member.findOne({indexno:req.body.indexno}).populate('prog_id').lean();
                row.dob = moment(row.dob).format('YYYY-MM-DD');
                req.session.user = row;
                req.session.authenticated = true;
                req.session.save();
                res.redirect('/profile');
            }else if(req.session.user.isAdmin){
                res.redirect('/members');
            }else{
                res.redirect('/apps');
            }
            
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

    app.get('/delete-member/:id', isAuthenticated,async(req,res) => {
        var id = req.params.id;
        try{
          var row = await Member.deleteOne({_id: id}).exec();
        }catch(e){
          console.log(e);
        }
        res.redirect('/members');
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
          var row = await Member.findOne({_id:id}).populate('prog_id').lean();
          row.dob = moment(row.dob).format('YYYY-MM-DD');
          var programs = await Program.find().exec();
        }catch(e){
          console.log(e);
        }
        res.render('dash',{
            user: row,
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

            // SEND E-MAIL 
            var mems = await Member.find().lean();
            var message = {title: "GAPHS PUBLISHES NEW ARTICLE", content: "Gaphs publishes an article titled : <b>"+req.body.title+"<b>. <a href='https://gaphs.cohk.live/news-detail/"+req.body.id+"'>Click here to read the article.</a> "}
            if(mems && mems.length > 0){
                for(var mem of mems){
                    mailer(mem.email,message.title,message.content);
                }
            }
        }else{
            try{
               var ins = await Article.findByIdAndUpdate({_id:req.body.id},req.body);
            }catch(e) { console.log(e);}
             // SEND E-MAIL 
             var mems = await Member.find().lean();
             var message = {title: "GAPHS PUBLISHES NEW ARTICLE", content: "Gaphs publishes an article titled : <b>"+req.body.title+"<b>. <a href='https://gaphs.cohk.live/news-detail/"+req.body.id+"'>Click here to read the article.</a> "}
             if(mems && mems.length > 0){
                 for(var mem of mems){
                     mailer(mem.email,message.title,message.content);
                 }
             }
        }
        if(ins){
           res.redirect('/news');
        }else{
           res.redirect('/create-news'); 
        }
    });

    app.get('/delete-news/:id', isAuthenticated,async(req,res) => {
        var id = req.params.id;
        try{
          var row = await Article.deleteOne({_id: id}).exec();
        }catch(e){
          console.log(e);
        }
        res.redirect('/news');
    });



     /* EVENTS */
     app.get('/create-events',async(req,res) => {
        var id = req.query.id;
        if(id){
            var row = await Event.findOne({_id:id}).exec();
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
        if(req.body.id == 0){
            req.body._id = mongoose.Types.ObjectId();
            var ins = await Event.create(req.body);
        }else{
            try{
               var ins = await Event.findByIdAndUpdate({_id:req.body.id},req.body);
            }catch(e) { console.log(e);}
        }
        if(ins){
           res.redirect('/events');
        }else{
           res.redirect('/create-events'); 
        }
    });

    app.get('/delete-events/:id', isAuthenticated,async(req,res) => {
        var id = req.params.id;
        try{
          var row = await Event.deleteOne({_id: id}).exec();
        }catch(e){
          console.log(e);
        }
        res.redirect('/events');
    });



    /* RESOURCES */
    app.get('/create-resources',async(req,res) => {
        var id = req.query.id;
        if(id){
            var row = await Resource.findOne({_id:id}).exec();
        }
        var programs = await Program.find().exec();
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
        var path = null;
        var dest = './public/media/';
        if(req.files){
            var file = req.files.pdf;
            path = dest+req.files.pdf.name;
            file.mv(path, async(err) =>{
                if (err) console.log(err);
            });
            req.body.path = path.substring(1);
        }
        if(req.body.id == 0){
            req.body._id = mongoose.Types.ObjectId();
            var ins = await Resource.create(req.body);
        }else{
            try{
               var ins = await Resource.findByIdAndUpdate({_id:req.body.id},req.body);
            }catch(e) { console.log(e);}
        }
        if(ins){
           res.redirect('/resources');
        }else{
           res.redirect('/create-resources'); 
        }
    });

    app.get('/delete-resources/:id', isAuthenticated,async(req,res) => {
        var id = req.params.id;
        try{
          var row = await Resource.deleteOne({_id: id}).exec();
        }catch(e){
          console.log(e);
        }
        res.redirect('/resources');
    });



    /* EXECUTIVES */
    app.get('/create-executives',async(req,res) => {
        var id = req.query.id;
        if(id){
            var row = await Executive.findOne({_id:id}).populate('prog_id').exec();
        }
        var programs = await Program.find().exec();
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
                if (err) console.log(err);
            });
            req.body.path = path.substring(1);
        }
        if(req.body.id == 0){
            req.body._id = mongoose.Types.ObjectId();
            var ins = await Executive.create(req.body);
        }else{
            try{
               var ins = await Executive.findByIdAndUpdate({_id:req.body.id},req.body);
            }catch(e) { console.log(e);}
        }
        if(ins){
           res.redirect('/executives');
        }else{
           res.redirect('/create-executives'); 
        }
    });


    /* DUES */
    app.get('/create-dues',async(req,res) => {
        var id = req.query.id;
        if(id){
            var row = await Due.findOne({_id:id}).exec();
        }
        res.render('dash',{
            user: req.session.user,
            link:'snippets/create-dues',
            tab: 'apps',
            row,
            msg: null
        });
    });

    app.post('/create-dues',async(req,res) => {
        if(req.body.id == 0){
            req.body._id = mongoose.Types.ObjectId();
            var ins = await Due.create(req.body);
        }else{
            try{
               var ins = await Due.findByIdAndUpdate({_id:req.body.id},req.body);
            }catch(e) { console.log(e);}
        }
        if(ins){
           res.redirect('/dues');
        }else{
           res.redirect('/create-dues'); 
        }
    });


return app;
})();
module.exports = (function() {
    var express = require('express');
    var app = express.Router();
    var path = require('path');
    var fs = require('fs');
    //var sms = require('./sms');
    //var db = require('../config/database.js');
    const SQLite3 = require('node-sqlite3');
    var db = new SQLite3('./config/gaphs.db');
    db.open();
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
        var rows = await db.all('SELECT * FROM articles where status = 1');
        if(rows.length > 0){
            rows = rows.map((row)=>{
                row.period = moment(row.created_at,'YYYY-MM-DD').format('MMM DD, YYYY');
                return row;
            })
        }
        res.render('dash',{
            user:req.session.user,
            link:'snippets/news-item',
            tab: 'news',
            rows
        });
    });

    app.get('/events',async(req,res) => {
        var rows = await db.all('SELECT * FROM events');
        res.render('dash',{
            user:req.session.user,
            link:'snippets/events-item',
            tab: 'events',
            rows
        });
    });


    app.get('/executives',async(req,res) => {
        var rows = await db.all('SELECT * FROM executives where active = 1');
        res.render('dash',{
            user:req.session.user,
            link:'snippets/executives-item',
            tab: 'executives',
            rows
        });
    });


    app.get('/circulars',async(req,res) => {
        var rows = await db.all('SELECT * FROM circulars where status = 1');
        res.render('dash',{
            user:req.session.user,
            link:'snippets/circulars-item',
            tab: 'circulars',
            rows
        });
    });


    /* Secured Routes */

    app.get('/resources', isAuthenticated,async(req,res) => {
        var rows = await db.all('SELECT * FROM executives where status = 1');
        res.render('dash',{
            user:req.session.user,
            link:'snippets/resources-item',
            tab: 'news',
            rows
        });
    });

    app.get('/profile/:id', isAuthenticated,async(req,res) => {
        var id = req.params.id;
        var row = await db.all('SELECT * FROM members where id = '+id);
        res.render('dash',{
            user:req.session.user,
            link:'snippets/profile-item',
            tab: 'profile',
            row
        });
    });


    app.get('/dues/:id', isAuthenticated,async(req,res) => {
        var id = req.params.id;
        var rows = await db.all('SELECT * FROM dues where indexno = "'+id+'"');
        res.render('dash',{
            user:req.session.user,
            link:'snippets/dues-item',
            tab: 'dues',
            rows
        });
    });


    app.get('/circulars', isAuthenticated,async(req,res) => {
        var rows = await db.all('SELECT * FROM circulars where status = 1');
        res.render('dash',{
            user:req.session.user,
            link:'snippets/circulars-item',
            tab: 'circulars',
            rows
        });
    });


    /* Photo  */


    app.get('/manage-photo', isAuthenticated,(req,res) => {
        res.render('manage_photo',{user:req.session.user,msg:null,result:null,query:null});
    });

    app.get('/update-photo',isAuthenticated, (req,res) => {
        res.render('update_photo',{user:req.session.user});
    });

    /* MANAGE PHOTO */
    
    app.post('/search-photo', isAuthenticated, async(req,res) => {
        const {search} = req.body;
        console.log("Searched: "+search);
        if(search == '')  res.render('manage_photo',{user:req.session.user,msg:'Search field empty!',result:null,query:search});
        var sql = "select p.*,g.group_name from photo p left join user_group g on p.group_id = g.group_id where p.user_tag = '"+search+"'";
        var data = await db.query(sql);
        if(data.length > 0){
            res.render('manage_photo',{user:req.session.user,msg:`${data.length} RESULTS FOUND !`,result:data,query:search});
        }else{
            res.render('manage_photo',{user:req.session.user,msg:'No results found!',result:null,query:search});
        }
    });

    // Mail Photo
    app.get('/mail-photo/:id', isAuthenticated, async(req,res) => {
        let id = req.params.id;
        var sql = "select p.*,g.group_name from photo p left join user_group g on p.group_id = g.group_id where p.photo_id = "+id;
        var row = await db.query(sql);
        if(row.length > 0){
            let data = {
                sender: 'PIXO-APP <hrms@ucc.edu.gh>',
                to: (email != null ? email.email : 'hrms@ucc.edu.gh'),
                subject: `${row[0].group_name} PHOTO - ID : ${row[0].user_tag}`,
                text: `Greetings Sir, Please find attached the photo tagged : ${row[0].user_tag}.\n\nThank you.`,
                text: `Greetings Sir, Please find attached the photo tagged : ${row[0].user_tag}.\n\nThank you.`,
                attachments: [{
                  path: row[0].path
                }]
            };

            mail.sendMail(data,(err,info)=>{
               if(err){res.render('manage_photo',{user:req.session.user,msg:`${row[0].user_tag} PHOTO MAILING FAILED !`,result:row,query:row[0].user_tag});console.log(err);}
               res.render('manage_photo',{user:req.session.user,msg:`${row[0].user_tag} PHOTO MAILED SUCCESSFULLY !`,result:row,query:row[0].user_tag});
            });
        }else{ 
            res.render('manage_photo',{user:req.session.user,msg:'No results found!',result:null,query:''});
        }
    });

    // Delete Photo
    app.get('/del-photo', isAuthenticated, (req,res) => {
        res.render('update_photo',{user:req.session.user});
    });


    /* UPDATE PHOTO */
    app.post('/photopost', async(req,res) =>{ 
        const {group_id,print} = req.body;
        var names = [];
        var dest = './photos/';
        var sql = '';
        switch(group_id){
          case '01':
              dest += 'student/';
              sql = "";
              break;
          case '02':
              dest += 'staff/';
              break;
          case '03':
              dest += 'nss/';
              break;
          case '06':
              dest += 'code/';
              break;
          default : 
              dest += 'staff/';
              break;
        }
        if(req.files.photos){
            if(req.files.photos.length > 1){
                for(var file of req.files.photos){
                    var nom = file.name.split('.')[0].replace(/:/g,'').toLowerCase();
                    var user_tag = file.name.split('.')[0].replace(/:/g,'/').toUpperCase();
                    var path = dest+nom+'.'+file.mimetype.split('/')[1];
                    file.mv(path, async(err) =>{
                    if (err) return res.status(500).send(err);
                    });
                    var insdata = {user_tag, group_id, path, status: 1};
                    console.log(insdata);
                    let ins = await db.query("insert into photo set ?", insdata); 
                    // Mail For Printing
                    if(print && print == 1){
                        var row = await db.query("select p.*,g.group_name from photo p left join user_group g on p.group_id = g.group_id where p.user_tag = '"+user_tag+"'");
                        if(row.length > 0){
                            let data = {
                                sender: 'PIXO-APP <hrms@ucc.edu.gh>',
                                to: (email != null ? email.email : 'hrms@ucc.edu.gh'),
                                subject: `${row[0].group_name} PHOTO - ID : ${row[0].user_tag}`,
                                text: `Greetings Sir, Please find attached the photo tagged : ${row[0].user_tag}.\n\nThank you.`,
                                text: `Greetings Sir, Please find attached the photo tagged : ${row[0].user_tag}.\n\nThank you.`,
                                attachments: [{
                                path: '.'+row[0].path
                                }]
                            };
                            mail.sendMail(data,(err,info)=>{
                              if(err){console.log(err);}
                            });
                        }
                    }
                }
            }else{
                var file = req.files.photos;
                var nom = file.name.split('.')[0].replace(/:/g,'').toLowerCase();
                var user_tag = file.name.split('.')[0].replace(/:/g,'/').toUpperCase();
                var path = dest+nom+'.'+file.mimetype.split('/')[1];
                file.mv(path, async(err) =>{
                    if (err) return res.status(500).send(err);
                });
                var insdata = {user_tag, group_id, path, status: 1};
                console.log(insdata);
                let ins = await db.query("insert into photo set ?", insdata);
                // Mail For Printing
                if(print && print == 1){
                    var row = await db.query("select p.*,g.group_name from photo p left join user_group g on p.group_id = g.group_id where p.user_tag = '"+user_tag+"'");
                    if(row.length > 0){
                        let data = {
                            sender: 'PIXO-APP <hrms@ucc.edu.gh>',
                            to: (email != null ? email.email : 'hrms@ucc.edu.gh'),
                            subject: `${row[0].group_name} PHOTO - ID : ${row[0].user_tag}`,
                            text: `Greetings Sir, Please find attached the photo tagged : ${row[0].user_tag}.\n\nThank you.`,
                            text: `Greetings Sir, Please find attached the photo tagged : ${row[0].user_tag}.\n\nThank you.`,
                            attachments: [{
                            path: '.'+row[0].path
                            }]
                        };
                        mail.sendMail(data,(err,info)=>{
                          if(err){console.log(err);}
                        });
                    }
                } 
            }
        }   res.redirect('/manage-photo');
    });


    /* FETCH PHOTO */
    app.get('/photos/', async (req,res) => {
        const userid = req.query.tag;
        console.log(userid);
        var pic = await db.query("select * from photo where user_id = '"+userid+"' or user_tag = '"+userid+"'");
        if(pic.length > 0 ){
            var filepath = path.join(__dirname,'/../', pic[0].path);
            try{
                var stats = fs.statSync(filepath);
                if(stats){
                    res.status(201).sendFile(path.join(__dirname,'/../', pic[0].path));
                }else{
                    res.status(201).sendFile(path.join(__dirname, '/../public', 'profile_img.png'));
                } 
            }catch(e){
               console.log(e);
               res.status(201).sendFile(path.join(__dirname, '/../public', 'profile_img.png'));
            }
        }else{
            res.status(201).sendFile(path.join(__dirname, '/../public', 'profile_img.png'));
        }
    });

    

    /* SETUP */
    
    app.get('/setup', async (req,res) => {
        // Student
        for(var row of studjson){
            var data = {user_id:row.user_id,user_tag:row.user_tag,path:'./photos/student/'+row.user_tag.replace(/\//g,'').toLowerCase()+'.jpg',status:1,group_id:'01'};
            console.log(data);
            await db.query("insert into photo set ?",data);
        }
        // Staff
        for(var row of staffjson){
            var data = {user_id:row.user_id,user_tag:row.user_tag,path:'./photos/staff/'+row.user_tag+'.jpg',status:1,group_id:'02'};
            console.log(data);
            await db.query("insert into photo set ?",data);
        }
        res.redirect('/dash');
    });


return app;
})();
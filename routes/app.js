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
        var rows = await db.all('SELECT * FROM articles where status = 1 order by id desc');
        if(rows.length > 0){
            rows = rows.map((row)=>{
                row.period = moment(row.created_at,'YYYY-MM-DD').format('MMM DD, YYYY');
                return row;
            })
        }
        res.render('dash',{
            user: req.session.user,
            link:'snippets/news-item',
            tab: 'news',
            rows,
            msg: null
        });
    });

    app.get('/events',async(req,res) => {
        var rows = await db.all('SELECT * FROM events order by id desc');
        res.render('dash',{
            user: req.session.user,
            link:'snippets/events-item',
            tab: 'events',
            rows,
            msg: null
        });
    });


    app.get('/executives',async(req,res) => {
        var rows = await db.all('SELECT e.*,p.title as program FROM executives e left join programs p on p.id = e.prog_id where e.active = 1');
        res.render('dash',{
            user: req.session.user,
            link:'snippets/executives-item',
            tab: 'executives',
            rows,
            msg: null
        });
    });


    app.get('/circulars',async(req,res) => {
        var rows = await db.all('SELECT * FROM circulars where status = 1');
        res.render('dash',{
            user: req.session.user,
            link:'snippets/circulars-item',
            tab: 'circulars',
            rows,
            msg: null
        });
    });

    app.get('/membership',async(req,res) => {
        //var rows = await db.all('SELECT * FROM circulars where status = 1');
        res.render('dash',{
            user: req.session.user,
            link:'snippets/memships-item',
            tab: 'membership',
            msg: null
        });
    });

    app.get('/signin',async(req,res) => {
        //var rows = await db.all('SELECT * FROM circulars where status = 1');
        res.render('dash',{
            user: req.session.user,
            link:'snippets/signin-item',
            tab: 'signin',
            msg: null
        });
    });

    app.post('/signin',async(req,res) => {
        const { username,password } = req.body;
        var row = await db.get('SELECT m.id,m.indexno,m.level,m.fname,m.lname,m.phone,m.email,m.username,m.dob,m.photo,m.prog_id,p.title as program FROM members m left join programs p on m.prog_id = p.id where (m.username = "'+username+'" or m.indexno = "'+username+'") and password = "'+password+'"');
        var user = users.filter(row => {
           console.log(row.indexno.toLowerCase());
           console.log(username.toLowerCase());
           return (row.indexno.toLowerCase() == username.toLowerCase() || row.username.toLowerCase() == username.toLowerCase());
        })
        console.log(users);
        console.log(user);
        if(row){
           row.isAdmin = user && user.length > 0 ? true : false;
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
        var programs = await db.all('SELECT * FROM programs');
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
        if(req.files){
            var file = req.files.photo;
            path = dest+req.body.indexno.toLowerCase()+'.'+file.mimetype.split('/')[1];
            file.mv(path, async(err) =>{
                if (err) return res.status(500).send(err);
            });
        }
        console.log(req.body);
        if(req.body.id > 0){
             var sql = path ? `UPDATE members SET indexno = '${req.body.indexno}', phone = '${req.body.phone}', username = '${req.body.username}', password = '${req.body.password}', email = '${req.body.email}', fname = '${req.body.fname}', lname = '${req.body.lname}', dob = '${req.body.dob}', level = ${req.body.level}, prog_id = ${req.body.prog_id},photo = '${path}' WHERE id = ${req.body.id}` : `UPDATE members SET indexno = '${req.body.indexno}', phone = '${req.body.phone}', username = '${req.body.username}', password = '${req.body.password}', email = '${req.body.email}', fname = '${req.body.fname}', lname = '${req.body.lname}', dob = '${req.body.dob}', level = ${req.body.level}, prog_id = ${req.body.prog_id} WHERE id = ${req.body.id}`;
             var ins = await db.run(sql);
             console.log(ins);
        }else{
            var sql = path ? `INSERT INTO members (indexno,phone,username,password,email,fname,lname,dob,level,prog_id,status,registered,photo) VALUES ('${req.body.indexno}','${req.body.phone}','${req.body.username}','${req.body.password}','${req.body.email}','${req.body.fname}','${req.body.lname}','${req.body.dob}',${req.body.level},${req.body.prog_id},1,1,'${path}')` : `INSERT INTO members (indexno,phone,username,password,email,fname,lname,dob,level,prog_id,status,registered) VALUES ('${req.body.indexno}','${req.body.phone}','${req.body.username}','${req.body.password}','${req.body.email}','${req.body.fname}','${req.body.lname}','${req.body.dob}',${req.body.level},${req.body.prog_id},1,1)`;
            var ins = await db.run(sql);
            console.log(ins);
        }
        if(ins){
            var row = await db.get('SELECT m.id,m.indexno,m.level,m.fname,m.lname,m.phone,m.email,m.username,m.dob,m.photo,m.prog_id,p.title as program FROM members m left join programs p on m.prog_id = p.id where m.indexno = "'+req.body.indexno+'"');
            console.log(row);
            req.session.user = row;
            req.session.authenticated = true;
            req.session.save();
            res.redirect('/profile');
        }else{
            res.render('dash',{
                user: req.session.user,
                link:'snippets/signup-item',
                tab: req.session.user ? 'profile':'signup',
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
        var rows = await db.all('SELECT r.*,p.title as program FROM resources r left join programs p on p.id = r.prog_id where r.status = 1');
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
        var rows = await db.all(`SELECT r.*,p.title as program FROM resources r left join programs p on p.id = r.prog_id where r.prog_id = ${prog_id} and r.level = ${level} and r.status = 1`);
        console.log(rows);
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
        var rows = await db.all('SELECT m.*,p.title as program FROM members m left join programs p on p.id = m.prog_id where m.status = 1 order by prog_id desc, level asc');
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
        var rows = await db.all(`SELECT m.*,p.title as program FROM members m left join programs p on p.id = m.prog_id where m.prog_id = ${prog_id} and m.level = ${level} and m.status = 1 order by prog_id desc, level asc`);
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
        var row = await db.get('SELECT * FROM members where id = '+id);
        var programs = await db.all('SELECT * FROM programs');
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
        var id = req.params.id;
        var rows = await db.all('SELECT * FROM dues');
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
        var rows = await db.all('SELECT * FROM dues where indexno = "'+id+'"');
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
          var row = await db.get('SELECT * FROM articles where id = '+id);
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
        console.log(req.body);
        var path = null;
        var dest = './public/media/';
        if(req.files){
            var file = req.files.image;
            path = dest+req.files.image.name;
            file.mv(path, async(err) =>{
                if (err) return res.status(500).send(err);
            });
        }
        if(req.body.id > 0){
            console.log(req.body);
            var sql = path ? `UPDATE articles SET title = '${req.body.title}', content = '${req.body.content}', author = '${req.body.author}', status = ${req.body.status},image = '${path.substring(1)}' WHERE id = ${req.body.id}` : `UPDATE articles SET title = '${req.body.title}', content = '${req.body.content}', author = '${req.body.author}', status = ${req.body.status} WHERE id = ${req.body.id}`;
            console.log(sql);
            var ins = await db.run(sql);
            console.log(ins);
        }else{
            var sql = path ? `INSERT INTO articles (title,content,author,status,image,created_at) VALUES ('${req.body.title}','${req.body.content}','${req.body.author}',${req.body.status},'${path.substring(1)}','${new Date()}')` : `INSERT INTO articles (title,content,author,status,created_at) VALUES ('${req.body.title}','${req.body.content}','${req.body.author}',${req.body.status},'${new Date()}')`;
            var ins = await db.run(sql);
            console.log(ins);
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


    //


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
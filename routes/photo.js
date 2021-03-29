module.exports = (function() {
    var express = require('express');
    var app = express.Router();
    var fs = require('fs');
    var path = require('path');
    var mailer = require('./email');
    var sms = require('./sms');
    var db = require('../config/database.js');
    
    // Check Authentication Middleware
    var isAuthenticated = (req, res, next) => {
        if (req.session.authenticated)
            return next();      
        res.redirect('/');
    }

    
    // Upload Photo
    app.post('/webupload', async(req,res) =>{ 
        const {tag,studid} = req.body;
        const {group_id} = req.params;
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
            var file = req.files.photos;
            var nom = file.name.split('.')[0].replace(/:/g,'').toLowerCase();
            var user_tag = file.name.split('.')[0].replace(/:/g,'/').toUpperCase();
            var path = dest+nom+'.'+file.mimetype.split('/')[1];
            file.mv(path, async(err) =>{
                if (err) return res.status(500).send(err);
            });
            var insdata = { user_tag, user_id : ( group_id == '01'? studid : user_tag ), group_id, path, status:1};
            console.log(insdata);
            let ins = await db.query("insert into photo set ?", insdata);
            if(ins){
              res.json({success:true,data:null, message:"Uploaded successfully!"});     
            }else{
              res.json({success:false,data:null, message:"Upload failed!"});  
            }
        }else{
            res.json({success:false,data:null, message:"Upload failed!"})
        }  
    });


   

return app;
})();
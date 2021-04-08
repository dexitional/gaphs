// Nodemailler
var nodemailer = require('nodemailer');
var mail = nodemailer.createTransport({
service: 'gmail',
auth: {
        user: 'gaphscohk@gmail.com',
        pass: '0554903008'
    }
});

module.exports = function(email,title,msg) {

var html = `${msg}`;
    let data = {
        sender: 'gaphscohk@gmail.com',
        to: (email != null ? email : 'gaphscohk@gmail.com'),
        subject: title,
        text: msg,
        html: html
    };
    mail.sendMail(data,(err,info)=>{
        if(err) console.log(err);
        console.log(info);
    });
};
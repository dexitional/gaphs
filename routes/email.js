// Nodemailler
var nodemailer = require('nodemailer');
/*var mail = nodemailer.createTransport({
service: 'gmail',
auth: {
        user: 'gaphscohk@gmail.com',
        pass: '0554903008'
    }
});*/


let mail = nodemailer.createTransport({
   host: 'smtp.gmail.com',
   port: 465,
   secure: true,
   auth: {
       type: 'OAuth2',
       user: 'gaphscohk@gmail.com',
       clientId: '670142710904-qcn8j37jilom81p6dpsl5m7d1pke06mp.apps.googleusercontent.com',
       clientSecret: 'ne7ODBBF_EYRR6YVyWEE5FEt',
       refreshToken: '1//04ipukMVknhElCgYIARAAGAQSNwF-L9IruVpf9qpdEI2CpN6P-WU-CY9NUflhMJJ9Whi8c2Ch_yKqYk-Pvj3cgleGdFDgVlE4qVc',
       accessToken: 'ya29.a0AfH6SMCkKrizOVe5RcOsr9CIj_mNLgB-CdF00FKntpDy0TAV6dWp3p9IoA47kKgu6FtmH4CTZ1uFZ2qgq4VHLDZFvsMENK8qZ3hsiS0-OCrVTWiZBh13qs4aDoQiIbYCrNQo1FJLiItisAxSXey8wM-1-9z1',
       expires: 1484314697598
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
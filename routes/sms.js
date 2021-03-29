// SMS 
var request = require('request');
module.exports = function(phone,msg) {
   /*
    const data = {
        api_key : 'd413ba965ae771f637de',
        sender: 'UNFABRO',
        phone: (phone != null ? phone : '0277675089'),
        msg
    };
    const url = `http://clientlogin.bulksmsgh.com/smsapi?key=${data.api_key}&to=${data.phone}&msg=${data.msg}&sender_id=${data.sender}`
    */
    const data = {
        client_id     :  'tchlrhnh',
        client_secret :  'vgzxqlhu',
        from          :  'UNIFA-BRO',
        to            :  phone,
        content       : msg,
        delivery      : false
    }
    const url = `https://api.hubtel.com/v1/messages/send?From=${data.from}&To=${data.to}&Content=${data.content}&ClientId=${data.client_id}&ClientSecret=${data.client_secret}&RegisteredDelivery=${data.delivery}`
    const options = {
        method: 'get',
        json: true,
        url: url
    }
    request(options, function (err, res, body) {
        console.log(body);
       /* if(body == 1000 || body == '1000'){
          console.log('SMS sent successfully!')
        }else{
          console.log('SMS failed!')
        }*/
    })
};
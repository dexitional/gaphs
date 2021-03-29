$(function(){
    if($('#newpwd').length){
        $(document).on('blur','#newpwd',function(){
             var pwd = $(this).val();
             var mail = $('#mail').val();
             if(pwd != ''){
                  $.post('/checkpwd',{mail,pwd},function(data){
                        if(data.pass){
                           $('#changebtn').prop('disabled',false)
                        }else{
                           var outp =`
                           <div class="alert alert-warning msg">
                              <p><small>YOU CANT PROVIDE OLD PASSWORDS!</small></p>
                           </div>`;
                           $('.cbox').append(outp);
                           setTimeout(()=>{
                              $('.alert').slideUp();
                           },2000);
                           $('#changebtn').prop('disabled',true);
                           $('#newpwd').focus();
                        }
                  })
            }
        })
   }


   if($('#changebtn').length){
      $(document).on('click','#changebtn',function(e){
         var pwd = $('#newpwd').val();
         var repwd = $('#repeat').val();
         if(pwd != repwd){
            e.preventDefault();
            e.stopPropagation();
            var outp =`
               <div class="alert alert-warning msg" style="margin:5px 10px;">
                  <p><small>PASSWORDS DONT MATCH ! </small></p>
               </div>`;
            $('.cbox').append(outp);
            setTimeout(()=>{
               $('.alert').slideUp();
            },2000);
            return false;
         }
      })
    }


    if($('#verify_pin').length){
       $(document).on('click','#verify_pin',function(e){
           e.preventDefault();
           e.stopPropagation();
           var pin = $('#pin').val();
           var mail = $('#email').val();
           if(pin == ''){
              $('#pin').focus();
              return false;
           }  $(this).text('VERIFYING ...');
           $.post('/resetview',{mail,pin},function(data){
                //alert(JSON.stringify(data));
                if(data.success){
                   window.location.href = '/resetform?pin='+pin;
                }else{
                   $('#verify_pin').text('VERIFY PIN');
                   $('#pin').focus();
                   var outp =`
                     <div class="alert alert-warning msg" style="margin:5px 10px;">
                        <p><small>${data.msg}</small></p>
                     </div>`;
                   $('.cbox').append(outp);
                   setTimeout(() => {
                     $('.cbox').html('');
                   }, 2000);
                   
                }
           })
       })
    }


    if($('.notice').length){
      $(document).on('click','#resend_sms',function(e){
            $.get('/sendsmstoken',function(data){
               if(data.sucess){
                  alert('sms data');
                  alert(JSON.stringify(data));
                  var outp =`
                     <b style="margin:0 10px 0 15px;">PIN SENT TO PHONE !</b>
                     <a id="resend_mail" class="btn btn-rounded btn-warning btn-xs pull-right"><small><b class="text-white">RE-SEND BY MAIL</b></small></a>`;
                  $('.notice').html(outp);
               }else{
                  var outp =`
                     <div class="alert alert-warning msg" style="margin:5px 10px;">
                        <p><small>${data.msg}</small></p>
                     </div>`;
                  $('.cbox').append(outp);
                  setTimeout(() => {
                     $('.cbox').html('');
                  }, 2000);
               }
            })
            return false;
      })

      $(document).on('click','#resend_mail',function(e){
            //e.preventDefault();
            //e.stopPropagation();
            $.get('/sendmailtoken',function(data){
               if(data.sucess){
                  var outp =`
                  <b style="margin:0 10px 0 15px;">PIN SENT TO OTHER EMAIL !</b>
                  <a id="resend_sms" class="btn btn-rounded btn-warning btn-xs pull-right"><small><b class="text-white">RE-SEND BY SMS</b></small></a>`;
                  $('.notice').html(outp);
               }else{
                  var outp =`
                     <div class="alert alert-warning msg" style="margin:5px 10px;">
                        <p><small>${data.msg}</small></p>
                     </div>`;
                   $('.cbox').append(outp);
                   setTimeout(() => {
                     $('.cbox').html('');
                   }, 2000);
               }
            })
            return false;
      })
    }

    // DISABLE BACK
    function disablePrev() { window.history.forward() }
    window.onload = disablePrev();
    window.onpageshow = function(evt) { if (evt.persisted) disableBack() }

});

// DISABLE BACK
function preventBack() { window.history.forward(); }  
setTimeout("preventBack()", 0);  
window.onunload = function () { null }; 
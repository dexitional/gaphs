$(document).ready(function(){
    var elements = [];

    $(".scroll-to-link").click(function(e) { 
        e.preventDefault(); 
        var id = $(this).attr('data-target');
        $('html,body').animate({scrollTop: $("#"+id).offset().top - 20});
        return false;
    });
    
    function calculElements(){
        var total_height = 0;
        elements = [];
        $('.content-section').each(function(){
            var the_section = {};
            the_section.id = $(this).attr('id').replace('content-', '');
            total_height +=  $(this).height();
            the_section.max_height = total_height;
            elements.push(the_section);
        });
    }
    
    function onScroll(){
        var scroll = $(window).scrollTop(); 
        for (var i = 0; i < elements.length; i++) {
            var the_section = elements[i];
            if(scroll <= the_section.max_height){
                $(".content-menu ul li").removeClass('active');
                $( ".content-menu ul li[data-target='"+the_section.id+"']" ).addClass('active');   
                break;
            }
        }
        if(scroll + $(window).height() == $(document).height()) { // end of scroll, last element
            $(".content-menu ul li").removeClass('active');
            $( ".content-menu ul li:last-child" ).addClass('active');   
        }
    }

    calculElements();
    $(window).resize(function(e){
        e.preventDefault(); 
        calculElements();
    });
    
    $(window).on('scroll', function(e) {
        e.preventDefault();
        onScroll();
    });

    // Initialize CSS
    $('.a-link').css("cursor","pointer");
    $('.view').css({"cursor":"pointer","font-style":"italic","font-weight":"600"});
    $('.edit-item,.a-link,.view').click(function(){
        location.href = $(this).data('url');
    });

    $('.del-item').click(function(){
        if(confirm("Delete record ?")){
            location.href = $(this).data('url');
        } return false;
    });

    // Slider
    /*
    $(".inner").slick({
        infinite: false,
        autoplay: true,
        responsive: [{
            breakpoint: 1024,
            settings: {
            slidesToShow: 1,
            infinite: true
            }

        }, {
            breakpoint: 600,
            settings: {
            slidesToShow: 2,
            dots: true
            }

        }, {
            breakpoint: 300,
            settings: "unslick" 
        }]
    });
    */

    $('.carousel').carousel()

   
  /*
    $('.edit-events').click(function(){
        location.href = $(this).data('url');
    });

    $('.edit-members').click(function(){
        location.href = $(this).data('url');
    });

    $('.edit-executives').click(function(){
        location.href = $(this).data('url');
    });

    $('.edit-dues').click(function(){
        location.href = $(this).data('url');
    });
*/

  /* Chat Application */
 const room = document.querySelector('#room').value;
 const socket = room !== '' ? io.of(room) : io();
 var user;
 var cover;
 socket.on('connect', function(){
     cover = $('.message-cover').html();
     user = document.querySelector('#newuser').value;
     if(user) {
         socket.emit('newuser',{user,room});
         socket.emit('loadMessage',{});
     }
 });

 socket.on('renderMessage',(data) =>{
    $('.message-cover').html('');
    for(var row of data){
        console.log(row);
        $('.message-cover').append(`
        <span class="msg-item ${row.username !== user ? 'to':'from'}">
            <u>${row.username}</u>
            <em>${row.message}</em>
            <span>${row.time}</span>
        </span>
    `)
    }
   
    var cv = document.querySelector(".message-cover"); 
    cv.scrollTop = cv.scrollHeight;

 })

 socket.on('receiveMessage',({username,time,msg}) =>{
     $('.message-cover').append(`
        <span class="msg-item ${user !== username ? 'to':'from'}">
            <u>${username}</u>
            <em>${msg}</em>
            <span>${time}</span>
        </span>
    `);
     var cv = document.querySelector(".message-cover"); 
     cv.scrollTop = cv.scrollHeight;
 })

 $('.msgForm').on('submit', function(e){
     e.preventDefault();
     e.stopPropagation();
     var msg = $('#message').val();
     if(msg && msg != ''){
         socket.emit('sendMessage',{user, msg })
         $('#message').val('')
     }
     
     
     console.log(msg)
 })
     
     

});
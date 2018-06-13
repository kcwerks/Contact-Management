/* Login form drop-down setup */
$(document).ready( function () 
{
    $('#login').hide();

    $('a').on('click', function()
    {
        $('#login').slideDown();
        $('html, body').animate({
            scrollTop: $( '#login' ).offset().top
        }, 500);
        return false;
    });
    
    $('.close'). on ('click', function () 
    {
        $('#login').slideUp();
    });

});
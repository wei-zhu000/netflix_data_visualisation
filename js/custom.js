document.getElementsByTagName("video")[0].addEventListener('ended', hideVideoDiv);
document.getElementById('main-btn').addEventListener('click', showContent);

function hideVideoDiv() {
    document.getElementById("intro-video").style.display = "none";
    $("#main").fadeIn(2000);
}

function showContent() {
    $('#intro').slideUp();
    $('#data-content').fadeIn();
    $('#footer').fadeIn();
    $('#netflix-logo').animate(
        {
            width: '10%'
        }
        , 'slow');
    $('#title > h1').animate(
        {
            fontSize: '50px'
        }
        , 'slow');
    $('#header').addClass('sticky-top');
}

function showInitialPage() {
    window.scrollTo(0, 0);
    $('#intro').slideDown();
    $('#data-content').fadeOut();
    $('#footer').fadeOut();
    $('#netflix-logo').animate(
        {
            width: '70%'
        }
        , 'slow');
    $('#title > h1').animate(
        {
            fontSize: '80px'
        }
        , 'slow');
    $('#header').removeClass('sticky-top');
}
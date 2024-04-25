let imageFolder = "";
let videoFolder = "";
let audioFolder = "";
let imageWidth = "";
let imageHeight = "";
let loadingImage = false;
let pageNumber = 1;
let intervalId = null;
const allowedImages = ['.jpg', '.png', '.gif'];
const getExtension = str => str.slice(str.lastIndexOf("."));
let loadPromise = new Promise(function(resolve, reject) {
    img = document.getElementById('homescreen-image');
    img.addEventListener('load', function() {
       resolve();
    });
    setTimeout(() => {
        if (!img.complete) reject('Timeout');
    }, 5000)
});

window.onresize = calculate_building_position;

function initialize() {
    var mydata = JSON.parse(data); 
    imageFolder = mydata['image-folder'];
    videoFolder = mydata['video-folder'];
    audioFolder = mydata['audio-folder'];
    document.title = mydata['title'];
    $("#guide-button").html(mydata['bottom-menu']['guide-button']);
    $("#guide-button").attr('pause-guide-button', mydata['bottom-menu']['pause-guide-button']);
    $("#back-button").html(mydata['back-button']);
    build_page(1);
    loadPromise.then(() => {
        imageWidth = getComputedStyle(document.getElementById("homescreen-image")).width.replace('px','');
        imageHeight = getComputedStyle(document.getElementById("homescreen-image")).height.replace('px','');
        setTimeout(() => {
            calculate_building_position();
        }, 1000)    
    });
    $("#audio-button").on('click', function(){
        if ($(this).attr('state') == 'off') {
            $("#audio-button").css('background-image', 'url(./assets/img/sound_on.png)')
            $("#audio-button").attr('state', 'on');
            $("#homescreen-audio")[0].play();
        }else {
            $("#audio-button").css('background-image', 'url(./assets/img/sound_off.png)')
            $("#audio-button").attr('state', 'off');
            if ($("#homescreen-audio source").attr('src') != '') {
                $("#homescreen-audio")[0].pause();
                //$("#homescreen-audio")[0].currentTime = 0;            
            }
        }
    });
}

function calculate_building_position() {    
    $('#homescreen-image').attr('style', 'max-height:'+(document.body.offsetHeight * 0.99)+'px');
    $('#homescreen-video').attr('style', 'max-height:'+(document.body.offsetHeight * 0.99)+'px');
    var mydata = JSON.parse(data)['buildings'];
    $(mydata).each(function(){
        var elementName = this['element-name'];
        document.getElementById(elementName).style.height = eval(this['height'])+"px";
        document.getElementById(elementName).style.width = eval(this['width'])+"px";
        document.getElementById(elementName).style.top = this['top'];
        document.getElementById(elementName).style.left = this['left'];
        document.getElementById(elementName).style.transform = "rotate("+this['transform']+"deg)";
        $("#"+elementName).attr('next_page', this['page-number']);
        $("#"+elementName).attr('transition_img', this['transition']);
        $("#"+elementName+' .building-label').html('');
        $("#"+elementName+' .building-label').append('<p>'+this['name']+'</p>').append('<div class="'+this['class-name']+'"></div>');
        $("#"+elementName+' .building-label').css('top', this['name-top']);
        $("#"+elementName+' .building-label').css('left', this['name-left']);
        document.getElementById(elementName).getElementsByClassName('building-label')[0].style.transform = "rotate("+(-1*this['transform'])+"deg)";
        $("#"+elementName).unbind('click');
        document.getElementById(elementName).addEventListener("click", function(e){
            var timeTransition = 0;
            if ($("#"+e.target.id).attr("transition_img") != 'none.gif'){
                timeTransition = 1700;
                hide_building_names();
                $("#homescreen-image").attr('src', imageFolder + $("#"+e.target.id).attr("transition_img")); 
            }
            setTimeout(function(){
                build_page($("#"+e.target.id).attr("next_page"));
            }, timeTransition);
        });
    }); 
}

function build_page(page_number) {
    var mydata = JSON.parse(data);
    var imageHome = mydata['image-home'];
    hide_building_names(page_number != 1);
    $("#building-menu-items").html('');
    $("#building-menu-title").html(''); 
    $("#building-menu-description").html('');
    $("#building-menu-items-problem").html('');
    $("#building-menu-title-problem").html(''); 
    $("#building-menu-description-problem").html('');
    $('#back-button').unbind('click');
    $(mydata['pages']).each(function(){
        if (this['page-number'] == page_number) {
            /* MAIN CONTENT START*/
            if (this['page-title'] != "None")
                $("#building-menu-title").html(this['page-title']);
            $(this['menu-items']).each(function(){
                new_ele = $("<a item-image='"+this['item-image']+"'>"+this['item-name']+"</a>");
                $("#building-menu-items").append(new_ele); 
                var page_number_next = this['page-number-next'];
                if (page_number === 1) {
                    new_ele.on('click',function(e) {
                        $("#homescreen-image").attr('src', imageFolder + e.target.getAttribute("item-image"));
                        countdown(5);
                        setTimeout(function(){
                            $("#homescreen-image").attr('src', imageFolder + imageHome);
                            clearInterval(intervalId);    
                            $("#countdown").addClass("hidden-element");                        
                        }, 5000);
                    });                    
                } else {
                    new_ele.on('click',function() {
                        build_page(page_number_next);
                    });                    
                }                
            });
            $(this['page-description']).each(function(i){
                $("#building-menu-description").append("<p>"+this[i]+"<p>");                    
            });

            if ($("#building-menu-title").is(":empty") && $("#building-menu-items").is(":empty") && $("#building-menu-description").is(":empty")) {
                $("#building-menu-main").addClass('hidden-element');                
            } else {
                $("#building-menu-main").removeClass('hidden-element');                
            }    
            /* MAIN CONTENT END*/

            /* PROBLEM CONTENT START*/
            if (this['page-title-problem'] != "None")
                $("#building-menu-title-problem").html(this['page-title-problem']);

            $(this['menu-items-problem']).each(function(){
                new_ele = $("<a item-image='"+this['item-image']+"'>"+this['item-name']+"</a>");
                $("#building-menu-items-problem").append(new_ele); 
                var page_number_next = this['page-number-next'];
                new_ele.on('click',function() {
                    build_page(page_number_next);
                });                  
            });

            $(this['page-description-problem']).each(function(i){
                    $("#building-menu-description-problem").append("<p>"+this[i]+"<p>");
            });

            if ($("#building-menu-title-problem").is(":empty") && $("#building-menu-items-problem").is(":empty") && $("#building-menu-description-problem").is(":empty")) {
                $("#building-menu-problem").addClass('hidden-element');                
            } else {
                $("#building-menu-problem").removeClass('hidden-element');                
            }
            /* PROBLEM CONTENT END*/            
            
            if (allowedImages.includes(getExtension(this['page-img']))) {
                loadingImage = true;
                $("#homescreen-image").removeClass('hidden-element');
                $("#homescreen-video").addClass('hidden-element');
                $("#homescreen-image").attr('src', imageFolder + this['page-img']);
            } else {
                $("#homescreen-image").addClass('hidden-element');
                $("#homescreen-video").removeClass('hidden-element');
                $("#homescreen-video source").attr('src', videoFolder+this['page-img']);
                $("#homescreen-video source").attr('type', 'video/'+getExtension(this['page-img']).replace('.',''));
                $("#homescreen-video")[0].load();
                $("#homescreen-video")[0].play();
            }
            if (this['page-audio'] != undefined) {
                $("#homescreen-audio source").attr('src', audioFolder+this['page-audio']);
                $("#homescreen-audio source").attr('type', 'audio/'+getExtension(this['page-audio']).replace('.',''));
                $("#homescreen-audio")[0].load();
                if ($("#audio-button").attr('state') === 'on') {
                    $("#homescreen-audio")[0].play();
                }else {
                    $("#homescreen-audio")[0].pause();
                    $("#homescreen-audio")[0].currentTime = 0;
                }
            } else {
                $("#homescreen-audio source").attr('src', '');
                $("#homescreen-audio source").attr('type', '');
                $("#homescreen-audio")[0].load();
            }
            var page_number_previous = this['page-number-previous'];
            if (this['page-transition'] != undefined)
                $("#back-button").attr('page-transition', this['page-transition']);
            else
                $("#back-button").removeAttr('page-transition');
            $('#back-button').on('click', function(){
                var timeTransition = 0;
                if ($("#back-button").attr('page-transition') != undefined){
                    timeTransition = 1700;
                    hide_building_names();
                    $("#homescreen-image").attr('src', imageFolder + $("#back-button").attr('page-transition'));
                }
                setTimeout(function(){
                    build_page(page_number_previous);
                }, timeTransition);                
            });            
            return
        }            
    });
}

function hide_building_names(value=true) {
    $("#building-menu-problem").addClass("hidden-element");
    $("#building-menu-main").addClass("hidden-element");
    if (value){
        $(".building-select").addClass("hidden-element");
        $("#back-button").removeClass("hidden-element");
    } else {
        $(".building-select").removeClass("hidden-element");
        $("#back-button").addClass("hidden-element");
    }
}

function countdown(seconds) {
    $("#countdown").removeClass("hidden-element");
    var countdownNumberEl = document.getElementById('countdown-number');
    var countdown = seconds;
    countdownNumberEl.textContent = countdown;
    intervalId = setInterval(function() {
        countdown = --countdown <= 0 ? seconds : countdown;
        countdownNumberEl.textContent = countdown;            
    }, 1000);
}

function isLoadingImage(){
    return loadingImage;
}
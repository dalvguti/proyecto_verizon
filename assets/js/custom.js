let imageFolder = "";
let videoFolder = "";
let audioFolder = "";
let subtitleFolder = "";
let imageWidth = "";
let imageHeight = "";
let loadingImage = false;
let pageNumber = 1;
let intervalId = null;
let guidedTour = JSON.parse(guided_tour);
let currentStep = -1;
let guidedTourFlag = false;
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
    subtitleFolder = mydata['subtitle-folder'];
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
            if ($("#homescreen-audio source").attr('src') != '') {
                $("#homescreen-audio")[0].play();
            }
            if ($("#homescreen-video source").attr('src') != '') {
                $("#homescreen-video").prop('muted', false);
            }            
        }else {
            $("#audio-button").css('background-image', 'url(./assets/img/sound_off.png)')
            $("#audio-button").attr('state', 'off');
            if ($("#homescreen-audio source").attr('src') != '') {
                $("#homescreen-audio")[0].pause();
                $("#homescreen-audio")[0].currentTime = 0;            
            }
            if ($("#homescreen-video source").attr('src') != '') {
                $("#homescreen-video").prop('muted', true);
            }
        }
    });
    $("#caption-button").on('click', function(){
        var name_element_subtitles = '';
        if ($("#homescreen-audio track").attr('src') != '') {
            name_element_subtitles = 'homescreen-audio';
        } else if ($("#homescreen-video track").attr('src') != '') {
            name_element_subtitles = 'homescreen-video';
        }
        if ($(this).attr('state') == 'off') {
            $(this).css('background-color', '#333');
            $(this).css('color', '#FFF');
            $(this).attr('state', 'on');            
            if (name_element_subtitles != '') {
                $("#subtitle-content").removeClass('hidden-element');
            } else {
                $("#subtitle-content").addClass('hidden-element');
            }                        
        }else {
            $(this).css('background-color', '');
            $(this).css('color', '');
            $(this).attr('state', 'off');
            $("#subtitle-content").addClass('hidden-element');        
        }
    });
    $("#guide-button").on('click', function(){
        if ($(this).attr('state') == 'off') {
            $(this).css('background-color', '#333');
            $(this).css('color', '#FFF');
            $(this).attr('state', 'on');
            $("#back-button").addClass('hidden-element');
            $("#building-menu-overlay").removeClass('hidden-element');
            guidedTourFlag = true;
        } else {
            $(this).css('background-color', '');
            $(this).css('color', '');
            $(this).attr('state', 'off');
            if (currentStep != 0)
                $("#back-button").removeClass('hidden-element');
            $("#building-menu-overlay").addClass('hidden-element');
            guidedTourFlag = false;
        }
        if (guidedTourFlag) {
            if ($("#audio-button").attr('state') == 'off')
                $("#audio-button").trigger('click');
            if ($("#caption-button").attr('state') == 'off')
                $("#caption-button").trigger('click');
            if (currentStep > guidedTour.length-1) {
                $("#guide-button").trigger("click");
                resetGuidedTourStates();
                build_page(1);
            } else {
                runGuidedTour();
            }                
        } else {
            clearInterval(intervalId);
            $("#countdown").addClass('hidden-element');
            $("#building-menu-items a").removeClass('animated-item');
            $("#building-menu-items-problem a").removeClass('animated-item');
        }           
    });
}

function calculate_building_position() {    
    imageWidth = getComputedStyle(document.getElementById("homescreen-image")).width.replace('px','');
    if (imageWidth > 1024) {
        $('#homescreen-image').css('max-height', (document.body.offsetHeight * 0.99)+'px');
        $('#homescreen-video').css('max-height', (document.body.offsetHeight * 0.99)+'px');
        $('#main-content').css('overflow', 'hidden');
    } else {
        $('#homescreen-image').css('max-height', '');
        $('#homescreen-video').css('max-height', '');
        $('#main-content').css('overflow', 'visible');
    }
    var mydata = JSON.parse(data)['buildings'];
    $(mydata).each(function(){
        var elementName = this['element-name'];
        document.getElementById(elementName).style.height = eval(this['height'])+"px";
        document.getElementById(elementName).style.width = eval(this['width'])+"px";
        document.getElementById(elementName).style.top = this['top'];
        document.getElementById(elementName).style.left = this['left'];
        document.getElementById(elementName).style.transform = "rotate("+this['transform']+"deg)";
        $("#"+elementName).attr('next_page', this['page-number']);
        $("#"+elementName).attr('transition', this['transition']);
        $("#"+elementName).attr('transition-time', this['transition-time']);
        $("#"+elementName+' .building-label').html('');
        $("#"+elementName+' .building-label').append('<p>'+this['name']+'</p>').append('<div class="'+this['class-name']+'"></div>');
        $("#"+elementName+' .building-label').css('top', this['name-top']);
        $("#"+elementName+' .building-label').css('left', this['name-left']);
        document.getElementById(elementName).getElementsByClassName('building-label')[0].style.transform = "rotate("+(-1*this['transform'])+"deg)";
        $("#"+elementName).unbind('click');
        document.getElementById(elementName).addEventListener("click", function(e){
            var timeTransition = 0;
            if ($("#"+e.target.id).attr("transition") != 'none.gif'){
                timeTransition = $("#"+e.target.id).attr("transition-time");
                hide_building_names();
                executeTransition($("#"+e.target.id).attr("transition"));                
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
    $("#building-menu").removeClass('hidden-element');   
    $(mydata['pages']).each(function(){
        if (this['page-number'] == page_number) {
            if (!guidedTourFlag)
                updateGuidedTourStep(page_number, this['page-number-next']);
            hide_building_names(page_number != 1);
            clearElements();
            if (this['menu-left'] != undefined) {
                $("#building-menu").addClass('menu-left');
            } else {
                $("#building-menu").removeClass('menu-left');
            }
            /* MAIN CONTENT START*/
            if (this['page-title'] != "None")
                $("#building-menu-title").html(this['page-title']);
            $(this['menu-items']).each(function(){
                var new_ele = $("<a item-image='"+this['item-image']+"' next-page='"+this['page-number-next']+"' transition-time='"+(this['transition-time']!=undefined?this['transition-time']:0)+"'>"+this['item-name']+"</a>");
                $("#building-menu-items").append(new_ele); 
                if (page_number === 1) {
                    new_ele.on('click',function(e) {
                        $("#homescreen-image").attr('src', imageFolder + e.target.getAttribute("item-image"));
                        if (!guidedTourFlag)
                            countdown(parseInt(e.target.getAttribute("transition-time"))/1000);
                        setTimeout(function(){
                            $("#homescreen-image").attr('src', imageFolder + imageHome);
                            clearInterval(intervalId);                                                        
                        }, e.target.getAttribute("transition-time"));
                    });                    
                } else {
                    new_ele.on('click',function() {
                        var next_page = $(this).attr('next-page');
                        var transition_image = $(this).attr('item-image');
                        var transition_time = $(this).attr('transition-time');
                        if (transition_image != "undefined") {
                            executeTransition(transition_image);
                        }
                        setTimeout(function(){
                            build_page(next_page);
                            clearInterval(intervalId);                                                        
                        }, transition_time);                    
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
                var new_ele = $("<a item-image='"+this['item-image']+"' next-page='"+this['page-number-next']+"' transition-time='"+(this['transition-time']!=undefined?this['transition-time']:0)+"'>"+this['item-name']+"</a>");
                $("#building-menu-items-problem").append(new_ele); 
                new_ele.on('click',function() {
                    var next_page = $(this).attr('next-page');
                    var transition_image = $(this).attr('item-image');
                    var transition_time = $(this).attr('transition-time');
                    if (transition_image != "undefined") {
                        executeTransition(transition_image);
                    }
                    setTimeout(function(){
                        build_page(next_page);
                        clearInterval(intervalId);                                                        
                    }, transition_time);                    
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
            
            /* HOW IT WORKS START */
            if (this['page-title-work'] != undefined)
                $("#building-menu-title-work").html(this['page-title-work']);

            $(this['menu-items-work']).each(function(){
                var new_ele = $("<a item-image='"+this['item-image']+"' next-page='"+this['page-number-next']+"' transition-time='"+(this['transition-time']!=undefined?this['transition-time']:0)+"'>"+this['item-name']+"</a>");
                $("#building-menu-items-work").append(new_ele); 
                new_ele.on('click',function() {
                    var next_page = $(this).attr('next-page');
                    var transition_image = $(this).attr('item-image');
                    var transition_time = $(this).attr('transition-time');
                    if (transition_image != "undefined") {
                        executeTransition(transition_image);
                    }
                    setTimeout(function(){
                        build_page(next_page);
                        clearInterval(intervalId);                                                        
                    }, transition_time);                    
                });
            });

            $(this['page-description-work']).each(function(i){
                    $("#building-menu-description-work").append("<p>"+this[i]+"<p>");
            });

            if ($("#building-menu-title-work").is(":empty") && $("#building-menu-items-work").is(":empty") && $("#building-menu-description-work").is(":empty")) {
                $("#building-menu-work").addClass('hidden-element');                
            } else {
                $("#building-menu-work").removeClass('hidden-element');                
            }
            /* HOW IT WORKS END */
            
            if (!isVideo(this['page-img'])) {
                $("#homescreen-image").removeClass('hidden-element');
                $("#homescreen-video").addClass('hidden-element');
                $("#homescreen-image").attr('src', imageFolder + this['page-img']);
            } else {
                $("#homescreen-image").addClass('hidden-element');
                $("#homescreen-video").removeClass('hidden-element');
                $("#homescreen-video source").attr('src', videoFolder+this['page-img']);
                $("#homescreen-video source").attr('type', 'video/'+getExtension(this['page-img']).replace('.',''));
                if (this['page-subtitles'] != undefined) {
                    if (this['page-subtitles']['type'] == 'video') {
                        $("#homescreen-video track").attr('src', subtitleFolder+this['page-subtitles']['file']);
                        document.getElementById("homescreen-video").textTracks[0].mode = 'hidden';
                        $("#homescreen-audio track").attr('src', '');
                    }  
                    if ($("#caption-button").attr('state') == 'on')
                        $("#subtitle-content").removeClass('hidden-element');
                    else
                        $("#subtitle-content").addClass('hidden-element');                  
                }
                document.getElementById("homescreen-video").load();
                document.getElementById('homescreen-video').textTracks[0].removeEventListener('cuechange', function() {
                    document.getElementById('subtitle-display').innerText = this.activeCues[0].text;                
                });
                document.getElementById('homescreen-video').textTracks[0].addEventListener('cuechange', function() {
                    document.getElementById('subtitle-display').innerText = this.activeCues[0].text;                
                });
                if ($("#audio-button").attr('state') === 'on') {
                    $("#homescreen-video").prop('muted', false);
                }else {
                    $("#homescreen-video").prop('muted', true);
                }  
                document.getElementById("homescreen-video").play();
            }
            if (this['page-audio'] != undefined) {
                $("#homescreen-audio source").attr('src', audioFolder+this['page-audio']);
                $("#homescreen-audio source").attr('type', 'audio/'+getExtension(this['page-audio']).replace('.',''));
                if (this['page-subtitles'] != undefined) {
                    if (this['page-subtitles']['type'] == 'audio') {
                        $("#homescreen-audio track").attr('src', subtitleFolder+this['page-subtitles']['file']);
                        $("#homescreen-video track").attr('src', '');
                    }
                    if ($("#caption-button").attr('state') == 'on')
                        $("#subtitle-content").removeClass('hidden-element');
                    else
                        $("#subtitle-content").addClass('hidden-element');                    
                }
                $("#homescreen-audio")[0].load();
                document.getElementById('homescreen-audio').textTracks[0].removeEventListener('cuechange', function() {
                    document.getElementById('subtitle-display').innerText = this.activeCues[0].text;                
                });
                document.getElementById('homescreen-audio').textTracks[0].addEventListener('cuechange', function() {
                    document.getElementById('subtitle-display').innerText = this.activeCues[0].text;                
                });
                if ($("#audio-button").attr('state') === 'on') {
                    $("#homescreen-audio")[0].play();
                }else {
                    $("#homescreen-audio")[0].pause();
                    $("#homescreen-audio")[0].currentTime = 0;
                }                
            } 
            var page_number_previous = this['page-number-previous'];
            if (this['page-transition-out'] != undefined){
                $("#back-button").attr('page-transition', this['page-transition-out']);
                $("#back-button").attr('page-transition-time', this['page-transition-time']);
            }
            else{
                $("#back-button").removeAttr('page-transition');
                $("#back-button").removeAttr('page-transition-time');
            }
            $('#back-button').on('click', function(){
                var timeTransition = 0;
                if ($("#back-button").attr('page-transition') != undefined){
                    timeTransition = $("#back-button").attr('page-transition-time');
                    hide_building_names();
                    executeTransition($("#back-button").attr('page-transition'));                    
                }
                setTimeout(function(){
                    console.log(page_number_previous);
                    build_page(page_number_previous);
                }, timeTransition);                
            });    
            if (guidedTourFlag) {
                runGuidedTour();
            }
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
    clearInterval(intervalId);
    $("#countdown").removeClass("hidden-element");
    var countdownNumberEl = document.getElementById('countdown-number');
    var countdown = seconds;
    countdownNumberEl.textContent = countdown--;
    intervalId = setInterval(function() {
        //countdown = --countdown <= 0 ? seconds : countdown;
        countdownNumberEl.textContent = countdown--;  
        if (countdown < 0)
            $("#countdown").addClass("hidden-element"); 
    }, 1000);
}

function isLoadingImage(){
    return loadingImage;
}

function isVideo(filename) {
    return !allowedImages.includes(getExtension(filename));
}

function executeTransition(filename) {
    $("#building-menu").addClass('hidden-element');
    $("#homescreen-image").addClass('hidden-element');
    $("#homescreen-video").addClass('hidden-element');
    if (isVideo(filename)) {
        $("#homescreen-video source").attr('src', videoFolder + filename);
        document.getElementById('homescreen-video').load();
        $("#homescreen-video").removeClass('hidden-element');
    } else {
        $("#homescreen-image").attr('src', imageFolder + filename);
        $("#homescreen-image").removeClass('hidden-element');
    }
}

function clearElements() {
    $("#building-menu-items").html('');
    $("#building-menu-title").html(''); 
    $("#building-menu-description").html('');
    $("#building-menu-items-problem").html('');
    $("#building-menu-title-problem").html(''); 
    $("#building-menu-description-problem").html('');
    $("#building-menu-items-work").html('');
    $("#building-menu-title-work").html(''); 
    $("#building-menu-description-work").html('');
    $("#homescreen-audio source").attr('src', '');
    $("#homescreen-audio source").attr('type', '');
    $("#homescreen-audio track").attr('src', '');
    $("#homescreen-audio")[0].load();
    $("#homescreen-video source").attr('src', '');
    $("#homescreen-video source").attr('type', '');
    $("#homescreen-video track").attr('src', '');
    document.getElementById('homescreen-video').load();
    $('#back-button').unbind('click');
    $("#subtitle-content").addClass('hidden-element');
}

function resetGuidedTourStates() {
    $(guidedTour).each(function(){
        this['state'] = false;
    });
}

function updateGuidedTourStep(page_number, next_page) {
    resetGuidedTourStates();
    $(guidedTour).each(function(){
        if (parseInt(this['page_number']) == parseInt(page_number) && parseInt(this['next_page']) == parseInt(next_page))
            currentStep = this['step'];
    });
    $(guidedTour).each(function(){
        if (parseInt(this['step']) < parseInt(currentStep))
            this['state'] = true;
    });    
}

function runGuidedTour() {
    if (!guidedTourFlag)
        return;
    if (currentStep >= guidedTour.length-1) {
        resetGuidedTourStates();
        currentStep = 0;
    }
    $("a[next-page='"+guidedTour[currentStep]['next_page']+"']").addClass("animated-item");
    setTimeout(function(){
        if (!guidedTourFlag)
            return;
        countdown(guidedTour[currentStep]['time']);
        guidedTour[currentStep]['state'] = true;
        if (guidedTour[currentStep]['building'] != undefined) {
            $("#"+guidedTour[currentStep]['building']).trigger('click');
        } else if (guidedTour[currentStep]['next_page'] === 0){
            $("#back-button").trigger('click');
        } else {
            $("a[next-page='"+guidedTour[currentStep]['next_page']+"']").trigger('click');
        }
        currentStep += 1;
    }, parseInt(guidedTour[currentStep]['time']) * 1000);    
}
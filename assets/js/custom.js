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
            runGuidedTour();
            if (currentStep > guidedTour.length-1) {
                $("#guide-button").trigger("click");
                build_page(1);
            }                
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
        $("#"+elementName+' .building-label').html('');
        $("#"+elementName+' .building-label').append('<p>'+this['name']+'</p>').append('<div class="'+this['class-name']+'"></div>');
        $("#"+elementName+' .building-label').css('top', this['name-top']);
        $("#"+elementName+' .building-label').css('left', this['name-left']);
        document.getElementById(elementName).getElementsByClassName('building-label')[0].style.transform = "rotate("+(-1*this['transform'])+"deg)";
        $("#"+elementName).unbind('click');
        document.getElementById(elementName).addEventListener("click", function(e){
            var timeTransition = 0;
            if ($("#"+e.target.id).attr("transition") != 'none.gif'){
                timeTransition = 1700;
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
    $(mydata['pages']).each(function(){
        if (this['page-number'] == page_number) {
            if (!guidedTourFlag)
                updateGuidedTourStep(page_number, this['page-number-next']);
            hide_building_names(page_number != 1);
            clearElements();
            /* MAIN CONTENT START*/
            if (this['page-title'] != "None")
                $("#building-menu-title").html(this['page-title']);
            $(this['menu-items']).each(function(){
                new_ele = $("<a item-image='"+this['item-image']+"' next-page='"+this['page-number-next']+"'>"+this['item-name']+"</a>");
                $("#building-menu-items").append(new_ele); 
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
                        build_page($(this).attr('next-page'));
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
                new_ele = $("<a item-image='"+this['item-image']+"' next-page='"+this['page-number-next']+"'>"+this['item-name']+"</a>");
                $("#building-menu-items-problem").append(new_ele); 
                new_ele.on('click',function() {
                    build_page($(this).attr('next-page'));
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
            if (this['page-transition'] != undefined)
                $("#back-button").attr('page-transition', this['page-transition']);
            else
                $("#back-button").removeAttr('page-transition');
            $('#back-button').on('click', function(){
                if (guidedTourFlag) 
                    return;
                var timeTransition = 0;
                if ($("#back-button").attr('page-transition') != undefined){
                    timeTransition = 1700;
                    hide_building_names();
                    executeTransition($("#back-button").attr('page-transition'));                    
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

function isVideo(filename) {
    return !allowedImages.includes(getExtension(filename));
}

function executeTransition(filename) {
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
    if (currentStep >= guidedTour.length-1 || !guidedTourFlag)
        return;
    if (guidedTour[currentStep]['building'] != undefined){
        countdown(guidedTour[currentStep]['time']);
        $("#building1").trigger('click');
    } else {
        countdown(guidedTour[currentStep]['time']);
        build_page(guidedTour[currentStep]['page_number']);
    }
    setTimeout(function(){
        $("a[next-page='"+guidedTour[currentStep]['next_page']+"']").css("background-color", "#333");        
    }, 2000);
    setTimeout(function(){
        clearInterval(intervalId);
        currentStep += 1;    
        $("#countdown").addClass("hidden-element");
        guidedTour[currentStep]['state'] = true;
        runGuidedTour();    
    }, parseInt(guidedTour[currentStep]['time']) * 1000);    
}
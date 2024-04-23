let imageFolder = "";
let videoFolder = "";
let pageNumber = 1;
const allowedImages = ['.jpg', '.png', '.gif'];
const getExtension = str => str.slice(str.lastIndexOf("."));

$(document).ready(function() {
    $('#building-menu a').on('click', function(){
        $("#homescreen-image").attr('src', imageFolder + $(this).attr('item-image'));
        setTimeout(function(){
            $("#homescreen-image").attr('src', imageFolder + 'home.jpg');
        }, 5000);
    });
});

window.onresize = calculate_building_position;

function initialize() {
    var mydata = JSON.parse(data); 
    imageFolder = mydata['image-folder'];
    videoFolder = mydata['video-folder'];
    document.title = mydata['title'];
    $("#back-button").html(mydata['back-button']);
    build_page(1);
    calculate_building_position();
}

function calculate_building_position() {
    var mydata = JSON.parse(data)['buildings'];

    /* Position of the buildings */
    var img = document.getElementById('homescreen-image'); 
    var width = img.clientWidth;

    $(mydata).each(function(){
        var elementName = this['element-name'];
        document.getElementById(elementName).style.height = eval(this['height'])+"px";
        document.getElementById(elementName).style.width = eval(this['width'])+"px";
        document.getElementById(elementName).style.top = this['top'];
        document.getElementById(elementName).style.left = this['left'];
        document.getElementById(elementName).style.transform = this['transform'];
        $("#"+elementName).attr('next_page', this['page-number']);
        $("#"+elementName).attr('transition_img', this['transition']);
        tippy('#'+elementName, {
            content: this['name'],
            arrow: true,
            followCursor: true,
        });
        document.getElementById(elementName).addEventListener("click", function(e){
            $("#homescreen-image").attr('src', imageFolder + $("#"+e.target.id).attr("transition_img"));
            setTimeout(function(){
                build_page($("#"+e.target.id).attr("next_page"));
            }, 1700);
        });
    }); 
}

function build_page(page_number) {
    var mydata = JSON.parse(data)['pages'];
    $("#building-menu-items").html('');
    $("#building-menu-title").html(''); 
    $("#building-menu-description").html('');
    $('#back-button').unbind('click');
    $(mydata).each(function(){
        if (this['page-number'] == page_number) {
            if (this['page-title'] !== "None")
                $("#building-menu-title").html(this['page-title']);
            $(this['menu-items']).each(function(){
                new_ele = $("<a item-image='"+this['item-image']+"'>"+this['item-name']+"</a>");
                $("#building-menu-items").append(new_ele); 
                var page_number_next = this['page-number-next'];
                if (page_number === 1) {
                    new_ele.on('click',function(e) {
                        $("#homescreen-image").attr('src', imageFolder + e.target.getAttribute("item-image"));
                    });                    
                } else {
                    new_ele.on('click',function() {
                        build_page(page_number_next);
                    });                    
                }                
            });
            $(this['page-description']).each(function(i){
                if (this[i] !== "None")
                    $("#building-menu-description").append("<p>"+this[i]+"<p>");
            });
            if ($("#building-menu-title").is(":empty") && $("#building-menu-items").is(":empty") && $("#building-menu-description").is(":empty")) {
                $("#building-menu").addClass('hidden-element');                
            } else {
                $("#building-menu").removeClass('hidden-element');                
            }    
            if (allowedImages.includes(getExtension(this['page-img']))) {
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
            var page_number_previous = this['page-number-previous'];
            if (this['page-transition'] !== undefined)
                $("#back-button").attr('page-transition', this['page-transition']);
            else
                $("#back-button").removeAttr('page-transition');
            $('#back-button').on('click', function(){
                var timeTransition = 0;
                if ($("#back-button").attr('page-transition') !== undefined){
                    timeTransition = 1700;
                    $("#homescreen-image").attr('src', imageFolder + $("#back-button").attr('page-transition'));
                }
                setTimeout(function(){
                    build_page(page_number_previous);
                }, timeTransition);                
            });
            hide_building_names(page_number !== 1);
            return
        }            
    });
}

function hide_building_names(value=true) {
    if (value){
        $(".building-select").addClass("hidden-element");
        $("#back-button").removeClass("hidden-element");
    } else {
        $(".building-select").removeClass("hidden-element");
        $("#back-button").addClass("hidden-element");
    }
}
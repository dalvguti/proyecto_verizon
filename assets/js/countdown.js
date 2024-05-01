var countdownWidth = 0,
  countdownHeight = 0,
  countdownTimePassed = 0,
  countdownTimeLimit = 5;

var timerStarted = false;

var timerInstance = null,
    fields = null,
    nilArc = null,
    arc = null,
    svg = null,
    field = null,
    back = null,
    path = null,
    label = null;

function calculateCountdownVariables() {
    nullAllVariables();
    fields = [{
        value: countdownTimeLimit,
        size: countdownTimeLimit,
        update: function() {
          return countdownTimePassed = countdownTimePassed + 1;
        }
      }];
      
    nilArc = d3.svg.arc()
        .innerRadius(countdownWidth / 2)
        .outerRadius(countdownWidth / 2)
        .startAngle(0)
        .endAngle(2 * Math.PI);
      
    arc = d3.svg.arc()
        .innerRadius(countdownWidth / 2 - 3)
        .outerRadius(countdownWidth / 2 - 1)
        .startAngle(0)
        .endAngle(function(d) {
          return ((d.value / d.size) * 2 * Math.PI);
        });
      
    svg = d3.select("#countdown").append("svg")
        .attr("width", countdownWidth)
        .attr("height", countdownHeight);
      
    field = svg.selectAll(".fieldV")
        .data(fields)
        .enter().append("g")
        .attr("transform", "translate(" + countdownWidth / 2 + "," + countdownHeight / 2 + ")")
        .attr("class", "fieldV");

    back = field.append("path")
        .attr("class", "path path--background")
        .attr("d", arc);

    path = field.append("path")
        .attr("class", "path path--foreground");

    label = field.append("text")
        .attr("class", "label")
        .attr("dy", ".35em");
}  

function nullAllVariables() {
    fields = null;
    nilArc = null;
    arc = null;
    svg = null;
    field = null;
    back = null;
    path = null;
    label = null;
}

function updateTimer() {
    field.each(function(d) {
        d.previous = d.value, d.value = d.update(countdownTimePassed);
    });
    path.transition()
        .ease("elastic")
        .duration(500)
        .attrTween("d", arcTween);
    label.text(function(d) {
        return d.size - d.value;
    });
    if (countdownTimePassed <= countdownTimeLimit)
        timerInstance = setTimeout(updateTimer, 1000 - (countdownTimePassed % 1000));
    else
        destroyTimer();
}

function destroyTimer() {
    $("#countdown").addClass("hidden-element");
    $("#countdown").empty();
    timerStarted = false;
}

function arcTween(b) {
    var i = d3.interpolate({
        value: b.previous
        }, b);
        return function(t) {
            return arc(i(t));
    };
}
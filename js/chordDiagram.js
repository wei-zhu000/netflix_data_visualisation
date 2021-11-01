let chordSvg;

let countryNames = ["United States", "India", "United Kingdom", "Canada", "France", "Japan", "Spain", "South Korea", "Germany", "Mexico"];

let chordTc = d3.select('#tooltip-container');

window.onload = initChordDiagram();

function initChordDiagram() {
    chordSvg = d3.select('#chord-svg-container')
        .append('svg')
        .attr("width", '100%')
        .attr("height", 920)

    plot();

}

function plot() {
    d3.csv('https://raw.githubusercontent.com/wei-zhu000/netflix_data_visualisation/master/data/country_matrix.csv', function (data) {
        //"United States","India","United Kingdom","Canada","France","Japan","Spain","South Korea","Germany","Mexico"
        list = [parseInt(data['United States']),
        parseInt(data['India']),
        parseInt(data['United Kingdom']),
        parseInt(data['Canada']),
        parseInt(data['France']),
        parseInt(data['Japan']),
        parseInt(data['Spain']),
        parseInt(data['South Korea']),
        parseInt(data['Germany']),
        parseInt(data['Mexico'])]
        return list;
    }).then(function (matrix) {
        var chord = d3.chord()
            .padAngle(.04)     // padding between entities
            .sortSubgroups(d3.descending)
            .sortChords(d3.descending)
            (matrix);

        var chordFill = d3.schemeTableau10;
        var innerRadius = 290;
        var outerRadius = 300;
        var arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        chordSvg
            .append("g")
            .attr("transform", "translate(480,460)");

        chordSvg
            .datum(chord)
            .select('g')
            .append("g")
            .selectAll("g")
            .data(function (d) { return d.groups; })
            .enter()
            .append("g")
            .attr('class', function (d) { return 'group ' + countryNames[d.index] })
            .append("path")
            .style("fill", function (d) { return chordFill[d.index] })
            .style("stroke", function (d) { return chordFill[d.index] })
            .attr("d", arc)
            .attr('class', 'arc')
            .on('mouseover', fadeChords(0))
            .on('mouseout', fadeChords(.8))
            .on('mousemove', updateTooltipPosition);

        // Add the links between groups
        var ribbon = d3.ribbon()
            .radius(innerRadius);

        chordSvg
            .datum(chord)
            .select('g')
            .append("g")
            .selectAll("path")
            .data(function (d) { return d; })
            .enter()
            .append("path")
            .attr("class", "chord")
            .attr("d", ribbon)
            .style("fill", function (d) { return chordFill[d.source.index] })
            .style("stroke", function (d) { return d3.rgb(chordFill[d.source.index]).brighter() })
            .attr('opacity', '.8')
            .on('mouseover', fadeChords(0))
            .on('mouseout', fadeChords(.8))
            .on('mousemove', updateTooltipPosition);

        // Add ticks and tick labels
        var ticks = chordSvg.selectAll(".group")
            .append("g")
            .attr("class", function (d) { return "ticks " + countryNames[d.index]; })
            .selectAll("g.ticks")
            .attr("class", "ticks")
            .data(groupTicks)
            .enter()
            .append("svg:g")
            .attr("transform", function (d) {
                var translateX = outerRadius + 10;
                return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                    + "translate(" + translateX + ",0)";
            });

        ticks.append("svg:line")
            .attr("x1", 1)
            .attr("y1", 0)
            .attr("x2", 5)
            .attr("y2", 0)
            .attr("class", "ticks")
            .style("stroke", "rgb(250,250,250)");

        ticks.append("svg:text")
            .attr("x", 8)
            .attr("dy", 3)
            .attr("class", "tickLabels")
            .attr('font-size', 10)
            .attr("transform", function (d) { return d.angle > Math.PI ? "rotate(180)translate(-16)" : null; })
            .style("text-anchor", function (d) { return d.angle > Math.PI ? "end" : null; })
            .style('fill', 'rgb(250,250,250)')
            .text(function (d) { 
                return d.label; 
            });

        d3.selectAll('.group')
        .append('text')
        .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr('dy', 3)
        .attr("class", "titles")
        .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
        .attr("transform", function(d) {
              return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
              + "translate(" + (innerRadius + 60) + ")"
              + (d.angle > Math.PI ? "rotate(180)" : "");
        })
        .text(function(d,i) { return countryNames[i]; })
        .style('fill', 'rgb(250,250,250)')
        .on('mouseover', fadeChords(0))
        .on('mousemove', updateTooltipPosition)
        .on('mouseout', fadeChords(.8));
    
    });
}

function groupTicks(d) {
    var k = (d.endAngle - d.startAngle) / d.value;
    return d3.range(0, d.value, 50).map(function (v, i) {
        console.log(v);
        return {
            angle: v * k + d.startAngle,
            label: v % 200 == 0 ? v : null
        };
    });
};

function fadeChords(opacity){
    return function(d, i) {
        var cls = this.getAttribute('class');
        var index = cls == 'chord' ? i.source.index : i.index;
        console.log(i)
        chordSvg.selectAll("path.chord")
            .filter(function(d) { return d.source.index != index && d.target.index != index; })
            .transition()
            .duration(500)
            .style("opacity", opacity);
        if(d.type == 'mouseover'){
            if(cls == 'chord'){
                if(i.source.index == i.target.index){
                    chordTc.style("display", "block");
                    tc.html('<p id="tooltip-text"> The numebr of movies and TV shows produced by ONLY <span style="font-weight:bold"> ' + countryNames[i.source.index] + ' </span> is <span style="font-weight:bold"> ' + i.source.value + '</span>.</p>');
                }else{
                    chordTc.style("display", "block");
                    tc.html('<p id="tooltip-text"> The numebr of movies and TV shows produced by <br><span style="font-weight:bold"> ' + countryNames[i.source.index] + ' </span> and <span style="font-weight:bold"> ' + countryNames[i.target.index] + ' </span> is <span style="font-weight:bold"> ' + i.source.value + '</span>.</p>');
                }
            }else{
                chordTc.style("display", "block");
                    tc.html('<p id="tooltip-text"> The total number of movies and TV shows that <span style="font-weight:bold"> ' + countryNames[i.index] + '</span> <br> has participated in production is <span style="font-weight:bold"> ' + i.value + '</span>.</p>');
            }
        }
        if(d.type == 'mouseout'){
            chordTc.style("display", "none");
        }
      };
}

function updateTooltipPosition(){
    chordTc
    .style("top", (event.pageY + 10) + "px")
    .style("left", (event.pageX + 10) + "px")
}



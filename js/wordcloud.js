let svg;
let fill;
let wordcloudtc;
let wordcloudtt;

window.onload = initWordCloud();

function initWordCloud() {
    // initiate variables
    svg = d3.select('#word-cloud');
    svg.attr('width', '660px')
        .attr('height', '700px');

    fill = d3.schemePaired;

    wordcloudtc = d3.select('#tooltip-container');
    wordcloudtt = d3.select('#tooltip-text');

    // render elements
    renderDropdown();
    renderWordCloud('All');
}

function renderDropdown() {
    d3.csv('data/genre.csv', function (data) {
        d3.select('#wc-control')
            .append('button')
            .attr('class', 'btn-outline-sm')
            .text(data.x)
            .on('click', function () {
                renderWordCloud(data.x);
            });
    });

}

function renderWordCloud(genre) {
    d3.csv('data/word_frequency.csv', function (data) {
        var word_frequency;
        if (data.genre == genre) {
            word_frequency = { word: data.word, size: data.freq, genre: data.genre };
        }
        return word_frequency;
    }).then(function (d) {
        let layout = d3.layout.cloud()
            .size([660, 700])
            .words(d.map(function (data) {
                return { text: data.word, size: data.size, genre: data.genre }
            }))
            .rotate(function () { return ~~(Math.random() * 2) * 90; })
            .font("Georgia")
            .fontSize(function (d) {
                if (d.genre == 'All') {
                    return d.size;
                } else {
                    if (d.size < 10) {
                        return d.size * 10;
                    } else {
                        return d.size * 5;
                    }
                }
            })
            .on("end", draw)
            .start();

        d3.selectAll('.wc-text')
        .on('mouseover', function(d, i){
            wordcloudtc.style("display", "block");
            content = "Word: " + i.text + "<br>" + "Frequency: " + i.size;
            wordcloudtc.html(content);
        })
        .on('mousemove', function(){
            wordcloudtc
            .style("top", (event.pageY + 10) + "px")
            .style("left", (event.pageX + 10) + "px")
        })
        .on('mouseout', function(){
            wordcloudtc.style("display", "none");
        });
    });
}

function draw(words) {
    d3.select('g')
        .transition()
        .duration(500)
        .style('opacity', 0)
        .remove();

    svg
        .append("g")
        .attr("transform", "translate(330,350)")
        .selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .attr('class', 'wc-text')
        .transition()
        .duration(1000)
        .style("font-size", function (d) { return d.size + "px"; })
        .style("font-family", function (d) { return d.font; })
        .attr("text-anchor", "middle")
        .attr('fill', function () { return fill[Math.floor(Math.random() * 11)]; })
        .attr("transform", function (d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function (d) { return d.text; })
}
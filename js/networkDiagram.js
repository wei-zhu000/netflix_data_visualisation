let link;
let node;
let simulation;


var nwSvg = d3.select('#network-diagram')
    .append('svg')
    .attr('id', 'network-svg')
    .attr('width', '100%')
    .attr('height', '100%');

let nodeLayer;
let linkLayer;
let tc = d3.select('#tooltip-container');
let tt = d3.select('#tooltip-text');

var dropDown = d3.select("#cast-select");

cast = ["Anupam Kher", "Shah Rukh Khan", "Naseeruddin Shah", "Om Puri", "Takahiro Sakurai", "Akshay Kumar", "Boman Irani", "Amitabh Bachchan", "Paresh Rawal", "Yuki Kaji"];

cast.forEach(element => {
    dropDown
        .append('option')
        .text(element)
        .attr('value', element);
});

dropDown.on('change', function () { drawNetworkDiagram(d3.select(this).property('value'), 1000) });

drawNetworkDiagram('Anupam Kher');

function drawNetworkDiagram(castName, animationDuration) {

    d3.select('#link-layer')
        .transition()
        .duration(animationDuration)
        .style('opacity', 0)
        .remove();

    d3.select('#node-layer')
        .transition()
        .duration(animationDuration)
        .style('opacity', 0)
        .remove();

    simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function (d) { return d.id; }))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(483 / 2, 450));

    var linkPath = 'data/network/link/links_' + castName + '.csv';
    var nodePath = 'data/network/node/nodes_' + castName + '.csv';

    d3.csv(linkPath).then(function (linkData) {
        linkLayer = nwSvg
            .append('g')
            .attr('id', 'link-layer');
        linkLayer
            .style('opacity', 0)
            .transition()
            .duration(animationDuration)
            .style('opacity', 1);

        data = linkData.map(function (d) {
            return {
                from: d.from,
                to: d.to,
                source: parseInt(d.source),
                target: parseInt(d.target)
            };
        });

        link = linkLayer
            .selectAll('line')
            .data(data)
            .enter()
            .append("line")
            .attr("stroke-width", '1px')
            .attr('stroke', 'rgb(250,250,250)');

        d3.csv(nodePath).then(function (nodeData) {
            nodeLayer = nwSvg
                .append('g')
                .attr('id', 'node-layer');
            nodeLayer
                .style('opacity', 0)
                .transition()
                .duration(animationDuration)
                .style('opacity', 1);

            cast = nodeData.map(function (d) {
                return { name: d.name, id: parseInt(d.id) };
            });

            node = nodeLayer
                .selectAll('circle')
                .data(cast)
                .enter()
                .append("circle")
                .attr("fill", function (d) {
                    if (d.name == castName) {
                        return "rgb(216, 36, 38)"
                    } else {
                        return "rgb(255, 190, 92)"
                    }
                })
                .attr('class', function (d) { return 'node ' + d.name; })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended))
                .on('mouseover', function (d, i) {
                    tc.style("display", "block");
                    tc.html('<p id="tooltip-text">' + i.name + '</p>');
                })
                .on('mousemove', function () {
                    tc
                        .style("top", (event.pageY + 10) + "px")
                        .style("left", (event.pageX + 10) + "px")
                })
                .on('mouseout', function () {
                    tc.style("display", "none");
                });

            simulation.nodes(cast)
                .on('tick', ticked);
            simulation.force("link")
                .links(data);


            let zoom = d3.zoom()
                .on('zoom', e => {
                    linkLayer.attr("transform", (transform = e.transform));
                    linkLayer.style("stroke-width", 3 / Math.sqrt(transform.k));
                    nodeLayer.attr("transform", (transform = e.transform));
                    nodeLayer.style("stroke-width", 3 / Math.sqrt(transform.k));
                    node.attr("r", function (d) { return 8 / Math.sqrt(transform.k) });
                })
                .on("start", function () {
                    document.getElementsByTagName("svg")[1].style.cursor = "grabbing";
                })
                .on("end", function () {
                    document.getElementsByTagName("svg")[1].style.cursor = "grab";
                });

            nwSvg
                .call(zoom)
                .call(zoom.transform, d3.zoomIdentity);
        });
    });
}

function ticked() {
    link
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });
    node
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
}

function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
}

function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
}

function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
}
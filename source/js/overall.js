// overall.js

function main() {

    d3.select('#overall-chart')
      .append('svg')
      .attr('width', 500)
      .attr('height', 300)
      .append('text')
      .attr('x', 50)
      .attr('y', 50)
      .attr('fill', 'white')
      .text('Overall Stats Chart Placeholder');

}
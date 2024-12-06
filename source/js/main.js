// main.js

document.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname.split("/").pop();

  if (currentPage === 'overall.html') {
    // Initialize D3 overall chart
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

  if (currentPage === 'season.html') {
    // Initialize D3 season chart
    d3.select('#season-chart')
      .append('svg')
      .attr('width', 500)
      .attr('height', 300)
      .append('text')
      .attr('x', 50)
      .attr('y', 50)
      .attr('fill', 'white')
      .text('Season Stats Chart Placeholder');
  }

  if (currentPage === 'race.html') {
    // Initialize D3 race chart
    d3.select('#race-chart')
      .append('svg')
      .attr('width', 500)
      .attr('height', 300)
      .append('text')
      .attr('x', 50)
      .attr('y', 50)
      .attr('fill', 'white')
      .text('Race Stats Chart Placeholder');
  }
});
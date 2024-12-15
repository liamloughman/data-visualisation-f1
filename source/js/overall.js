let racesDataGlobal = [];
let svgRaceCount;
let xScaleRaceCount, yScaleRaceCount, xAxisRaceCount, yAxisRaceCount, lineGeneratorRaceCount;
let gRaceCount;
let tooltipRaceCount;

function main() {
    const racesCsvPath = 'data/races.csv';
    d3.csv(racesCsvPath).then(function (racesData) {
        racesData.forEach(d => {
            d.raceId = +d.raceId;
            d.year = +d.year;
        });
        racesDataGlobal = racesData;

        const years = Array.from(new Set(racesData.map(d => d.year))).sort((a, b) => a - b);

        initializeYearSlider(years);

        initializeRaceCountChart(years);

        createInitialCharts(racesData, years);
    }).catch(console.error);
}

function initializeYearSlider(years) {
    const slider = d3.select('#year-slider');
    const selectedYearLabel = d3.select('#selected-year');

    slider
        .attr('min', d3.min(years))
        .attr('max', d3.max(years))
        .attr('value', d3.max(years))
        .attr('step', 1);

    selectedYearLabel.text(d3.max(years));

    slider.on('input', function () {
        const selectedYear = +this.value;
        selectedYearLabel.text(selectedYear);
        updateChartsUpToYear(selectedYear);
    });
}

function createInitialCharts(racesData, years) {
    updateChartsUpToYear(d3.max(years));
}

function updateChartsUpToYear(selectedYear) {
    updateRaceCount(selectedYear);
    updateAverageSpeed(selectedYear);
    updateConstructorWins(selectedYear);
    updateDriverQualifyingTime(selectedYear);
    updateAveragePitStopTime(selectedYear);
    updateCircuitDistributionMap(selectedYear);
    updateDriverNationalityMap(selectedYear);
}

function initializeRaceCountChart(years) {
    const raceCountDiv = d3.select('#race-count');
    raceCountDiv.html('');
    const svgWidth = 500;
    const svgHeight = 300;
    const margin = {top: 20, right: 30, bottom: 70, left: 80};

    svgRaceCount = raceCountDiv.append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .style('display', 'block')
        .style('margin', '0 auto');

    gRaceCount = svgRaceCount.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    xScaleRaceCount = d3.scaleLinear()
        .range([0, width]);
    yScaleRaceCount = d3.scaleLinear()
        .range([height, 0]);

    xAxisRaceCount = gRaceCount.append('g')
        .attr('transform', `translate(0,${height})`);
    yAxisRaceCount = gRaceCount.append('g');

    lineGeneratorRaceCount = d3.line()
        .x(d => xScaleRaceCount(d.year))
        .y(d => yScaleRaceCount(d.cumulativeRaces))
        .curve(d3.curveMonotoneX);

    svgRaceCount.append("text")
        .attr("x", svgWidth / 2)
        .attr("y", svgHeight - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#ffffff")
        .style("font-family", "Formula1")
        .style("font-size", "14px")
        .text("Year");

    svgRaceCount.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 20)
        .attr("x", -svgHeight / 2 + 25)
        .attr("text-anchor", "middle")
        .attr("fill", "#ffffff")
        .style("font-family", "Formula1")
        .style("font-size", "14px")
        .text("Cumulative Race Count");

    gRaceCount.append('path')
        .attr('class', 'race-count-line')
        .attr('fill', 'none')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2);

    tooltipRaceCount = d3.select("body").append("div")
        .attr("class", "tooltip-race-count")
        .style("position", "absolute")
        .style("background-color", "#222")
        .style("color", "#ffffff")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("font-family", "Formula1")
        .style("font-size", "14px")
        .style("box-shadow", "0px 0px 10px rgba(0,0,0,0.5)");
}

function updateRaceCount(selectedYear) {
    const filteredData = racesDataGlobal.filter(d => d.year <= selectedYear);

    const raceCountPerYear = d3.rollups(
        filteredData,
        v => v.length,
        d => d.year
    ).map(d => ({year: d[0], raceCount: d[1]}))
        .sort((a, b) => a.year - b.year);

    let cumulative = 0;
    const cumulativeData = raceCountPerYear.map(d => {
        cumulative += d.raceCount;
        return {year: d.year, raceCount: d.raceCount, cumulativeRaces: cumulative};
    });

    xScaleRaceCount.domain(d3.extent(cumulativeData, d => d.year));
    yScaleRaceCount.domain([0, d3.max(cumulativeData, d => d.cumulativeRaces)]).nice();

    xAxisRaceCount.transition()
        .duration(750)
        .call(d3.axisBottom(xScaleRaceCount).tickFormat(d3.format("d")).ticks(10))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-family", "Formula1")
        .style("font-size", "12px")
        .style("fill", "#ffffff");

    xAxisRaceCount.selectAll(".domain").style("stroke", "#ffffff");
    xAxisRaceCount.selectAll(".tick line").style("stroke", "#ffffff");

    yAxisRaceCount.transition()
        .duration(750)
        .call(d3.axisLeft(yScaleRaceCount))
        .selectAll("text")
        .style("font-family", "Formula1")
        .style("font-size", "12px")
        .style("fill", "#ffffff");

    yAxisRaceCount.selectAll(".domain").style("stroke", "#ffffff");
    yAxisRaceCount.selectAll(".tick line").style("stroke", "#ffffff");

    const line = gRaceCount.select('.race-count-line')
        .datum(cumulativeData);

    line.transition()
        .duration(750)
        .attr('d', lineGeneratorRaceCount)
        .on('end', () => {
            addRaceCountCircles(cumulativeData);
        });

    gRaceCount.selectAll('.race-count-circle')
        .transition()
        .duration(300)
        .style('opacity', 0)
        .remove();
}

function addRaceCountCircles(cumulativeData) {
    gRaceCount.selectAll('.race-count-circle')
        .data(cumulativeData)
        .enter()
        .append('circle')
        .attr('class', 'race-count-circle')
        .attr('cx', d => xScaleRaceCount(d.year))
        .attr('cy', d => yScaleRaceCount(d.cumulativeRaces))
        .attr('r', 2)
        .attr('fill', '#ffffff')
        .style('opacity', 0)
        .on('mouseover', function (event, d) {
            tooltipRaceCount.transition()
                .duration(200)
                .style("opacity", .9);
            tooltipRaceCount.html(`<strong>Year:</strong> ${d.year}<br/>
                                   <strong>Races This Year:</strong> ${d.raceCount}<br/>
                                   <strong>Cumulative Races:</strong> ${d.cumulativeRaces}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on('mousemove', function (event, d) {
            tooltipRaceCount
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on('mouseout', function () {
            tooltipRaceCount.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .transition()
        .duration(300)
        .style('opacity', 1);
}

function updateAverageSpeed(selectedYear) {
}

function updateConstructorWins(selectedYear) {
}

function updateDriverQualifyingTime(selectedYear) {
}

function updateAveragePitStopTime(selectedYear) {
}

function updateCircuitDistributionMap(selectedYear) {
}

function updateDriverNationalityMap(selectedYear) {
}
let racesDataGlobal = [];
let resultsDataGlobal = [];
let circuitsDataGlobal = [];

let svgRaceCount;
let xScaleRaceCount, yScaleRaceCount, xAxisRaceCount, yAxisRaceCount, lineGeneratorRaceCount;
let gRaceCount;
let tooltipRaceCount;

let svgAverageTopSpeed;
let xScaleAverageTopSpeed, yScaleAverageTopSpeed, xAxisAverageTopSpeed, lineGeneratorAverageTopSpeed;
let gAverageTopSpeed;
let tooltipAverageTopSpeed;
let colorScale;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const generateColorPalette = (numColors) => {
    const colors = [];
    const saturation = 70;
    const lightness = 40;
    for (let i = 0; i < numColors; i++) {
        const hue = Math.round((i * 360) / numColors);
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return shuffle(colors);
};
const colorPalette = generateColorPalette(30);

let legendGroup;

function main() {
    const racesCsvPath = 'data/races.csv';
    const resultsCsvPath = 'data/results.csv';
    const circuitsCsvPath = 'data/circuits.csv';
    const lapTimesCsvPath = 'data/lap_times.csv';

    Promise.all([
        d3.csv(racesCsvPath),
        d3.csv(resultsCsvPath),
        d3.csv(circuitsCsvPath)


    ]).then(function ([racesData, resultsData, circuitsData]) {

        racesData.forEach(d => {
            d.raceId = +d.raceId;
            d.year = +d.year;
        });
        resultsData.forEach(d => {
            d.raceId = +d.raceId;
            d.driverId = +d.driverId;
            d.constructorId = +d.constructorId;
            d.fastestLapSpeed = d.fastestLapSpeed === '\\N' ? null : +d.fastestLapSpeed;
        });
        circuitsData.forEach(d => {
            d.circuitId = +d.circuitId;
        });

        racesDataGlobal = racesData;
        resultsDataGlobal = resultsData;
        circuitsDataGlobal = circuitsData;

        const years = Array.from(new Set(racesData.map(d => d.year))).sort((a, b) => a - b);

        initializeYearSlider(years);

        initializeRaceCountChart(years);

        initializeAverageTopSpeedChart(years);

        createInitialCharts(years);
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

function createInitialCharts(years) {

    updateChartsUpToYear(d3.max(years));
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

function initializeAverageTopSpeedChart(years) {
    const averageTopSpeedDiv = d3.select('#average-top-speed');
    averageTopSpeedDiv.html('');
    const svgWidth = 800;
    const svgHeight = 300;
    const margin = {top: 20, right: 300, bottom: 70, left: 80};

    svgAverageTopSpeed = averageTopSpeedDiv.append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .style('display', 'block')
        .style('margin', '0 auto');

    gAverageTopSpeed = svgAverageTopSpeed.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    xScaleAverageTopSpeed = d3.scaleLinear()
        .range([0, width]);
    yScaleAverageTopSpeed = d3.scaleLinear()
        .range([height, 0]);

    xAxisAverageTopSpeed = gAverageTopSpeed.append('g')
        .attr('transform', `translate(0,${height})`);
    yAxisAverageTopSpeed = gAverageTopSpeed.append('g');

    lineGeneratorAverageTopSpeed = d3.line()
        .x(d => xScaleAverageTopSpeed(d.year))
        .y(d => yScaleAverageTopSpeed(d.averageTopSpeed))
        .curve(d3.curveMonotoneX);

    colorScale = d3.scaleOrdinal()
        .range(colorPalette);

    svgAverageTopSpeed.append("text")
        .attr("x", svgWidth / 2 - 120)
        .attr("y", svgHeight - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#ffffff")
        .style("font-family", "Formula1")
        .style("font-size", "14px")
        .text("Year");

    svgAverageTopSpeed.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 30)
        .attr("x", -svgHeight / 2 + 25)
        .attr("text-anchor", "middle")
        .attr("fill", "#ffffff")
        .style("font-family", "Formula1")
        .style("font-size", "14px")
        .text("Average Top Speed (km/h)");

    tooltipAverageTopSpeed = d3.select("body").append("div")
        .attr("class", "tooltip-average-top-speed")
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

    legendGroup = svgAverageTopSpeed.append("g")
        .attr("class", "legend-group")
        .attr("transform", `translate(${width + margin.left + 40}, ${margin.top})`)
        .style("opacity", 0);

    legendGroup.append("rect")
        .attr("x", -10)
        .attr("y", -10)
        .attr("width", 240)
        .attr("height", 255)
        .attr("fill", "rgba(0, 0, 0, 0.7)")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1)
        .attr("rx", 5)
        .attr("ry", 5);

    legendGroup.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .attr("fill", "#ffffff")
        .style("font-family", "Formula1")
        .style("font-size", "16px")
        .text("Circuits Legend");

    legendGroup.append("foreignObject")
        .attr("x", 10)
        .attr("y", 30)
        .attr("width", 230)
        .attr("height", 200)
        .append("xhtml:div")
        .attr("id", "legend-items")
        .style("width", "330px")
        .style("height", "250px")
        .style("overflow-y", "auto")
        .style("font-family", "Formula1")
        .style("font-size", "12px")
        .style("color", "#ffffff");
}

function updateChartsUpToYear(selectedYear) {
    updateRaceCount(selectedYear);
    updateAverageTopSpeed(selectedYear);

    updateConstructorWins(selectedYear);
    updateDriverQualifyingTime(selectedYear);
    updateAveragePitStopTime(selectedYear);
    updateCircuitDistributionMap(selectedYear);
    updateDriverNationalityMap(selectedYear);
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

function updateAverageTopSpeed(selectedYear) {
    const averageTopSpeedDiv = d3.select('#average-top-speed');

    averageTopSpeedDiv.selectAll('.no-data-text').remove();
    if (selectedYear < 2004) {

        svgAverageTopSpeed.style('display', 'none');

        averageTopSpeedDiv.append('div')
            .attr('class', 'no-data-text')
            .style('color', '#ffffff')
            .style('font-family', 'Formula1')
            .style('font-size', '18px')
            .style('text-align', 'center')
            .style('margin-top', '20px')
            .text('No data available for years before 2004.');
        return;
    } else {

        svgAverageTopSpeed.style('display', 'block');
    }

    const filteredRaces = racesDataGlobal.filter(d => d.year <= selectedYear);
    const filteredRaceIds = filteredRaces.map(d => d.raceId);
    const filteredResults = resultsDataGlobal.filter(d => filteredRaceIds.includes(d.raceId) && d.fastestLapSpeed !== null);

    const raceSpeedByCircuit = d3.rollups(
        filteredRaces,
        v => {
            const raceIds = v.map(d => d.raceId);
            const raceResults = filteredResults.filter(r => raceIds.includes(r.raceId));
            const raceSpeeds = raceResults.map(r => r.fastestLapSpeed);
            return {
                averageTopSpeed: raceSpeeds.length > 0 ? d3.mean(raceSpeeds) : null
            };
        },
        d => +d.circuitId,
        d => d.year
    );

    const averageTopSpeedData = [];
    raceSpeedByCircuit.forEach(([circuitId, yearMap]) => {
        const circuit = circuitsDataGlobal.find(c => c.circuitId === circuitId);
        if (circuit) {
            const circuitName = circuit.name;
            yearMap.forEach(([year, data]) => {
                if (data.averageTopSpeed !== null) {
                    averageTopSpeedData.push({
                        circuitId: circuitId,
                        circuitName: circuitName,
                        year: year,
                        averageTopSpeed: data.averageTopSpeed
                    });
                }
            });
        }
    });

    const dataByCircuit = d3.group(averageTopSpeedData, d => d.circuitName);

    colorScale.domain(Array.from(dataByCircuit.keys()));

    xScaleAverageTopSpeed.domain(d3.extent(averageTopSpeedData, d => d.year));
    yScaleAverageTopSpeed.domain([
        100,
        d3.max(averageTopSpeedData, d => d.averageTopSpeed)
    ]).nice();

    xAxisAverageTopSpeed.transition()
        .duration(750)
        .call(d3.axisBottom(xScaleAverageTopSpeed).tickFormat(d3.format("d")).ticks(10))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-family", "Formula1")
        .style("font-size", "12px")
        .style("fill", "#ffffff");

    xAxisAverageTopSpeed.selectAll(".domain").style("stroke", "#ffffff");
    xAxisAverageTopSpeed.selectAll(".tick line").style("stroke", "#ffffff");

    yAxisAverageTopSpeed.transition()
        .duration(750)
        .call(d3.axisLeft(yScaleAverageTopSpeed))
        .selectAll("text")
        .style("font-family", "Formula1")
        .style("font-size", "12px")
        .style("fill", "#ffffff");

    yAxisAverageTopSpeed.selectAll(".domain").style("stroke", "#ffffff");
    yAxisAverageTopSpeed.selectAll(".tick line").style("stroke", "#ffffff");

    updateLegend();

    const circuits = Array.from(dataByCircuit.keys());

    const circuitLines = gAverageTopSpeed.selectAll(".average-top-speed-line")
        .data(circuits, d => d);

    circuitLines.exit()
        .transition()
        .duration(750)
        .style("opacity", 0)
        .remove();

    circuitLines.transition()
        .duration(750)
        .attr("d", d => {
            const circuitData = dataByCircuit.get(d).sort((a, b) => a.year - b.year);

            if (circuitData.length >= 2) {
                return lineGeneratorAverageTopSpeed(circuitData);
            } else {

                return null;
            }
        })
        .attr("stroke", d => colorScale(d))
        .style("opacity", d => dataByCircuit.get(d).length >= 2 ? 1 : 0);

    circuitLines.enter()
        .append("path")
        .attr("class", "average-top-speed-line")
        .attr("fill", "none")
        .attr("stroke", d => colorScale(d))
        .attr("stroke-width", 2)
        .attr("d", d => {
            const circuitData = dataByCircuit.get(d).sort((a, b) => a.year - b.year);
            if (circuitData.length >= 2) {
                return lineGeneratorAverageTopSpeed(circuitData);
            } else {
                return null;
            }
        })
        .style("opacity", d => dataByCircuit.get(d).length >= 2 ? 0 : 0)
        .transition()
        .duration(750)
        .style("opacity", d => dataByCircuit.get(d).length >= 2 ? 1 : 0);


    gAverageTopSpeed.selectAll(".average-top-speed-circle")
        .transition()
        .duration(300)
        .style("opacity", 0)
        .remove();

    averageTopSpeedData.forEach(d => {
        gAverageTopSpeed.append("circle")
            .attr("class", "average-top-speed-circle")
            .attr("cx", xScaleAverageTopSpeed(d.year))
            .attr("cy", yScaleAverageTopSpeed(d.averageTopSpeed))
            .attr("r", 2.5)
            .attr("fill", colorScale(d.circuitName))
            .style("opacity", 0)
            .on("mouseover", function (event, dataPoint) {
                tooltipAverageTopSpeed.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltipAverageTopSpeed.html(`<strong>Circuit:</strong> ${d.circuitName}<br/>
                                           <strong>Year:</strong> ${d.year}<br/>
                                           <strong>Average Top Speed:</strong> ${d.averageTopSpeed.toFixed(2)} km/h`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function (event, dataPoint) {
                tooltipAverageTopSpeed
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                tooltipAverageTopSpeed.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .transition()
            .duration(300)
            .delay(750)
            .style('opacity', 1);
    });

    d3.select('#average-top-speed-info-card')
        .on("mouseover", function () {
            legendGroup.transition()
                .duration(300)
                .style("opacity", 0.9);
        })
        .on("mouseout", function () {
            legendGroup.transition()
                .duration(300)
                .style("opacity", 0);
        });
}

function updateLegend() {

    d3.select('#legend-items').selectAll(".legend-item").remove();

    const circuits = colorScale.domain();

    const legendItems = d3.select('#legend-items').selectAll(".legend-item")
        .data(circuits)
        .enter()
        .append("div")
        .attr("class", "legend-item")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "4px")
        .style("white-space", "nowrap");

    legendItems.append("span")
        .style("width", "18px")
        .style("height", "18px")
        .style("display", "inline-block")
        .style("background-color", d => colorScale(d))
        .style("margin-right", "6px");

    legendItems.append("span")
        .text(d => d.length > 30 ? d.slice(0, 27) + '...' : d)
        .attr("title", d => d)
        .style("white-space", "nowrap")
        .style("overflow", "hidden")
        .style("text-overflow", "ellipsis");
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

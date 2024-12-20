let racesDataGlobal = [];
let resultsDataGlobal = [];
let circuitsDataGlobal = [];
let driversDataGlobal = [];
let qualifyingDataGlobal = [];
let constructorsDataGlobal = [];
let pitStopsDataGlobal = [];
let constructorNameMap = new Map();
let svgRaceCount;
let xScaleRaceCount, yScaleRaceCount, xAxisRaceCount, yAxisRaceCount, lineGeneratorRaceCount;
let gRaceCount;
let tooltipRaceCount;
let svgAverageTopSpeed;
let xScaleAverageTopSpeed, yScaleAverageTopSpeed, xAxisAverageTopSpeed, yAxisAverageTopSpeed,
    lineGeneratorAverageTopSpeed;
let gAverageTopSpeed;
let tooltipAverageTopSpeed;
let colorScale;
let legendGroup;
let previousDriverQTimesMap = new Map();
let previousPitStopTimesMap = new Map();
let driverConstructorMap = new Map();
let xScaleConstructorWins, yScaleConstructorWins;
let xAxisConstructorWins;
let colorScaleConstructorWins;
let constructorLastYearMap = new Map();
let allActiveConstructors = [];
let barHeight = 30;
let maxConstructorsCount = 0;
let mapMode = 'drivers';
let tooltipDriverNationality;
let svgNationalityMap;
let gCountriesNationality, gMarkersNationality;
let projectionNationality, pathNationality;
let worldDataNationality;
let toggleButtonElement;
const nationalityCoordinates = {
    "American": {lat: 37.0902, lng: -95.7129},
    "Argentine": {lat: -38.4161, lng: -63.6167},
    "Australian": {lat: -25.2744, lng: 133.7751},
    "Austrian": {lat: 47.5162, lng: 14.5501},
    "Belgian": {lat: 50.5039, lng: 4.4699},
    "Brazilian": {lat: -14.2350, lng: -51.9253},
    "British": {lat: 55.3781, lng: -3.4360},
    "Canadian": {lat: 56.1304, lng: -106.3468},
    "Chilean": {lat: -35.6751, lng: -71.5430},
    "Chinese": {lat: 35.8617, lng: 104.1954},
    "Colombian": {lat: 4.5709, lng: -74.2973},
    "Czech": {lat: 49.8175, lng: 15.4730},
    "Danish": {lat: 56.2639, lng: 9.5018},
    "Dutch": {lat: 52.1326, lng: 5.2913},
    "East German": {lat: 51.1657, lng: 10.4515},
    "Finnish": {lat: 61.9241, lng: 25.7482},
    "French": {lat: 46.2276, lng: 2.2137},
    "German": {lat: 51.1657, lng: 10.4515},
    "Hungarian": {lat: 47.1625, lng: 19.5033},
    "Indian": {lat: 20.5937, lng: 78.9629},
    "Indonesian": {lat: -0.7893, lng: 113.9213},
    "Irish": {lat: 53.1424, lng: -7.6921},
    "Italian": {lat: 41.8719, lng: 12.5674},
    "Japanese": {lat: 36.2048, lng: 138.2529},
    "Liechtensteiner": {lat: 47.1660, lng: 9.5554},
    "Malaysian": {lat: 4.2105, lng: 101.9758},
    "Mexican": {lat: 23.6345, lng: -102.5528},
    "Monegasque": {lat: 43.7384, lng: 7.4246},
    "New Zealander": {lat: -40.9006, lng: 174.8860},
    "Polish": {lat: 51.9194, lng: 19.1451},
    "Portuguese": {lat: 39.3999, lng: -8.2245},
    "Rhodesian": {lat: -19.0154, lng: 29.1549},
    "Russian": {lat: 61.5240, lng: 105.3188},
    "South African": {lat: -30.5595, lng: 22.9375},
    "Spanish": {lat: 40.4637, lng: -3.7492},
    "Swedish": {lat: 60.1282, lng: 18.6435},
    "Swiss": {lat: 46.8182, lng: 8.2275},
    "Thai": {lat: 15.8700, lng: 100.9925},
    "Uruguayan": {lat: -32.5228, lng: -55.7658},
    "Venezuelan": {lat: 6.4238, lng: -66.5897}
};

function getNationalityCoords(nationality) {
    const baseNat = nationality.includes('-') ? nationality.split('-')[0] : nationality;
    return nationalityCoordinates[baseNat] || nationalityCoordinates["American"];
}

function main() {
    const racesCsvPath = 'data/races.csv';
    const resultsCsvPath = 'data/results.csv';
    const circuitsCsvPath = 'data/circuits.csv';
    const driversCsvPath = 'data/drivers.csv';
    const qualifyingCsvPath = 'data/qualifying.csv';
    const constructorsCsvPath = 'data/constructors.csv';
    const pitStopsCsvPath = 'data/pit_stops.csv';
    Promise.all([
        d3.csv(racesCsvPath),
        d3.csv(resultsCsvPath),
        d3.csv(circuitsCsvPath),
        d3.csv(driversCsvPath),
        d3.csv(qualifyingCsvPath),
        d3.csv(constructorsCsvPath),
        d3.csv(pitStopsCsvPath),
        d3.json('data/world-110m.json')
    ]).then(function ([racesData, resultsData, circuitsData, driversData, qualifyingData, constructorsData, pitStopsData, world]) {
        racesData.forEach(d => {
            d.raceId = +d.raceId;
            d.year = +d.year;
        });
        resultsData.forEach(d => {
            d.raceId = +d.raceId;
            d.driverId = +d.driverId;
            d.constructorId = +d.constructorId;
            d.fastestLapSpeed = d.fastestLapSpeed === '\\N' ? null : +d.fastestLapSpeed;
            d.positionOrder = +d.positionOrder;
        });
        circuitsData.forEach(d => {
            d.circuitId = +d.circuitId;
            d.lat = +d.lat;
            d.lng = +d.lng;
        });
        driversData.forEach(d => {
            d.driverId = +d.driverId;
        });
        constructorsData.forEach(d => {
            d.constructorId = +d.constructorId;
        });
        qualifyingData.forEach(d => {
            d.qualifyId = +d.qualifyId;
            d.raceId = +d.raceId;
            d.driverId = +d.driverId;
            d.constructorId = +d.constructorId;
            d.number = +d.number;
            d.position = +d.position;
            d.q1_ms = convertTimeToMs(d.q1);
            d.q2_ms = convertTimeToMs(d.q2);
            d.q3_ms = convertTimeToMs(d.q3);
        });
        pitStopsData.forEach(d => {
            d.raceId = +d.raceId;
            d.driverId = +d.driverId;
            d.stop = +d.stop;
            d.lap = +d.lap;
            d.milliseconds = +d.milliseconds;
        });
        racesDataGlobal = racesData;
        resultsDataGlobal = resultsData;
        circuitsDataGlobal = circuitsData;
        driversDataGlobal = driversData;
        qualifyingDataGlobal = qualifyingData;
        constructorsDataGlobal = constructorsData;
        pitStopsDataGlobal = pitStopsData;
        constructorNameMap = new Map(constructorsDataGlobal.map(c => [c.constructorId, c.name]));
        resultsDataGlobal.forEach(r => {
            const key = `${r.raceId}-${r.driverId}`;
            driverConstructorMap.set(key, r.constructorId);
        });
        const constructorYearsMap = d3.group(resultsDataGlobal, d => d.constructorId);
        constructorYearsMap.forEach((arr, cId) => {
            let years = arr.map(d => {
                const race = racesDataGlobal.find(r => r.raceId === d.raceId);
                return race ? race.year : null;
            }).filter(y => y !== null);
            constructorLastYearMap.set(cId, d3.max(years));
        });
        let allConstructorsIds = Array.from(constructorLastYearMap.keys());
        allActiveConstructors = allConstructorsIds.slice().sort((a, b) => {
            const nameA = constructorNameMap.get(a) || "";
            const nameB = constructorNameMap.get(b) || "";
            return d3.ascending(nameA, nameB);
        });
        maxConstructorsCount = allActiveConstructors.length;
        worldDataNationality = world;
        const years = Array.from(new Set(racesData.map(d => d.year))).sort((a, b) => a - b);
        initializeYearSlider(years);
        initializeRaceCountChart(years);
        initializeAverageTopSpeedChart(years);
        initializeConstructorWinsChart();
        createQualifyingTable();
        createPitStopTable();
        initializeDriverNationalityMap();
        createInitialCharts(years);
    }).catch(console.error);
}

function convertTimeToMs(timeStr) {
    if (!timeStr || timeStr === '\\N') return null;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        const minutes = +parts[0];
        const seconds = parseFloat(parts[1]);
        return minutes * 60000 + seconds * 1000;
    }
    return null;
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
    const generateF1ColorPalette = (numColors) => {
        const colors = [];
        const saturation = 100;
        const lightness = 37;
        for (let i = 0; i < numColors; i++) {
            const hue = Math.round((i * 360) / numColors);
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }
        return shuffleArray(colors);
    };
    const colorPalette = generateF1ColorPalette(30);
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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function updateChartsUpToYear(selectedYear) {
    updateRaceCount(selectedYear);
    updateAverageTopSpeed(selectedYear);
    updateConstructorWins(selectedYear);
    updateDriverQualifyingTime(selectedYear);
    updateAveragePitStopTime(selectedYear);
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
        .on('mousemove', function (event) {
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
            return (circuitData.length >= 2) ? lineGeneratorAverageTopSpeed(circuitData) : null;
        })
        .attr("stroke", d => colorScale(d))
        .style("opacity", d => dataByCircuit.get(d).length >= 2 ? 1 : 0);
    circuitLines.enter()
        .append("path")
        .attr("class", "average-top-speed-line")
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("stroke", d => colorScale(d))
        .attr("d", d => {
            const circuitData = dataByCircuit.get(d).sort((a, b) => a.year - b.year);
            return (circuitData.length >= 2) ? lineGeneratorAverageTopSpeed(circuitData) : null;
        })
        .style("opacity", 0)
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
            .on("mouseover", function (event) {
                tooltipAverageTopSpeed.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltipAverageTopSpeed.html(`<strong>Circuit:</strong> ${d.circuitName}<br/>
                                           <strong>Year:</strong> ${d.year}<br/>
                                           <strong>Average Top Speed:</strong> ${d.averageTopSpeed.toFixed(2)} km/h`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", function (event) {
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
    var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    if (!isChrome) {
        d3.select('#legend-items')
            .append("div")
            .style("color", "#ffffff")
            .style("font-family", "Formula1")
            .style("font-size", "14px")
            // .style("margin", "10px")
            .style("width", "210px")
            .style("white-space", "normal")
            .html("<br/>For the best experience,<br/>please view this page in <br/>Google Chrome.");
        return;
    }
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

function initializeConstructorWinsChart() {
    const colorArray = [
        "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728",
        "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
        "#bcbd22", "#17becf", "#9edae5", "#f7b6d2",
        "#c7c7c7", "#dbdb8d", "#c49c94", "#ff9896",
        "#98df8a", "#c5b0d5", "#ffbb78", "#aec7e8",
        "#ffefc1", "#bdbc8b", "#e7c7d7", "#d8b5a5",
        "#f7c680", "#b5dfea", "#f7b280", "#cbc5df",
        "#7d7d7d", "#cfa2c5"
    ];
    colorScaleConstructorWins = d3.scaleOrdinal(colorArray);
    const container = d3.select('#constructor-wins');
    container.selectAll('*').remove();
    const wrapper = container.append('div')
        .style('position', 'relative')
        .style('width', '550px')
        .style('overflow', 'hidden')
        .style('margin', '0 auto');
    const axisSvgHeight = 20;
    const axisSvg = wrapper.append('svg')
        .attr('width', '600px')
        .attr('height', axisSvgHeight)
        .style('position', 'sticky')
        .style('top', '0')
        .style('z-index', '10')
        .style('background', '#111')
        .style('margin-bottom', '-10px');
    const barsDivHeight = 400;
    const barsDiv = wrapper.append('div')
        .style('overflow-y', 'auto')
        .style('height', barsDivHeight + 'px')
        .style('width', '600px')
        .style('position', 'relative')
        .style('background', '#111');
    xScaleConstructorWins = d3.scaleLinear().range([0, 300]);
}

function updateConstructorWins(selectedYear) {
    const container = d3.select('#constructor-wins');
    const wrapper = container.select('div');
    if (wrapper.empty()) return;
    const margin = {top: 20, right: 20, bottom: 20, left: 200};
    const width = 600 - margin.left - margin.right;
    const axisWidth = 600;
    const axisHeight = 20;
    const totalBarHeight = maxConstructorsCount * barHeight;
    const barsSvgHeight = totalBarHeight + margin.top + margin.bottom;
    const filteredRaces = racesDataGlobal.filter(d => d.year <= selectedYear);
    const filteredRaceIds = new Set(filteredRaces.map(d => d.raceId));
    const winners = resultsDataGlobal.filter(d => filteredRaceIds.has(d.raceId) && d.positionOrder === 1);
    const constructorWinsMap = new Map(allActiveConstructors.map(cId => [cId, 0]));
    winners.forEach(w => {
        if (constructorWinsMap.has(w.constructorId)) {
            constructorWinsMap.set(w.constructorId, constructorWinsMap.get(w.constructorId) + 1);
        }
    });
    const constructorWinsData = allActiveConstructors.map(constructorId => {
        const name = constructorNameMap.has(constructorId) ? constructorNameMap.get(constructorId) : "Unknown";
        const lastYear = constructorLastYearMap.get(constructorId);
        const isActive = lastYear !== undefined && lastYear >= selectedYear;
        const wins = constructorWinsMap.get(constructorId) || 0;
        return {constructorId, name, wins, isActive};
    });
    constructorWinsData.sort((a, b) => d3.descending(a.wins, b.wins));
    xScaleConstructorWins.domain([0, d3.max(constructorWinsData, d => d.wins)]).nice();
    yScaleConstructorWins = d3.scaleBand()
        .domain(constructorWinsData.map(d => d.constructorId))
        .range([0, totalBarHeight])
        .padding(0.1);
    const axisSvg = wrapper.select('svg')
        .attr('width', axisWidth)
        .attr('height', axisHeight);
    const axisG = axisSvg.selectAll('.x-axis-cwins').data([null]);
    axisG.enter().append('g')
        .attr('class', 'x-axis-cwins')
        .merge(axisG)
        .attr('transform', `translate(${margin.left},${axisHeight - 20})`)
        .call(d3.axisBottom(xScaleConstructorWins).ticks(5).tickSizeOuter(0))
        .selectAll("text")
        .style("font-family", "Formula1")
        .style("font-size", "12px")
        .style("fill", "#ffffff");
    axisSvg.selectAll('.domain, .tick line')
        .style('stroke', '#ffffff');
    axisSvg.selectAll('text')
        .style("fill", "#ffffff");
    const barsDiv = wrapper.select('div');
    let barsSvg = barsDiv.select('svg.cw-bars-svg');
    if (barsSvg.empty()) {
        barsSvg = barsDiv.append('svg')
            .attr('class', 'cw-bars-svg')
            .style('display', 'block')
            .attr('width', 600)
            .attr('height', barsSvgHeight)
            .style('margin', '0 auto');
    }
    const g = barsSvg.selectAll('.bars-group').data([null]);
    const gEnter = g.enter().append('g')
        .attr('class', 'bars-group')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    const gBars = gEnter.merge(g);
    const bars = gBars.selectAll('.constructor-bar')
        .data(constructorWinsData, d => d.constructorId);
    const t = d3.transition().duration(1000);
    bars.exit().remove();
    const barEnter = bars.enter().append('rect')
        .attr('class', 'constructor-bar')
        .attr('y', d => yScaleConstructorWins(d.constructorId))
        .attr('height', yScaleConstructorWins.bandwidth())
        .attr('x', 0)
        .attr('width', 0)
        .attr('fill', d => d.isActive ? colorScaleConstructorWins(d.constructorId) : '#888');
    barEnter.merge(bars)
        .transition(t)
        .attr('y', d => yScaleConstructorWins(d.constructorId))
        .attr('height', yScaleConstructorWins.bandwidth())
        .attr('width', d => xScaleConstructorWins(d.wins))
        .attr('fill', d => d.isActive ? colorScaleConstructorWins(d.constructorId) : '#888');
    const labels = gBars.selectAll('.constructor-wins-label')
        .data(constructorWinsData, d => d.constructorId);
    labels.exit().remove();
    const labelsEnter = labels.enter().append('text')
        .attr('class', 'constructor-wins-label')
        .attr('x', d => xScaleConstructorWins(d.wins) + 5)
        .attr('y', d => yScaleConstructorWins(d.constructorId) + yScaleConstructorWins.bandwidth() / 2)
        .attr('dy', '0.35em')
        .style("font-family", "Formula1")
        .style("font-size", "12px")
        .style("fill", "#ffffff")
        .text(d => d.wins)
        .style('opacity', 0);
    labelsEnter.merge(labels)
        .transition(t)
        .attr('x', d => xScaleConstructorWins(d.wins) + 5)
        .attr('y', d => yScaleConstructorWins(d.constructorId) + yScaleConstructorWins.bandwidth() / 2)
        .style('opacity', 1)
        .text(d => d.wins);
    const teamLabels = gBars.selectAll('.constructor-label-group')
        .data(constructorWinsData, d => d.constructorId);
    teamLabels.exit().remove();
    const teamLabelsEnter = teamLabels.enter().append('g')
        .attr('class', 'constructor-label-group');
    teamLabelsEnter.append('image')
        .attr('class', 'constructor-icon')
        .attr('width', 20)
        .attr('height', 20)
        .attr('x', -170)
        .attr('y', d => yScaleConstructorWins(d.constructorId) + (yScaleConstructorWins.bandwidth() - 20) / 2)
        .attr('href', d => `images/team_logos/${d.constructorId}.png`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .on('error', function () {
            d3.select(this).attr('href', 'images/team_logos/default.png');
        });
    teamLabelsEnter.append('text')
        .attr('class', 'constructor-name-label')
        .attr('x', -140)
        .attr('y', d => yScaleConstructorWins(d.constructorId) + yScaleConstructorWins.bandwidth() / 2)
        .attr('dy', '0.35em')
        .style("font-family", "Formula1")
        .style("font-size", "12px")
        .style("fill", "#ffffff")
        .text(d => d.name);
    teamLabelsEnter.merge(teamLabels)
        .select('image.constructor-icon')
        .transition(t)
        .attr('y', d => yScaleConstructorWins(d.constructorId) + (yScaleConstructorWins.bandwidth() - 20) / 2);
    teamLabelsEnter.merge(teamLabels)
        .select('text.constructor-name-label')
        .transition(t)
        .attr('y', d => yScaleConstructorWins(d.constructorId) + yScaleConstructorWins.bandwidth() / 2);
}

function createQualifyingTable() {
    const container = d3.select('#driver-qualifying-time');
    container.selectAll('*').remove();
    const tableContainer = container.append('div')
        .attr('id', 'qualifying-table-container')
        .style('max-height', '300px')
        .style('overflow-y', 'auto');
    const table = tableContainer.append('table')
        .attr('class', 'standings-table')
        .style('border-collapse', 'collapse')
        .style('width', '100%')
        .style('font-family', 'Formula1')
        .style('table-layout', 'fixed');
    const thead = table.append('thead');
    const headerRow = thead.append('tr');
    headerRow.selectAll('th')
        .data(['Pos', 'Driver', 'Team', 'Avg Qual. Time'])
        .enter().append('th')
        .text(d => d)
        .style('text-align', 'center')
        .style('vertical-align', 'middle')
        .style('width', (d, i) => i === 0 ? '60px' : null);
    table.append('tbody');
}

function createPitStopTable() {
    const container = d3.select('#average-top-pit-stop-time');
    container.selectAll('*').remove();
    const tableContainer = container.append('div')
        .attr('id', 'pitstop-table-container')
        .style('max-height', '300px')
        .style('overflow-y', 'auto');
    const table = tableContainer.append('table')
        .attr('class', 'standings-table')
        .style('border-collapse', 'collapse')
        .style('width', '100%')
        .style('font-family', 'Formula1')
        .style('table-layout', 'fixed');
    const thead = table.append('thead');
    const headerRow = thead.append('tr');
    headerRow.selectAll('th')
        .data(['Pos', 'Driver', 'Team', 'Avg Pit Stop Time'])
        .enter().append('th')
        .text(d => d)
        .style('text-align', 'center')
        .style('vertical-align', 'middle')
        .style('width', (d, i) => i === 0 ? '60px' : null);
    table.append('tbody');
}

function updateDriverQualifyingTime(selectedYear) {
    const container = d3.select('#driver-qualifying-time');
    const table = container.select('table.standings-table');
    if (table.empty()) {
        createQualifyingTable();
    }
    const tbody = table.select('tbody');
    const filteredRaces = racesDataGlobal.filter(d => d.year === selectedYear);
    let dataToShow = [];
    if (filteredRaces.length === 0) {
        dataToShow = [{message: "No data available for this year."}];
    } else {
        const raceIds = filteredRaces.map(d => d.raceId);
        const filteredQualifying = qualifyingDataGlobal.filter(q => raceIds.includes(q.raceId));
        if (filteredQualifying.length === 0) {
            dataToShow = [{message: "No qualifying data available for years before 1994."}];
        } else {
            const driverNameMap = new Map(driversDataGlobal.map(d => [d.driverId, `${d.forename} ${d.surname}`]));
            const driverTimes = d3.rollups(filteredQualifying, v => {
                const allTimes = v.flatMap(d => [d.q1_ms, d.q2_ms, d.q3_ms].filter(x => x !== null));
                if (allTimes.length === 0) return null;
                const avgTime = d3.mean(allTimes);
                return {count: allTimes.length, avg: avgTime, constructorId: v[0].constructorId};
            }, d => d.driverId);
            const driverResults = driverTimes.map(([driverId, val]) => {
                return {
                    driverId: driverId,
                    driverName: driverNameMap.get(driverId) || "Unknown",
                    constructorId: val ? val.constructorId : null,
                    avgMs: val ? val.avg : null
                };
            }).filter(d => d.avgMs !== null);
            if (driverResults.length === 0) {
                dataToShow = [{message: "No valid qualifying times for this year."}];
            } else {
                driverResults.sort((a, b) => d3.ascending(a.avgMs, b.avgMs));
                dataToShow = driverResults.slice(0, 20);
            }
        }
    }
    const rows = tbody.selectAll('tr')
        .data(dataToShow, d => d.driverId || d.message);
    rows.exit()
        .transition().duration(500)
        .style('opacity', 0)
        .remove();
    const enter = rows.enter().append('tr')
        .style('opacity', 0);
    enter.filter(d => d.message)
        .append('td')
        .attr('colspan', 4)
        .style('color', '#fff')
        .style('font-family', 'Formula1')
        .style('font-size', '16px')
        .style('text-align', 'center')
        .text(d => d.message);
    const normalEnter = enter.filter(d => !d.message);
    normalEnter.append('td')
        .style('text-align', 'center')
        .style('color', '#ffffff')
        .style('vertical-align', 'middle');
    normalEnter.append('td')
        .style('text-align', 'center')
        .style('color', '#ffffff')
        .style('vertical-align', 'middle');
    normalEnter.append('td')
        .style('text-align', 'center')
        .style('color', '#ffffff')
        .style('vertical-align', 'middle');
    normalEnter.append('td')
        .style('text-align', 'center')
        .style('color', '#ffffff')
        .style('vertical-align', 'middle');
    const allRows = enter.merge(rows);
    allRows.filter(d => !d.message).select('td:nth-child(1)').text((d, i) => i + 1);
    allRows.filter(d => !d.message).select('td:nth-child(2)').html(d => d.driverName);
    allRows.filter(d => !d.message).select('td:nth-child(3)').html(d => {
        if (d.constructorId && d.constructorId != '\\N' && constructorNameMap.has(d.constructorId)) {
            const teamName = constructorNameMap.get(d.constructorId);
            const teamLogoPath = `images/team_logos/${d.constructorId}.png`;
            return `${teamName} <img src="${teamLogoPath}" alt="${teamName}" class="team-logo-small" style="vertical-align:middle;width:20px;height:20px;margin-left:5px;"/>`;
        } else {
            return 'Unknown Team';
        }
    });
    allRows.filter(d => !d.message).select('td:nth-child(4)').each(function (d) {
        const oldVal = previousDriverQTimesMap.get(d.driverId) || d.avgMs;
        d3.select(this).text(d.avgMs ? formatMsToTime(oldVal) : '');
        d._oldVal = oldVal;
    });
    if (!dataToShow[0]?.message) {
        allRows.sort((a, b) => d3.ascending(a.avgMs, b.avgMs));
    }
    const oldPositions = new Map();
    allRows.each(function (d) {
        oldPositions.set(d.driverId || d.message, this.getBoundingClientRect());
    });
    if (!dataToShow[0]?.message) {
        const newPositions = new Map();
        allRows.each(function (d) {
            if (!d.message) newPositions.set(d.driverId, this.getBoundingClientRect());
        });
        allRows.style('background-color', (d, i) => i % 2 === 0 ? '#111' : '#222');
        allRows.each(function (d, i) {
            if (d.message) return;
            const rowSel = d3.select(this);
            const oldPos = oldPositions.get(d.driverId);
            const newPos = newPositions.get(d.driverId);
            let dx = 0, dy = 0;
            if (oldPos && newPos) {
                dx = oldPos.left - newPos.left;
                dy = oldPos.top - newPos.top;
            }
            rowSel
                .style('transform', `translate(${dx}px,${dy}px)`)
                .transition().duration(1000)
                .style('transform', 'translate(0,0)')
                .style('opacity', 1)
                .on('end', function () {
                    const td = rowSel.select('td:nth-child(4)');
                    const finalVal = d.avgMs;
                    const oldVal = d._oldVal;
                    if (finalVal != null) {
                        td.transition().duration(1000)
                            .tween('text', function () {
                                const i = d3.interpolateNumber(oldVal, finalVal);
                                return t => td.text(formatMsToTime(i(t)));
                            })
                            .on('end', () => {
                                td.text(formatMsToTime(finalVal));
                                previousDriverQTimesMap.set(d.driverId, finalVal);
                            });
                    } else {
                        rowSel.style('opacity', 1);
                    }
                });
        });
    } else {
        allRows.transition().duration(500).style('opacity', 1);
    }

    function formatMsToTime(ms) {
        const totalSeconds = ms / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = (totalSeconds % 60).toFixed(3);
        return `${minutes}:${seconds.padStart(6, '0')}`;
    }
}

function updateAveragePitStopTime(selectedYear) {
    const container = d3.select('#average-top-pit-stop-time');
    const table = container.select('table.standings-table');
    if (table.empty()) {
        createPitStopTable();
    }
    const tbody = table.select('tbody');
    const filteredRaces = racesDataGlobal.filter(d => d.year === selectedYear);
    let dataToShow = [];
    if (filteredRaces.length === 0) {
        dataToShow = [{message: "No data available for this year."}];
    } else {
        const raceIds = filteredRaces.map(d => d.raceId);
        const filteredPitStops = pitStopsDataGlobal.filter(p => raceIds.includes(p.raceId) && p.milliseconds < 5 * 60 * 1000);
        if (filteredPitStops.length === 0) {
            dataToShow = [{message: "No pit stop data available for years before 2011."}];
        } else {
            const driverNameMap = new Map(driversDataGlobal.map(d => [d.driverId, `${d.forename} ${d.surname}`]));
            const driverPitTimes = d3.rollups(filteredPitStops, v => {
                const times = v.map(d => d.milliseconds).filter(x => x !== null);
                if (times.length === 0) return null;
                const avg = d3.mean(times);
                const firstRecord = v[0];
                const cId = driverConstructorMap.get(`${firstRecord.raceId}-${firstRecord.driverId}`) || null;
                return {avg: avg, constructorId: cId};
            }, d => d.driverId);
            const driverPitResults = driverPitTimes.map(([driverId, val]) => {
                return {
                    driverId: driverId,
                    driverName: driverNameMap.get(driverId) || "Unknown",
                    constructorId: val ? val.constructorId : null,
                    avgMs: val ? val.avg : null
                };
            }).filter(d => d.avgMs !== null);
            if (driverPitResults.length === 0) {
                dataToShow = [{message: "No valid pit stop times for this year."}];
            } else {
                driverPitResults.sort((a, b) => d3.ascending(a.avgMs, b.avgMs));
                dataToShow = driverPitResults.slice(0, 20);
            }
        }
    }
    const rows = tbody.selectAll('tr')
        .data(dataToShow, d => d.driverId || d.message);
    rows.exit()
        .transition().duration(500)
        .style('opacity', 0)
        .remove();
    const enter = rows.enter().append('tr')
        .style('opacity', 0);
    enter.filter(d => d.message)
        .append('td')
        .attr('colspan', 4)
        .style('color', '#fff')
        .style('font-family', 'Formula1')
        .style('font-size', '16px')
        .style('text-align', 'center')
        .text(d => d.message);
    const normalEnter = enter.filter(d => !d.message);
    normalEnter.append('td')
        .style('text-align', 'center')
        .style('color', '#ffffff')
        .style('vertical-align', 'middle');
    normalEnter.append('td')
        .style('text-align', 'center')
        .style('color', '#ffffff')
        .style('vertical-align', 'middle');
    normalEnter.append('td')
        .style('text-align', 'center')
        .style('color', '#ffffff')
        .style('vertical-align', 'middle');
    normalEnter.append('td')
        .style('text-align', 'center')
        .style('color', '#ffffff')
        .style('vertical-align', 'middle');
    const allRows = enter.merge(rows);
    allRows.filter(d => !d.message).select('td:nth-child(1)').text((d, i) => i + 1);
    allRows.filter(d => !d.message).select('td:nth-child(2)').html(d => d.driverName);
    allRows.filter(d => !d.message).select('td:nth-child(3)').html(d => {
        if (d.constructorId && d.constructorId != '\\N' && constructorNameMap.has(d.constructorId)) {
            const teamName = constructorNameMap.get(d.constructorId);
            const teamLogoPath = `images/team_logos/${d.constructorId}.png`;
            return `${teamName} <img src="${teamLogoPath}" alt="${teamName}" class="team-logo-small" style="vertical-align:middle;width:20px;height:20px;margin-left:5px;"/>`;
        } else {
            return 'Unknown Team';
        }
    });
    allRows.filter(d => !d.message).select('td:nth-child(4)').each(function (d) {
        const oldVal = previousPitStopTimesMap.get(d.driverId) || d.avgMs;
        d3.select(this).text(d.avgMs ? formatPitMsToTime(oldVal) : '');
        d._oldVal = oldVal;
    });
    if (!dataToShow[0]?.message) {
        allRows.sort((a, b) => d3.ascending(a.avgMs, b.avgMs));
    }
    const oldPositions = new Map();
    allRows.each(function (d) {
        oldPositions.set(d.driverId || d.message, this.getBoundingClientRect());
    });
    if (!dataToShow[0]?.message) {
        const newPositions = new Map();
        allRows.each(function (d) {
            if (!d.message) newPositions.set(d.driverId, this.getBoundingClientRect());
        });
        allRows.style('background-color', (d, i) => i % 2 === 0 ? '#111' : '#222');
        allRows.each(function (d, i) {
            if (d.message) return;
            const rowSel = d3.select(this);
            const oldPos = oldPositions.get(d.driverId);
            const newPos = newPositions.get(d.driverId);
            let dx = 0, dy = 0;
            if (oldPos && newPos) {
                dx = oldPos.left - newPos.left;
                dy = oldPos.top - newPos.top;
            }
            rowSel
                .style('transform', `translate(${dx}px,${dy}px)`)
                .transition().duration(1000)
                .style('transform', 'translate(0,0)')
                .style('opacity', 1)
                .on('end', function () {
                    const td = rowSel.select('td:nth-child(4)');
                    const finalVal = d.avgMs;
                    const oldVal = d._oldVal;
                    if (finalVal != null) {
                        td.transition().duration(1000)
                            .tween('text', function () {
                                const i = d3.interpolateNumber(oldVal, finalVal);
                                return t => td.text(formatPitMsToTime(i(t)));
                            })
                            .on('end', () => {
                                td.text(formatPitMsToTime(finalVal));
                                previousPitStopTimesMap.set(d.driverId, finalVal);
                            });
                    } else {
                        rowSel.style('opacity', 1);
                    }
                });
        });
    } else {
        allRows.transition().duration(500).style('opacity', 1);
    }

    function formatPitMsToTime(ms) {
        const seconds = (ms / 1000).toFixed(3);
        return `${seconds}s`;
    }
}

function updateDriverNationalityMap(selectedYear) {
    if (!svgNationalityMap || !projectionNationality || !gMarkersNationality) return;
    const duration = 1000;
    let dataPoints = [];
    const filteredRaces = racesDataGlobal.filter(d => d.year === selectedYear);
    if (mapMode === 'drivers') {
        const raceIds = new Set(filteredRaces.map(r => r.raceId));
        const participatingDrivers = Array.from(new Set(resultsDataGlobal
            .filter(r => raceIds.has(r.raceId))
            .map(r => r.driverId)));
        dataPoints = participatingDrivers.map(dId => {
            const driver = driversDataGlobal.find(dd => dd.driverId === dId);
            if (!driver) return null;
            const nationality = driver.nationality;
            const coord = getNationalityCoords(nationality);
            const constructorId = (function () {
                const driverResults = resultsDataGlobal.filter(rr => raceIds.has(rr.raceId) && rr.driverId === dId)
                if (driverResults.length > 0) {
                    driverResults.sort((a, b) => a.raceId - b.raceId);
                    return driverResults[driverResults.length - 1].constructorId;
                }
                return null;
            })();
            return coord ? {
                type: 'driver',
                driverName: driver.forename + " " + driver.surname,
                nationality: nationality,
                constructorId: constructorId,
                lat: coord.lat,
                lng: coord.lng
            } : null;
        }).filter(x => x);
    } else {
        dataPoints = filteredRaces.map(r => {
            const c = circuitsDataGlobal.find(cc => cc.circuitId === +r.circuitId);
            if (!c) return null;
            return {
                type: 'circuit',
                circuitName: c.name,
                lat: c.lat,
                lng: c.lng
            };
        }).filter(x => x);
    }
    const markers = gMarkersNationality.selectAll('circle.nationality-marker')
        .data(dataPoints, d => d.type === 'driver' ? d.driverName : d.circuitName);
    markers.exit()
        .transition().duration(duration)
        .style('opacity', 0)
        .remove();
    const enter = markers.enter().append('circle')
        .attr('class', 'nationality-marker')
        .attr('r', 4)
        .attr('fill', 'red')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .style('opacity', 0)
        .attr('cx', d => projectionNationality([d.lng, d.lat])[0])
        .attr('cy', d => projectionNationality([d.lng, d.lat])[1])
        .on('mouseover', (event, d) => {
            tooltipDriverNationality.transition().duration(200).style('opacity', 0.9);
            if (d.type === 'driver') {
                const teamName = d.constructorId && constructorNameMap.has(d.constructorId) ? constructorNameMap.get(d.constructorId) : 'Unknown Team';
                const teamLogoPath = d.constructorId ? `images/team_logos/${d.constructorId}.png` : 'images/team_logos/default.png';
                tooltipDriverNationality.html(`<strong>Driver:</strong> ${d.driverName}<br/>
                <strong>Nationality:</strong> ${d.nationality}<br/>
                <strong>Team:</strong> ${teamName} <img src="${teamLogoPath}" alt="${teamName}" class="team-logo-small" style="vertical-align:middle;width:20px;height:20px;margin-left:5px;"/>`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            } else {
                tooltipDriverNationality.html(`<strong>Circuit:</strong> ${d.circuitName}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            }
        })
        .on('mousemove', (event) => {
            tooltipDriverNationality
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
            tooltipDriverNationality.transition().duration(500).style('opacity', 0);
        });
    const allMarkers = enter.merge(markers);
    allMarkers.transition().duration(duration)
        .style('opacity', 1);
}

function initializeDriverNationalityMap() {
    const container = d3.select('#driver-nationality-map');
    container.selectAll('*').remove();
    container.style('position', 'relative');
    const cardHeader = d3.select('#driver-nationality-map').node().parentNode.querySelector('h2');
    const h2Selection = d3.select(cardHeader);
    let titleTextSpan = h2Selection.select('.title-text');
    if (titleTextSpan.empty()) {
        const originalText = cardHeader.childNodes[0].textContent.trim();
        cardHeader.childNodes[0].textContent = '';
        d3.select(cardHeader)
            .insert('span', ':first-child')
            .attr('class', 'title-text')
            .text(originalText);
        titleTextSpan = h2Selection.select('.title-text');
    }
    d3.select('#driver-nationality-map').select('.toggle-button').remove();
    toggleButtonElement = h2Selection.append('button')
        .attr('class', 'toggle-button')
        .style('margin-left', '15px')
        .text('Show Circuit Distribution')
        .on('click', toggleMapView);
    h2Selection.style('display', 'flex').style('align-items', 'center');
    tooltipDriverNationality = d3.select('body').append('div')
        .attr('class', 'tooltip-driver-nationality')
        .style('position', 'absolute')
        .style('background-color', '#222')
        .style('color', '#ffffff')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('font-family', 'Formula1')
        .style('font-size', '14px')
        .style('box-shadow', '0px 0px 10px rgba(0,0,0,0.5)');
    const width = 550, height = 360;
    svgNationalityMap = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('border', '1px solid #333')
        .style('border-radius', '8px')
        .style('background', '#222');
    gCountriesNationality = svgNationalityMap.append('g').attr('class', 'countries-group');
    gMarkersNationality = svgNationalityMap.append('g').attr('class', 'markers-group');
    projectionNationality = d3.geoNaturalEarth1().scale(120).translate([width / 2, height / 2]);
    pathNationality = d3.geoPath().projection(projectionNationality);
    const worlddata = topojson.feature(worldDataNationality, worldDataNationality.objects.countries).features;
    gCountriesNationality.selectAll('path.country')
        .data(worlddata)
        .enter().append('path')
        .attr('class', 'country')
        .attr('d', pathNationality)
        .attr('fill', '#333')
        .attr('stroke', '#111')
        .attr('stroke-width', 0.5);
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
            if (event.sourceEvent) event.sourceEvent.preventDefault();
            currentTransform = event.transform;
            gCountriesNationality.attr('transform', currentTransform);
            gMarkersNationality.attr('transform', currentTransform);
        });
    svgNationalityMap.call(zoom)
        .on("wheel", (event) => {
            event.preventDefault();
        }, {passive: false});
}

function fadeTitleText(newText) {
    const titleTextSpan = d3.select('.title-text');
    titleTextSpan.transition()
        .duration(325)
        .style('opacity', 0)
        .on('end', function () {
            titleTextSpan.text(newText);
            titleTextSpan.transition()
                .duration(325)
                .style('opacity', 1);
        });
}

function toggleMapView() {
    if (mapMode === 'drivers') {
        mapMode = 'circuits';
        d3.select(this).text('Show Driver Nationality Distribution');
        fadeTitleText('Circuit Distribution');
    } else {
        mapMode = 'drivers';
        d3.select(this).text('Show Circuit Distribution');
        fadeTitleText('Driver Nationality Distribution');
    }
    const selectedYear = +d3.select('#year-slider').property('value');
    updateDriverNationalityMap(selectedYear);
}
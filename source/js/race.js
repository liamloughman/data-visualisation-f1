function main() {
    const racesCsvPath = 'data/Races.csv';  
    
    d3.csv(racesCsvPath).then(function(racesData) {
        racesData.forEach(d => {
            d.raceId = +d.raceId;
            d.year = +d.year;
        });

        const years = Array.from(new Set(racesData.map(d => d.year))).sort((a, b) => a - b);

        const racesByYear = {};
        years.forEach(y => {
            racesByYear[y] = racesData.filter(d => d.year === y)
                                      .map(d => ({ raceId: d.raceId, name: d.name }));
        });

        createSelectors(years, racesByYear);
        initializePodiumAndFastestLap();
    });
}

function createSelectors(years, racesByYear) {
    const header = d3.select('#Selectors')
                     .style('display', 'flex')
                     .style('justify-content', 'center')
                     .style('align-items', 'center')
                     .style('gap', '15px');

    const yearSelectorContainer = header.append('div')
                                        .style('display', 'flex')
                                        .style('align-items', 'center')
                                        .style('opacity', 0);

    yearSelectorContainer.append('label')
                         .text('Year: ')
                         .style('color', '#ee2a26')
                         .style('margin-right', '10px')
                         .style('font-family', 'Formula1')
                         .style('font-weight', 'normal');

    const yearSelector = yearSelectorContainer.append('select')
                                              .attr('id', 'year-selector')
                                              .style('font-family', 'Formula1')
                                              .style('font-weight', 'normal')
                                              .style('width', '300px')
                                              .style('background', '#222')
                                              .style('color', '#ee2a26')
                                              .style('border', '1px solid transparent')
                                              .style('transition', 'border-color 0.2s ease')
                                              .style('padding', '10px 20px')
                                              .style('border-radius', '8px')
                                              .style('cursor', 'pointer');

    yearSelector.on('mouseover', function() {
        d3.select(this).style('border', '1px solid #ee2a26');
    })
    .on('mouseout', function() {
        d3.select(this).style('border', '1px solid transparent');
    });

    yearSelector.append('option')
        .attr('value', '')
        .text('Select Year')
        .attr('disabled', true)
        .attr('selected', true);

    yearSelector.selectAll('option:not([disabled])')
                .data(years)
                .enter()
                .append('option')
                .attr('value', d => d)
                .text(d => d);

    const raceSelectorContainer = header.append('div')
                                        .style('display', 'flex')
                                        .style('align-items', 'center')
                                        .style('opacity', 0);

    raceSelectorContainer.append('label')
                         .text('Race: ')
                         .style('color', '#ee2a26')
                         .style('margin-right', '10px')
                         .style('font-family', 'Formula1')
                         .style('font-weight', 'normal');

    const raceSelector = raceSelectorContainer.append('select')
                                              .attr('id', 'race-selector')
                                              .attr('disabled', true)
                                              .style('font-family', 'Formula1')
                                              .style('font-weight', 'normal')
                                              .style('width', '300px')
                                              .style('background', '#222')
                                              .style('color', '#ee2a26')
                                              .style('border', '1px solid transparent')
                                              .style('transition', 'border-color 0.2s ease')
                                              .style('padding', '10px 20px')
                                              .style('border-radius', '8px')
                                              .style('cursor', 'pointer');

    raceSelector.on('mouseenter', function() {
        if (!this.disabled) {
            d3.select(this).style('border', '1px solid #ee2a26');
        }
    })
    .on('mouseleave', function() {
        d3.select(this).style('border', '1px solid transparent');
    });
    yearSelectorContainer.transition()
        .duration(200)
        .style('opacity', 1);

    raceSelectorContainer.transition()
        .duration(200)
        .style('opacity', 1);

    yearSelector.on('change', function() {
        const selectedYear = +this.value;
        const yearRaces = racesByYear[selectedYear];

        raceSelector.attr('disabled', null);

        raceSelector.selectAll('option').remove();

        raceSelector.append('option')
                    .attr('value', '')
                    .text('Select Race')
                    .attr('disabled', true)
                    .attr('selected', true);

        raceSelector.selectAll('option:not([disabled])')
                    .data(yearRaces)
                    .enter()
                    .append('option')
                    .attr('value', d => d.raceId)
                    .text(d => d.name);

        raceSelector.on('change', function () {
            const selectedRaceId = +this.value;
            getData(selectedRaceId);
        });
    });
}

function initializePodiumAndFastestLap() {
    const podiumBoxes = d3.selectAll('.podium-box');
    podiumBoxes.transition()
        .duration(400)
        .style('height', function() {
            const id = this.id;
            if (id === 'first-place') return '150px';
            if (id === 'second-place') return '130px';
            if (id === 'third-place') return '110px';
        })
        .style('opacity', 1)
        .on('end', function() {
            d3.select('#fastest-lap-box')
                .transition()
                .duration(500)
                .style('opacity', 1);
        });
}

function getData(selectedRaceId) {
    const qualifyingCsvPath = 'data/qualifying.csv';
    const resultsCsvPath = 'data/results.csv';
    const driversCsvPath = 'data/drivers.csv';
    const constructorsCsvPath = 'data/constructors.csv';
    const statusCsvPath = 'data/status.csv';
    const pitStopsCsvPath = 'data/pit_stops.csv';
    const lapTimesCsvPath = 'data/lap_times.csv';

    Promise.all([
        d3.csv(qualifyingCsvPath),
        d3.csv(resultsCsvPath),
        d3.csv(driversCsvPath),
        d3.csv(constructorsCsvPath),
        d3.csv(statusCsvPath),
        d3.csv(pitStopsCsvPath),
        d3.csv(lapTimesCsvPath)
    ]).then(function ([qualifyingData, resultsData, driversData, constructorsData, statusData, pitStopsData, lapTimesData]) {
        
        qualifyingData.forEach(d => (d.raceId = +d.raceId));
        resultsData.forEach(d => {
            d.raceId = +d.raceId;
            d.constructorId = +d.constructorId;
            d.number = d.number ? +d.number : 'N/A';
            d.statusId = +d.statusId;
            d.fastestLapTime = d.fastestLapTime || '\\N';
            d.fastestLap = +d.fastestLap || '\\N';
        });

        driversData.forEach(d => (d.driverId = +d.driverId));
        constructorsData.forEach(d => (d.constructorId = +d.constructorId));
        statusData.forEach(d => (d.statusId = +d.statusId));
        pitStopsData.forEach(d => {
            d.raceId = +d.raceId;
            d.driverId = +d.driverId;
            d.lap = +d.lap;
            d.milliseconds = +d.milliseconds;
        });

        const driverCodeMap = Object.fromEntries(
            driversData.map(d => [d.driverId, d.code || 'N/A'])
        );
        const constructorNameMap = Object.fromEntries(
            constructorsData.map(d => [d.constructorId, d.name || 'N/A'])
        );
        const statusMap = Object.fromEntries(
            statusData.map(d => [d.statusId, d.status])
        );

        const resultsForRace = resultsData
            .filter(d => d.raceId === selectedRaceId)
            .sort((a, b) => +a.positionOrder - +b.positionOrder);

        const driverForenameMap = Object.fromEntries(
            driversData.map(d => [d.driverId, d.forename])
        );

        const driverSurnameMap = Object.fromEntries(
            driversData.map(d => [d.driverId, d.surname])
        );

        const driverMap = Object.fromEntries(
            driversData.map(d => [d.driverId, `${d.forename} ${d.surname}`])
        );

        const podiumData = resultsForRace.slice(0, 3).map((result, index) => ({
            position: index + 1,
            driverName: driverMap[result.driverId] || 'Unknown',
            driverCode: driverCodeMap[result.driverId] || 'N/A',
            constructorId: result.constructorId || 'N/A',
            constructorName: constructorNameMap[result.constructorId] || 'N/A',
            time: result.time || 'N/A',
        }));

        const fastestLapEntry = resultsForRace.find(d => d.fastestLapTime !== '\\N');
        let fastestLapData = null;

        if (fastestLapEntry) {

            const pitStopsForDriver = pitStopsData.filter(
                p => p.raceId === fastestLapEntry.raceId && p.driverId === +fastestLapEntry.driverId
            );

            const tyreAges = pitStopsForDriver
                .map(p => {
                    const age = fastestLapEntry.fastestLap - p.lap;
                    return age;
                })
                .filter(age => age > 0);
                
            const tyreAge = tyreAges.length > 0 ? `${Math.min(...tyreAges)} laps` : 'Unknown';
    
            fastestLapData = {
                time: fastestLapEntry.fastestLapTime,
                driverName: driverMap[fastestLapEntry.driverId] || 'Unknown',
                constructorName: constructorNameMap[fastestLapEntry.constructorId] || 'N/A',
                lap: fastestLapEntry.fastestLap,
                tyreAge,
            };
        
        }

        const startingGrid = qualifyingData
        .filter(q => q.raceId === selectedRaceId)
        .sort((a, b) => +a.position - +b.position)
        .map(d => {
            const matchingResult = resultsData.find(r => r.raceId === selectedRaceId && r.driverId === d.driverId);
            const driverFullName = driverMap[d.driverId] || 'Unknown Driver';

            return {
                position: +d.position,
                driverId: +d.driverId,
                driverCode: driverCodeMap[+d.driverId] || 'N/A',
                driverFullName: driverFullName,
                forename: driverForenameMap[d.driverId] || 'Unknown',
                surname: driverSurnameMap[d.driverId] || 'Unknown',
                time: determineBestTime(d.q1, d.q2, d.q3),
                constructorId: matchingResult ? matchingResult.constructorId : null,
                constructorName: matchingResult ? constructorNameMap[matchingResult.constructorId] : 'N/A'
            };
        });


        const finishingGrid = resultsData
            .filter(r => r.raceId === selectedRaceId)
            .sort((a, b) => +a.positionOrder - +b.positionOrder)
            .map(d => ({
                position: +d.positionOrder,
                driverId: +d.driverId,
                driverCode: driverCodeMap[+d.driverId] || 'N/A',
                driverFullName: driverMap[+d.driverId] || 'Unknown',
                forename: driverForenameMap[d.driverId] || 'Unknown',
                surname: driverSurnameMap[d.driverId] || 'Unknown',
                time: d.time !== '\\N' ? d.time : statusMap[+d.statusId] || 'Unknown Status',
                constructorId: d.constructorId,
                constructorName: constructorNameMap[d.constructorId] || 'N/A'
            }));

        lapTimesData.forEach(d => {
            d.raceId = +d.raceId;
            d.driverId = +d.driverId;
            d.lap = +d.lap;
            d.milliseconds = +d.milliseconds;
        });

        const filteredLaps = lapTimesData.filter(d => d.raceId === selectedRaceId);
        
        const laps = Array.from(new Set(filteredLaps.map(d => d.lap))).sort((a, b) => a - b);
        
        const positionData = [];
        laps.forEach(lap => {
            const lapRank = [];
            filteredLaps
                .filter(d => d.lap === lap)
                .forEach(d => {
                    const cumulativeTime = d3.sum(
                        filteredLaps.filter(ld => ld.driverId === d.driverId && ld.lap <= lap),
                        ld => ld.milliseconds
                    );
                    lapRank.push({ driverId: d.driverId, lap, cumulativeTime });
                });

            lapRank
                .sort((a, b) => a.cumulativeTime - b.cumulativeTime)
                .forEach((ranked, i) => {
                    positionData.push({
                        driverId: ranked.driverId,
                        lap: ranked.lap,
                        position: i + 1,
                    });
                });
        });

        const initialPositions = startingGrid.map((d) => ({
            driverId: d.driverId,
            lap: 0,
            position: d.position
        }));

        const driverConstructorMap = {};
        resultsForRace.forEach(result => {
            driverConstructorMap[result.driverId] = result.constructorId;
        });

        const lapTimeByDriver = d3.group(filteredLaps, d => d.driverId);

        const driversWithLapTimes = startingGrid.map(driver => ({
            driverId: driver.driverId,
            driverCode: driver.driverCode,
            driverName: driver.forename || 'Unknown',
            driverFamilyName: driver.surname || 'Unknown',
            lapTimes: lapTimeByDriver.get(driver.driverId) || []
        }));

        console.log("Drivers During Race and Their Lap Times:", driversWithLapTimes);
        
        updatePodium(podiumData);
        updateFastestLap(fastestLapData);
        updateStartingGrid(startingGrid);
        updateFinishingGrid(finishingGrid);
        updatePositionChart(positionData, driverMap, driverCodeMap, constructorNameMap, startingGrid, finishingGrid, initialPositions, driverConstructorMap);
        renderLapTimeLineChart(driversWithLapTimes);

    }).catch(console.error);
}

function updatePodium(podiumData) {
    const podiumBoxes = {
        1: d3.select('#first-place'),
        2: d3.select('#second-place'),
        3: d3.select('#third-place'),
    };

    if (podiumData && podiumData.length > 0) {
        podiumData.forEach(driver => {
            const podiumBox = podiumBoxes[driver.position];
            const teamLogoPath = `images/team_logos/${driver.constructorId}.png`;
            const details = [driver.constructorName];
            if (driver.driverCode !== '\\N') details.push(driver.driverCode);
            if (driver.time !== '\\N') details.push(driver.time);
            let content = podiumBox.select('.podium-content');
        
            if (content.empty()) {
                content = podiumBox.append('div')
                    .attr('class', 'podium-content')
                    .style('opacity', 0)
                    .style('display', 'flex')
                    .style('flex-direction', 'row')
                    .style('align-items', 'center')
                    .style('gap', '10px');
            }
        
            content.transition()
                .duration(300)
                .style('opacity', 0)
                .on('end', function () {
                    content.html(`
                        <img src="${teamLogoPath}" alt="${driver.constructorName} Logo" class="team-logo">
                        <div class="text-content">
                            <strong>P${driver.position} - ${driver.driverName}</strong><br>
                            <span>${details.join(' - ')}</span>
                        </div>
                    `);
                    
                    content.select('.text-content')
                        .style('display', 'flex')
                        .style('flex-direction', 'column');
        
                    content.transition()
                        .duration(300)
                        .style('opacity', 1);
                });
        });
    } else {
        const firstContent = podiumBoxes[1].select('.podium-content');
        firstContent
            .transition()
            .duration(300)
            .style('opacity', 0)
            .on('end', function() {
                d3.select(this).html('P1')
                    .transition()
                    .duration(300)
                    .style('opacity', 1);
            });
    
        const secondContent = podiumBoxes[2].select('.podium-content');
        secondContent
            .transition()
            .duration(300)
            .style('opacity', 0)
            .on('end', function() {
                d3.select(this).html('P2')
                    .transition()
                    .duration(300)
                    .style('opacity', 1);
            });
    
        const thirdContent = podiumBoxes[3].select('.podium-content');
        thirdContent
            .transition()
            .duration(300)
            .style('opacity', 0)
            .on('end', function() {
                d3.select(this).html('P3')
                    .transition()
                    .duration(300)
                    .style('opacity', 1);
            });
    }
}

function updateFastestLap(fastestLapData) {
    const fastestLapBox = d3.select('#fastest-lap-content');
    
    fastestLapBox
        .transition()
        .duration(300)
        .style('opacity', 0)
        .on('end', function () {
            if (fastestLapData) {
                fastestLapBox.html(`
                    <strong>Fastest Lap</strong> - ${fastestLapData.driverName} - ${fastestLapData.constructorName} - ${fastestLapData.time} - Lap ${fastestLapData.lap} - Tyre Age: ${fastestLapData.tyreAge}
                `);
            } else {
                fastestLapBox.html(`
                    <strong>Fastest Lap</strong> - Unknown fastest lap for this race.
                `);
            }
            fastestLapBox
                .transition()
                .duration(300)
                .style('opacity', 1);
        });
}

function updateStartingGrid(grid) {
    const tbody = d3.select('#grid tbody');

    tbody.selectAll('tr').remove();

    if (grid.length === 0) {
        tbody.append('tr').append('td')
            .attr('colspan', 3)
            .style('text-align', 'center')
            .style('color', '#fff')
            .text('Starting grid unavailable for this race');
    } else {
        grid.forEach(row => {
            const driverDisplay = row.driverCode === '\\N' ? row.surname : row.driverCode;

            const tr = tbody.append('tr')
                .style('opacity', 0);
            tr.append('td').text(row.position);
            tr.append('td')
                .style('text-align', 'left')
                .html(`
                    ${driverDisplay}
                    <img src="images/team_logos/${row.constructorId}.png"
                         alt="${row.constructorName}"
                         class="team-logo-small" />
                `);

            tr.append('td').text(row.time)
            tr.on('mouseover', function(event) {
                showTooltip(event, row.driverFullName, row.constructorName);
            })
            .on('mousemove', function(event) {
                tooltip.style('left', (event.pageX + 10) + 'px')
                       .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                hideTooltip();
            });
        });

        const rows = tbody.selectAll('tr');
        rows.transition()
            .duration(300)
            .delay((d, i) => i * 50)
            .style('opacity', 1);
    }

    d3.select('#grid-table')
        .transition()
        .duration(500)
        .ease(d3.easeCubic)
        .style('opacity', 1);

    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', '#fff')
        .style('padding', '5px 10px')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('font-size', '12px');

    function showTooltip(event, driverFullName, constructorName) {
        tooltip.transition()
            .duration(200)
            .style('opacity', 0.9);
        tooltip.html(`<strong>${driverFullName}</strong><br>Constructor: ${constructorName}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
    }

    function hideTooltip() {
        tooltip.transition()
            .duration(500)
            .style('opacity', 0);
    }
}

function determineBestTime(q1, q2, q3) {
    if (q3 && q3 !== '\\N') return q3;
    if (q2 && q2 !== '\\N') return q2;
    if (q1 && q1 !== '\\N') return q1;
    return 'No Time Set';
}

function updateFinishingGrid(grid) {
    const tbody = d3.select('#finishing-grid tbody');
    tbody.selectAll('tr').remove();

    if (grid.length === 0) {
        tbody.append('tr').append('td')
            .attr('colspan', 3)
            .style('text-align', 'center')
            .style('color', '#fff')
            .text('Unknown finishing grid during this race');
    } else {
        grid.forEach(row => {
            const driverDisplay = row.driverCode === '\\N' ? row.surname : row.driverCode;
            const timeStr = row.time;
            const lowerTime = timeStr.toLowerCase();

            let displayPosition;
            
            if (lowerTime.includes('lap')) {
                displayPosition = row.position;
            } else if (
                (/^\+\d+(\.\d+)?$/.test(timeStr)) || (timeStr.includes(':'))
            ) {
                displayPosition = row.position;
            } else {
                displayPosition = 'DNF';
            }

            const tr = tbody.append('tr')
                .style('opacity', 0);
            tr.append('td').text(displayPosition);

            tr.append('td')
                .style('text-align', 'left')
                .html(`
                    ${driverDisplay}
                    <img src="images/team_logos/${row.constructorId}.png"
                         alt="${row.constructorName}"
                         class="team-logo-small" />
                `);

            tr.append('td').text(timeStr)
            tr.on('mouseover', function(event) {
                showTooltip(event, row.driverFullName, row.constructorName);
            })
            .on('mousemove', function(event) {
                tooltip.style('left', (event.pageX + 10) + 'px')
                       .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                hideTooltip();
            });
        });

        const rows = tbody.selectAll('tr');
        rows.transition()
            .duration(300)
            .delay((d, i) => i * 50)
            .style('opacity', 1);
    }

    d3.select('#finishing-grid')
        .transition()
        .duration(500)
        .ease(d3.easeCubic)
        .style('opacity', 1);

    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', '#fff')
        .style('padding', '5px 10px')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('font-size', '12px');

    function showTooltip(event, driverFullName, constructorName) {
        tooltip.transition()
            .duration(200)
            .style('opacity', 0.9);
        tooltip.html(`<strong>${driverFullName}</strong><br>Constructor: ${constructorName}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
    }

    function hideTooltip() {
        tooltip.transition()
            .duration(500)
            .style('opacity', 0);
    }
}

function updatePositionChart(positionData, driverMap, driverCodeMap, constructorNameMap, startingGrid, finishingGrid, initialPositions, driverConstructorMap) {
    d3.select('#chart-container').selectAll('*').remove();

    let chartHeight;
    if (startingGrid.length > 0) {
        chartHeight = startingGrid.length * 30;
    } else if (finishingGrid.length > 0) {
        chartHeight = finishingGrid.length * 30;
    } else {
        chartHeight = 900; 
    }

    const chartContainer = d3.select('#chart-container');
    chartContainer.style('height', `${chartHeight + 60}px`);

    if (positionData.length === 0) {
        chartContainer.append('div')
            .style('color', '#fff')
            .text('No lap position data available for this race.');
        
        d3.select('#position-chart')
            .transition()
            .duration(500)
            .ease(d3.easeCubic)
            .style('opacity', 1);
        return;
    }

    const updatedPositionData = initialPositions.concat(positionData);

    const containerNode = chartContainer.node();
    const width = containerNode.getBoundingClientRect().width;
    const height = containerNode.getBoundingClientRect().height;

    const margin = { top: 20, right: 5, bottom: 28, left: 5 };
    const topOffset = 25;
    const bottomOffset = 17;
    
    const dataByDriver = d3.group(updatedPositionData, d => d.driverId);
    const driversWithData = dataByDriver.size;
    
    let qualifiedDrivers = 0;
    if (startingGrid.length > 0) {
        qualifiedDrivers = startingGrid.length;
    } else if (finishingGrid.length > 0) {
        qualifiedDrivers = finishingGrid.length;
    } else {
        qualifiedDrivers = 0;
    }

    const missingDrivers = qualifiedDrivers - driversWithData;
    const additionalOffset = missingDrivers > 0 ? missingDrivers * 30 : 0;

    const xScale = d3.scaleLinear()
        .domain(d3.extent(updatedPositionData.map(d => d.lap)))
        .range([margin.left, width - margin.right]);

    const maxPosition = d3.max(updatedPositionData, d => d.position);

    const yScale = d3.scaleLinear()
        .domain([1, maxPosition])
        .range([margin.top + topOffset, height - margin.bottom - bottomOffset - additionalOffset]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(updatedPositionData.map(d => d.driverId));

    d3.select('#position-chart').style('opacity', 0);

    const svg = chartContainer
        .append('svg')
        .attr('width', width)
        .attr('height', height - 5)
        .style('background', '#222')
        .style('border-radius', '8px');

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format('d'));
    const yAxis = d3.axisLeft(yScale);

    svg.append('g')
       .attr('transform', `translate(0,${height - margin.bottom})`)
       .call(xAxis)
       .call(g => g.selectAll('text').attr('fill', '#fff'))
       .call(g => g.selectAll('line').attr('stroke', '#fff'))
       .call(g => g.selectAll('path').attr('stroke', '#fff'));

    svg.append('g')
       .attr('transform', `translate(${margin.left},0)`)
       .call(yAxis)
       .call(g => g.selectAll('*').style('display', 'none'));

    const line = d3.line()
        .x(d => xScale(d.lap))
        .y(d => yScale(d.position));

    const linesGroup = svg.append('g').attr('class', 'lines-group');
    const hoverGroup = svg.append('g').attr('class', 'hover-group');

    for (const [driverId, lapsData] of dataByDriver.entries()) {
        lapsData.sort((a, b) => a.lap - b.lap);

        const color = colorScale(driverId);

        let pathNode;
        if (lapsData.length > 1) {
            const path = linesGroup.append('path')
                .datum(lapsData)
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', 2)
                .attr('d', line)
                .attr('class', `position-driver-line position-driver-line-${driverId}`);

            const lastData = lapsData[lapsData.length - 1];

            svg.append('circle')
                .attr('cx', xScale(lastData.lap))
                .attr('cy', yScale(lastData.position))
                .attr('r', 4)
                .attr('fill', color)
                .attr('class', `position-driver-circle position-driver-circle-${driverId}`)
                .style('opacity', 1);

            pathNode = path.node();
            const totalLength = pathNode.getTotalLength();
            path
                .attr('stroke-dasharray', totalLength + ' ' + totalLength)
                .attr('stroke-dashoffset', totalLength);

            hoverGroup.append('path')
                .datum(lapsData)
                .attr('fill', 'none')
                .attr('stroke', 'transparent')
                .attr('stroke-width', 5)
                .attr('d', line)
                .attr('class', `driver-hover driver-hover-${driverId}`)
                .style('cursor', 'pointer')
                .on('mouseover', function(event) {
                    d3.selectAll('.position-driver-line')
                        .transition()
                        .duration(200)
                        .style('opacity', 0.3);

                    d3.selectAll('.position-driver-circle')
                        .transition()
                        .duration(200)
                        .style('opacity', 0.3);

                    d3.select(`.position-driver-line-${driverId}`)
                        .transition()
                        .duration(200)
                        .style('opacity', 1)
                        .attr('stroke-width', 4);

                    d3.selectAll(`.position-driver-circle-${driverId}`)
                        .transition()
                        .duration(200)
                        .style('opacity', 1)
                        .attr('r', 8);
                    
                    showTooltip(event, driverId);
                })
                .on('mousemove', function(event) {
                    tooltip.style('left', (event.pageX + 10) + 'px')
                           .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', function() {
                    d3.selectAll('.position-driver-line')
                        .transition()
                        .duration(200)
                        .style('opacity', 1)
                        .attr('stroke-width', 2);

                    d3.selectAll('.position-driver-circle')
                        .transition()
                        .duration(200)
                        .style('opacity', 1)
                        .attr('r', 4);
                    
                    hideTooltip();
                });
        }
    }

    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', '#fff')
        .style('padding', '5px 10px')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('font-size', '12px');

    function showTooltip(event, driverId) {
        const driverName = driverMap[driverId] || 'Unknown Driver';
        const constructorId = driverConstructorMap[driverId];
        const constructorName = constructorNameMap[constructorId] || 'N/A';
        tooltip.transition()
            .duration(200)
            .style('opacity', 0.9);
        tooltip.html(`<strong>${driverName}</strong><br>Constructor: ${constructorName}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
    }

    function hideTooltip() {
        tooltip.transition()
            .duration(500)
            .style('opacity', 0);
    }

    const startRowsCount = startingGrid.length;
    const finishRowsCount = finishingGrid.length;
    const maxRows = Math.max(startRowsCount, finishRowsCount);
    const tableAnimationTime = 300 + (maxRows - 1)*50 + 500;

    setTimeout(() => {
        d3.select('#position-chart')
            .transition()
            .duration(500)
            .ease(d3.easeCubic)
            .style('opacity', 1)
            .on('end', function() {
                animateLines();
            });
    }, tableAnimationTime);

    function animateLines() {
        hoverGroup.style('pointer-events', 'none');
    
        const driverLines = d3.selectAll('.position-driver-line');
        const totalTransitions = driverLines.size();
        let completedTransitions = 0;
    
        driverLines.transition()
            .duration(2000)
            .ease(d3.easeCubic)
            .attr('stroke-dashoffset', 0)
            .on('end', function() {
                completedTransitions++;
                if (completedTransitions === totalTransitions) {
                    hoverGroup.style('pointer-events', 'all');
                }
            });
    }
}

function renderLapTimeLineChart(driversWithLapTimes) {
    d3.select('#lap-chart > h2')
        .transition()
        .duration(300)
        .style('opacity', 1);

    const container = d3.select('#lap-chart');

    container.selectAll('svg')
        .transition()
        .duration(300)
        .style('opacity', 0)
        .remove();

    container.selectAll('.no-lap-data-message')
        .transition()
        .duration(300)
        .style('opacity', 0)
        .remove();

    container.select('#driver-buttons-container')
        .transition()
        .duration(300)
        .style('opacity', 0)
        .remove();

    const width = container.node().getBoundingClientRect().width;
    const height = 500;
    const margin = { top: 20, right: 30, bottom: 50, left: 70 };

    const allLapData = driversWithLapTimes.flatMap(driver => 
        driver.lapTimes.map(d => ({
            driverId: driver.driverId, 
            lap: d.lap, 
            milliseconds: d.milliseconds,
            driverCode: driver.driverCode,
            driverFamilyName: driver.driverFamilyName
        }))
    );

    if (allLapData.length === 0) {
        container.append('div')
            .attr('class', 'no-lap-data-message')
            .style('display', 'flex')
            .style('justify-content', 'center')
            .style('align-items', 'center')
            .style('color', '#fff')
            .text('No lap time data available.');
        return;
    }

    const xDomain = [1, d3.max(allLapData, d => d.lap)];
    const yDomain = [d3.min(allLapData, d => d.milliseconds), d3.max(allLapData, d => d.milliseconds)];

    const svg = container.append('svg')
        .attr('id', 'lap-time-chart-svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', '#222')
        .style('border-radius', '8px')
        .style('margin-top', '20px')
        .style('opacity', 0);

    const xScale = d3.scaleLinear()
        .domain(xDomain)
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain(yDomain)
        .range([height - margin.bottom, margin.top]);

    svg.node().__lapTimeScales = { xScale, yScale, margin, width, height };

    svg.append('g')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')))
        .selectAll('text')
        .style('fill', 'white');

    svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .style('fill', 'white');

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .text('Lap Number');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .text('Lap Time (ms)');

    svg.append('g').attr('class', 'lap-time-lines-group');

    svg.append('g').attr('class', 'lap-time-hover-circles-group');

    svg.transition().duration(500).style('opacity', 1);

    createDriverButtons(driversWithLapTimes);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
                         .domain(driversWithLapTimes.map(d => d.driverId));

    const firstThree = driversWithLapTimes.slice(0, 3);
    firstThree.forEach(d => {
        toggleLapTimeChart(driversWithLapTimes, d.driverId, true);
        d3.select(`.driver-button[data-driver-id='${d.driverId}']`)
            .classed('selected', true)
            .style('border-color', colorScale(d.driverId));
    });

    const tooltip = container.append('div')
        .attr('class', 'shared-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', '#fff')
        .style('padding', '10px')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('font-size', '12px')
        .style('max-width', '300px')
        .style('z-index', '10');

    svg.append('rect')
        .attr('width', width - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom)
        .attr('x', margin.left)
        .attr('y', margin.top)
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mousemove', mousemove)
        .on('mouseout', () => {
            tooltip.transition().duration(500).style('opacity', 0);
            svg.select('.lap-time-hover-circles-group').selectAll('circle').remove();
        });

    function mousemove(event) {
        const [mouseX, mouseY] = d3.pointer(event);
        const lap = Math.round(xScale.invert(mouseX));
        if (lap < xDomain[0] || lap > xDomain[1]) {
            tooltip.transition().duration(500).style('opacity', 0);
            svg.select('.lap-time-hover-circles-group').selectAll('circle').remove();
            return;
        }

        const selectedDriverIds = Array.from(document.querySelectorAll('.driver-button.selected'))
            .map(button => +button.getAttribute('data-driver-id'));

        if (selectedDriverIds.length === 0) {
            tooltip.transition().duration(500).style('opacity', 0);
            svg.select('.lap-time-hover-circles-group').selectAll('circle').remove();
            return;
        }

        const lapTimesAtLap = driversWithLapTimes
            .filter(driver => selectedDriverIds.includes(driver.driverId))
            .map(driver => {
                const lapTime = driver.lapTimes.find(d => d.lap === lap);
                return {
                    driverId: driver.driverId,
                    driverName: driver.driverCode !== '\\N' ? driver.driverCode : driver.driverFamilyName,
                    milliseconds: lapTime ? lapTime.milliseconds : null,
                    lap: lapTime ? lapTime.lap : null
                };
            })
            .filter(d => d.milliseconds !== null);

        if (lapTimesAtLap.length === 0) {
            tooltip.transition().duration(500).style('opacity', 0);
            svg.select('.lap-time-hover-circles-group').selectAll('circle').remove();
            return;
        }

        let htmlContent = `<strong>Lap ${lap}</strong><br/><br/>`;
        lapTimesAtLap.forEach(d => {
            const color = colorScale(d.driverId);
            const formattedTime = formatMilliseconds(d.milliseconds);
            htmlContent += `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="width: 12px; height: 12px; background-color: ${color}; border-radius: 50%; display: inline-block;"></span>
                    <span>${d.driverName}</span>
                    <span>${formattedTime}</span>
                </div>
            `;
        });

        tooltip.html(htmlContent)
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 28) + 'px')
            .transition()
            .duration(200)
            .style('opacity', 0.9);

        const hoverCirclesGroup = svg.select('.lap-time-hover-circles-group');
        hoverCirclesGroup.selectAll('circle').remove();

        lapTimesAtLap.forEach(d => {
            hoverCirclesGroup.append('circle')
                .attr('cx', xScale(d.lap))
                .attr('cy', yScale(d.milliseconds))
                .attr('r', 6)
                .attr('fill', 'none')
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .attr('pointer-events', 'none');
        });
    }
}

function createDriverButtons(driversWithLapTimes) {

    console.log(driversWithLapTimes);

    d3.select('#driver-buttons-container').remove();

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
                         .domain(driversWithLapTimes.map(d => d.driverId));

    const buttonContainer = d3.select('#lap-chart')
        .append('div')
        .attr('id', 'driver-buttons-container')
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('gap', '10px')
        .style('justify-content', 'center')
        .style('margin-top', '20px');

driversWithLapTimes.forEach(driver => {
    const { driverId, driverCode, driverName, driverFamilyName } = driver;
    const color = colorScale(driverId);
    const displayName = driverCode !== '\\N' ? driverCode : driverFamilyName;

    const button = buttonContainer.append('button')
        .attr('class', 'driver-button')
        .attr('data-driver-id', driverId)
        .style('background', '#222')
        .style('color', '#ee2a26')
        .style('border', `2px solid transparent`)
        .style('padding', '8px 12px')
        .style('border-radius', '6px')
        .style('cursor', 'pointer')
        .style('font-family', 'Formula1')
        .style('transition', 'border-color 0.2s ease')
        .text(displayName)
        .on('mouseover', function() {
            d3.select(this).style('border-color', color);
        }).on('mouseout', function() {
            if (!d3.select(this).classed('selected')) {
                d3.select(this).style('border-color', 'transparent');
            }
        });

    button.on('click', function() {
        const isSelected = d3.select(this).classed('selected');

        if (isSelected) {
            d3.select(this).classed('selected', false)
                .style('border-color', 'transparent');
            toggleLapTimeChart(driversWithLapTimes, driverId, false);
        } else {
            d3.select(this).classed('selected', true)
                .style('border-color', color);
            toggleLapTimeChart(driversWithLapTimes, driverId, true);
        }
        });
    });
}

function toggleLapTimeChart(driversWithLapTimes, driverId, shouldDisplay) {
    const svg = d3.select('#lap-time-chart-svg');
    if (svg.empty()) return;

    const scales = svg.node().__lapTimeScales;
    if (!scales) return;

    const { xScale, yScale } = scales;

    const driverData = driversWithLapTimes.find(d => d.driverId === driverId);
    if (!driverData) return;
    const lapData = driverData.lapTimes;

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(driversWithLapTimes.map(d => d.driverId));

    const color = colorScale(driverId);
    const linesGroup = svg.select('.lap-time-lines-group');

    const line = d3.line()
        .x(d => xScale(d.lap))
        .y(d => yScale(d.milliseconds));

    if (shouldDisplay) {
        const path = linesGroup.selectAll(`.lap-time-driver-lap-line-${driverId}`)
            .data([lapData], d => driverId);

        const entering = path.enter().append('path')
            .attr('class', `lap-time-driver-lap-line-${driverId}`)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2)
            .attr('d', line)
            .style('opacity', 0);

        entering.transition().duration(1000).style('opacity', 1);

        const circlesGroup = linesGroup.selectAll(`.lap-time-driver-circles-group-${driverId}`)
            .data([driverData], d => driverId);

        const circlesEnter = circlesGroup.enter().append('g')
            .attr('class', `lap-time-driver-circles-group-${driverId}`);

        circlesEnter.selectAll(`.lap-time-driver-circle-${driverId}`)
            .data(lapData)
            .enter()
            .append('circle')
            .attr('class', `lap-time-driver-circle-${driverId}`)
            .attr('cx', d => xScale(d.lap))
            .attr('cy', d => yScale(d.milliseconds))
            .attr('r', 4)
            .attr('fill', color)
            .style('opacity', 0)
            .on('mouseover', function(event, d) {})
            .on('mouseout', function() {})
            .transition()
            .duration(1000)
            .style('opacity', 1);

        circlesGroup.exit().remove();

    } else {
        linesGroup.select(`.lap-time-driver-lap-line-${driverId}`)
            .transition()
            .duration(500)
            .style('opacity', 0)
            .remove();

        linesGroup.selectAll(`.lap-time-driver-circles-group-${driverId}`)
            .transition()
            .duration(500)
            .style('opacity', 0)
            .remove();
    }
}

function formatMilliseconds(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}
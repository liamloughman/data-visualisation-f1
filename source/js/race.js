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
                forename: driverFullName.split(' ')[0], 
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
                driverFullName: driverMap[+d.driverId] || 'Unknown Driver',
                forename: driverMap[+d.driverId]?.split(' ')[0] || 'Unknown',
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
        
        updatePodium(podiumData);
        updateFastestLap(fastestLapData);
        updateStartingGrid(startingGrid);
        updateFinishingGrid(finishingGrid);
        updatePositionChart(positionData, driverMap, driverCodeMap, constructorNameMap, startingGrid, finishingGrid);

    }).catch(console.error);
}

function updatePodium(podiumData) {
    const podiumBoxes = {
        1: d3.select('#first-place'),
        2: d3.select('#second-place'),
        3: d3.select('#third-place'),
    };

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
    
        content
            .transition()
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
    
                content
                    .transition()
                    .duration(300)
                    .style('opacity', 1);
            });
    });
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
            const driverDisplay = row.driverCode === '\\N' ? row.forename : row.driverCode;

            const tr = tbody.append('tr');
            tr.append('td').text(row.position);
            tr.append('td')
                .attr('title', `${row.driverFullName} - ${row.constructorName}`)
                .style('text-align', 'left')
                .html(`
                    ${driverDisplay}
                    <img src="images/team_logos/${row.constructorId}.png"
                         alt="${row.constructorName}"
                         class="team-logo-small" />
                `);

            tr.append('td').text(row.time);
        });
    }

    d3.select('#grid-table')
        .transition()
        .duration(500)
        .ease(d3.easeCubic)
        .style('opacity', 1);
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
            const driverDisplay = row.driverCode === '\\N' ? row.forename : row.driverCode;
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

            const tr = tbody.append('tr');
            tr.append('td').text(displayPosition);

            tr.append('td')
                .attr('title', `${row.driverFullName} - ${row.constructorName}`)
                .style('text-align', 'left')
                .html(`
                    ${driverDisplay}
                    <img src="images/team_logos/${row.constructorId}.png"
                         alt="${row.constructorName}"
                         class="team-logo-small" />
                `);

            tr.append('td').text(timeStr);
        });
    }

    d3.select('#finishing-grid')
        .transition()
        .duration(500)
        .ease(d3.easeCubic)
        .style('opacity', 1);
}

function updatePositionChart(positionData, driverMap, driverCodeMap, constructorNameMap, startingGrid, finishingGrid) {
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
            .style('opacity', 1);
        return;
    }

    const containerNode = chartContainer.node();
    const width = containerNode.getBoundingClientRect().width;
    const height = containerNode.getBoundingClientRect().height;

    const margin = { top: 20, right: 5, bottom: 20, left: 5 };
    const topOffset = 25;
    const bottomOffset = 25;
    
    const dataByDriver = d3.group(positionData, d => d.driverId);
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
        .domain(d3.extent(positionData.map(d => d.lap)))
        .range([margin.left, width - margin.right]);

    const maxPosition = d3.max(positionData, d => d.position);

    const yScale = d3.scaleLinear()
        .domain([1, maxPosition])
        .range([margin.top + topOffset, height - margin.bottom - bottomOffset - additionalOffset]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(positionData.map(d => d.driverId));

    const svg = chartContainer
        .append('svg')
        .attr('width', width)
        .attr('height', height)
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

    for (const [driverId, lapsData] of dataByDriver.entries()) {
        lapsData.sort((a, b) => a.lap - b.lap);

        const color = colorScale(driverId);
        
        if (lapsData.length > 1) {
            svg.append('path')
                .datum(lapsData)
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', 2)
                .attr('d', line);
        }
        
        const lastData = lapsData[lapsData.length - 1];

        svg.append('circle')
            .attr('cx', xScale(lastData.lap))
            .attr('cy', yScale(lastData.position))
            .attr('r', 4)
            .attr('fill', color);

        const driverLabel = driverCodeMap[driverId] !== 'N/A' 
            ? driverCodeMap[driverId] 
            : driverMap[driverId].split(' ')[0];

        svg.append('text')
            .attr('x', xScale(lastData.lap) + 5)
            .attr('y', yScale(lastData.position))
            .attr('dy', '0.35em')
            .attr('fill', '#fff')
            .attr('font-size', '10px');
    }

    d3.select('#position-chart')
        .transition()
        .duration(500)
        .ease(d3.easeCubic)
        .style('opacity', 1);
}
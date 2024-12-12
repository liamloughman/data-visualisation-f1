
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
            populateBoxes(selectedRaceId);
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

function populateBoxes(selectedRaceId) {
    const qualifyingCsvPath = 'data/qualifying.csv';
    const resultsCsvPath = 'data/results.csv';
    const driversCsvPath = 'data/drivers.csv';
    const constructorsCsvPath = 'data/constructors.csv';
    const statusCsvPath = 'data/status.csv';
    const pitStopsCsvPath = 'data/pit_stops.csv';

    Promise.all([
        d3.csv(qualifyingCsvPath),
        d3.csv(resultsCsvPath),
        d3.csv(driversCsvPath),
        d3.csv(constructorsCsvPath),
        d3.csv(statusCsvPath),
        d3.csv(pitStopsCsvPath)
    ]).then(function ([qualifyingData, resultsData, driversData, constructorsData, statusData, pitStopsData]) {
        
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

        updatePodium(podiumData);
        updateFastestLap(fastestLapData);
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
    const fastestLapBox = d3.select('#fastest-lap-box');
    
    fastestLapBox
        .transition()
        .duration(300)
        .style('opacity', 0)
        .on('end', function () {
            if (fastestLapData) {
                fastestLapBox.html(`
                    <strong>Fastest Lap</strong> - ${fastestLapData.driverName} - ${fastestLapData.constructorName} - ${fastestLapData.time} - ${fastestLapData.lap} - Tyre Age: ${fastestLapData.tyreAge}
                `);
            } else {
                fastestLapBox.html(`
                    <strong>Fastest Lap</strong> Unknown fastest lap during this race.
                `);
            }
            fastestLapBox
                .transition()
                .duration(300)
                .style('opacity', 1);
        });
}
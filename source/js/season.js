let animationInProgress = false;
let animationTimeouts = [];
let previousPointsMap = new Map(); // Store previous points by nameKey
let animatedLinePoints = []; // Points for the animated line during animation
let previousLineLength = 0; // Track the previously drawn line length for cumulative growth

async function main() {
    const [circuits, races, drivers, constructors, driverStandings, constructorStandings, results, world] = await Promise.all([
        d3.csv('data/Circuits.csv'),
        d3.csv('data/Races.csv'),
        d3.csv('data/drivers.csv'),
        d3.csv('data/Constructors.csv'),
        d3.csv('data/driver_standings.csv'),
        d3.csv('data/constructor_standings.csv'),
        d3.csv('data/results.csv'),
        d3.json('data/world-110m.json')
    ]);

    // Convert numeric fields
    circuits.forEach(d => {
        d.circuitId = +d.circuitId;
        d.lat = +d.lat;
        d.lng = +d.lng;
    });
    races.forEach(d => {
        d.raceId = +d.raceId;
        d.year = +d.year;
        d.round = +d.round;
        d.circuitId = +d.circuitId; // ensure numeric
    });
    drivers.forEach(d => d.driverId = +d.driverId);
    constructors.forEach(d => d.constructorId = +d.constructorId);

    driverStandings.forEach(d => {
        d.driverStandingsId = +d.driverStandingsId;
        d.raceId = +d.raceId;
        d.driverId = +d.driverId;
        d.points = +d.points;
        d.position = +d.position;
        d.wins = +d.wins;
    });
    constructorStandings.forEach(d => {
        d.constructorStandingsId = +d.constructorStandingsId;
        d.raceId = +d.raceId;
        d.constructorId = +d.constructorId;
        d.points = +d.points;
        d.position = +d.position;
        d.wins = +d.wins;
    });

    results.forEach(d => {
        d.raceId = +d.raceId;
        d.driverId = +d.driverId;
        d.constructorId = +d.constructorId;
        d.points = +d.points;
        d.grid = +d.grid;
        d.positionOrder = +d.positionOrder;
    });

    // Maps for IDs to names/codes
    const driverNameMap = new Map(drivers.map(d => [d.driverId, `${d.forename} ${d.surname}`]));
    const driverCodeMap = new Map(drivers.map(d => [d.driverId, d.code || null]));
    const constructorNameMap = new Map(constructors.map(c => [c.constructorId, c.name]));

    const seasons = Array.from(new Set(races.map(r => r.year))).sort(d3.ascending);

    const mainContainer = d3.select('#season-chart');

    // Season selector
    const selectorContainer = mainContainer.append('div')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('align-items', 'center')
        .style('gap', '15px')
        .style('margin-bottom', '20px');

    selectorContainer.append('label')
        .text('Select Season:')
        .style('color', '#ee2a26')
        .style('font-family', 'Formula1');

    const seasonSelector = selectorContainer.append('select')
        .style('font-family', 'Formula1')
        .style('font-weight', 'normal')
        .style('width', '200px')
        .style('background', '#222')
        .style('color', '#ee2a26')
        .style('border', '1px solid transparent')
        .style('border-radius', '8px')
        .style('padding', '10px 20px')
        .style('cursor', 'pointer');

    seasonSelector.on('mouseover', function() {
        d3.select(this).style('border', '1px solid #ee2a26');
    })
    .on('mouseout', function() {
        d3.select(this).style('border', '1px solid transparent');
    });

    seasonSelector.selectAll('option')
        .data(seasons)
        .enter()
        .append('option')
        .attr('value', d => d)
        .text(d => d);

    let selectedYear = seasons[0];

    seasonSelector.on('change', function() {
        selectedYear = +this.value;
        previousPointsMap.clear();
        createStandingsTable(constructorDiv, 'Constructors');
        createStandingsTable(driverDiv, 'Drivers');
        updateSeason(selectedYear, true);
    });

    // Container for tables and map
    const container = mainContainer.append('div')
        .style('display', 'flex')
        .style('flex-direction', 'row')
        .style('align-items', 'flex-start')
        .style('justify-content', 'center')
        .style('gap', '20px')
        .style('color', '#fff');

    const constructorDiv = container.append('div')
        .attr('id', 'constructor-standings-container')
        .style('flex', '0 0 300px');

    const mapDiv = container.append('div')
        .attr('id', 'map-container')
        .style('position', 'relative')
        .style('opacity', 0);

    const driverDiv = container.append('div')
        .attr('id', 'driver-standings-container')
        .style('flex', '0 0 300px');

    // One button for animation
    const buttonContainer = mainContainer
        .append('div')
        .attr('class', 'button-container')
        .style('width', '100%')
        .style('text-align', 'center')
        .style('margin-top', '20px');

    const animateButton = buttonContainer.append('button')
        .text('Show Season Evolution')
        .style('padding', '10px 20px')
        .style('background', '#222')
        .style('color', '#ee2a26')
        .style('border', '1px solid #ee2a26')
        .style('border-radius', '8px')
        .style('font-family', 'Formula1')
        .style('cursor', 'pointer');

    animateButton.on('mouseover', function() { d3.select(this).style('border-color', '#fff'); })
        .on('mouseout', function() { d3.select(this).style('border-color', '#ee2a26'); })
        .on('click', toggleAnimation);

    const width = 600;
    const height = 400;

    const svg = mapDiv.append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('border', '1px solid #333')
        .style('border-radius', '8px')
        .style('background', '#222');

    // Groups for separate zoom behavior
    const gCountries = svg.append('g').attr('class', 'countries-group');
    const gMarkers = svg.append('g').attr('class', 'markers-group');

    const projection = d3.geoNaturalEarth1()
        .scale(120)
        .translate([width/2, height/2]);

    const path = d3.geoPath().projection(projection);
    const worlddata = topojson.feature(world, world.objects.countries).features;

    gCountries.selectAll('path.country')
        .data(worlddata)
        .enter().append('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', '#333')
        .attr('stroke', '#111')
        .attr('stroke-width', 0.5);

    let raceCircles = gMarkers.selectAll('circle.race-location');
    let animatedLine = gCountries.selectAll('path.animated-line');

    // Zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
            gCountries.attr('transform', event.transform);
            gMarkers.selectAll('circle.race-location')
                .attr('cx', d => event.transform.applyX(projection([d.lng, d.lat])[0]))
                .attr('cy', d => event.transform.applyY(projection([d.lng, d.lat])[1]));
        });

    svg.call(zoom);

    createStandingsTable(constructorDiv, 'Constructors');
    createStandingsTable(driverDiv, 'Drivers');
    updateSeason(selectedYear, true); // Show final standings immediately

    function toggleAnimation() {
        if (!animationInProgress) {
            animationInProgress = true;
            animateButton.text('Stop Animation');
            startAnimation(selectedYear);
        } else {
            stopAnimation(selectedYear);
        }
    }

    function startAnimation(selectedYear) {
        clearAllAnimationTimeouts();
        animatedLinePoints = [];
        animatedLine.remove();
        animatedLine = gCountries.selectAll('path.animated-line');
        previousLineLength = 0; // reset line length for cumulative growth

        const seasonRaces = races.filter(r => r.year === selectedYear).sort((a,b) => a.round - b.round);
        const raceIds = seasonRaces.map(r => r.raceId);

        const yearDriverStandings = driverStandings.filter(d => raceIds.includes(d.raceId));
        const yearConstructorStandings = constructorStandings.filter(d => raceIds.includes(d.raceId));
        const yearResults = results.filter(r => raceIds.includes(r.raceId));

        const snapshots = seasonRaces.map(race => {
            const currentRaceId = race.raceId;
            const driversUpToRace = yearDriverStandings.filter(d => d.raceId <= currentRaceId);
            const constructorsUpToRace = yearConstructorStandings.filter(c => c.raceId <= currentRaceId);

            return {
                raceId: currentRaceId,
                raceName: race.name,
                driverStandings: getFinalDriverStandings(driversUpToRace, yearResults.filter(rr => rr.raceId <= currentRaceId)),
                constructorStandings: getFinalConstructorStandings(constructorsUpToRace),
                circuitId: race.circuitId
            };
        });

        let index = 0;
        step();

        function step() {
            if (!animationInProgress) return;
            if (index >= snapshots.length) {
                animationInProgress = false;
                animateButton.text('Show Season Evolution');
                return;
            }

            const snapshot = snapshots[index];
            const c = circuits.find(ci => ci.circuitId === snapshot.circuitId);

            gMarkers.selectAll('circle.race-location')
                .transition()
                .duration(500)
                .attr('fill', d => d.raceId === snapshot.raceId ? 'yellow' : 'red')
                .attr('r', d => d.raceId === snapshot.raceId ? 8 : 5)
                .style('opacity', d => d.raceId === snapshot.raceId ? 1 : 0.8);

            updateStandingsRows(constructorDiv, snapshot.constructorStandings, 'constructorName', true);
            updateStandingsRows(driverDiv, snapshot.driverStandings, 'driverName', true);

            if (c) {
                animatedLinePoints.push({ lat: c.lat, lng: c.lng });
            }

            if (animatedLinePoints.length > 1) {
                const lineGenerator = d3.line()
                    .curve(d3.curveCardinal) // smooth, curved line
                    .x(d => projection([d.lng, d.lat])[0])
                    .y(d => projection([d.lng, d.lat])[1]);

                animatedLine = gCountries.selectAll('path.animated-line')
                    .data([animatedLinePoints]);

                animatedLine.exit().remove();

                const lineUpdate = animatedLine.enter()
                    .append('path')
                    .attr('class', 'animated-line')
                    .attr('fill', 'none')
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1.5)
                    .merge(animatedLine)
                    .attr('d', lineGenerator);

                // Animate only the newly added segment
                const pathEl = lineUpdate.node();
                const newLength = pathEl.getTotalLength();

                // We assume line was fully drawn up to previousLineLength
                // Now we extend it to newLength
                d3.select(pathEl)
                  .attr('stroke-dasharray', newLength + ' ' + newLength)
                  .attr('stroke-dashoffset', newLength - previousLineLength)
                  .transition()
                  .duration(1000)
                  .ease(d3.easeLinear)
                  .attr('stroke-dashoffset', 0)
                  .on('end', () => {
                      previousLineLength = newLength;
                  });

            }

            const t = setTimeout(step, 2500);
            animationTimeouts.push(t);
            index++;
        }
    }

    function stopAnimation(selectedYear) {
        if (!animationInProgress) return;
        animationInProgress = false;
        clearAllAnimationTimeouts();
        animateButton.text('Show Season Evolution');
        updateSeason(selectedYear, true);
    }

    async function updateSeason(selectedYear, freshLoad=false) {
        clearAllAnimationTimeouts();
        animationInProgress = false;
        animateButton.text('Show Season Evolution');
        animatedLine.remove();
        previousLineLength = 0;

        const seasonRaces = races.filter(r => r.year === selectedYear).sort((a,b) => a.round - b.round);
        const raceIds = seasonRaces.map(r => r.raceId);

        const yearDriverStandings = driverStandings.filter(d => raceIds.includes(d.raceId));
        const yearConstructorStandings = constructorStandings.filter(d => raceIds.includes(d.raceId));
        const yearResults = results.filter(r => raceIds.includes(r.raceId));

        const finalDriverStandings = getFinalDriverStandings(yearDriverStandings, yearResults);
        const finalConstructorStandings = getFinalConstructorStandings(yearConstructorStandings);

        const seasonCircuits = seasonRaces.map(r => {
            const c = circuits.find(ci => ci.circuitId === +r.circuitId);
            return {
                raceId: r.raceId,
                name: r.name,
                lat: c?.lat,
                lng: c?.lng,
                round: r.round
            };
        });

        raceCircles
            .transition()
            .duration(500)
            .style('opacity', 0)
            .remove();

        raceCircles = gMarkers.selectAll('circle.race-location')
            .data(seasonCircuits, d => d.raceId);

        raceCircles.exit()
            .transition()
            .duration(500)
            .style('opacity', 0)
            .remove();

        const enterCircles = raceCircles.enter()
            .append('circle')
            .attr('class', 'race-location')
            .attr('r', 5)
            .attr('fill', 'red')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('opacity', 0);

        positionMarkers(gMarkers, projection, seasonCircuits);
        enterCircles
            .transition()
            .delay(500)
            .duration(500)
            .style('opacity', 0.8);

        // Show final standings immediately
        updateStandingsRows(constructorDiv, finalConstructorStandings, 'constructorName', true);
        updateStandingsRows(driverDiv, finalDriverStandings, 'driverName', true);

        mapDiv.transition().duration(500).style('opacity',1);
    }

    function positionMarkers(g, projection, data) {
        g.selectAll('circle.race-location')
            .attr('cx', d => projection([d.lng, d.lat])[0])
            .attr('cy', d => projection([d.lng, d.lat])[1]);
    }

    function createStandingsTable(container, title) {
        container.selectAll('*').remove();

        container.append('h2')
            .text(title)
            .style('text-align', 'center')
            .style('color', '#ee2a26')
            .style('font-family', 'Formula1');

        const table = container.append('table')
            .attr('class', 'standings-table')
            .style('border-collapse', 'collapse');

        const thead = table.append('thead');
        thead.append('tr')
            .selectAll('th')
            .data(['Pos', title.slice(0,-1), 'Points'])
            .enter()
            .append('th')
            .text(d => d)
            .style('text-align', 'center')
            .style('vertical-align', 'middle');

        // Ensure tbody exists even if empty
        table.append('tbody');
    }

    function updateStandingsRows(container, data, nameKey, showLogos) {
        // top 10 only
        data = data.sort((a,b) => d3.descending(a.points, b.points)).slice(0,10);

        const oldPointsMap = new Map();
        data.forEach(d => {
            const key = d[nameKey];
            oldPointsMap.set(key, previousPointsMap.get(key) || d.points);
        });

        const table = container.select('table.standings-table');
        const tbody = table.select('tbody');

        const oldPositions = {};
        tbody.selectAll('tr')
            .each(function(d) {
                if (d) {
                    oldPositions[d[nameKey]] = this.getBoundingClientRect();
                }
            });

        const rows = tbody.selectAll('tr')
            .data(data, d => d[nameKey]);

        rows.exit()
            .transition()
            .duration(1)
            .style('opacity', 0)
            .remove();

        const enter = rows.enter()
            .append('tr')
            .style('opacity', 0);

        enter.append('td').style('color', '#fff').style('text-align', 'center').style('vertical-align', 'middle');
        enter.append('td').style('color', '#fff').style('text-align', 'center').style('vertical-align', 'middle');
        enter.append('td').style('color', '#fff').style('text-align', 'center').style('vertical-align', 'middle');

        const allRows = enter.merge(rows);

        allRows.select('td:nth-child(1)')
            .text((d, i) => i+1);

        allRows.select('td:nth-child(2)')
            .html(d => {
                // If code not found, fallback to first word of driver's name
                let displayName;
                if (d.driverId) {
                    const code = driverCodeMap.get(d.driverId);
                    const fallbackName = driverNameMap.get(d.driverId) || d[nameKey] || "Unknown";
                    const finalName = fallbackName.split(' ')[0]; // first word
                    if (code && code.toUpperCase() !== 'N/A' && code !== '\\N') {
                        displayName = code;
                    } else {
                        displayName = finalName;
                    }
                } else {
                    const fallback = d[nameKey] || "Unknown";
                    displayName = fallback.split(' ')[0]; // first word if multiple
                }

                let html = displayName;
                const cId = d.constructorId;
                if (showLogos && cId) {
                    const teamLogoPath = `images/team_logos/${cId}.png`;
                    html += ` <img src="${teamLogoPath}" alt="${d[nameKey]}" class="team-logo-small" style="vertical-align:middle;"/>`;
                }
                return html;
            });

        allRows.select('td:nth-child(3)')
            .each(function(d) {
                const oldVal = oldPointsMap.get(d[nameKey]) || d.points;
                const diff = d.points - oldVal;
                let initialText = oldVal.toString();
                if (diff > 0) {
                    // Display oldVal + diff in green first
                    initialText += `<span class="points-gain" style="color:#00ff00">+${diff}</span>`;
                }
                d3.select(this).html(initialText);
                d._oldVal = oldVal;
                d._diff = diff;
            });

        tbody.selectAll('tr')
            .sort((a,b) => d3.descending(a.points, b.points));

        const newPositions = {};
        allRows.each(function(d) {
            newPositions[d[nameKey]] = this.getBoundingClientRect();
        });

        allRows
            .style('opacity', 1)
            .each(function(d) {
                const oldPos = oldPositions[d[nameKey]];
                const newPos = newPositions[d[nameKey]];
                const rowSel = d3.select(this);

                let dx = 0, dy = 0;
                if (oldPos && newPos) {
                    dx = oldPos.left - newPos.left;
                    dy = oldPos.top - newPos.top;
                }

                const finalPoints = d.points; 
                const oldVal = d._oldVal;
                const diff = d._diff;

                rowSel
                    .style('background-color', (dx !== 0 || dy !== 0) ? '#444' : null)
                    .style('transform', `translate(${dx}px,${dy}px)`)
                    .transition()
                    .duration(1000)
                    .style('transform', 'translate(0,0)')
                    .on('end', function() {
                        rowSel.style('background-color', null);
                        const td = rowSel.select('td:nth-child(3)');
                        
                        // Now remove the +diff and start tween
                        // If diff > 0, we remove the plus and revert to oldVal, then tween
                        if (diff > 0) {
                            // revert temporarily to oldVal before tween
                            td.text(oldVal);

                            // Start tweening
                            td.transition()
                              .duration(1000)
                              .tween('text', function() {
                                  const i = d3.interpolateNumber(oldVal, finalPoints);
                                  return function(t) {
                                      td.text(Math.floor(i(t)));
                                  };
                              })
                              .on('end', () => {
                                  td.text(finalPoints);
                                  previousPointsMap.set(d[nameKey], finalPoints);
                              });
                        } else {
                            // No diff, just set final points and update map
                            td.text(finalPoints);
                            previousPointsMap.set(d[nameKey], finalPoints);
                        }
                    });
            });
    }

    function getFinalDriverStandings(standings, resultsData) {
        const driverPointsByDriver = d3.rollup(
            standings,
            v => d3.max(v, d => d.points),
            d => d.driverId
        );

        const driverConstructorMap = new Map();
        for (const [driverId] of driverPointsByDriver) {
            const driverResults = resultsData.filter(r => r.driverId === driverId);
            if (driverResults.length > 0) {
                driverResults.sort((a,b) => a.raceId - b.raceId);
                const lastResult = driverResults[driverResults.length - 1];
                driverConstructorMap.set(driverId, lastResult.constructorId);
            }
        }

        return Array.from(driverPointsByDriver, ([driverId, points]) => ({
            driverId, 
            driverName: driverNameMap.get(driverId) || 'Unknown',
            constructorId: driverConstructorMap.get(driverId),
            points
        })).sort((a,b) => d3.descending(a.points, b.points));
    }

    function getFinalConstructorStandings(standings) {
        const constructorPointsByConstructor = d3.rollup(
            standings,
            v => d3.max(v, d => d.points),
            d => d.constructorId
        );
        return Array.from(constructorPointsByConstructor, ([constructorId, points]) => ({
            constructorId,
            constructorName: constructorNameMap.get(constructorId) || 'Unknown',
            points
        })).sort((a,b) => d3.descending(a.points, b.points));
    }

    function clearAllAnimationTimeouts() {
        animationTimeouts.forEach(t => clearTimeout(t));
        animationTimeouts = [];
    }
}
let animationInProgress = false;
let animationTimeouts = [];
let previousPointsMap = new Map(); 
let animatedLinePoints = []; 
let previousLineLength = 0; 

// Global variables for the contribution chart
let contributionSvg, contributionChartG, contributionXAxisG, contributionYAxisG;
let contributionX, contributionY;
let contributionWidth = 700, contributionHeight = 300;
let contributionMargin = {top:70,right:20,bottom:50,left:120};
let contributionInnerWidth = contributionWidth - contributionMargin.left - contributionMargin.right;
let contributionInnerHeight = contributionHeight - contributionMargin.top - contributionMargin.bottom;
let contributionInitialized = false;

// Store a stable order of constructors and drivers for the chart
let stableConstructorsOrder = []; // final season top5 constructorNames
let stableDriversKeys = []; // final top5 teams drivers
let finalMaxPoints = null; // final maximum points (for fixed x-axis domain)

// We will create a large color palette to ensure uniqueness
// Concatenate multiple schemes:
const bigColorPalette = [
    ...d3.schemeTableau10,
    ...d3.schemeSet2,
    ...d3.schemeSet3,
    ...d3.schemePaired,
    ...d3.schemePastel1,
    ...d3.schemePastel2,
    ...d3.schemeDark2,
    ...d3.schemeAccent
].flat();
// Remove duplicates if any (unlikely, but safe)
const uniqueColorPalette = Array.from(new Set(bigColorPalette));

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

    function clearAllAnimationTimeouts() {
        animationTimeouts.forEach(t => clearTimeout(t));
        animationTimeouts = [];
    }

    // Convert numeric fields
    circuits.forEach(d => { d.circuitId = +d.circuitId; d.lat = +d.lat; d.lng = +d.lng; });
    races.forEach(d => { d.raceId = +d.raceId; d.year = +d.year; d.round = +d.round; d.circuitId = +d.circuitId; });
    drivers.forEach(d => d.driverId = +d.driverId);
    constructors.forEach(d => d.constructorId = +d.constructorId);
    driverStandings.forEach(d => { d.driverStandingsId=+d.driverStandingsId; d.raceId=+d.raceId; d.driverId=+d.driverId; d.points=+d.points; d.position=+d.position; d.wins=+d.wins; });
    constructorStandings.forEach(d => { d.constructorStandingsId=+d.constructorStandingsId; d.raceId=+d.raceId; d.constructorId=+d.constructorId; d.points=+d.points; d.position=+d.position; d.wins=+d.wins; });
    results.forEach(d => { d.raceId=+d.raceId; d.driverId=+d.driverId; d.constructorId=+d.constructorId; d.points=+d.points; d.grid=+d.grid; d.positionOrder=+d.positionOrder; });

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
        .style('font-family','Formula1')
        .style('font-weight','normal')
        .style('width','200px')
        .style('background','#222')
        .style('color','#ee2a26')
        .style('border','1px solid transparent')
        .style('border-radius','8px')
        .style('padding','10px 20px')
        .style('cursor','pointer');

    seasonSelector.on('mouseover', function() {
        d3.select(this).style('border','1px solid #ee2a26');
    }).on('mouseout', function() {
        d3.select(this).style('border','1px solid transparent');
    });

    seasonSelector.selectAll('option')
        .data(seasons)
        .enter().append('option')
        .attr('value', d => d)
        .text(d => d);

    let selectedYear = seasons[0];
    seasonSelector.on('change', function() {
        selectedYear = +this.value;
        previousPointsMap.clear();
        stableConstructorsOrder = [];
        stableDriversKeys = [];
        finalMaxPoints = null;
        createStandingsTable(constructorDiv, 'Constructors');
        createStandingsTable(driverDiv, 'Drivers');
        updateSeason(selectedYear, true);
    });

    const container = mainContainer.append('div')
        .style('display','flex')
        .style('flex-direction','row')
        .style('align-items','flex-start')
        .style('justify-content','center')
        .style('gap','20px')
        .style('color','#fff');

    const constructorDiv = container.append('div')
        .attr('id','constructor-standings-container')
        .style('flex','0 0 300px');

    const mapDiv = container.append('div')
        .attr('id','map-container')
        .style('position','relative')
        .style('opacity',0);

    const driverDiv = container.append('div')
        .attr('id','driver-standings-container')
        .style('flex','0 0 300px');

    const contributionContainer = mainContainer.append('div')
        .attr('id','contribution-container')
        .style('width','700px')
        .style('margin','20px auto');

    const buttonContainer = mainContainer.append('div')
        .attr('class','button-container')
        .style('width','100%')
        .style('text-align','center')
        .style('margin-top','20px');

    const animateButton = buttonContainer.append('button')
        .text('Show Season Evolution')
        .style('padding','10px 20px')
        .style('background','#222')
        .style('color','#ee2a26')
        .style('border','1px solid #ee2a26')
        .style('border-radius','8px')
        .style('font-family','Formula1')
        .style('cursor','pointer');

    animateButton.on('mouseover', function(){ d3.select(this).style('border-color','#fff');})
                 .on('mouseout', function(){ d3.select(this).style('border-color','#ee2a26');})
                 .on('click', toggleAnimation);

    const width=600, height=400;

    const svg=mapDiv.append('svg')
        .attr('width',width)
        .attr('height',height)
        .style('border','1px solid #333')
        .style('border-radius','8px')
        .style('background','#222');

    const gCountries=svg.append('g').attr('class','countries-group');
    const gMarkers=svg.append('g').attr('class','markers-group');

    const projection=d3.geoNaturalEarth1().scale(120).translate([width/2,height/2]);
    const path=d3.geoPath().projection(projection);
    const worlddata=topojson.feature(world,world.objects.countries).features;

    gCountries.selectAll('path.country')
        .data(worlddata)
        .enter().append('path')
        .attr('class','country')
        .attr('d',path)
        .attr('fill','#333')
        .attr('stroke','#111')
        .attr('stroke-width',0.5);

    let raceCircles=gMarkers.selectAll('circle.race-location');
    let animatedLine=gCountries.selectAll('path.animated-line');

    const zoom=d3.zoom().scaleExtent([1,8])
        .on('zoom',(event)=>{
            gCountries.attr('transform',event.transform);
            gMarkers.selectAll('circle.race-location')
                .attr('cx',dd=>event.transform.applyX(projection([dd.lng, dd.lat])[0]))
                .attr('cy',dd=>event.transform.applyY(projection([dd.lng, dd.lat])[1]));

            const newStrokeWidth=1.5/event.transform.k;
            gCountries.selectAll('.animated-line').attr('stroke-width',newStrokeWidth);
        });
    svg.call(zoom);

    createStandingsTable(constructorDiv,'Constructors');
    createStandingsTable(driverDiv,'Drivers');
    updateSeason(selectedYear,true);

    function toggleAnimation() {
        if(!animationInProgress){
            animationInProgress=true;
            animateButton.text('Stop Animation');
            startAnimation(selectedYear);
        }else{
            stopAnimation(selectedYear);
        }
    }

    function startAnimation(selectedYear){
        clearAllAnimationTimeouts();
        animatedLinePoints=[];
        animatedLine.remove();
        animatedLine=gCountries.selectAll('path.animated-line');
        previousLineLength=0;

        const seasonRaces=races.filter(r=>r.year===selectedYear).sort((a,b)=>a.round-b.round);
        const raceIds=seasonRaces.map(r=>r.raceId);

        const yearDriverStandings=driverStandings.filter(d=>raceIds.includes(d.raceId));
        const yearConstructorStandings=constructorStandings.filter(d=>raceIds.includes(d.raceId));
        const yearResults=results.filter(d=>raceIds.includes(d.raceId));

        const snapshots=seasonRaces.map(race=>{
            const currentRaceId=race.raceId;
            const driversUpToRace=yearDriverStandings.filter(d=>d.raceId<=currentRaceId);
            const constructorsUpToRace=yearConstructorStandings.filter(c=>c.raceId<=currentRaceId);
            return {
                raceId:currentRaceId,
                raceName:race.name,
                driverStandings:getFinalDriverStandings(driversUpToRace, yearResults.filter(rr=>rr.raceId<=currentRaceId)),
                constructorStandings:getFinalConstructorStandings(constructorsUpToRace),
                circuitId:race.circuitId
            };
        });

        let index=0;
        step();
        function step(){
            if(!animationInProgress)return;
            if(index>=snapshots.length){
                animationInProgress=false;
                animateButton.text('Show Season Evolution');
                return;
            }

            const snapshot=snapshots[index];
            const c=circuits.find(ci=>ci.circuitId===snapshot.circuitId);

            gMarkers.selectAll('circle.race-location')
                .transition().duration(500)
                .attr('fill',dd=>dd.raceId===snapshot.raceId?'yellow':'red')
                .attr('r',dd=>dd.raceId===snapshot.raceId?8:5)
                .style('opacity',dd=>dd.raceId===snapshot.raceId?1:0.8);

            updateStandingsRows(constructorDiv,snapshot.constructorStandings,'constructorName',true);
            updateStandingsRows(driverDiv,snapshot.driverStandings,'driverName',true);

            updateConstructorContributionChart(snapshot.driverStandings,snapshot.constructorStandings);

            if(c){
                animatedLinePoints.push({lat:c.lat,lng:c.lng});
            }

            if(animatedLinePoints.length>1){
                const lineGenerator=d3.line().curve(d3.curveCardinal)
                    .x(dd=>projection([dd.lng,dd.lat])[0])
                    .y(dd=>projection([dd.lng,dd.lat])[1]);

                animatedLine=gCountries.selectAll('path.animated-line')
                    .data([animatedLinePoints]);

                animatedLine.exit().remove();

                const lineUpdate=animatedLine.enter()
                    .append('path')
                    .attr('class','animated-line')
                    .attr('fill','none')
                    .attr('stroke','#fff')
                    .attr('stroke-width',1.5)
                    .merge(animatedLine)
                    .attr('d',lineGenerator);

                const pathEl=lineUpdate.node();
                const newLength=pathEl.getTotalLength();

                d3.select(pathEl)
                  .attr('stroke-dasharray',newLength+' '+newLength)
                  .attr('stroke-dashoffset',newLength-previousLineLength)
                  .transition().duration(1000).ease(d3.easeLinear)
                  .attr('stroke-dashoffset',0)
                  .on('end',()=>{
                      previousLineLength=newLength;
                  });
            }

            const t=setTimeout(step,2500);
            animationTimeouts.push(t);
            index++;
        }
    }

    function stopAnimation(selectedYear){
        if(!animationInProgress)return;
        animationInProgress=false;
        clearAllAnimationTimeouts();
        animateButton.text('Show Season Evolution');
        updateSeason(selectedYear,true);
    }

    async function updateSeason(selectedYear,freshLoad=false){
        clearAllAnimationTimeouts();
        animationInProgress=false;
        animateButton.text('Show Season Evolution');
        animatedLine.remove();
        previousLineLength=0;

        const seasonRaces=races.filter(r=>r.year===selectedYear).sort((a,b)=>a.round-b.round);
        const raceIds=seasonRaces.map(r=>r.raceId);

        const yearDriverStandings=driverStandings.filter(d=>raceIds.includes(d.raceId));
        const yearConstructorStandings=constructorStandings.filter(d=>raceIds.includes(d.raceId));
        const yearResults=results.filter(d=>raceIds.includes(d.raceId));

        const finalDriverStandings=getFinalDriverStandings(yearDriverStandings,yearResults);
        const finalConstructorStandings=getFinalConstructorStandings(yearConstructorStandings);

        const seasonCircuits=seasonRaces.map(r=>{
            const c=circuits.find(ci=>ci.circuitId===+r.circuitId);
            return {raceId:r.raceId,name:r.name,lat:c?.lat,lng:c?.lng,round:r.round};
        });

        raceCircles
            .transition().duration(500)
            .style('opacity',0)
            .remove();

        raceCircles=gMarkers.selectAll('circle.race-location')
            .data(seasonCircuits,dd=>dd.raceId);

        raceCircles.exit()
            .transition().duration(500)
            .style('opacity',0)
            .remove();

        const enterCircles=raceCircles.enter()
            .append('circle')
            .attr('class','race-location')
            .attr('r',5)
            .attr('fill','red')
            .attr('stroke','#fff')
            .attr('stroke-width',1)
            .attr('opacity',0);

        positionMarkers(gMarkers,projection,seasonCircuits);
        enterCircles.transition().delay(500).duration(500).style('opacity',0.8);

        updateStandingsRows(constructorDiv,finalConstructorStandings,'constructorName',true);
        updateStandingsRows(driverDiv,finalDriverStandings,'driverName',true);

        mapDiv.transition().duration(500).style('opacity',1);

        // Set stable order of constructors and drivers once
        if(stableConstructorsOrder.length === 0) {
            stableConstructorsOrder = finalConstructorStandings.slice(0,5).map(d => d.constructorName);

            // Gather all drivers from final top 5 teams
            const top5Constructors = finalConstructorStandings.slice(0,5);
            const allDriversInTop5 = finalDriverStandings.filter(d=>top5Constructors.find(c=>c.constructorId===d.constructorId));
            const driverNamesSet = new Set();
            allDriversInTop5.forEach(d=>{
                const name = getDriverDisplayName(d.driverId, d.driverName);
                driverNamesSet.add(name);
            });
            stableDriversKeys = Array.from(driverNamesSet);

            // Determine finalMaxPoints for fixed x-axis:
            // sum across top5Constructors their max total and find max
            const stackedData = getStackedData(finalDriverStandings, finalConstructorStandings);
            finalMaxPoints = d3.max(stackedData,d=>d3.sum(stableDriversKeys,k=>d[k]))||0;

            // Initialize chart if not done
            if (!contributionInitialized) {
                initializeConstructorContributionChart();
            }

            // Once stable sets are known, we won't change them for this season
        }

        updateConstructorContributionChart(finalDriverStandings,finalConstructorStandings);
    }

    function positionMarkers(g,projection,data){
        g.selectAll('circle.race-location')
            .attr('cx',dd=>projection([dd.lng,dd.lat])[0])
            .attr('cy',dd=>projection([dd.lng,dd.lat])[1]);
    }

    function createStandingsTable(container,title){
        container.selectAll('*').remove();
        container.append('h2')
            .text(title)
            .style('text-align','center')
            .style('color','#ee2a26')
            .style('font-family','Formula1');

        const table=container.append('table')
            .attr('class','standings-table')
            .style('border-collapse','collapse');

        const thead=table.append('thead');
        thead.append('tr')
            .selectAll('th')
            .data(['Pos',title.slice(0,-1),'Points'])
            .enter().append('th')
            .text(d=>d)
            .style('text-align','center')
            .style('vertical-align','middle');

        table.append('tbody');
    }

    function updateStandingsRows(container,data,nameKey,showLogos){
        data=data.sort((a,b)=>d3.descending(a.points,b.points)).slice(0,10);

        const oldPointsMap=new Map();
        data.forEach(d=>oldPointsMap.set(d[nameKey],previousPointsMap.get(d[nameKey])||d.points));

        const table=container.select('table.standings-table');
        const tbody=table.select('tbody');

        const oldPositions={};
        tbody.selectAll('tr').each(function(d){
            if(d) oldPositions[d[nameKey]]=this.getBoundingClientRect();
        });

        const rows=tbody.selectAll('tr')
            .data(data,d=>d[nameKey]);

        rows.exit().transition().duration(1).style('opacity',0).remove();

        const enter=rows.enter().append('tr').style('opacity',0);

        enter.append('td').style('color','#fff').style('text-align','center').style('vertical-align','middle');
        enter.append('td').style('color','#fff').style('text-align','center').style('vertical-align','middle');
        enter.append('td').style('color','#fff').style('text-align','center').style('vertical-align','middle');

        const allRows=enter.merge(rows);

        allRows.select('td:nth-child(1)').text((d,i)=>i+1);

        allRows.select('td:nth-child(2)')
            .html(d=>{
                const displayName = getDriverDisplayName(d.driverId, d[nameKey]);
                let html=displayName;
                const cId=d.constructorId;
                if(showLogos && cId){
                    const teamLogoPath=`images/team_logos/${cId}.png`;
                    html+=` <img src="${teamLogoPath}" alt="${d[nameKey]}" class="team-logo-small" style="vertical-align:middle;"/>`;
                }
                return html;
            });

        allRows.select('td:nth-child(3)')
            .each(function(d){
                const oldVal=oldPointsMap.get(d[nameKey])||d.points;
                const diff=d.points-oldVal;
                let initialText=oldVal.toString();
                if(diff>0) initialText+=`<span class="points-gain" style="color:#00ff00">+${diff}</span>`;
                d3.select(this).html(initialText);
                d._oldVal=oldVal;
                d._diff=diff;
            });

        tbody.selectAll('tr')
            .sort((a,b)=>d3.descending(a.points,b.points));

        const newPositions={};
        allRows.each(function(d){
            newPositions[d[nameKey]]=this.getBoundingClientRect();
        });

        allRows.style('opacity',1)
            .each(function(d){
                const oldPos=oldPositions[d[nameKey]];
                const newPos=newPositions[d[nameKey]];
                const rowSel=d3.select(this);

                let dx=0,dy=0;
                if(oldPos && newPos){
                    dx=oldPos.left-newPos.left;
                    dy=oldPos.top-newPos.top;
                }

                const finalPoints=d.points; 
                const oldVal=d._oldVal;
                const diff=d._diff;

                rowSel
                    .style('background-color',(dx!==0||dy!==0)?'#444':null)
                    .style('transform',`translate(${dx}px,${dy}px)`)
                    .transition().duration(1000)
                    .style('transform','translate(0,0)')
                    .on('end',function(){
                        rowSel.style('background-color',null);
                        const td=rowSel.select('td:nth-child(3)');
                        if(diff>0){
                            td.text(oldVal);
                            td.transition().duration(1000)
                              .tween('text',function(){
                                  const i=d3.interpolateNumber(oldVal,finalPoints);
                                  return t=>td.text(Math.floor(i(t)));
                              })
                              .on('end',()=>{
                                  td.text(finalPoints);
                                  previousPointsMap.set(d[nameKey],finalPoints);
                              });
                        } else {
                            td.text(finalPoints);
                            previousPointsMap.set(d[nameKey],finalPoints);
                        }
                    });
            });
    }

    function getFinalDriverStandings(standings,resultsData){
        const driverPointsByDriver=d3.rollup(standings,v=>d3.max(v,dd=>dd.points),dd=>dd.driverId);
        const driverConstructorMap=new Map();
        for(const [driverId]of driverPointsByDriver){
            const driverResults=resultsData.filter(r=>r.driverId===driverId);
            if(driverResults.length>0){
                driverResults.sort((a,b)=>a.raceId-b.raceId);
                const lastResult=driverResults[driverResults.length-1];
                driverConstructorMap.set(driverId,lastResult.constructorId);
            }
        }
        return Array.from(driverPointsByDriver,([driverId,points])=>({
            driverId, 
            driverName:driverNameMap.get(driverId)||'Unknown',
            constructorId:driverConstructorMap.get(driverId),
            points
        })).sort((a,b)=>d3.descending(a.points,b.points));
    }

    function getFinalConstructorStandings(standings){
        const constructorPointsByConstructor=d3.rollup(
            standings,v=>d3.max(v,dd=>dd.points),dd=>dd.constructorId
        );
        return Array.from(constructorPointsByConstructor,([constructorId,points])=>({
            constructorId,
            constructorName:constructorNameMap.get(constructorId)||'Unknown',
            points
        })).sort((a,b)=>d3.descending(a.points,b.points));
    }

    function initializeConstructorContributionChart() {
        const container = d3.select('#contribution-container');
        container.selectAll('*').remove();

        container.append('h2')
            .text("Constructor Contribution Breakdown")
            .style('text-align','center')
            .style('color','#ee2a26')
            .style('font-family','Formula1');

        contributionSvg = container.append('svg')
            .attr('width', contributionWidth)
            .attr('height', contributionHeight)
            .style('background','#222')
            .style('border-radius','8px');

        contributionChartG = contributionSvg.append('g')
            .attr('transform',`translate(${contributionMargin.left},${contributionMargin.top})`);

        contributionX = d3.scaleLinear().range([0,contributionInnerWidth]);
        contributionY = d3.scaleBand().range([0,contributionInnerHeight]).padding(0.1);

        contributionXAxisG = contributionChartG.append('g')
            .attr('class','x-axis')
            .attr('transform',`translate(0,${contributionInnerHeight})`);

        contributionYAxisG = contributionChartG.append('g')
            .attr('class','y-axis');

        // Set final domain for X-axis once finalMaxPoints is known
        if (finalMaxPoints !== null) {
            contributionX.domain([0, finalMaxPoints]);
        }
        if (stableConstructorsOrder.length > 0) {
            contributionY.domain(stableConstructorsOrder);
        }
    }

    function getDriverDisplayName(driverId, fallbackName) {
        const code = driverCodeMap.get(driverId);
        const fullName = fallbackName || "Unknown";
        let shortName = fullName.split(' ')[0];
        if(shortName.length>5) shortName = shortName.slice(0,5);

        return (code && code.toUpperCase()!=='N/A' && code!=='\\N') ? code : shortName;
    }

    function getStackedData(finalDriverStandings, finalConstructorStandings){
        // Creates the stacked data for final state
        const top5Constructors = stableConstructorsOrder.map(cName => finalConstructorStandings.find(x=>x.constructorName===cName));
        const constructorToDrivers={};
        top5Constructors.forEach(con=>{
            const driversForConstructor=finalDriverStandings.filter(dd=>dd.constructorId===con.constructorId);
            const driverPointsByName = new Map();
            driversForConstructor.forEach(d=>{
                const name = getDriverDisplayName(d.driverId, d.driverName);
                driverPointsByName.set(name, d.points);
            });
            constructorToDrivers[con.constructorId]=stableDriversKeys.map(key=>{
                return {driverName:key,points:driverPointsByName.get(key)||0};
            });
        });

        const stackedData=top5Constructors.map(con=>{
            const obj={constructorName:con.constructorName};
            stableDriversKeys.forEach(dName=>{
                const drv=constructorToDrivers[con.constructorId].find(x=>x.driverName===dName);
                obj[dName]=drv?drv.points:0;
            });
            return obj;
        });

        return stackedData;
    }

    function updateConstructorContributionChart(finalDriverStandings,finalConstructorStandings){
        if (!contributionInitialized) {
            initializeConstructorContributionChart();
        }

        if (stableConstructorsOrder.length === 0 || stableDriversKeys.length === 0 || finalMaxPoints === null) {
            // final sets not ready yet
            return;
        }

        const top5Constructors = stableConstructorsOrder.map(cName => finalConstructorStandings.find(x=>x.constructorName===cName));
        const stackedData = getStackedData(finalDriverStandings, finalConstructorStandings);
        const stack=d3.stack().keys(stableDriversKeys);
        const stackedSeries=stack(stackedData);

        // X-axis remains fixed, do not recalculate domain
        // Y-axis also fixed

        const xAxis=d3.axisBottom(contributionX).ticks(5).tickSizeOuter(0).tickPadding(5);
        const yAxis=d3.axisLeft(contributionY).tickSizeOuter(0).tickPadding(5);

        // No domain change for X and Y here, they are stable

        contributionXAxisG.call(xAxis)
            .selectAll('text').attr('fill','#fff');
        contributionYAxisG.call(yAxis)
            .selectAll('text').attr('fill','#fff');

        contributionChartG.selectAll('.domain, .tick line').attr('stroke','#fff');

        const groups=contributionChartG.selectAll('.stack-group')
            .data(stackedSeries, d=>d.key);

        groups.exit().remove();

        const groupsEnter=groups.enter().append('g')
            .attr('class','stack-group');

        const mergedGroups=groupsEnter.merge(groups);

        // Assign a unique color per driverKey from stableDriversKeys
        // Create a dictionary: driverName->color from bigColorPalette:
        const driverColorMap = {};
        stableDriversKeys.forEach((dName,i)=>{
            driverColorMap[dName] = uniqueColorPalette[i % uniqueColorPalette.length];
        });

        mergedGroups.attr('fill', series=>driverColorMap[series.key]);

        const rects=mergedGroups.selectAll('rect')
            .data(d=>d, d=>d.data.constructorName);

        rects.exit().remove();

        const rectEnter=rects.enter().append('rect')
            .attr('y', seg => contributionY(seg.data.constructorName))
            .attr('x', seg => contributionX(seg[0]))
            .attr('height', contributionY.bandwidth())
            .attr('width', seg=>contributionX(seg[1])-contributionX(seg[0]))
            .style('opacity',1);

        const allRects=rectEnter.merge(rects);

        allRects.transition().duration(1000).ease(d3.easeCubic)
            .attr('x', seg => contributionX(seg[0]))
            .attr('width', seg => contributionX(seg[1]) - contributionX(seg[0]))
            .attr('y', seg => contributionY(seg.data.constructorName))
            .attr('height', contributionY.bandwidth())
            .style('opacity',1);

        // Legend is fixed from stableDriversKeys
        const legendG = contributionSvg.selectAll('.legend-group').data([null]);
        const legendGEnter = legendG.enter().append('g')
            .attr('class','legend-group')
            .style('font-size','10px');

        const legendUpdate = legendGEnter.merge(legendG);

        const legendItems = legendUpdate.selectAll('.legend-item')
            .data(stableDriversKeys, d => d);

        legendItems.exit().remove();

        const legendItemsEnter = legendItems.enter().append('g')
            .attr('class','legend-item');

        legendItemsEnter.append('rect')
            .attr('width',12)
            .attr('height',12)
            .attr('y',-12);

        legendItemsEnter.append('text')
            .attr('x',15)
            .attr('y',-2)
            .style('fill','#fff')
            .style('font-family','Formula1');

        const allLegendItems = legendItemsEnter.merge(legendItems)
            .attr('transform',(dd,i)=>`translate(${i*60},0)`);

        allLegendItems.select('rect').attr('fill',dd=>driverColorMap[dd]);
        allLegendItems.select('text').text(dd=>dd);

        const totalLegendWidth=stableDriversKeys.length*60;
        legendUpdate
            .attr('transform',`translate(${(contributionWidth - totalLegendWidth)/2},${contributionMargin.top-20})`);
    }
}

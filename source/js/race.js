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
                                        .style('align-items', 'center');

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
        .attr('selected', true)
        .style('font-family', 'Formula1')
        .style('font-weight', 'normal');

    yearSelector.selectAll('option:not([disabled])')
                .data(years)
                .enter()
                .append('option')
                .attr('value', d => d)
                .text(d => d)
                .style('font-family', 'Formula1')
                .style('font-weight', 'normal');

    const raceSelectorContainer = header.append('div')
                                        .style('display', 'flex')
                                        .style('align-items', 'center');

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

    yearSelector.on('change', function() {
        const selectedYear = +this.value;
        const yearRaces = racesByYear[selectedYear];

        raceSelector.attr('disabled', null);

        raceSelector.selectAll('option').remove();

        raceSelector.append('option')
                    .attr('value', '')
                    .text('Select Race')
                    .attr('disabled', true)
                    .attr('selected', true)
                    .style('font-family', 'Formula1')
                    .style('font-weight', 'normal');

        raceSelector.selectAll('option:not([disabled])')
                    .data(yearRaces)
                    .enter()
                    .append('option')
                    .attr('value', d => d.raceId)
                    .text(d => d.name)
                    .style('font-family', 'Formula1')
                    .style('font-weight', 'normal');

        raceSelector.on('change', function() {
            const selectedRaceId = +this.value;
            console.log(`Selected raceId: ${selectedRaceId}`);
        });
    });
}

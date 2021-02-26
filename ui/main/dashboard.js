const Chart = require('chart.js');


function showDashboard(e, data) {
    showElement('dashboard');


    // setting default chart options
    Chart.defaults.global.elements.point.radius = 0;


    populateShareTable(data.shares, data.rssm);
    populateHolderTable(data.persons);
    drawShareChart(data.journal, data.series);

}


function populateShareTable(shares, rssm_a_code){
    let total = 0;
    let rssm = 0;

    for( let s in shares){
        total++;
        if(shares[s].a_code == rssm_a_code) {
            rssm++;
        }
    }

    $('#dash-cell-total-shares').text(total);
    $('#dash-cell-avail-shares').text(rssm);

}

function populateHolderTable(people) {

    let total = 0;
    let active = 0;

    for(let i=0; i < people.length; i++) {
        total++;
        if(people[i].shares) {
            if(people[i].correspondence) {
                active++;
            }
        }
    }

    $('#dash-cell-total-holders').text(total);
    $('#dash-cell-active-holders').text(active);

}

function drawShareChart(journal,series) {

    let ctx = 'shares-chart';
    let available = [];
    let total = [];
    let count = 0;

    for(let i=0; i < journal.length; i++) {

        if(journal[i].share_stock) {
            available.push({
                y: journal[i].share_stock,
                x: journal[i].transaction_date
            });
        }
    }

    for(let i=0; i<series.length; i++) {
        count += series[i].shares;

        total.push({
            y: count,
            x: series[i].emission_date
        });
    }
    total.push({
        y: count,
        x: helpers.dateToDbString()
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            datasets : [{
                label: 'Aktien Verfügbar',
                backgroundColor: 'rgba(21, 101, 192, 0.5)',
                borderColor: 'rgba(21, 101, 192, 0.6)',
                borderWidth: 2,
                data: available,
                steppedLine: true
            },{
                label: 'Aktien Total',
                backgroundColor: 'rgba(130, 177, 255, 0.2)',
                borderColor: 'rgba(130, 177, 255, 0.4)',
                borderWidth: 2,
                data: total,
                steppedLine: true
            }]
        },
        options : {
            elements : {
                line: {
                    tension: 0
                }
            },
            scales : {
                xAxes : [{
                    type : 'time',
                    time : {
                        parser: 'YYYY-MM-DD',
                        tooltipFormat: 'll'
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Jahr'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Aktien'
                    }
                }]
            }

        }
    });


}

module.exports = {
    showDashboard
};
const Chart = require("chart.js")
require("chartjs-adapter-date-fns")

function showDashboard(e, data) {
    showElement("dashboard")
    const [available, total] = populateShareTable(data.shares, data.rssm)
    populateHolderTable(data.persons)
    drawShareChart(data.journal, data.series, available, total)
}

function populateShareTable(shares, rssm_a_code) {
    let total = 0
    let rssm = 0

    for (let s in shares) {
        total++
        if (shares[s].a_code == rssm_a_code) {
            rssm++
        }
    }

    $("#dash-cell-total-shares").text(total)
    $("#dash-cell-avail-shares").text(rssm)
    return [rssm, total]
}

function populateHolderTable(people) {
    let total = 0
    let active = 0

    for (let i = 0; i < people.length; i++) {
        total++
        if (people[i].shares) {
            if (people[i].correspondence) {
                active++
            }
        }
    }

    $("#dash-cell-total-holders").text(total)
    $("#dash-cell-active-holders").text(active)
}

function drawShareChart(journal, series, inStock, total) {
    const ctx = "shares-chart"
    const available = []
    const capital = []
    const todayDate = new Date()
    const days = new Map()
    let yearStartDate = null
    let count = inStock

    console.log(series)

    // get start date of business year (July 1. - June 31.)
    if (todayDate.getMonth() >= 5) {
        // July 1st this year
        yearStartDate = new Date(`${todayDate.getFullYear()}-07-01`)
    } else {
        // July 1st last year
        yearStartDate = new Date(`${todayDate.getFullYear() - 1}-07-01`)
    }

    // iterate journal
    for (let i = 0; i < journal.length; i++) {
        const j = journal[i]

        // skip all entries with no change of stock
        if (j.number == 0) {
            continue
        }

        // condense all share stock changes per transaction date
        if (days.has(j.transaction_date)) {
            days.set(j.transaction_date, days.get(j.transaction_date) + j.number)
        } else {
            days.set(j.transaction_date, j.number)
        }
    }

    // push first data point for todays values
    available.push({
        y: count,
        x: todayDate.getTime(),
    })
    // create dataset for available shares over time using the condensed dataset
    days.forEach((value, key) => {
        if (value != 0) {
            count += value

            available.push({
                y: count,
                x: new Date(key).getTime(),
            })
        }
    })

    // iterate series
    countCapital = 0
    for (let i = 0; i < series.length; i++) {
        const s = series[i]
        countCapital = countCapital + s.shares

        capital.push({
            y: countCapital,
            x: new Date(s.emission_date).getTime(),
        })
    }
    capital.push({
        y: total,
        x: todayDate.getTime(),
    })

    console.log(capital)

    const canvas = document.getElementById(ctx)
    const myChart = new Chart(canvas, {
        type: "line",
        data: {
            datasets: [
                {
                    label: "Besitz RSSM",
                    data: available,
                    backgroundColor: "#448aff",
                    borderColor: "#1565c0",
                    tension: 0.1,
                    radius: 0,
                    stepped: true,
                },
                {
                    label: "Kapital RSSM",
                    data: capital,
                    backgroundColor: "#999999",
                    borderColor: "#666666",
                    tension: 0.1,
                    radius: 0,
                    stepped: true,
                },
            ],
        },
        options: {
            scales: {
                x: {
                    type: "time",
                    //min: yearStartDate.getTime(),
                    time: {
                        //unit: "month",
                        unit: "year",
                    },
                    title: {
                        display: true,
                        text: "Datum",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "# Aktien",
                    },
                    min: 0,
                    max: total + 100,
                },
            },
        },
    })
}

module.exports = {
    showDashboard,
}

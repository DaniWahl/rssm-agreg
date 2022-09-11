const Chart = require("chart.js")
const { startOfDay } = require("date-fns")
const { dash } = require("pdfkit")
require("chartjs-adapter-date-fns")
let dashChart = undefined
let chartStates = undefined

document.getElementById("chart-container").addEventListener("click", toggleChartScale)

// currently not used
function toggleChartScale(e) {
    //const nextState = chartStates.states[dashChart.currentState]["nextState"]
    //const nextOptions = chartStates.states[nextState]["options"]
    //dashChart.options.scales.x.min = nextOptions.scales.x.min
    //dashChart.options.scales.x.time.unit = nextOptions.scales.x.time.unit
    //dashChart.currentState = nextState
    //dashChart.update()
}

function showDashboard(e, data) {
    showElement("dashboard")
    const [available, total] = populateShareTable(data.shares, data.rssm_a_code)
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
    const labels = []
    const capital = []
    const todayDate = new Date()
    const currentYear = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
    const tenYearsDate = new Date(`${todayDate.getFullYear() - 10}-01-01`)
    const twoYearsDate = new Date(`${todayDate.getFullYear() - 2}-01-01`)
    const dataMap = new Map()
    let count = inStock
    let yearStartDate = null

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

        const transactionDate = new Date(j.transaction_date)
        const monthly = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), 1).getTime()

        // skip all entries with no change of stock
        if (j.number == 0) {
            continue
        }

        // skip all transactions older than 10 years
        if (transactionDate <= tenYearsDate) {
            continue
        }

        // condense all share stock changes per transaction date
        if (dataMap.has(monthly)) {
            dataMap.set(monthly, dataMap.get(monthly) - j.number)
        } else {
            dataMap.set(monthly, j.number)
        }
    }

    // push first data point for todays values
    available.push({
        y: count,
        x: todayDate.getTime(),
    })

    // create dataset for available shares over time using the condensed dataset
    dataMap.forEach((value, timestamp) => {
        if (value != 0) {
            count += value
            available.push({
                y: count,
                x: timestamp,
            })
        }
    })

    // iterate series
    // countCapital = 0
    // for (let i = 0; i < series.length; i++) {
    //     const s = series[i]
    //     countCapital = countCapital + s.shares

    //     capital.push({
    //         y: countCapital,
    //         x: new Date(s.emission_date).getTime(),
    //     })
    // }
    // capital.push({
    //     y: total,
    //     x: todayDate.getTime(),
    // })

    const canvas = document.getElementById(ctx)
    dashChart = new Chart(canvas, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Besitz RSSM",
                    data: available,
                    fill: true,
                    backgroundColor: "rgba(21,101,192,0.5)",
                    borderColor: "rgba(21,101,192,0.7)",
                    tension: 0.5,
                    radius: 3,
                },
                // {
                //     label: "Aktienkapital",
                //     data: capital,
                //     fill: true,
                //     backgroundColor: "rgba(100,100,100,0.3)",
                //     borderColor: "rgba(100,100,100,0.7",
                //     tension: 0.1,
                //     radius: 0,
                //     stepped: true,
                //     parsing: false,
                // },
            ],
        },
        options: {
            plugins: {
                decimation: {
                    enabled: false,
                    algorithm: "lttb",
                    samples: 10,
                },
                title: {
                    display: true,
                    align: "start",
                    text: `Aktien im Besitz der RSSM, Geschäftsjahr ${yearStartDate.getFullYear()}/${
                        yearStartDate.getFullYear() + 1
                    }`,
                },
            },
            scales: {
                x: {
                    type: "time",
                    time: {
                        unit: "month",
                    },
                    min: yearStartDate.getTime(),
                    title: {
                        display: true,
                        text: "Monat",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "# Aktien",
                    },
                    min: 0,
                    //max: total + 30,
                },
            },
        },
    })

    // chartStates = {
    //     1: {
    //         currentState: 1,
    //         nextState: 2,
    //         options: {
    //             scales: {
    //                 x: {
    //                     time: {
    //                         unit: "year",
    //                     },
    //                     min: tenYearsDate.getTime(),
    //                 },
    //             },
    //         },
    //     },
    //     2: {
    //         currentState: 2,
    //         nextState: 3,
    //         options: {
    //             scales: {
    //                 x: {
    //                     time: {
    //                         unit: "month",
    //                     },
    //                     min: yearStartDate.getTime(),
    //                 },
    //             },
    //         },
    //     },
    //     3: {
    //         currentState: 3,
    //         nextState: 1,
    //         options: {
    //             scales: {
    //                 x: {
    //                     time: {
    //                         unit: "year",
    //                     },
    //                     min: new Date("2000-01-01").getTime(),
    //                 },
    //             },
    //         },
    //     },
    // }
    // dashChart.currentState = 2
}

module.exports = {
    showDashboard,
}

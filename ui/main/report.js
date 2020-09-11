
// setup report ui specific event handlers
document.querySelector('#report-pdf-btn').addEventListener('click', exportReport);

const startDateEl = document.querySelector('#report-start-date-input')
const endDateEl = document.querySelector('#report-end-date-input')


let reportData;
const reportRange = {
    startDate : null,
    endDate : null
};


/**
 * handler for the transaction range start date onSelect event
 * @param {Date} date  selected date
 */
function setStartDate(date) {
    reportRange.startDate = date
    setReportRange()
}

/**
 * handler for the transaction range end date onSelect event
 * @param {Date} date  selected date
 */
function setEndDate(date) {
    reportRange.endDate = date

    if(!reportRange.startDate) {
        // start date not set, set it to 1 year before end date
        prevYear = new Date(date)
        prevYear.setFullYear(prevYear.getFullYear() -1 )
        prevYear.setDate( prevYear.getDate() +1 )
    
        const startDateM = M.Datepicker.getInstance(startDateEl)
        startDateM.setDate(prevYear)
        startDateM._finishSelection()    
    } else { 
        // start was set by user already
        setReportRange()   
    }
}

/**
 * sends 'report:execute' message back to main if transaction range is complete
 */
function setReportRange() {
    if(reportRange.startDate && reportRange.endDate) {
        ipcRenderer.send('report:execute', reportRange);
    }
}

/**
 * handler for the report:show IPC event.
 * displays the report data on it's table
 * @param {Event} e
 * @param {Array} report
 */
function showReport(e, report) {
    // show target element
    showElement('content-report');


    // reset date picker options
    let dateOpts = {    
        autoClose : true,
        defaultDate : new Date(),
        //setDefaultDate : true,
        format: 'dd.mm.yyyy',
        firstDay: 1,
        i18n : {
            months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
            'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
            monthsShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
            weekdays : ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
            weekdaysShort : ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
            weekdaysAbbrev: ['S', 'M', 'D', 'M', 'D', 'F', 'S'],
            cancel : 'Abbrechen'
        }
    }

    dateOpts.onSelect = setStartDate
    M.Datepicker.init(startDateEl, dateOpts)

    dateOpts.onSelect = setEndDate
    M.Datepicker.init(endDateEl, dateOpts)
}


function showReportData(e, data) {
    console.log("showReportData", data);

    reportData = data;

    const tableEl = $('#table-yearly-report');
    let table;

    // have we initialized the DataTable before?
    if( ! $.fn.dataTable.isDataTable(tableEl) ) {

        // prepare data table configuration
        const config = getDataTableConfig();
        config.columns = [
            {data: 'transaction_date'},
            {data: 'journal_no'},
            {data: 'transaction_type'},
            {data: 'name'},
            {data: 'stock_change'},
            {data: 'shares'}
        ];
        //config.order = [[0, 'desc']]; // order first col descending


        // initialize DataTable
        table = tableEl.DataTable(config);
        console.log('showReportData: initialized table');

    } else {
        table = tableEl.DataTable();
    }

    table.clear();
    table.rows.add(reportData.transactions).draw();
    $('#report-pdf-btn').removeClass('disabled');

    console.log('showReportData: loaded table data');
}


/**
 * sends 'report:export' back to main
 */
function exportReport() {
    ipcRenderer.send('report:export', reportData);
}


module.exports.showReport = showReport;
module.exports.showReportData = showReportData;

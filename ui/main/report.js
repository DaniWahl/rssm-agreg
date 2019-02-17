
// setup report ui specific event handlers
document.querySelector('#report-start-date-input').addEventListener('input', setReportRange);
document.querySelector('#report-end-date-input').addEventListener('input', setReportRange);


const reportRange = {
    startDate : null,
    endDate : null
};


function setReportRange() {

    reportRange.startDate = $('#report-start-date-input').val();
    reportRange.endDate = $('#report-end-date-input').val();

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

}


function showReportData(e, data) {
    console.log("showReportData", data);

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
            {data: 'share_number'},
            {data: 'share_stock'},
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
    table.rows.add(data.transactions).draw();
    console.log('showReportData: loaded table data');




}

module.exports.showReport = showReport;
module.exports.showReportData = showReportData;

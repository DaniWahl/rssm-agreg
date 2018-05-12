/**
 * handler for the journal:show IPC event.
 * displays the journal data on it's table
 * @param {Event} e
 * @param {Array} journal
 */
function showJournal(e, journal) {

    // show target element
    showElement('content-journal');
    const tableEl = $('#table-journal');
    let table;


    // have we initialized the DataTable before?
    if( ! $.fn.dataTable.isDataTable(tableEl) ) {

        // prepare data table configuration
        const config = getDataTableConfig();
        config.columns = [
            {
                data : 'journal_no',
                render : function ( data, type, row ) {
                    return `<b>${data}</b>`;
                }
            },
            { data : 'transaction_date'},
            { data : 'a_code'},
            { data : 'name'},
            { data : 'shares'},
            { data : 'transaction_type'},
            { data : 'action'},
            { data : 'number'},
            { data : 'share_stock'}
        ];
        config.order = [[0, 'desc']]; // order first col descending

        // initialize DataTable
        table = tableEl.DataTable(config);
        console.log('showJournal: initialized table');

    } else {
        table = tableEl.DataTable();
    }


    table.clear();
    table.rows.add(journal).draw();
    console.log('showJournal: loaded table data');

}

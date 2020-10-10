// setup journal ui specific event handlers
document.querySelector('#new-journal-comment-save-btn').addEventListener('click', submitJournalComment);
document.querySelector('#new-journal-comment').addEventListener('keyup', enableSubmitBtn);



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
                data: 'journal_id',
                render: function (data, type, row) {
                    return `<a class="btn-table-icon journal_info" journal_id="${data}"><i class="fa fa-lg fa-info-circle hoverable"></i></a>`
                }
            },
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
    $('#table-journal tbody').on('click', '.journal_info', loadJournalInfo)
    console.log('showJournal: loaded table data');

}


function loadJournalInfo(e) {
    target = e.currentTarget
    ipcRenderer.send('journalinfo:load', { 'journal_id': target.getAttribute('journal_id') });
}



function showJournalInfo(e, data) {

    console.log(data)

    // prepare data table configuration
    const config = getDataTableConfig();
    config.paging = false
    config.searching = false
    config.bInfo = false
    config.scrollY = "310px"
    config.scollCollapse = true
    config.ordering = false
    let shares = data.journal_info.repurchased + data.journal_info.sold
    if (shares=='0') {
        shares = ''
    } else if (shares=='1') {
        shares = shares + ' Aktie'
    } else {
        shares = shares + ' Aktien'
    }
    let prep = 'von'
    if(data.journal_info.action == 'Verkauf') {
        prep = 'für'
    }

    // initialize and show dialog
    const dialogEl = document.querySelector('#journal-info-modal')
    dialogEl.querySelector('div > div.modal-content > h5').innerHTML = `${data.journal_info.journal_no}  ${data.journal_info.transaction_type}`
    dialogEl.querySelector('div > div.modal-content > div.row > div.col > p.journal_date').innerHTML = `<b>Journal Datum:</b> ${data.journal_info.journal_date}`
    dialogEl.querySelector('div > div.modal-content > div.row > div.col > p.transaction_date').innerHTML = `<b>Buchungs Datum:</b> ${data.journal_info.booking_date || ''}`
    dialogEl.querySelector('div > div.modal-content > div.row > div.col > p.action').innerHTML = `<b>${data.journal_info.action}</b>`
    dialogEl.querySelector('div > div.modal-content > div.row > div.col > p.shares').innerHTML = `${shares}`
    dialogEl.querySelector('div > div.modal-content > div.row > div.col > p.person').innerHTML = `${prep} ${data.journal_info.name} (${data.journal_info.a_code})`
    document.querySelector('#new-journal-comment-id').value = data.journal_info.journal_id

    const tableSharesEl = $('#journal-info-shares-table');
    const tableCommentsEl = $('#journal-info-comments-table');
    let tableShares;
    let tableComments;

    // have we initialized the DataTable before?
    if (!$.fn.dataTable.isDataTable(tableSharesEl)) {
        // initialize DataTables with columns
        
        config.columns = [
            {
                data: 'share_no',
                render: function (data, type, row) {
                    return `<b>${helpers.pad0(data, 3)}</b>`;
                }
            },
            { data: 'type' },
            { data: 'value' },
            { data: 'transaction_date' }
        ]
        tableShares = tableSharesEl.DataTable(config);

        config.columns = [
            {data : 'remark'},
            {
                data : 'timestamp',
                type : 'data',
                render : function(data, type, row) {
                    return helpers.timestampUTCtoString(data)
                } 
            }
        ]
        config.order = [[1, 'desc']]
        tableComments = tableCommentsEl.DataTable(config);
       
    } else {
        tableShares = tableSharesEl.DataTable();
        tableComments = tableCommentsEl.DataTable();
    }

    // load table data
    tableShares.clear();
    tableShares.rows.add(data.shares).draw();

    tableComments.clear();
    tableComments.rows.add(data.remarks).draw();

    // open modal
    const dialog = M.Modal.getInstance(dialogEl)
    dialog.open()
}


function enableSubmitBtn(e) {
    document.querySelector('#new-journal-comment-save-btn').classList.remove('disabled')
}

function submitJournalComment(e) {
    // extract comment data from from
    const journal_id = document.querySelector('#new-journal-comment-id').value
    const comment = document.querySelector('#new-journal-comment').value

    // send data to main process
    ipcRenderer.send('journalcomment:set', { 'journal_id': journal_id, 'remark': comment });

    // empty comment form
    document.querySelector('#new-journal-comment').value = ''
    document.querySelector('#new-journal-comment-save-btn').classList.add('disabled')

    // fill new comment into table
    const now = new Date()
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000)

    const tableComments = $('#journal-info-comments-table').DataTable();
    tableComments.row.add({
        'remark' : comment,
        'timestamp' : utc
    }).draw()

    // select comments tab
    const tabs = M.Tabs.getInstance(document.querySelector('#journal-info-tabs'))
    tabs.select('journal-comments')
}

module.exports = {
    showJournal,
    showJournalInfo
};
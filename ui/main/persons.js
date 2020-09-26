const helpers = require('../../lib/app.helpers');

function showPersons(e, holders) {

    // show target element
    showElement('content-persons');
    const tableEl = $('#table-persons-all');
    let table;


    // have we initialized the DataTable before?
    if (!$.fn.dataTable.isDataTable(tableEl)) {

        // prepare data table configuration
        const config = getDataTableConfig();
        config.columns = [
            {
                data: 'person_id',
                render: function (data, type, row) {
                    return `<a class="btn-table-icon person_info" person_id="${data}"><i class="fa fa-lg fa-info-circle hoverable"></i></a>`
                }
            },
            {
                data: 'a_code',
                render: function (data, type, row) {
                    return `<b>${data}</b>`;
                }
            },
            { data: 'name' },
            { data: 'first_name' },
            { data: 'address' },
            { data: 'city' },
            { data: 'shares' },
            { data: 'correspondence' }
        ]

        // initialize DataTable
        table = tableEl.DataTable(config);
        console.log('showPersons: initialized table');

    } else {
        table = tableEl.DataTable();
    }

    // prepare and load table data
    const tableData = [];
    holders.forEach(person => {

        let correspondence_flag = '';
        if (person.correspondence === 1) {
            correspondence_flag = '<td><i class="far fa-envelope"></i></td>';
        }

        tableData.push({
            person_id: person.person_id,
            a_code: person.a_code,
            name: person.name,
            first_name: person.first_name,
            address: person.address,
            city: person.post_code + ' ' + person.city,
            shares: person.shares,
            correspondence: correspondence_flag
        });

    });

    table.clear();
    table.rows.add(tableData).draw();
    console.log('showPersons: loaded table data');


    $('#table-persons-all tbody').on('click', '.person_info', loadPersonInfo)
}

function loadPersonInfo(e) {
    data = {}
    target = e.currentTarget
    ipcRenderer.send('personinfo:load', { 'person_id': target.getAttribute('person_id') });
}

function showPersonInfo(e, data) {

    // prepare data table configuration
    const config = getDataTableConfig();
    config.paging = false
    config.searching = false
    config.bInfo = false
    config.scrollY = "310px"
    config.scollCollapse = true

    correspondence = "Aktiv"
    if (data.person_info.correspondence == '0') {
        correspondence = "Inaktiv"
    }

    // initialize and show dialog
    const dialogEl = document.querySelector('#person-info-modal')
    dialogEl.querySelector('div > div.modal-content > h5').innerHTML = `${data.person_info.first_name} ${data.person_info.name} (${data.person_info.a_code})`
    dialogEl.querySelector('div > div.modal-content > div.row > div.col > p.address').innerHTML = `${data.person_info.address}<br>${data.person_info.post_code} ${data.person_info.city}`
    dialogEl.querySelector('div > div.modal-content > div.row > div.col > p.correspondence').innerHTML = `<b>Korrespondenz:</b> ${correspondence}`
    dialogEl.querySelector('div > div.modal-content > div.row > div.col > p.shares').innerHTML = `<b>Anzahl Aktien:</b> ${data.shares.length}`


    const tableSharesEl = $('#persons-info-shares-table');
    const tableCommentsEl = $('#persons-info-comments-table');
    const tableTrailEl = $('#persons-info-trail-table');
    let tableShares;
    let tableComments;
    let tableTrail;

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
            { data: 'transaction_date' },
            { data: 'journal_no' }
        ]
        tableShares = tableSharesEl.DataTable(config);

        config.columns = [
            {data : 'remark'},
            {
                data : 'timestamp',
                render : function(data, type, row) {
                    return helpers.timestampUTCtoString(data)
                } 
            }
        ]
        config.order = [[1, 'desc']]
        tableComments = tableCommentsEl.DataTable(config);

        config.columns = [
            {data : 'type'},
            {data : 'value'},
            {data : 'original'},
            {data : 'field'},
            {data : 'user'},
            {
                data : 'timestamp',
                render : function(data, type, row) {
                    return helpers.timestampUTCtoString(data)
                } 
            }
        ]
        config.order = [[5, 'desc']]
        tableTrail = tableTrailEl.DataTable(config);
        
    } else {
        tableShares = tableSharesEl.DataTable();
        tableComments = tableCommentsEl.DataTable();
        tableTrail = tableTrailEl.DataTable();
    }

    // load table data
    tableShares.clear();
    tableShares.rows.add(data.shares).draw();

    tableComments.clear();
    tableComments.rows.add(data.remarks).draw();

    tableTrail.clear();
    tableTrail.rows.add(data.trail).draw();

    // open modal
    const dialog = M.Modal.getInstance(dialogEl)
    dialog.open()
}



module.exports = {
    showPersons,
    showPersonInfo
};
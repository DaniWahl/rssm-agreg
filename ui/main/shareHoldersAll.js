


function showShareHoldersAll(e, holders) {


    // show target element
    showElement('content-share-holders-all');
    const tableEl = $('#table-share-holders-all');
    let table;


    // have we initialized the DataTable before?
    if( ! $.fn.dataTable.isDataTable(tableEl) ) {

        // prepare data table configuration
        const config = getDataTableConfig();
        config.columns = [
            {
                data : 'share_no',
                render : function ( data, type, row ) {
                    return `<b>${data}</b>`;
                }
            },
            { data : 'generation'},
            { data : 'transaction'},
            { data : 'a_code'},
            { data : 'name'},
            { data : 'first_name'},
            { data : 'address'},
            { data : 'city'}
        ]

        // initialize DataTable
        table = tableEl.DataTable(config);
        console.log('showShareHoldersAll: initialized table');

    } else {
        table = tableEl.DataTable();
    }

    // prepare and load table data
    const tableData = [];
    holders.forEach(person => {

        tableData.push({
            share_no    : helpers.pad0(person.share_no, 3),
            generation  : person.generation,
            transaction : person.transaction_date,
            a_code      : person.a_code,
            name        : person.name,
            first_name  : person.first_name,
            address     : person.address,
            city        : person.post_code + ' ' + person.city
        });

    });

    table.clear();
    table.rows.add(tableData).draw();
    console.log('showShareHoldersAll: loaded table data');

}

module.exports = {
    showShareHoldersAll
};
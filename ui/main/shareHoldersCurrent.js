/**
 * initialized and loads the shareholder data table
 * @param e
 * @param holders
 */
function showShareHoldersCurrent(e, holders) {

    // show target element
    showElement('content-share-holders-current');

    const tableEl = $('#table-share-holders-current');
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
            { data : 'a_code'},
            { data : 'name'},
            { data : 'first_name'},
            { data : 'address'},
            { data : 'city'}
        ]

        // initialize DataTable
        table = tableEl.DataTable(config);
        console.log('showShareHoldersCurrent: initialized table');

    } else {
        table = tableEl.DataTable();
    }

    // prepare and load table data
    const tableData = [];
    holders.forEach(person => {

        tableData.push({
            share_no : helpers.pad0(person.share_no, 3),
            a_code   : person.a_code,
            name     : person.name,
            first_name : person.first_name,
            address  : person.address,
            city     : person.post_code + ' ' + person.city
        });

    });

    table.clear();
    table.rows.add(tableData).draw();

    console.log('showShareHoldersCurrent: loaded table data');

}

module.exports = {
    showShareHoldersCurrent
};
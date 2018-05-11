


function showShareHoldersCurrent(e, holders) {

    // show target element
    showElement('content-share-holders-current');

    const tableEl = $('#table-share-holders-current');
    let table;
    //console.log(table);
    //return;

    if( ! $.fn.dataTable.isDataTable(tableEl) ) {

        console.log('showShareHoldersCurrent: initializing table');

        // prepare data table configuration
        const config = getDataTableConfig();
        config.columns = [
            { data : 'share_no'},
            { data : 'a_code'},
            { data : 'name'},
            { data : 'first_name'},
            { data : 'address'},
            { data : 'city'}
        ]

        // make this a DataTable
        table = tableEl.DataTable(config);

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

    console.log('showShareHoldersCurrent: loading table data');


}
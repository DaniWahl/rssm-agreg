
function showPersons(e, holders) {

    // show target element
    showElement('content-persons');
    const tableEl = $('#table-persons-all');
    let table;


    // have we initialized the DataTable before?
    if( ! $.fn.dataTable.isDataTable(tableEl) ) {

        // prepare data table configuration
        const config = getDataTableConfig();
        config.columns = [
            {
                data : 'a_code',
                render : function ( data, type, row ) {
                    return `<b>${data}</b>`;
                }
            },
            { data : 'name'},
            { data : 'first_name'},
            { data : 'address'},
            { data : 'city'},
            { data : 'shares'},
            { data : 'correspondence'}
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

        let correspondence_flag ='';
        if(person.correspondence === 1) {
            correspondence_flag = '<td><i class="far fa-envelope"></i></td>';
        }

        tableData.push({
            a_code         : person.a_code,
            name           : person.name,
            first_name     : person.first_name,
            address        : person.address,
            city           : person.post_code + ' ' + person.city,
            shares         : person.shares,
            correspondence : correspondence_flag
        });

    });

    table.clear();
    table.rows.add(tableData).draw();
    console.log('showPersons: loaded table data');
}
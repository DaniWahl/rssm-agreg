
// shares-all-filter-switch
document.querySelector('#shares-all-filter-switch').addEventListener('change', switchFilter);

function showShareRegister(e, holders) {


    // show target element
    showElement('content-register');
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
            { data : 'city'},
            { 
                data : 'is_current',
                visible : false
            }
        ]

        // initialize DataTable
        table = tableEl.DataTable(config);
        console.log('showShareHoldersAll: initialized table');

    } else {
        table = tableEl.DataTable();
    }

    // prepare and load table data
    const tableData = [];
    holders.forEach(data => {

        tableData.push({
            share_no    : helpers.pad0(data.share_no, 3),
            generation  : data.generation,
            transaction : data.transaction_date,
            a_code      : data.a_code,
            name        : data.name,
            first_name  : data.first_name,
            address     : data.address,
            city        : data.post_code + ' ' + data.city,
            is_current  : data.is_current
        });

    });

    table.clear();
    table.rows.add(tableData);
    table.column(8).search("1").draw();
    console.log('showShareHoldersAll: loaded table data');

}


function switchFilter(e) {
    e.preventDefault()
    if(e.target.checked) {
        $('#table-share-holders-all').DataTable().column(8).search('').draw();
    } else {
        $('#table-share-holders-all').DataTable().column(8).search('1').draw();
    }
}


module.exports = {
    showShareRegister
};
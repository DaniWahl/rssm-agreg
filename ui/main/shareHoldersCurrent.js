


function showShareHoldersCurrent(e, holders) {

    // show target element
    showElement('content-share-holders-current');

    // load shareholder data
    //const tbody = document.querySelector('#table-share-holders-current > tbody')
    //tbody.innerHTML = ''


    // prepare table data
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


    // make this a DataTable
    $('#table-share-holders-current').DataTable({
        paging: false,
        language: {
            search : 'Suchen',
            processing:     "Bitte warten...",
            lengthMenu:    "_MENU_ Einträge anzeigen",
            info:           "_START_ bis _END_ von _TOTAL_ Einträgen",
            infoEmpty:      "Keine Daten vorhanden",
            infoFiltered:   "(gefiltert von _MAX_ Einträgen)",
            infoPostFix:    "",
            infoThousands:  "",
            loadingRecords: "Wird geladen...",
            zeroRecords:    "Keine Einträge vorhanden",
            emptyTable:     "Aucune donnée disponible dans le tableau",
            paginate: {
                first:      "Erste",
                previous:   "Zurück",
                next:       "Nächste",
                last:       "Letzte"
            },
            aria: {
                sortAscending:  ": aktivieren, um Spalte aufsteigend zu sortieren",
                sortDescending: ": aktivieren, um Spalte absteigend zu sortieren"
            }
        },
        select: true,
        scrollY: 650,
        data : tableData,
        columns : [
            { data : 'share_no'},
            { data : 'a_code'},
            { data : 'name'},
            { data : 'first_name'},
            { data : 'address'},
            { data : 'city'}
        ]
    });

}
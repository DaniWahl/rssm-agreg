


function showShareHoldersAll(e, holders) {


    // show target element
    showElement('content-share-holders-all');

    // load history dats
    const tbody = document.querySelector('#table-share-holders-all > tbody')
    tbody.innerHTML = ''
    holders.forEach(person => {
        tbody.appendChild( makeTableItem(person, 'holders_all') )
    })
}

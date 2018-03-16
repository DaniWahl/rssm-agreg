


function showShareHoldersAll(e, holders) {
    const tbody = document.querySelector('#table-share-holders-all > tbody')

    // make sure list is empty
    tbody.innerHTML = ''
    holders.forEach(person => {
        tbody.appendChild( makeTableItem(person, 'holders_all') )
    })
}

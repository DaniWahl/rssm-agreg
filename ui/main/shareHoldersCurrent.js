
function showShareHoldersCurrent(e, holders) {
    const tbody = document.querySelector('#table-share-holders-current > tbody')

    // make sure list is empty
    tbody.innerHTML = ''
    holders.forEach(person => {
        tbody.appendChild( makeTableItem(person, 'holders_current') )
    })
}
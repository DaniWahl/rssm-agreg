/**
 * handler for the journal:show IPC event.
 * displays the journal data on it's table
 * @param {Event} e
 * @param {Array} journal
 */
function showJournal(e, journal) {
    const tbody = document.querySelector('#table-journal > tbody')

    // make sure list is empty
    tbody.innerHTML = ''
    journal.forEach(entry => {
        tbody.appendChild( makeTableItem(entry, 'journal') )
    })
}

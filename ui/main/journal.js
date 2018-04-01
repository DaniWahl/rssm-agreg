/**
 * handler for the journal:show IPC event.
 * displays the journal data on it's table
 * @param {Event} e
 * @param {Array} journal
 */
function showJournal(e, journal) {

    // show target element
    showElement('content-journal');

    // load joural table
    const tbody = document.querySelector('#table-journal > tbody');
    tbody.innerHTML = '';
    journal.forEach(entry => {
        tbody.appendChild( makeTableItem(entry, 'journal') );
    })
}

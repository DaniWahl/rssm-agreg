
const electron = require('electron')
const {ipcRenderer} = electron
const pad0 = require('../../lib/app.helpers').pad0
let rssm
let row_group
let last_share_no

ipcRenderer.on('receive:data',          receiveData)
ipcRenderer.on('holders:current:show',  showShareHoldersCurrent)
ipcRenderer.on('holders:all:show',      showShareHoldersAll)
ipcRenderer.on('journal:show',          showJournal)



// register event handlers for all elements
document.querySelectorAll('a').forEach(el => {
    if(el.target) {
        el.addEventListener("click", handleLinkClicks);
    }
})


function receiveData(e, obj) {
    rssm = obj


    const a_codes = {}
    Object.keys(rssm.data.a_codes).forEach(a_code => {
        let suggest = rssm.data.a_codes[a_code].name
        suggest += ' '
        suggest += rssm.data.a_codes[a_code].first_name
        suggest += ' (' + a_code + ')'

        a_codes[suggest] = null;
    })


    $('#a_code_input').autocomplete({
        data: a_codes,
        limit: 20, // The max amount of results that can be shown at once. Default: Infinity.
        onAutocomplete: function(val) {

            const regex = /.+ \((.+)\)$/g
            const matches = regex.exec(val)
            loadRepurchaseShares(matches[1])
        },
        minLength: 1, // The minimum length of the input for the autocomplete to start. Default: 1.
    });



}


function loadRepurchaseShares(a_code) {
    console.log('display', rssm.data.a_codes[a_code])
}

function showShareHoldersCurrent(e, holders) {
    const tbody = document.querySelector('#table-share-holders-current > tbody')

    // make sure list is empty
    tbody.innerHTML = ''
    holders.forEach(person => {
        tbody.appendChild( makeTableItem(person, 'holders_current') )
    })
}

function showShareHoldersAll(e, holders) {
    const tbody = document.querySelector('#table-share-holders-all > tbody')

    // make sure list is empty
    tbody.innerHTML = ''
    holders.forEach(person => {
        tbody.appendChild( makeTableItem(person, 'holders_all') )
    })
}

function showJournal(e, journal) {
    const tbody = document.querySelector('#table-journal > tbody')

    // make sure list is empty
    tbody.innerHTML = ''
    journal.forEach(entry => {
        tbody.appendChild( makeTableItem(entry, 'journal') )
    })
}


/**
 * handle click events on <a> dom elements
 * @param {Event} e
 */
function handleLinkClicks(e) {
    e.preventDefault()

    // show target element
    showElement(e.target.target)

    // send message to main
    ipcRenderer.send('content:show',  e.target.target)
}


/**
 * show the specified element id, making sure all others are hidden
 * @param {String}  element_id
 */
function showElement(element_id) {

    // hide all elements
    document.querySelectorAll('.content-element').forEach(div => {
        div.classList.add('hidden')
    })

    // show selected element
    if(element_id) {
        document.querySelector(`#${element_id}`).classList.remove('hidden');
    }
}



function makeTableItem(row, type) {
    const tr = document.createElement('tr')
    const columns = getColumms(type)
    let row_html = ''
    let share_no


    if( type === 'holders_current' && row.a_code === '999010') {
        tr.className = 'rssm-owner'
    }

    if( row.share_no ) {
        share_no = pad0(row.share_no, 3);

        // toggle row group stripe for each share no
        if (last_share_no !== share_no) {

            if (row_group === 'row-type-plain') {
                row_group = 'row-type-highlight'
            } else {
                row_group = 'row-type-plain'
            }
        }


        tr.className = row_group
        last_share_no = share_no
    }



    columns.forEach(col => {

        switch(col) {
            case 'share_holder':
                row_html += `<td><b>${share_no}</b></td>`
                break;
            case 'level':
                row_html += `<td>${row.level}</td>`
                break
            case 'transaction':
                row_html += `<td>${row.transaction_date}</td>`
                break
            case 'a_code':
                row_html += `<td>${row.a_code}</td>`
                break
            case 'name':
                row_html += `<td>${row.name}</td>`
                break
            case 'fist_name':
                row_html += `<td>${row.first_name}</td>`
                break
            case 'address':
                row_html += `<td>${row.address}</td>`
                break
            case 'city':
                row_html += `<td>${row.post_code} ${row.city}</td>`
                break

            case 'journal_no':
                row_html += `<td><b>${row.journal_no}</b></td>`
                break

            case 'shares':
                row_html += `<td>${row.shares}</td>`
                break

            case 'transaction_type':
                row_html += `<td>${row.transaction_type}</td>`
                break

            case 'action':
                row_html += `<td>${row.action}</td>`
                break

            case 'number':
                row_html += `<td>${row.number}</td>`
                break

            case 'share_stock':
                row_html += `<td>${row.share_stock}</td>`
                break

        }
    })

    tr.innerHTML = row_html;
    return tr
}


function getColumms(type) {

    const columns = {
        holders_all     : [
            'share_holder',
            'level',
            'transaction',
            'a_code',
            'name',
            'fist_name',
            'address',
            'city'
        ],
        holders_current : [
            'share_holder',
            'a_code',
            'name',
            'fist_name',
            'address',
            'city'
        ],
        journal : [
            'journal_no',
            'transaction',
            'a_code',
            'name',
            'shares',
            'transaction_type',
            'action',
            'number',
            'share_stock'
        ]

    }

    return columns[type]

}
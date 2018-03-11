
const electron = require('electron')
const {ipcRenderer} = electron
const pad0 = require('../../lib/app.helpers').pad0
let row_group
let last_share_no

ipcRenderer.on('holders:current:show', showShareHoldersCurrent)
ipcRenderer.on('holders:all:show', showShareHoldersAll)


// register event handlers for all elements
document.querySelectorAll('a').forEach(el => {
    if(el.target) {
        el.addEventListener("click", handleLinkClicks);
    }
})


function showShareHoldersCurrent(e, holders) {
    const tbody = document.querySelector('#table-share-holders-current > tbody')

    // make sure list is empty
    tbody.innerHTML = ''
    holders.forEach(person => {
        tbody.appendChild( makeTableItem(person, 'current') )
    })
}

function showShareHoldersAll(e, holders) {
    const tbody = document.querySelector('#table-share-holders-all > tbody')

    // make sure list is empty
    tbody.innerHTML = ''
    holders.forEach(person => {
        tbody.appendChild( makeTableItem(person, 'all') )
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



function makeTableItem(person, type) {
    const tr = document.createElement('tr')
    const share_no = pad0(person.share_no, 3);
    const columns = getColumms(type)
    let row_html = ''


    if(person.a_code === '999010' && type === 'current') {
        tr.className = 'rssm-owner'
    }


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

    columns.forEach(col => {

        switch(col) {
            case 'share_holder':
                row_html += `<td><b>${share_no}</b></td>`
                break;
            case 'level':
                row_html += `<td>${person.level}</td>`
                break
            case 'transaction':
                row_html += `<td>${person.transaction_date}</td>`
                break
            case 'a_code':
                row_html += `<td>${person.a_code}</td>`
                break
            case 'name':
                row_html += `<td>${person.name}</td>`
                break
            case 'fist_name':
                row_html += `<td>${person.first_name}</td>`
                break
            case 'address':
                row_html += `<td>${person.address}</td>`
                break
            case 'city':
                row_html += `<td>${person.post_code} ${person.city}</td>`
                break
        }
    })

    tr.innerHTML = row_html;
    return tr
}


function getColumms(type) {

    const columns = {
        all     : [
            'share_holder',
            'level',
            'transaction',
            'a_code',
            'name',
            'fist_name',
            'address',
            'city'
        ],
        current : [
            'share_holder',
            'a_code',
            'name',
            'fist_name',
            'address',
            'city'
        ]
    }

    return columns[type]

}
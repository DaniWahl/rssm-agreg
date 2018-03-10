const electron = require('electron')
const pad0 = require('../../lib/app.helpers').pad0
const {ipcRenderer} = electron
const tables = document.querySelectorAll('table')
let row_group
let last_share_no



ipcRenderer.on('holders:current:show', function(e, holders) {

    const table = showTable('shareholders-current-table')
    const tbody = table.querySelector('tbody')

    // make sure list is empty
    tbody.innerHTML = ''
    holders.forEach(person => {
        tbody.appendChild( makeTableItem(person, 'current') )
    })
})

ipcRenderer.on('holders:all:show', function(e, holders) {

    const table = showTable('shareholders-all-table')
    const tbody = table.querySelector('tbody')

    // make sure list is empty
    tbody.innerHTML = ''
    holders.forEach(person => {
        tbody.appendChild( makeTableItem(person, 'all') )
    })
})


function showTable(id) {

    let t;

    tables.forEach(table => {
        if(table.id === id) {
            table.classList.remove('rssm-hidden')
            t = table;
        } else {
            table.classList.add('rssm-hidden')
        }
    })

    return t;
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

        if (row_group === 'rssm-plain') {
            row_group = 'rssm-highlight'
        } else {
            row_group = 'rssm-plain'
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
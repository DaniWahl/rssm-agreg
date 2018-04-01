
const electron = require('electron');
const {ipcRenderer} = electron;
const helpers = require('../../lib/app.helpers');

let row_group
let last_share_no

// register IPC event handlers
ipcRenderer.on('repurchase:show',       showRepurchase)
ipcRenderer.on('holders:current:show',  showShareHoldersCurrent)
ipcRenderer.on('holders:all:show',      showShareHoldersAll)
ipcRenderer.on('journal:show',          showJournal)


// register event handlers for all elements
document.querySelectorAll('a').forEach(el => {
    if(el.target) {
        el.addEventListener("click", handleLinkClicks);
    }
})

console.log('mainWindow: started')


/**
 * handle click events on <a> dom elements
 * @param {Event} e
 */
function handleLinkClicks(e) {
    e.preventDefault()

    // send message to main to load the data
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
        console.log(`mainWindow.showElement: element '${element_id}' showed`);
    }
}


/**
 * generates table rows and td elements for a specified table type
 * TODO: may have to refactor this into individual functions for different table types
 * @param {Object} row  object holding data
 * @param {String} type   table type
 * @returns {HTMLTableRowElement}
 */
function makeTableItem(row, type) {
    const tr = document.createElement('tr')
    const columns = getColumms(type)
    let row_html = ''
    let share_no


    if( type === 'holders_current' && row.a_code === '999010') {
        tr.className = 'rssm-owner'
    }

    if( row.share_no ) {
        share_no = helpers.pad0(row.share_no, 3);

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


    // generate <td> elements holding data values
    columns.forEach(col => {

        switch(col) {
            case 'share_no':
                row_html += `<td><b>${share_no}</b></td>`
                break;
            case 'level':
                row_html += `<td>${row.level}</td>`
                break
            case 'transaction':
                row_html += `<td>${row.transaction_date}</td>`
                break

            case 'city':
                row_html += `<td>${row.post_code} ${row.city}</td>`
                break

            case 'journal_no':
                row_html += `<td><b>${row.journal_no}</b></td>`
                break

            case 'checkbox':
                row_html += `
                    <td>
                        <input type="checkbox" name="repurchase_share" value="${row.share_no}" class="filled-in" id="share_no_${row.share_no}" />
                        <label for="share_no_${row.share_no}"></label>
                    </td>
                `
                break

            default:
                row_html += `<td>${row[col]}</td>`
                break

        }
    })

    tr.innerHTML = row_html;
    return tr
}


/**
 * returns array of columns for a certain table type
 * @param {String} type  table type
 * @returns {Array}
 */
function getColumms(type) {

    const columns = {
        holders_all     : [
            'share_no',
            'generation',
            'transaction',
            'a_code',
            'name',
            'first_name',
            'address',
            'city'
        ],
        holders_current : [
            'share_no',
            'a_code',
            'name',
            'first_name',
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
        ],
        share_list : [
            'checkbox',
            'share_no',
            'a_code',
            'name',
            'first_name',
            'address',
            'city'
        ]

    }

    return columns[type]
}
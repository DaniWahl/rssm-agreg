
const electron = require('electron');
const {ipcRenderer, dialog} = electron;
const helpers = require('../../lib/app.helpers');

var $ = require( 'jquery' );
var dt = require( 'datatables.net' )( window, $ );

require( 'datatables.net-fixedheader' )();
require( 'datatables.net-rowgroup' )();
require( 'datatables.net-scroller' )();



let row_group;
let row_group_value;

// register IPC event handlers
ipcRenderer.on('version:show',          showVersion);
ipcRenderer.on('repurchase:show',       showRepurchase);
ipcRenderer.on('holders:current:show',  showShareHoldersCurrent);
ipcRenderer.on('holders:all:show',      showShareHoldersAll);
ipcRenderer.on('persons:show',          showPersons);
ipcRenderer.on('journal:show',          showJournal);
ipcRenderer.on('transfer:show',         showTransfer);
ipcRenderer.on('mutation:show',         showMutation);
ipcRenderer.on('sale:show',             showSale);
ipcRenderer.on('toast:show',            showToast);



// register event handlers for all elements
document.querySelectorAll('a').forEach(el => {
    if(el.target) {
        el.addEventListener("click", handleLinkClicks);
    }
})



console.log('mainWindow: started');


/**
 * handler for the toast:show event.
 * displays message toast on the ui
 * @param e
 * @param msg
 */
function showToast(e, msg) {
    Materialize.toast(msg, 4000, 'rounded z-depth-4');
}


/**
 * handler for the version:show event.
 * displays the application version in it's container.
 * @param e
 * @param version
 */
function showVersion(e, version) {
    console.log("showing version ", version)
    document.querySelector('#version-no').innerHTML = version;
}

/**
 * handle click events on <a> dom elements
 * @param {Event} e
 */
function handleLinkClicks(e) {
    e.preventDefault();

    // send message to main to load the data
    ipcRenderer.send('content:show',  e.target.target);
}


/**
 * show the specified element id, making sure all others are hidden
 * @param {String}  element_id
 */
function showElement(element_id) {

    // hide all elements
    document.querySelectorAll('.content-element').forEach(div => {
        div.classList.add('hidden');
    })

    // show selected element
    if(element_id) {
        document.querySelector(`#${element_id}`).classList.remove('hidden');
        console.log(`mainWindow.showElement: element '${element_id}' showed`);
    }
}


/**
 * generates and returns a share html element
 * @param share {Object}  contains share information
 * @param type {String}  transaction type - will be added to the element id
 * @returns {string}
 */
function  makeShareElement(share, type) {

    const no = helpers.pad0(share.share_no, 3);

    const html = `<div id="${type}-share-${share.share_no}" class="card-panel hoverable share-dd-item">
        <img src="../../assets/linden.png">
        <p class="share-no">${no}</p>
        <p class="name">${share.first_name} ${share.name}</p>
    </div>`;

    return html;
}


/**
 * returns share numbers of all selected share elements
 * @param type {String}  transaction type
 * @returns {Array}
 */
function getSelectedShares(type) {

    const container_id = `#${type}-list`;
    const selected = $(`${container_id} div.share-dd-item-selected`);
    const share_no = [];
    const reg = new RegExp(/\d+$/);


    // extract share_no from id
    for(let i=0; i<selected.length; i++) {
        const matches = reg.exec(selected[i].id)
        share_no.push(matches[0]);
    }

    return share_no;
}

/**
 * generates share html elements from the provided shares list and
 * populates the elements into the share list.
 * @param {Array} shares
 * @param {String} type   transaction type for shares
 */
function showShares(shares, type) {

    const container_id = `#${type}-list`;

    // empty the share container
    $(`${container_id} div`).remove();


    // create share elements to the container
    shares.forEach(share => {
        const div = makeShareElement(share, type);
        $(`${container_id}`).append(div);
    });

    // create click event handler for all share elements
    $(`${container_id} div.share-dd-item`).on('click', function(e) {

        const element = e.currentTarget;
        e.preventDefault();

        // toggle element selection
        if( $(element).hasClass('share-dd-item-selected') ) {
            $(element).removeClass('share-dd-item-selected');
        } else {
            $(element).addClass('share-dd-item-selected');
        }

        // update form with selected information
        updateSelected(type);
    });

}

/**
 * count number of selected shares and update summary table and submit button status
 * @param {String} type
 */
function updateSelected(type) {

    const container_id = `#${type}-list`;
    const submit_id = `#${type}-submit`;
    const summary_id = `#${type}-shares`;

    const selected = $(`${container_id} div.share-dd-item-selected`);
    document.querySelector(summary_id).innerHTML = selected.length;

    if(selected.length) {
        $(submit_id).removeClass('disabled');
    } else {
        $(submit_id).addClass('disabled');
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
    const tr = document.createElement('tr');
    const columns = getColumms(type);
    let row_html = '';
    let share_no;

    // styling the rows based on column values
    switch(type) {
        case 'holders_current':
            share_no = helpers.pad0(row.share_no, 3);
            tr.className = getRowClass(share_no);
            break;

        case 'holders_all':
            share_no = helpers.pad0(row.share_no, 3);
            tr.className = getRowClass(share_no);
            break;

        case 'share_list':
            share_no = helpers.pad0(row.share_no, 3);
            tr.className = getRowClass(share_no);
            break;

        case 'journal':
            tr.className = getRowClass(row.journal_no);
            break;

        case 'persons':
            tr.className = getRowClass(row.a_code);
            break;
    }



    // generate <td> elements holding data values
    columns.forEach(col => {

        switch(col) {
            case 'share_no':
                row_html += `<td><b>${share_no}</b></td>`;
                break;
            case 'level':
                row_html += `<td>${row.level}</td>`;
                break;
            case 'transaction':
                row_html += `<td>${row.transaction_date}</td>`;
                break;

            case 'city':
                row_html += `<td>${row.post_code} ${row.city}</td>`;
                break;

            case 'journal_no':
                row_html += `<td><b>${row.journal_no}</b></td>`;
                break;

            case 'correspondence':
                if(row.correspondence === 1) {
                    row_html += '<td><i class="far fa-envelope"></i></td>';
                } else {
                    // row_html += '<td><span class="fa-stack fa-1x" >' +
                    //     '<i class="far fa-envelope fa-stack-1x" style="color:#cccccc;"></i>' +
                    //     '<i class="fas fa-ban fa-stack-2x" style="color:#999999;"></i>' +
                    //
                    //     '</span></td>';

                    row_html += '<td></td>';
                }
                break;

            case 'checkbox':
                //2DO: check box items need to have a unique id, but the below ids are not causing the checkboxes to not enable!
                row_html += `
                    <td>
                        <input type="checkbox" name="share_item" value="${row.share_no}" class="filled-in" id="share_no_${row.share_no}" />
                        <label for="share_no_${row.share_no}"></label>
                    </td>
                `;
                break;

            default:
                row_html += `<td>${row[col]}</td>`;
                break;

        }
    })

    tr.innerHTML = row_html;
    return tr;
}


/**
 * returns the row class based on the previous and current values passed in.
 * will toggle the classes if previous and current are different,
 * @param current
 * @returns {String} css class
 */
function getRowClass(current) {
    if(row_group_value !== current) {
        // need to toggle the row group
        if (row_group === 'row-type-plain') {
            row_group = 'row-type-highlight';
        } else {
            row_group = 'row-type-plain';
        }
    }
    row_group_value = current;
    return row_group;
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
        ],
        persons : [
            'a_code',
            'name',
            'first_name',
            'address',
            'city',
            'shares',
            'correspondence'
        ]

    };

    return columns[type];
}


/**
 * returns a default dataTable config object
 * @returns {{paging: boolean, language: {search: string, processing: string, lengthMenu: string, info: string, infoEmpty: string, infoFiltered: string, infoPostFix: string, infoThousands: string, loadingRecords: string, zeroRecords: string, emptyTable: string, paginate: {first: string, previous: string, next: string, last: string}, aria: {sortAscending: string, sortDescending: string}}, select: boolean, scrollY: number}}
 */
function getDataTableConfig() {
    return {
        paging: false,
        language: {
            search :        "<i class=\"fas fa-search\"></i> Suchen",
            processing:     "Bitte warten...",
            lengthMenu:    "_MENU_ Einträge anzeigen",
            info:           "_START_ bis _END_ von _TOTAL_ Einträgen",
            infoEmpty:      "Keine Daten vorhanden",
            infoFiltered:   "(gefiltert von _MAX_ Einträgen)",
            infoPostFix:    "",
            thousands:      "'",
            loadingRecords: "Wird geladen...",
            zeroRecords:    "",
            emptyTable:     "",
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
        scrollY: 650
    }
}

const electron = require('electron');
const {ipcRenderer, dialog} = electron;
const helpers = require('../../lib/app.helpers');

var $ = require( 'jquery' );
var dt = require( 'datatables.net' )( window, $ );

require( 'datatables.net-fixedheader' )();
require( 'datatables.net-rowgroup' )();
require( 'datatables.net-scroller' )();


// load ui modules
const {showAdminDB} = require('./dbAdmin');
const {showJournal} = require('./journal');
const {showMutation} = require('./mutation');
const {showPersons} = require('./persons');
const {showRepurchase} = require('./repurchase');
const {showTransfer} = require('./transfer');
const {showSale} = require('./sale');
const {showShareHoldersAll} = require('./shareHoldersAll');
const {showShareHoldersCurrent} = require('./shareHoldersCurrent');






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
ipcRenderer.on('admin:database:show',   showAdminDB);



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
    Materialize.toast(msg, 5000, 'rounded blue green lighten-1 z-depth-4');
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

    // get existing shares in container
    const old = $(`${container_id} div`);

    if(type === 'sale') {
        for(let i=0; i<old.length; i++) {

            // remove only the non-selected
            if( !$(old[i]).hasClass("share-dd-item-selected") ) {
                $(old[i]).remove();
            }
        }
    } else {
        // remove all
        $(old).remove();
    }


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
 * returns a default dataTable config object
 * @returns {{paging: boolean, language: {search: string, processing: string, lengthMenu: string, info: string, infoEmpty: string, infoFiltered: string, infoPostFix: string, infoThousands: string, loadingRecords: string, zeroRecords: string, emptyTable: string, paginate: {first: string, previous: string, next: string, last: string}, aria: {sortAscending: string, sortDescending: string}}, select: boolean, scrollY: number}}
 */
function getDataTableConfig() {
    return {
        paging: true,
        pageLength : 20,
        lengthChange : false,
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
                first:      "<i class='fas fa-angle-double-left'></i>",
                previous:   "<i class='fas fa-angle-left'></i>",
                next:       "<i class='fas fa-angle-right'></i>",
                last:       "<i class='fas fa-angle-double-right'></i>"
            },
            aria: {
                sortAscending:  ": aktivieren, um Spalte aufsteigend zu sortieren",
                sortDescending: ": aktivieren, um Spalte absteigend zu sortieren"
            }
        },
        select: true
    }
}

const electron = require('electron');
const {ipcRenderer, dialog} = electron;
const helpers = require('../../lib/app.helpers');

var $ = require( 'jquery' );
var dt = require( 'datatables.net' )( window, $ );
require( 'datatables.net-fixedheader' )();
require( 'datatables.net-rowgroup' )();
require( 'datatables.net-scroller' )();


// load ui modules
const {showJournal, showJournalInfo} = require('./journal');
const {showMutation} = require('./mutation');
const {showPersons, showPersonInfo} = require('./persons');
const {showRepurchase} = require('./repurchase');
const {showTransfer} = require('./transfer');
const {showSale} = require('./sale');
const {showShareRegister} = require('./shareRegister');
const {showDashboard} = require('./dashboard');
const {showSettings} = require('./settings');
const {showReport, showReportData} = require('./report');
const {showEnterPerson} = require('./newPerson');

// initialize Materialze library
M.AutoInit();
M.Modal.init(document.querySelectorAll('.modal'));
M.FormSelect.init(document.querySelectorAll('select'));
M.Datepicker.init(document.querySelectorAll('input.datepicker'), {
    autoClose : true,
    defaultDate : new Date(),
    //setDefaultDate : true,
    format: 'dd.mm.yyyy',
    firstDay: 1,
    i18n : {
        months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
        monthsShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
        weekdays : ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
        weekdaysShort : ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
        weekdaysAbbrev: ['S', 'M', 'D', 'M', 'D', 'F', 'S'],
        cancel : 'Abbrechen'
    }
});



// are these still needed ? 
// let row_group;
// let row_group_value;

// register IPC event handlers
ipcRenderer.on('version:show',          showVersion);
ipcRenderer.on('information:show',      showInfo);
ipcRenderer.on('dashboard:show',        showDashboard);
ipcRenderer.on('repurchase:show',       showRepurchase);
ipcRenderer.on('shareregister:show',    showShareRegister);
ipcRenderer.on('persons:show',          showPersons);
ipcRenderer.on('personsinfo:show',      showPersonInfo);
ipcRenderer.on('journal:show',          showJournal);
ipcRenderer.on('journalinfo:show',      showJournalInfo);
ipcRenderer.on('report:show',           showReport);
ipcRenderer.on('report:data:show',      showReportData);
ipcRenderer.on('transfer:show',         showTransfer);
ipcRenderer.on('mutation:show',         showMutation);
ipcRenderer.on('sale:show',             showSale);
ipcRenderer.on('enterperson:show',      showEnterPerson);
ipcRenderer.on('toast:show',            showToast);
ipcRenderer.on('admin:settings:show',   showSettings);



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
 * @param msg {String}
 * @param color {String}
 */
function showToast(e, msg, color='green') {
    M.toast({
        html : msg,
        displayLength : 5000,
        classes : `rounded ${color} lighten-1 z-depth-4`
    })
}

/**
 * handler for the info:show event.
 * displays application info
 * @param e
 */
function showInfo(e, version) {
    const el = document.querySelector('#application-info')
    el.querySelector('div > div.modal-content > p > span.rssm-app-info-version').innerHTML = version
    const dialog = M.Modal.getInstance(el)
    dialog.open()
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
    });

    // show selected element
    if(element_id) {
        document.querySelector(`#${element_id}`).classList.remove('hidden');
        console.log(`mainWindow.showElement: element '${element_id}' showed`);
    }

    M.Tooltip.init(document.querySelectorAll('.tooltipped'));
}


/**
 * generates and returns a share html element
 * @param share {Object}  contains share information
 * @param type {String}  transaction type - will be added to the element id
 * @returns {string}
 */
function  makeShareElement(share, type) {

    const no = helpers.pad0(share.share_no, 3);
    let icon_div = ''
    let hash_div = ''

    if(share.status == 'reserved') {
        icon_div = '<div class="share-dd-icon"><i class="far fa-registered"></i></a>'
    }
    if(share.status == 'invalidated') {
        icon_div = '<div class="share-dd-icon"><i class="fas fa-ban"></i></a>'
    }
    if(share.status == 'electronic') {
        icon_div = '<div class="share-dd-icon"><i class="fas fa-microchip"></i></a>'
    }
    if(type == 'repurchase' && share.hash) {
        hash_div = `<div class="share-dd-hash">${share.hash.substr(0, 8)}</div>`
    }

    const html = `<div id="${type}-share-${share.share_no}" class="card-panel hoverable waves-effect waves-light share-status-${share.status} share-dd-item">
        <img src="../../assets/linden.png">
        <p class="share-no">${no}</p>
        <p class="name">${share.first_name} ${share.name}</p>
        ${hash_div}
        ${icon_div}
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

    for(let i=0; i<selected.length; i++) {
        // stop here if any of the selected shares is a reserved certificate
        if($(selected[i]).hasClass('share-status-reserved') && type == 'sale') {
            return
        }
    }

    // if we reach this, en-disable the sale submit button
    if(selected.length) {
        $(submit_id).removeClass('disabled');
    } else {
        $(submit_id).addClass('disabled');
    }

}


/**
 * returns a default dataTable config object
 * @returns {Object}
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
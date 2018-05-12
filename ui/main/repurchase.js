

// setup repurchase ui specific event handlers
document.querySelector('#repurchase-submit').addEventListener('click', submitRepurchase);
document.querySelector('#confirmation-repurchase-ok').addEventListener('click', doRepurchase);



/**
 * event handler for the Repurchase Submit button.
 * displays a confirmation dialog
 * @param e
 */
function submitRepurchase(e) {
    e.preventDefault();

    // get form data
    const formData = new FormData(document.querySelector('form[name=repurchase]'));
    const shares = formData.getAll('share_item');
    const holder = formData.get('holder');


    // form dialog message
    let msg = `Vom Aktionär <b>${holder}</b> werden die folgenden <b>${shares.length}</b> Aktien zurückgekauft, 
         welche in den Besitz des <b>Schulvereins der RSSM (999010)</b> zurück gehen: <br> 
         <ul style="list-style-type:disc"><b>`;
    shares.forEach(share_no => {
        msg += `<li>${helpers.pad0(share_no, 3)}</li>`;
    })
    msg += '<b><ul>';
        

    // initialize and show dialog
    const dialog = document.querySelector('#confirmation-modal-repurchase');
    dialog.querySelector('div > div.modal-content > p').innerHTML = msg;
    $('#confirmation-modal-repurchase').modal();
    $('#confirmation-modal-repurchase').modal('open');

}

/**
 * event handler for the modal dialog ok button click.
 * passes the data back to main for being processed
 * @param e
 */
function doRepurchase(e) {

    const repurchase = {};
    const formData = new FormData(document.querySelector('form[name=repurchase]'));
    repurchase.shares = formData.getAll('share_item');
    repurchase.holder = formData.get('holder');

    // extract a_code
    let reg = /.+ \((.+)\)$/;
    let matches = reg.exec(repurchase.holder);
    repurchase.a_code = matches[1];

    ipcRenderer.send('repurchase:execute', repurchase);

}


/**
 * event handler for the repurchase:show IPC event.
 * initialized the Repurchase form
 * @param {Event} e
 * @param {Object} data
 */
function showRepurchase(e, data) {

    // show target element
    showElement('content-repurchase');

    initRepurchaseSummary(data);
    initRepurchaseForm();


    // prepare the a_codes suggestion list
    const a_codes = {}
    Object.keys(data.a_codes).forEach(a_code => {
        let suggest = data.a_codes[a_code].name;
        suggest += ' ';
        suggest += data.a_codes[a_code].first_name;
        suggest += ' (' + a_code + ')';

        a_codes[suggest] = null;
    })


    // initialize the a_code autocomplete field with suggestion list event handler
    $('#repurchase-a-code-input').autocomplete({
        data: a_codes,
        limit: 20, // The max amount of results that can be shown at once. Default: Infinity.
        onAutocomplete: function (val) {

            initRepurchaseSummary(data);

            // extract a_code part from selection
            const regex = /.+ \((.+)\)$/g;
            const matches = regex.exec(val);
            const a_code = matches[1];

            // get share holder with a_code
            const holder = data.a_codes[a_code];

            // prepare array of shares from that share holders
            const shares = []
            holder.shares.forEach(share_no => {
                shares.push(data.shares[share_no]);
            })


            // create table rows
            listRepurchaseShares(shares);
        },
        minLength: 1, // The minimum length of the input for the autocomplete to start. Default: 1.
    });

}


function initRepurchaseTable() {
    const tableEl = $('#table-repurchase-share-list');

    // have we initialized the DataTable before?
    if( ! $.fn.dataTable.isDataTable(tableEl) ) {

        // prepare data table configuration
        const config = getDataTableConfig();
        config.searching = false;
        config.ordering = false;
        config.info = false;
        config.scrollY = 300;
        config.columns = [
            {
                data : 'checkbox',
                render : function ( data, type, row ) {
                    return `<b>${data}</b>`;
                }
            },
            { data : 'share_no'},
            { data : 'a_code'},
            { data : 'name'},
            { data : 'first_name'},
            { data : 'address'},
            { data : 'city'}

        ];

        // initialize DataTable
        tableEl.DataTable(config);
        console.log('initRepurchaseTable: initialized table');
    }
}


/**
 * initialize the Repurchase summary table
 */
function initRepurchaseSummary(data) {
    // initialize the summary table
    document.querySelector('#repurchase-date').innerHTML = helpers.dateToString();
    document.querySelector('#repurchase-journal').innerHTML = data.nextJournal;
    document.querySelector('#repurchase-shares').innerHTML = '0';
}

function initRepurchaseForm() {
    //document.querySelector('#table-repurchase-share-list > tbody').innerHTML = '';
    document.querySelector('#repurchase-a-code-input').value = '';
}

/**
 * pupulate shares container with shares from selected share holder
 * @param {Array} shares
 */
function listRepurchaseShares(shares) {

    // empty the share container
    $('#repurchase-list div').remove();


    // create share elements to the container
    shares.forEach(share => {
        const div = makeShareElement(share);
        $('#repurchase-list').append(div);
    });

    $('#repurchase-list div.share-dd-item').on('click', function(e) {

        const element = e.currentTarget;
        e.preventDefault();

        // toggle element selection
        if( $(element).hasClass('share-dd-item-selected') ) {
            $(element).removeClass('share-dd-item-selected');
            $(element).removeClass('z-depth-5');
        } else {
            $(element).addClass('share-dd-item-selected');
            $(element).addClass('z-depth-5');
        }

    });

}

/**
 * event handler of the checkbox change event.
 * count number of selected shares and update summary table and repurchase button status
 * @param {Event} e
 */
function fff(element) {

    console.log(element);




}

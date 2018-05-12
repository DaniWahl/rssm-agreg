const TRANSFER_TYPE = 'transfer';

// setup repurchase ui specific event handlers
document.querySelector('#transfer-submit').addEventListener('click', submitTransfer);
document.querySelector('#confirmation-transfer-ok').addEventListener('click', doTransfer);


/**
 * event handler for the Transfer Submit button.
 * displays a confirmation dialog
 * @param e
 */
function submitTransfer(e) {
    e.preventDefault();

    // get form data
    const formData = new FormData(document.querySelector('form[name=transfer]'));
    const holder = formData.get('source');
    const reciever = formData.get('reciever');
    const comment = formData.get('comment');

    // get selected shares
    const shares = getSelectedShares(TRANSFER_TYPE);

    // form dialog message
    let msg = `Vom Aktionär <b>${holder}</b> werden die folgenden <b>${shares.length}</b> Aktien an den <br>Aktionär
           <b>${reciever}</b> übertragen. <br>
           Begründung: ${comment}<br>
          <ul style="list-style-type:disc"><b>`;
    shares.forEach(share_no => {
        msg += `<li>${helpers.pad0(share_no, 3)}</li>`;
    })
    msg += '<b><ul>';

    // initialize and show dialog
    const dialog = document.querySelector('#confirmation-modal-transfer');
    dialog.querySelector('div > div.modal-content > p').innerHTML = msg;
    $('#confirmation-modal-transfer').modal();
    $('#confirmation-modal-transfer').modal('open');
}

/**
 * event handler for the modal dialog ok button click.
 * passes the data back to main for being processed
 * @param e
 */
function doTransfer(e) {

    const transfer = {};
    // get form data
    const formData = new FormData(document.querySelector('form[name=transfer]'));
    transfer.shares = getSelectedShares(TRANSFER_TYPE);
    transfer.holder = formData.get('source');
    transfer.reciever = formData.get('reciever');
    transfer.comment = formData.get('comment');

    // extract a_codes
    let reg = /.+ \((.+)\)$/;
    let matches = reg.exec(transfer.holder);
    transfer.holder = matches[1];
    matches = reg.exec(transfer.reciever);
    transfer.reciever = matches[1];

    ipcRenderer.send('transfer:execute', transfer);

}


/**
 * event handler for the repurchase:show IPC event.
 * initialized the Repurchase form
 * @param {Event} e
 * @param {Object} data
 */
function showTransfer(e, data) {

    // show target element
    showElement('content-transfer');

    initTransferSummary(data);
    initTransferForm();

    // empty the share container
    $('#transfer-list div').remove();

    // prepare the a_codes suggestion list
    const a_codes = {};
    Object.keys(data.a_codes).forEach(a_code => {
        let suggest = data.a_codes[a_code].name;
        suggest += ' ';
        suggest += data.a_codes[a_code].first_name;
        suggest += ' (' + a_code + ')';

        a_codes[suggest] = null;
    })


    // initialize the a_code autocomplete field with suggestion list event handler
    $('#transfer-a-code-source-input').autocomplete({
        data: a_codes,
        limit: 20, // The max amount of results that can be shown at once. Default: Infinity.
        onAutocomplete: function (val) {

            initTransferSummary(data);

            // extract a_code part from selection
            const regex = /.+ \((.+)\)$/g;
            const matches = regex.exec(val);
            const a_code = matches[1];

            // get share holder with a_code
            const holder = data.a_codes[a_code];

            // prepare array of shares from that share holders
            const shares = [];
            holder.shares.forEach(share_no => {
                shares.push(data.shares[share_no]);
            })

            // create share elements
            showShares(shares, TRANSFER_TYPE);
        },
        minLength: 1 // The minimum length of the input for the autocomplete to start. Default: 1.
    })


    $('#transfer-a-code-reciever-input').autocomplete({
        data: a_codes,
        limit: 20, // The max amount of results that can be shown at once. Default: Infinity.
        minLength: 1 // The minimum length of the input for the autocomplete to start. Default: 1.
    })

}

/**
 * initialize the Transfer summary table
 */
function initTransferSummary(data) {
    // initialize the summary table
    document.querySelector('#transfer-date').innerHTML = helpers.dateToString();
    document.querySelector('#transfer-journal').innerHTML = data.nextJournal;
    document.querySelector('#transfer-shares').innerHTML = '0';
}

function initTransferForm() {
    document.querySelector('#transfer-a-code-source-input').value = '';
    document.querySelector('#transfer-a-code-reciever-input').value = '';
    document.querySelector('#transfer-comment-input').value = '';
}


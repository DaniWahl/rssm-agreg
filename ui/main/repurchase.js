

// setup repurchase ui specific event handlers
document.querySelector('#repurchase-submit').addEventListener('click', submitRepurchase)
document.querySelector('#confirmation-modal-ok').addEventListener('click', doRepurchase)



/**
 * event handler for the Repurchase Submit button.
 * displays a confirmation dialog
 * @param e
 */
function submitRepurchase(e) {
    e.preventDefault()

    // get form data
    const formData = new FormData(document.querySelector('form[name=repurchase]'))
    const shares = formData.getAll('repurchase_share')
    const holder = formData.get('holder')


    // form dialog message
    let msg = `Vom Aktionär <b>${holder}</b> werden die folgenden <b>${shares.length}</b> Aktien zurückgekauft, 
         welche in den Besitz des <b>Schulvereins der RSSM (999010)</b> zurück gehen: <br> 
         <ul style="list-style-type:disc"><b>`
    shares.forEach(share_no => {
        msg += `<li>${share_no}</li>`
    })
    msg += '<b><ul>'
        

    // initialize and show dialog
    const dialog = document.querySelector('#confirmation-modal')
    dialog.querySelector('div > div.modal-content > h4').innerHTML = 'Rückkauf'
    dialog.querySelector('div > div.modal-content > p').innerHTML = msg



    $('#confirmation-modal').modal()
    $('#confirmation-modal').modal('open')

}

/**
 * event handler for the modal dialog ok button click.
 * passes the data back to main for being processed
 * @param e
 */
function doRepurchase(e) {

    const repurchase = {}
    const formData = new FormData(document.querySelector('form[name=repurchase]'))
    repurchase.shares = formData.getAll('repurchase_share')
    repurchase.holder = formData.get('holder')


    console.log('firing ipc repurchase:execute')
    ipcRenderer.send('repurchase:execute', repurchase)

}


/**
 * event handler for the repurchase:show IPC event.
 * initialized the Repurchase form
 * @param {Event} e
 * @param {Object} data
 */
function showRepurchase(e, data) {

    initRepurchaseSummary(data)


    // prepare the a_codes suggestion list
    const a_codes = {}
    Object.keys(data.a_codes).forEach(a_code => {
        let suggest = data.a_codes[a_code].name
        suggest += ' '
        suggest += data.a_codes[a_code].first_name
        suggest += ' (' + a_code + ')'

        a_codes[suggest] = null
    })


    // initialize the a_code autocomplete field with suggestion list event handler
    $('#a_code_input').autocomplete({
        data: a_codes,
        limit: 20, // The max amount of results that can be shown at once. Default: Infinity.
        onAutocomplete: function (val) {

            initRepurchaseSummary(data)

            // extract a_code part from selection
            const regex = /.+ \((.+)\)$/g
            const matches = regex.exec(val)
            const a_code = matches[1]

            // get share holder with a_code
            const holder = data.a_codes[a_code]

            // prepare array of shares from that share holders
            const shares = []
            holder.shares.forEach(share_no => {
                shares.push(data.shares[share_no])
            })


            // create table rows
            listRepurchaseShares(shares)
        },
        minLength: 1, // The minimum length of the input for the autocomplete to start. Default: 1.
    })

}

/**
 * initialize the Repurchase summary table
 */
function initRepurchaseSummary(data) {
    // initialize the summary table
    document.querySelector('#repurchase-date').innerHTML = dateToString()
    document.querySelector('#repurchase-journal').innerHTML = data.nextJournal
    document.querySelector('#repurchase-shares').innerHTML = 0
}


/**
 * pupulate shares table with shares from selected share holder
 * @param {Array} shares
 */
function listRepurchaseShares(shares) {
    const tbody = document.querySelector('#table-repurchase-share-list > tbody')

    tbody.innerHTML = ''
    shares.forEach(share => {
        tbody.appendChild(makeTableItem(share, 'share_list'))

    })

    document.querySelectorAll('#table-repurchase-share-list > tbody > tr > td > input').forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedShares)
    })
}

/**
 * event handler of the checkbox change event.
 * count number of selected shares and update summary table and repurchase button status
 * @param {Event} e
 */
function updateSelectedShares(e) {

    const formData = new FormData(document.querySelector('form[name=repurchase]'))
    const share_no = formData.getAll('repurchase_share').length

    document.querySelector('#repurchase-shares').innerHTML = share_no

    // handle button status
    if(share_no !== 0) {
        document.querySelector('#repurchase-submit').classList.remove('disabled')
    } else {
        document.querySelector('#repurchase-submit').classList.add('disabled')
    }


}
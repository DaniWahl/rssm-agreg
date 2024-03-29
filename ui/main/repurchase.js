const REPURCHASE_TYPE = "repurchase"

// setup repurchase ui specific event handlers
document.querySelector("#repurchase-submit").addEventListener("click", submitRepurchase)
document.querySelector("#confirmation-repurchase-ok").addEventListener("click", doRepurchase)

/**
 * event handler for the Repurchase Submit button.
 * displays a confirmation dialog
 * @param e
 */
function submitRepurchase(e) {
    e.preventDefault()

    // get form data
    const formData = new FormData(document.querySelector("form[name=repurchase]"))
    const holder = formData.get("holder")

    // get selected shares
    const shares = getSelectedShares(REPURCHASE_TYPE)

    // form dialog message
    let msg = `Vom Aktionär <b>${holder}</b> werden die folgenden <b>${shares.length}</b> Aktien zurückgekauft, 
         welche in den Besitz des <b>Schulvereins der RSSM (999010)</b> zurück gehen: <br> 
         <ul style="list-style-type:disc"><b>`
    shares.forEach((share_no) => {
        msg += `<li>${helpers.pad0(share_no, 3)}</li>`
    })
    msg += "<b><ul>"

    // initialize and show dialog
    const dialogEl = document.querySelector("#confirmation-modal-repurchase")
    dialogEl.querySelector("div > div.modal-content > p").innerHTML = msg
    const dialog = M.Modal.getInstance(dialogEl)
    dialog.open()
}

/**
 * event handler for the modal dialog ok button click.
 * passes the data back to main for being processed
 * @param e
 */
function doRepurchase(e) {
    const repurchase = {}
    const formData = new FormData(document.querySelector("form[name=repurchase]"))
    repurchase.shares = getSelectedShares(REPURCHASE_TYPE)
    repurchase.holder = formData.get("holder")
    repurchase.booking_date = formData.get("transaction")

    // extract a_code
    let reg = /.+ \((.+)\)$/
    let matches = reg.exec(repurchase.holder)
    repurchase.a_code = matches[1]

    ipcRenderer.send("repurchase:execute", repurchase)
}

/**
 * event handler for the repurchase:show IPC event.
 * initialized the Repurchase form
 * @param {Event} e
 * @param {Object} data
 */
function showRepurchase(e, data) {
    // show target element
    showElement("content-repurchase")
    initRepurchaseForm()

    // empty the share container
    $("#repurchase-list div").remove()

    // prepare the a_codes suggestion list
    const a_codes = {}
    Object.keys(data.a_codes).forEach((a_code) => {
        let suggest = data.a_codes[a_code].name
        suggest += " "
        suggest += data.a_codes[a_code].first_name
        suggest += " (" + a_code + ")"

        a_codes[suggest] = null
    })

    // initialize the a_code autocomplete field with suggestion list event handler

    const selectField = document.querySelectorAll("#repurchase-a-code-input")
    M.Autocomplete.init(selectField, {
        data: a_codes,
        limit: 20, // The max amount of results that can be shown at once. Default: Infinity.
        onAutocomplete: function (val) {
            // extract a_code part from selection
            const regex = /.+ \((.+)\)$/g
            const matches = regex.exec(val)
            const a_code = matches[1]

            // get share holder with a_code
            const holder = data.a_codes[a_code]

            // prepare array of shares from that share holders
            const shares = []
            holder.shares.forEach((share_no) => {
                shares.push(data.shares[share_no])
            })

            // create share elements
            showShares(shares, REPURCHASE_TYPE)
        },
    })
}

function initRepurchaseForm() {
    document.querySelector("#repurchase-a-code-input").value = ""
}

module.exports = {
    showRepurchase,
}

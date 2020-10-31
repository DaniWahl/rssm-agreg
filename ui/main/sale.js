const SALE_TYPE = 'sale';

// setup repurchase ui specific event handlers
document.querySelector('#sale-submit').addEventListener('click', submitSale);
document.querySelector('#sale-reserved-submit').addEventListener('click', submitIssueReserved);
document.querySelector('#confirmation-sale-ok').addEventListener('click', doSale);
document.querySelector('#confirmation-issuereserved-ok').addEventListener('click', doIssueReserved);
document.querySelector('#sale-n-shares').addEventListener('input', updateShareList);

//let rssmSharesNo;
let rssmShareIndex;
let allShares;


/**
 * event handler for the sale-n-shares input event.
 * compile a list of available shares and show them on the container
 * @param e
 */
function updateShareList(e) {
    const value = parseInt(e.target.value);

    if (isNaN(value)) {
        return;
    }

    // override any reserved shares being displayed
    document.querySelector('#sale-reserved-submit').classList.add("hidden")

    // pull list of available shares
    const list = getShareList(value);

    // create share table rows
    const shares = [];
    for (let i=0; i<list.length; i++) {
        shares.push(allShares[list[i]]);
    }

    // create share elements
    showShares(shares, SALE_TYPE);
}


/**
 * returns an array of share numbers for sale.
 * tries to get a sequece where possible
 * @param n {int}  number of shares to pull
 * @returns {*[]}
 */
function getShareList(n) {
    let list = [];
    let i=n;

    while(list.length < n && i>0) {

        // check if we have a group in the index
        if (typeof rssmShareIndex[i] !== 'undefined') {

            if(typeof rssmShareIndex[i][0] != 'undefined') {

                // lucky! return the first
                list = list.concat(rssmShareIndex[i][0]);
            }
        }

        i--;
    }

    //console.log(`getShares(${n} , ${i} ) = ${list} `);
    return list.slice(0,n);
}


/**
 * generates an index of share_no sequence groups
 * @param rssmSharesNo {Array}  share numbers to index
 * @returns {Object}
 */
function indexShareList(rssmSharesNo) {
    const index = {};
    let group = [];
    let next = rssmSharesNo[0];  // bootstrap next with first share no


    for (let i = 0; i < rssmSharesNo.length; i++) {

        // is share no in sequence group?
        if (rssmSharesNo[i] !== next) {

            // make sure we have a index array of that size
            if (typeof index[group.length] === 'undefined') {
                index[group.length] = [];
            }

            // add group to index and start a new group
            index[group.length].push(group);
            group = [];

        }

        // add to group and adjust next
        group.push(rssmSharesNo[i]);
        next = rssmSharesNo[i] + 1;
    }

    return index;
}


 /**
  * event handler for the Transfer Submit button.
  * displays a confirmation dialog
  * @param e
  */
function submitSale(e) {
    e.preventDefault();

    // get form data
    const formData = new FormData(document.querySelector('form[name=sale]'));

    const holder = formData.get('holder');
    const buyer = {
        a_code: formData.get('a_code'),
        salutation: formData.get('salutation'),
        family: formData.get('family'),
        first_name: formData.get('first_name'),
        name: formData.get('name'),
        address: formData.get('address'),
        post_code: formData.get('post_code'),
        city: formData.get('city'),
        comment: formData.get('comment')
    };

    // get selected shares
    const shares = getSelectedShares(SALE_TYPE);
    const cert_type = formData.get('cert_type');

    let buyer_status = 'new';
    if (holder !== '') {
        buyer_status = 'exists';
    }

    // form dialog message
    let msg = `Die folgenden <b>${shares.length}</b> Aktien werden`;


    if (cert_type == 'reservation') {
        msg += ` für den Aktionär <b>${buyer.name}</b> reserviert.<br>`
        msg += `Dabei werden Zertifikate mit dem Vermerk 'reserviert' erstellt aber noch nicht gedruckt.<br>`
    } else {
        msg += ` dem Aktionär <b>${buyer.name}</b> verkauft:<br>`
    }
    
    if (cert_type == 'paper') {
        msg += `Die Zertifikate werden ausgestellt und gedruckt.`
    } 
    else if (cert_type == 'electronic') {
        msg += `Die Zertifikate werden mit dem Vermerk 'elektronisch' ausgestellt aber nicht gedruckt.`
    }        
    
    msg += `<ul style="list-style-type:disc"><b>`;
    shares.forEach(share_no => {
        msg += `<li>${helpers.pad0(share_no, 3)}</li>`;
    })
    msg += '</b></ul>';

    if (buyer_status === 'new') {
        msg += '<p>Für den Aktionär werden neue Stammdaten erstellt.</p>';
    }

    // initialize and show dialog
    let dialogEl = document.querySelector('#confirmation-modal-sale')
    dialogEl.querySelector('div > div.modal-content > p').innerHTML = msg
    M.Modal.getInstance(dialogEl).open()
}



 /**
  * event handler for the Transfer Submit button.
  * displays a confirmation dialog
  * @param e
  */
 function submitIssueReserved(e) {
    e.preventDefault();

    // get form data
    const formData = new FormData(document.querySelector('form[name=sale]'));

    const holder = formData.get('holder');
    const buyer = {
        a_code: formData.get('a_code'),
        salutation: formData.get('salutation'),
        family: formData.get('family'),
        first_name: formData.get('first_name'),
        name: formData.get('name'),
        address: formData.get('address'),
        post_code: formData.get('post_code'),
        city: formData.get('city'),
        comment: formData.get('comment')
    };

    // get selected shares
    const shares = getSelectedShares(SALE_TYPE);
    const cert_type = formData.get('cert_type');

    let buyer_status = 'new';
    if (holder !== '') {
        buyer_status = 'exists';
    }

    // form dialog message
    let msg = `Die folgenden <b>${shares.length}</b> reservierten Aktien werden`;
    msg +=  ` nun definitiv auf den Aktionär <b>${buyer.name}</b> ausgestellt:<br>`

    if (cert_type == 'paper') {
        msg += `Die Zertifikate werden ausgestellt und gedruckt.`
    } 
    else if (cert_type == 'electronic') {
        msg += `Die Zertifikate werden mit dem Vermerk 'elektronisch' ausgestellt aber nicht gedruckt.`
    }         
    
    msg += `<ul style="list-style-type:disc"><b>`;
    shares.forEach(share_no => {
        msg += `<li>${helpers.pad0(share_no, 3)}</li>`;
    })
    msg += '</b></ul>';

    if (buyer_status === 'new') {
        msg += '<p>Für den Aktionär werden neue Stammdaten erstellt.</p>';
    }

    // initialize and show dialog
    const dialogEl = document.querySelector('#confirmation-modal-reserved')
    dialogEl.querySelector('div > div.modal-content > p').innerHTML = msg
    M.Modal.getInstance(dialogEl).open()
}


  /**
   * event handler for the modal dialog ok button click.
   * passes the data back to main for being processed
   * @param e
   */
function doSale(e) {

      // get form data
      const formData = new FormData(document.querySelector('form[name=sale]'));
      const sale = {};

      const holder = formData.get('holder');
      sale.buyer = {
          a_code :     formData.get('a_code'),
          salutation : formData.get('salutation'),
          family     : formData.get('family'),
          first_name : formData.get('first_name'),
          name :       formData.get('name'),
          address :    formData.get('address'),
          post_code :  formData.get('post_code'),
          city :       formData.get('city')
      };
      sale.transaction = {
          comment :    formData.get('comment'),
          booking_date : formData.get('transaction'),
          cert_type : formData.get('cert_type'),
          transaction_type : formData.get('transaction-type'),
          shares : getSelectedShares(SALE_TYPE)
      };

      // extract a_code
      let reg = /.+ \((.+)\)$/;
      let matches = reg.exec(holder);
      if(matches) {
          sale.buyer.a_code = matches[1];
      } else {
          sale.buyer.a_code = null;
      }


      ipcRenderer.send('sale:execute', sale);
}


  /**
   * event handler for the modal dialog ok button click.
   * passes the data back to main for being processed
   * @param e
   */
  function doIssueReserved(e) {

    // get form data
    const formData = new FormData(document.querySelector('form[name=sale]'));
    const sale = {};

    const holder = formData.get('holder');
    sale.buyer = {
        a_code :     formData.get('a_code'),
        salutation : formData.get('salutation'),
        family     : formData.get('family'),
        first_name : formData.get('first_name'),
        name :       formData.get('name'),
        address :    formData.get('address'),
        post_code :  formData.get('post_code'),
        city :       formData.get('city')
    };
    sale.transaction = {
        comment :    formData.get('comment'),
        booking_date : formData.get('transaction'),
        cert_type : formData.get('cert_type'),
        transaction_type : formData.get('transaction-type'),
        shares : getSelectedShares(SALE_TYPE)
    };

    // extract a_code
    let reg = /.+ \((.+)\)$/;
    let matches = reg.exec(holder);
    if(matches) {
        sale.buyer.a_code = matches[1];
    } else {
        sale.buyer.a_code = null;
    }

    document.querySelector('#sale-reserved-submit').classList.add('hidden')
    ipcRenderer.send('issuereserved:execute', sale)
}

/**
 * event handler for the sale:show IPC event.
 * initialized the Sale form
 * @param {Event} e
 * @param {Object} data
 */
function showSale(e, data) {

    console.log(data)

    // show target element
    showElement('content-sale');

    initSaleSummary(data);
    initSaleForm();

    allShares = data.shares;
    rssmShareIndex = indexShareList(data.rssm_shares);

    // prepare the a_codes suggestion list
    const a_codes = {};
    Object.keys(data.a_codes).forEach(a_code => {
        let suggest = data.a_codes[a_code].name;
        suggest += ' ';
        suggest += data.a_codes[a_code].first_name;
        suggest += ' (' + a_code + ')';

        a_codes[suggest] = null;
    });


    // initialize the a_code autocomplete field with suggestion list event handler
    const selectField = document.querySelectorAll('#sale-a-code-select');
    M.Autocomplete.init(selectField, {
        data: a_codes,
        limit: 20, // The max amount of results that can be shown at once. Default: Infinity.
        onAutocomplete: function (val) {

            // extract a_code part from selection
            const regex = /.+ \((.+)\)$/g;
            const matches = regex.exec(val);
            const a_code = matches[1];

            // get share holder with a_code
            const holder = data.a_codes[a_code];
            const reserved = []
            for (i in holder.shares) {
                if(data.shares[holder.shares[i]]['status'] == 'reserved') {
                    reserved.push(data.shares[holder.shares[i]])
                }
            }

            // save data global
            holder_orig = Object.assign({}, holder);

            // load person data to form
            initSaleForm(holder);


            if(reserved.length) {
                showShares(reserved, SALE_TYPE)
                document.querySelector('#sale-reserved-submit').classList.remove('hidden');
                document.querySelector('#sale-submit').classList.add('disabled');
                ipcRenderer.send('dialog:show', {
                    type: "info",
                    message: "Diese Person hat reservierte Aktien.",
                    title: "Reservierte Aktien",
                    detail: 'Sie können die Zertifikate jetzt ausstellen. Dadurch werden die Zertifikate in elektronische oder ausgedruckte Aktienzertifikate umgewandelt.'
                });

            } else {
                document.querySelector('#sale-submit').classList.remove('disabled');
            }

        }
    });

}


/**
 * initialize the Purchase summary table
 */
function initSaleSummary(data) {
    // initialize the summary table
    document.querySelector('#sale-date').innerHTML = helpers.dateToString();
    document.querySelector('#sale-journal').innerHTML = data.nextJournal;
    document.querySelector('#sale-shares').innerHTML = '0';
}


/**
 * initializes the purchase form with blank or share holder info
 * @param {Object} holder
 */
function initSaleForm(holder = {}) {
    if (!holder.a_code) {
        document.querySelector('#sale-a-code-select').value = '';
    }

    document.querySelector('#sale-salutation-input').value = holder.salutation || '';
    document.querySelector('#sale-family-input').value = holder.family || '';
    document.querySelector('#sale-first-name-input').value = holder.first_name || '';
    document.querySelector('#sale-name-input').value = holder.name || '';
    document.querySelector('#sale-address-input').value = holder.address || '';
    document.querySelector('#sale-post-code-input').value = holder.post_code || '';
    document.querySelector('#sale-city-input').value = holder.city || '';
    document.querySelector('#sale-comment-input').value = holder.comment || '';
    document.querySelector('#sale-n-shares').value = '';
    document.querySelector('#sale-transaction').value = '';
    document.querySelector('#sale-cert-type').value = 'paper';
    document.querySelector('#sale-list').innerHTML = '';

    document.querySelector('#sale-submit').classList.add('disabled');

    M.updateTextFields();
    M.FormSelect.init(document.querySelector('#sale-cert-type'));
}


module.exports = {
    showSale
};
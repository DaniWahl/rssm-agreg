// setup repurchase ui specific event handlers
document.querySelector('#sale-submit').addEventListener('click', submitSale);
document.querySelector('#confirmation-sale-ok').addEventListener('click', doSale);
document.querySelector('#sale-n-shares').addEventListener('input', updateShareList);

//let rssmSharesNo;
let rssmShareIndex;
let allShares;

function updateShareList(e) {
    const value = parseInt(e.target.value);

    if (isNaN(value)) {
        return;
    }

    // pull list of available shares
    const list = getShareList(value);

    // create share table rows
    const shares = [];
    for (let i=0; i<list.length; i++) {
        shares.push(allShares[list[i]]);
    }

    // create table rows
    listSaleShares(shares);

}


/**
 * pupulate shares table with proposed shares
 * @param {Array} shares
 */
function listSaleShares(shares) {
    const tbody = document.querySelector('#table-sale-share-list > tbody');

    tbody.innerHTML = '';
    shares.forEach(share => {
        tbody.appendChild(makeTableItem(share, 'share_list'));
    })

    document.querySelectorAll('#table-sale-share-list > tbody > tr > td > input').forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedShares);
    })
}


/**
 * event handler of the checkbox change event.
 * count number of selected shares and update summary table and repurchase button status
 * @param {Event} e
 */
function updateSelectedShares(e) {

    const formData = new FormData(document.querySelector('form[name=sale]'));
    const share_no = formData.getAll('share_item').length;

    document.querySelector('#sale-shares').innerHTML = share_no;

    // handle button status
    if(share_no !== 0) {
        document.querySelector('#sale-submit').classList.remove('disabled');
    } else {
        document.querySelector('#sale-submit').classList.add('disabled');
    }


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
     const shares = formData.getAll('share_item');

     const buyer = {};
     const holder = formData.get('holder');
     buyer.a_code = formData.get('a_code');
     buyer.salutation = formData.get('salutation');
     buyer.first_name = formData.get('first_name');
     buyer.name = formData.get('name');
     buyer.address = formData.get('address');
     buyer.post_code = formData.get('post_code');
     buyer.city = formData.get('city');
     buyer.comment = formData.get('comment');


     let buyer_status = 'new';
     if(holder !== '') {
         buyer_status = 'exists';
     }

     // form dialog message
     let msg = `Die folgenden <b>${shares.length}</b> Aktien werden dem Aktionär <b>${buyer.name}</b> verkauft:<br> `;
     msg +=  `<ul style="list-style-type:disc"><b>`;
     shares.forEach(share_no => {
         msg += `<li>${helpers.pad0(share_no, 3)}</li>`;
     })
     msg += '</b></ul>';

     if(buyer_status === 'new') {
         msg += '<p>Für den Aktionär werden neue Stammdaten erstellt.</p>';
     }


     // initialize and show dialog
     const dialog = document.querySelector('#confirmation-modal-sale');
     dialog.querySelector('div > div.modal-content > p').innerHTML = msg;
     $('#confirmation-modal-sale').modal();
     $('#confirmation-modal-sale').modal('open');
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

      sale.shares = formData.getAll('share_item');
      sale.buyer = {};
      sale.buyer.salutation = formData.get('salutation');
      sale.buyer.first_name = formData.get('first_name');
      sale.buyer.name = formData.get('name');
      sale.buyer.address = formData.get('address');
      sale.buyer.post_code = formData.get('post_code');
      sale.buyer.city = formData.get('city');
      sale.buyer.comment = formData.get('comment');

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
 * event handler for the sale:show IPC event.
 * initialized the Sale form
 * @param {Event} e
 * @param {Object} data
 */
function showSale(e, data) {

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
    $('#sale-a-code-select').autocomplete({
        data: a_codes,
        limit: 20, // The max amount of results that can be shown at once. Default: Infinity.
        onAutocomplete: function (val) {

            // extract a_code part from selection
            const regex = /.+ \((.+)\)$/g;
            const matches = regex.exec(val);
            const a_code = matches[1];

            // get share holder with a_code
            const holder = data.a_codes[a_code];

            // save data global
            holder_orig = Object.assign({}, holder);

            // load person data to form
            initSaleForm(holder);

            document.querySelector('#sale-submit').classList.remove('disabled');

        },
        minLength: 1 // The minimum length of the input for the autocomplete to start. Default: 1.
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

    document.querySelector('#table-sale-share-list > tbody').innerHTML = '';

    if (!holder.a_code) {
        document.querySelector('#sale-a-code-select').value = '';
    }

    document.querySelector('#sale-salutation-input').value = holder.salutation || '';
    document.querySelector('#sale-first-name-input').value = holder.first_name || '';
    document.querySelector('#sale-name-input').value = holder.name || '';
    document.querySelector('#sale-address-input').value = holder.address || '';
    document.querySelector('#sale-post-code-input').value = holder.post_code || '';
    document.querySelector('#sale-city-input').value = holder.city || '';
    document.querySelector('#sale-comment-input').value = holder.comment || '';

    Materialize.updateTextFields();

}


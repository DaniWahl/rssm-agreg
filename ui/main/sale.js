// setup repurchase ui specific event handlers
document.querySelector('#sale-submit').addEventListener('click', submitSale);
document.querySelector('#confirmation-sale-ok').addEventListener('click', doSale);
document.querySelector('#sale-n-shares').addEventListener('input', updateShareList);

//let rssmSharesNo;
let rssmShareIndex;

function updateShareList(e) {
    const value = parseInt(e.target.value);

    if(isNaN(value)) {
        return;
    }

    const list = getShareList(value);
    console.log(list);


}

function getShareList(n) {
    let list=[];

    // check if we have a group in the index
    if(typeof rssmShareIndex[n] !== 'undefined') {
        // lucky! return the first
        return rssmShareIndex[n][0];
    }


    //2DO: need to resolve when there no group of n available


    return list;

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


    for (let i=0; i<rssmSharesNo.length; i++) {

        // is share no in sequence group?
        if(rssmSharesNo[i] !== next) {

            // make sure we have a index array of that size
            if(typeof index[group.length] === 'undefined') {
                index[group.length] = [];
            }

            // add group to index and start a new group
            index[group.length].push(group);
            group = [];

        }

        // add to group and adjust next
        group.push(rssmSharesNo[i]);
        next = rssmSharesNo[i] +1;
    }

    return index;
}


// /**
//  * event handler for the Transfer Submit button.
//  * displays a confirmation dialog
//  * @param e
//  */
 function submitSale(e) {
//     e.preventDefault();
//
//     // get form data
//     const formData = new FormData(document.querySelector('form[name=mutation]'));
//     const mutated = {};
//     const holder = formData.get('holder');
//     mutated.a_code = formData.get('a_code');
//     mutated.salutation = formData.get('salutation');
//     mutated.first_name = formData.get('first_name');
//     mutated.name = formData.get('name');
//     mutated.address = formData.get('address');
//     mutated.post_code = formData.get('post_code');
//     mutated.city = formData.get('city');
//     mutated.comment = formData.get('comment');
//
//
//     // form dialog message
//     let msg = `Vom Aktionär <b>${holder}</b> werden die folgenden Informationen mutiert:<br> `;
//
//     let field_counter = 0;
//     for (let field of ['a_code', 'salutation', 'first_name', 'name', 'address', 'post_code', 'city']) {
//
//         if (mutated[field] !== holder_orig[field]) {
//             msg += `${holder_orig[field]} &rarr; ${mutated[field]} <br>`;
//             field_counter++;
//         }
//
//     }
//
//     if(mutated.comment) {
//         msg += `Kommentar:  ${mutated.comment} <br>`;
//     }
//
//     if (field_counter > 0) {
//         msg += '<b><ul>';
//     } else {
//         alert('Keine Änderungen an Personendaten.');
//         return;
//     }
//
//
//     // initialize and show dialog
//     const dialog = document.querySelector('#confirmation-modal');
//     dialog.querySelector('div > div.modal-content > h4').innerHTML = 'Mutation';
//     dialog.querySelector('div > div.modal-content > p').innerHTML = msg;
//
//     $('#confirmation-modal').modal();
//     $('#confirmation-modal').modal('open');
 }
//
//  /**
//   * event handler for the modal dialog ok button click.
//   * passes the data back to main for being processed
//   * @param e
//   */
  function doSale(e) {
//
//      // get form data
//      const formData = new FormData(document.querySelector('form[name=mutation]'));
//      const mutated = {};
//      mutated.a_code = formData.get('a_code');
//      mutated.salutation = formData.get('salutation');
//      mutated.first_name = formData.get('first_name');
//      mutated.name = formData.get('name');
//      mutated.address = formData.get('address');
//      mutated.post_code = formData.get('post_code');
//      mutated.city = formData.get('city');
//      mutated.comment = formData.get('comment');
//
//      ipcRenderer.send('mutation:execute', mutated);
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

     rssmShareIndex = indexShareList(data.rssm_shares);
     console.log(rssmShareIndex);

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
     document.querySelector('#sale-first-name-input').value = holder.first_name || '';
     document.querySelector('#sale-name-input').value = holder.name || '';
     document.querySelector('#sale-address-input').value = holder.address || '';
     document.querySelector('#sale-post-code-input').value = holder.post_code || '';
     document.querySelector('#sale-city-input').value = holder.city || '';
     document.querySelector('#sale-comment-input').value = holder.comment || '';

     Materialize.updateTextFields();

 }



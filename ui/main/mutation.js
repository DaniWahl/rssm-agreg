// // setup repurchase ui specific event handlers
// document.querySelector('#transfer-submit').addEventListener('click', submitTransfer);
// document.querySelector('#confirmation-modal-ok').addEventListener('click', doTransfer);
//
//
// /**
//  * event handler for the Transfer Submit button.
//  * displays a confirmation dialog
//  * @param e
//  */
// function submitTransfer(e) {
//     e.preventDefault();
//
//     // get form data
//     const formData = new FormData(document.querySelector('form[name=transfer]'));
//     const shares = formData.getAll('share_item');
//     const holder = formData.get('source');
//     const reciever = formData.get('reciever');
//     const comment = formData.get('comment');
//
//     // form dialog message
//     let msg = `Vom Aktionär <b>${holder}</b> werden die folgenden <b>${shares.length}</b> Aktien an den <br>Aktionär
//            <b>${reciever}</b> übertragen. <br>
//            Begründung: ${comment}<br>
//           <ul style="list-style-type:disc"><b>`;
//     shares.forEach(share_no => {
//         msg += `<li>${helpers.pad0(share_no, 3)}</li>`;
//     })
//     msg += '<b><ul>';
//
//     // initialize and show dialog
//     const dialog = document.querySelector('#confirmation-modal');
//     dialog.querySelector('div > div.modal-content > h4').innerHTML = 'Übertrag';
//     dialog.querySelector('div > div.modal-content > p').innerHTML = msg;
//
//     $('#confirmation-modal').modal();
//     $('#confirmation-modal').modal('open');
// }
//
// /**
//  * event handler for the modal dialog ok button click.
//  * passes the data back to main for being processed
//  * @param e
//  */
// function doTransfer(e) {
//
//     const transfer = {};
//     // get form data
//     const formData = new FormData(document.querySelector('form[name=transfer]'));
//     transfer.shares = formData.getAll('share_item');
//     transfer.holder = formData.get('source');
//     transfer.reciever = formData.get('reciever');
//     transfer.comment = formData.get('comment');
//
//     // extract a_codes
//     let reg = /.+ \((.+)\)$/;
//     let matches = reg.exec(transfer.holder);
//     transfer.holder = matches[1];
//     matches = reg.exec(transfer.reciever);
//     transfer.reciever = matches[1];
//
//     ipcRenderer.send('transfer:execute', transfer);
//
// }
//
//
 /**
  * event handler for the mutation:show IPC event.
  * initialized the Mutation form
  * @param {Event} e
  * @param {Object} data
  */
 function showMutation(e, data) {

     // show target element
     showElement('content-mutation');

     initMutationSummary(data);
     initMutationForm();

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
     $('#mutation-a-code-select').autocomplete({
         data: a_codes,
         limit: 20, // The max amount of results that can be shown at once. Default: Infinity.
         onAutocomplete: function (val) {

             // extract a_code part from selection
             const regex = /.+ \((.+)\)$/g;
             const matches = regex.exec(val);
             const a_code = matches[1];

             // get share holder with a_code
             const holder = data.a_codes[a_code];

             //2DO: load person data to form
             initMutationForm(holder);

         },
         minLength: 1 // The minimum length of the input for the autocomplete to start. Default: 1.
     })

 }

 /**
  * initialize the Transfer summary table
  */
 function initMutationSummary(data) {
     // initialize the summary table
     document.querySelector('#mutation-date').innerHTML = helpers.dateToString();
     document.querySelector('#mutation-journal').innerHTML = data.nextJournal;
 }

 function initMutationForm(holder = {}) {


     if(!holder.a_code) {
         document.querySelector('#mutation-a-code-select').value = '';
     }

     document.querySelector('#mutation-a-code-input').value = holder.a_code || '';
     document.querySelector('#mutation-salutation-input').value = holder.salutation || '';
     document.querySelector('#mutation-first-name-input').value = holder.first_name || '';
     document.querySelector('#mutation-name-input').value = holder.name || '';
     document.querySelector('#mutation-address-input').value = holder.address || '';
     document.querySelector('#mutation-post-code-input').value = holder.post_code || '';
     document.querySelector('#mutation-city-input').value = holder.city || '';
     document.querySelector('#mutation-comment-input').value = holder.comment ||'';

     Materialize.updateTextFields();

 }



// setup repurchase ui specific event handlers
document.querySelector('#mutation-submit').addEventListener('click', submitTransfer);
document.querySelector('#confirmation-modal-ok').addEventListener('click', doMutation);

let holder_orig;

/**
 * event handler for the Transfer Submit button.
 * displays a confirmation dialog
 * @param e
 */
function submitTransfer(e) {
    e.preventDefault();

    // get form data
    const formData = new FormData(document.querySelector('form[name=mutation]'));
    const mutated = {};
    const holder = formData.get('holder');
    mutated.a_code = formData.get('a_code');
    mutated.salutation = formData.get('salutation');
    mutated.first_name = formData.get('first_name');
    mutated.name = formData.get('name');
    mutated.address = formData.get('address');
    mutated.post_code = formData.get('post_code');
    mutated.city = formData.get('city');
    mutated.comment = formData.get('comment');


    // form dialog message
    let msg = `Vom Aktionär <b>${holder}</b> werden die folgenden Informationen mutiert:<br> `;

    let field_counter = 0;
    for (let field of ['a_code', 'salutation', 'first_name', 'name', 'address', 'post_code', 'city']) {

        if (mutated[field] !== holder_orig[field]) {
            msg += `${holder_orig[field]} &rarr; ${mutated[field]} <br>`;
            field_counter++;
        }

    }

    if(mutated.comment) {
        msg += `Kommentar:  ${mutated.comment} <br>`;
    }

    if (field_counter > 0) {
        msg += '<b><ul>';
    } else {
        alert('Keine Änderungen an Personendaten.');
        return;
    }


    // initialize and show dialog
    const dialog = document.querySelector('#confirmation-modal');
    dialog.querySelector('div > div.modal-content > h4').innerHTML = 'Mutation';
    dialog.querySelector('div > div.modal-content > p').innerHTML = msg;

    $('#confirmation-modal').modal();
    $('#confirmation-modal').modal('open');
}

 /**
  * event handler for the modal dialog ok button click.
  * passes the data back to main for being processed
  * @param e
  */
 function doMutation(e) {

     // get form data
     const formData = new FormData(document.querySelector('form[name=mutation]'));
     const mutated = {};
     mutated.a_code = formData.get('a_code');
     mutated.salutation = formData.get('salutation');
     mutated.first_name = formData.get('first_name');
     mutated.name = formData.get('name');
     mutated.address = formData.get('address');
     mutated.post_code = formData.get('post_code');
     mutated.city = formData.get('city');
     mutated.comment = formData.get('comment');

     ipcRenderer.send('mutation:execute', mutated);
}

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
    });


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

            // save data global
            holder_orig = Object.assign({}, holder);

            // load person data to form
            initMutationForm(holder);

            document.querySelector('#mutation-submit').classList.remove('disabled');

        },
        minLength: 1 // The minimum length of the input for the autocomplete to start. Default: 1.
    });

}

/**
 * initialize the Transfer summary table
 */
function initMutationSummary(data) {
    // initialize the summary table
    document.querySelector('#mutation-date').innerHTML = helpers.dateToString();
    document.querySelector('#mutation-journal').innerHTML = data.nextJournal;
}


/**
 * initializes the mutation form with blank or share holder info
 * @param {Object} holder
 */
function initMutationForm(holder = {}) {


    if (!holder.a_code) {
        document.querySelector('#mutation-a-code-select').value = '';
    }

    document.querySelector('#mutation-a-code-input').value = holder.a_code || '';
    document.querySelector('#mutation-salutation-input').value = holder.salutation || '';
    document.querySelector('#mutation-first-name-input').value = holder.first_name || '';
    document.querySelector('#mutation-name-input').value = holder.name || '';
    document.querySelector('#mutation-address-input').value = holder.address || '';
    document.querySelector('#mutation-post-code-input').value = holder.post_code || '';
    document.querySelector('#mutation-city-input').value = holder.city || '';
    document.querySelector('#mutation-comment-input').value = holder.comment || '';

    Materialize.updateTextFields();

}



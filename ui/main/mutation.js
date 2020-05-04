// setup repurchase ui specific event handlers
document.querySelector('#mutation-submit').addEventListener('click', submitMutation);
document.querySelector('#confirmation-mutation-ok').addEventListener('click', doMutation);

let holder_orig;

/**
 * event handler for the Mutation Submit button.
 * displays a confirmation dialog
 * @param e
 */
function submitMutation(e) {
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
    mutated.family = formData.get('family');
    mutated.correspondence = $('form[name=mutation] input[name=correspondence]')[0].checked ? 1: 0;


    // form dialog message
    let msg = `Vom Aktionär <b>${holder}</b> werden die folgenden Informationen mutiert:<br> `;

    let field_counter = 0;
    for (let field of ['a_code', 'salutation', 'first_name', 'name', 'address', 'post_code', 'city', 'family']) {

        if (mutated[field] !== holder_orig[field]) {
            msg += `${holder_orig[field]} <i class="fas fa-caret-right"></i> ${mutated[field]} <br>`;
            field_counter++;
        }
    }

    if (mutated.correspondence !== holder_orig.correspondence) {
        let action = 'deaktiviert';
        if(mutated.correspondence ) {
            action = 'aktiviert';
        }

        msg += `Korrespondenz wurde ${action} <br>`;
        field_counter++;
    }

    if(mutated['comment'] !== holder_orig['comment']) {
        msg += `Kommentar:  ${mutated.comment} <br>`;
        field_counter++;
    }

    if (field_counter > 0) {
        msg += '<b><ul>';
    } else {
        alert('Keine Änderungen an Personendaten.');
        return;
    }


    // initialize and show dialog
    const dialog = document.querySelector('#confirmation-modal-mutation');
    dialog.querySelector('div > div.modal-content > p').innerHTML = msg;
    $('#confirmation-modal-mutation').modal();
    $('#confirmation-modal-mutation').modal('open');
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
     mutated.family = formData.get('family');
     mutated.correspondence = $('form[name=mutation] input[name=correspondence]')[0].checked ? 1: 0;

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
    const selectField = document.querySelectorAll('#mutation-a-code-select');
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

            // save data global
            holder_orig = Object.assign({}, holder);

            // load person data to form
            initMutationForm(holder);

            document.querySelector('#mutation-submit').classList.remove('disabled');

        }
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
    document.querySelector('#mutation-family-input').value = holder.family || '';
    document.querySelector('#mutation-correspondence-input').checked = holder.correspondence || 0;


    M.updateTextFields();

}


module.exports = {
    showMutation
};
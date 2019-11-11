

// setup repurchase ui specific event handlers
document.querySelector('#enter-person-submit').addEventListener('click', submitEnterPerson);
document.querySelector('#confirmation-enter-person-ok').addEventListener('click', doEnterPerson);


/**
 * event handler for the Transfer Submit button.
 * displays a confirmation dialog
 * @param e
 */
function submitEnterPerson(e) {
    e.preventDefault();

    // get form data
    const formData = new FormData(document.querySelector('form[name=enterPerson]'));

    const person = {
        salutation : formData.get('salutation'),
        family     : formData.get('family'),
        first_name : formData.get('first_name'),
        name :       formData.get('name'),
        address :    formData.get('address'),
        post_code :  formData.get('post_code'),
        city :       formData.get('city'),
        comment :    formData.get('comment')
    };

    // form dialog message
    let msg = "Für die Person werden neue Stammdaten erstellt:<br>";
    msg += `<b>Anrede:</b> ${person.salutation}<br>`;
    msg += `<b>Vorname:</b> ${person.first_name}<br>`;
    msg += `<b>Name:</b> ${person.name}<br>`;
    msg += `<b>Adresse:</b> ${person.address}<br>`;
    msg += `<b>PLZ:</b> ${person.post_code}<br>`;
    msg += `<b>Ort:</b> ${person.city}<br>`;
    msg += `<b>Kommentar:</b> ${person.comment}<br>`;


    // initialize and show dialog
    const dialog = document.querySelector('#confirmation-modal-enter-person');
    dialog.querySelector('div > div.modal-content > p').innerHTML = msg;
    $('#confirmation-modal-enter-person').modal();
    $('#confirmation-modal-enter-person').modal('open');
}


/**
 * event handler for the modal dialog ok button click.
 * passes the data back to main for being processed
 * @param e
 */
function doEnterPerson(e) {

    // get form data
    const formData = new FormData(document.querySelector('form[name=enterPerson]'));
    const person = {
        comment :    formData.get('comment'),
        salutation : formData.get('salutation'),
        family     : formData.get('family'),
        first_name : formData.get('first_name'),
        name :       formData.get('name'),
        address :    formData.get('address'),
        post_code :  formData.get('post_code'),
        city :       formData.get('city')
    };
    ipcRenderer.send('enterperson:execute', person);
}

/**
 * event handler for the enterperson:show IPC event.
 * initialized the enterPerson form
 * @param {Event} e
 * @param {Object} data
 */
function showEnterPerson(e, data) {

    // show target element
    showElement('content-enter-person');
    initEnterPersonForm();
}



/**
 * initializes the form with blank info
 */
function initEnterPersonForm() {

    document.querySelector('#enter-person-salutation-input').value = '';
    document.querySelector('#enter-person-family-input').value = '';
    document.querySelector('#enter-person-first-name-input').value = '';
    document.querySelector('#enter-person-name-input').value = '';
    document.querySelector('#enter-person-address-input').value = '';
    document.querySelector('#enter-person-post-code-input').value = '';
    document.querySelector('#enter-person-city-input').value = '';
    document.querySelector('#enter-person-comment-input').value = '';

    Materialize.updateTextFields();
}


module.exports = {
    showEnterPerson
};
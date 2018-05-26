const { dialog } = require('electron').remote;


// setup action button event handlers
document.querySelector('#admin-db-select').addEventListener('click', selectDb);



function showAdminDB(e, data) {

    // show target element
    showElement('admin-db');
    console.log(data);

    initDbAdminForm(data);
};


function selectDb() {

    const paths = dialog.showOpenDialog({
        title : "Datenbank auswählen",
        message : "Datenbank Datei auswählen",
        filters : [
            {name : "SQLite Datenbank", extensions: ['db']}
            ],
        properties : ['openFile']
    });

    ipcRenderer.send('dbpath:set', paths[0]);
}


/**
 * initialize the Admin form
 */
function initDbAdminForm(data) {
    // initialize the summary table


    $('#admin-info-version').text(data.version);
    $('#admin-info-db-creation').text(data.db_creation_date);
    $('#admin-info-db-load').text(data.db_load_date);


    if(data.dbpath) {
        $('#admin-info-dbpath').text(data.dbpath);
    }

    if(data.db_backup_path) {
        $('#admin-info-backup').text(data.db_backup_path);
    }
    if(data.error) {
        $('#admin-info-error').text(data.error);
        $('#admin-info-error-row').removeClass('hidden');

        if(data.error.match(/Failed to open database/)) {
            $('#admin-info-dbpath-row').addClass('danger');
            $('#admin-info-dbpath-row > td > button').addClass('pulse');
            $('#admin-info-dbpath-row > td > button').removeClass('blue');
            $('#admin-info-dbpath-row > td > button').addClass('red');




        }

    }

}

module.exports = {
    showAdminDB
};
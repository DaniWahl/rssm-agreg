

function showAdminDB(e, data) {

    // show target element
    showElement('admin-db');
    console.log(data);

    initDbAdminForm(data);
}


/**
 * initialize the Admin form
 */
function initDbAdminForm(data) {
    // initialize the summary table


    $('#admin-info-version').text(data.version);
    $('#admin-info-db-creation').text(data.db_creation_date);
    $('#admin-info-db-load').text(data.db_load_date);


    if(data.db_path) {
        $('#admin-info-dbpath').text(data.db_path);
    }

    if(data.db_backup_path) {
        $('#admin-info-backup').text(data.db_backup_path);
    }





}
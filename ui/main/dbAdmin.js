
// setup action button event handlers
document.querySelector('#admin-db-select-btn').addEventListener('click', selectDb);
document.querySelector('#admin-db-backup-btn').addEventListener('click', backupDb);
document.querySelector('#admin-db-export-btn').addEventListener('click', exportDb);


function showAdminDB(e, data) {
    // show target element
    showElement('admin-db');
    initDbAdminForm(data);
};


function backupDb() {
    ipcRenderer.send('dbbackup:create');
}

function exportDb() {
    ipcRenderer.send('dbexport:create');
}

function selectDb() {
    ipcRenderer.send('dbpath:set');
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
        $('#admin-info-backup-dir').text(data.db_backup_path);
    }

    if(data.db_backup_list) {
        let ul = '';


        for(let i=0; i<data.db_backup_list.length; i++) {
            const file = data.db_backup_list[i];
            if(file) {
                ul += '<li>';
                if (i===0) {
                    ul += '<b>';
                }
                ul += file;
                if (i===0) {
                    ul += '</b>';
                }
                ul += '</li>';
            }
        }



        $('#admin-info-backup').html(`<ul>${ul}</ul>`);


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
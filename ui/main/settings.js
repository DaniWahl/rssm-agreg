
//document.querySelector('#settings-submit').addEventListener('click', saveSettings);
let originalSettings;

function showSettings(e, data) {
    showElement('settings');

    
    const tabsEl = document.querySelectorAll('#settings-tabs');
    M.Tabs.init(tabsEl, {onShow: onTabSelect});

    originalSettings = data;
    setValues(data);
}



function onTabSelect(el) {
    console.log('onTabSelect()')
}

function saveSettings() {
    const settings = getValues();

    if(settings.A_CODE_SEQ == originalSettings.A_CODE_SEQ) {
        delete settings.A_CODE_SEQ;
    } else {
        originalSettings.A_CODE_SEQ = settings.A_CODE_SEQ;
    }

    if(settings.AG_SECRETARY == originalSettings.AG_SECRETARY) {
        delete settings.AG_SECRETARY;
    } else {
        originalSettings.AG_SECRETARY = settings.AG_SECRETARY;
    }

    if(settings.AG_REGISTER == originalSettings.AG_REGISTER) {
        delete settings.AG_REGISTER;
    } else {
        originalSettings.AG_REGISTER = settings.AG_REGISTER;
    }

    if(settings.AG_REGISTER_INITIALS == originalSettings.AG_REGISTER_INITIALS) {
        delete settings.AG_REGISTER_INITIALS;
    } else {
        originalSettings.AG_REGISTER_INITIALS = settings.AG_REGISTER_INITIALS;
    }

    if(settings.AG_REGISTER_CITY == originalSettings.AG_REGISTER_CITY) {
        delete settings.AG_REGISTER_CITY;
    } else {
        originalSettings.AG_REGISTER_CITY = settings.AG_REGISTER_CITY;
    }

    if(settings.EXPORT_PATH == originalSettings.EXPORT_PATH) {
        delete settings.EXPORT_PATH;
    } else {
        originalSettings.EXPORT_PATH = settings.EXPORT_PATH;
    }

    // is there something to save?
    if(Object.keys(settings).length) {
        ipcRenderer.send('settings:update', settings);
    }

}



function setValues(data) {

    $('#admin-info-version').text(data.version);
    $('#admin-info-db-creation').text(data.db_creation_date);
    $('#admin-info-db-load').text(data.db_load_date);

    $('#setting-edit-A_CODE_SEQ').val(data.A_CODE_SEQ);
    $('#setting-edit-AG_SECRETARY').val(data.AG_SECRETARY);
    $('#setting-edit-AG_REGISTER').val(data.AG_REGISTER);
    $('#setting-edit-AG_REGISTER_INITIALS').val(data.AG_REGISTER_INITIALS);
    $('#setting-edit-AG_REGISTER_CITY').val(data.AG_REGISTER_CITY);
    $('#setting-edit-EXPORT_PATH').val(data.EXPORT_PATH);


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

}

function getValues() {

    const data = {};

    data.A_CODE_SEQ = parseInt($('#setting-edit-A_CODE_SEQ').val());
    data.AG_SECRETARY = $('#setting-edit-AG_SECRETARY').val();
    data.AG_REGISTER = $('#setting-edit-AG_REGISTER').val();
    data.AG_REGISTER_INITIALS = $('#setting-edit-AG_REGISTER_INITIALS').val();
    data.AG_REGISTER_CITY = $('#setting-edit-AG_REGISTER_CITY').val();
    data.EXPORT_PATH = $('#setting-edit-EXPORT_PATH').val();

    return data;
}


module.exports = {
    showSettings
};
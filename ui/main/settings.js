

document.querySelector('#settings-submit').addEventListener('click', saveSettings);
document.querySelector('#admin-db-select-btn').addEventListener('click', selectDb);
document.querySelector('#admin-backup-select-btn').addEventListener('click', selectBackup);
document.querySelector('#admin-document-select-btn').addEventListener('click', selectDocuments);
document.querySelector('#admin-export-select-btn').addEventListener('click', selectExport);
document.querySelector('#admin-db-backup-btn').addEventListener('click', backupDb);
document.querySelector('#admin-db-export-btn').addEventListener('click', exportDb);

let originalSettings;

function backupDb() {
    ipcRenderer.send('dbbackup:create');
}

function exportDb() {
    ipcRenderer.send('dbexport:create');
}

function selectDb() {
    ipcRenderer.send('dbpath:set');
}

function selectBackup() {
    ipcRenderer.send('backuppath:set');
}

function selectDocuments() {
    ipcRenderer.send('documentpath:set');
}

function selectExport() {
    ipcRenderer.send('exportpath:set');
}


function showSettings(e, data) {
    showElement('settings');
    
    const tabsEl = document.querySelectorAll('#settings-tabs');
    M.Tabs.init(tabsEl, {onShow: onTabSelect});

    originalSettings = data;
    setValues(data);
}



function onTabSelect(el) {
    //console.log('onTabSelect()')
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
    issues = []

    if(data.A_CODE_SEQ) {
        document.querySelector('#setting-edit-A_CODE_SEQ').value = data.A_CODE_SEQ
    } else {
        issues.push("Bitte Nummer für A-Code Sequenz definieren.")
    }

    if(data.AG_SECRETARY) {
        document.querySelector('#setting-edit-AG_SECRETARY').value = data.AG_SECRETARY
    } else {
        issues.push("Bitte Person für Sekretariat definieren.")
    }

    if(data.AG_REGISTER) {
        document.querySelector('#setting-edit-AG_REGISTER').value = data.AG_REGISTER
    } else {
        issues.push("Bitte Person für Aktienregisterführer definieren.")
    }

    if(data.AG_REGISTER_INITIALS) {
        document.querySelector('#setting-edit-AG_REGISTER_INITIALS').value = data.AG_REGISTER_INITIALS
    } else {
        issues.push("Bitte Kürzel für Aktienregisterführer definieren.")
    }

    if(data.AG_REGISTER_CITY) {
        document.querySelector('#setting-edit-AG_REGISTER_CITY').value = data.AG_REGISTER_CITY
    } else {
        issues.push("Bitte Ort für Aktienregisterführer definieren.")
    }

        
    document.querySelector('#admin-info-version').textContent = data.version
    document.querySelector('#admin-info-configfile').textContent = data.user_config_file
    document.querySelector('#admin-info-configset').textContent = data.user_config_set
    
    
    if(data.dbpath) {
        document.querySelector('#admin-info-dbpath').textContent = data.dbpath
    } else {
        issues = []
        issues.push("Bitte Datenbank Datei auswählen.")
        document.querySelector("#admin-db-backup-btn").classList.add('disabled')
        document.querySelector("#admin-db-export-btn").classList.add('disabled')
        
    }

    if(data.backuppath) {
        document.querySelector('#admin-info-dbbackuppath').textContent = data.backuppath
    } else {
        issues.push("Bitte Ordner für Datenbank Backups auswählen.")
        document.querySelector("#admin-db-backup-btn").classList.add('disabled')
    }

    if(data.exportpath) {
        document.querySelector('#admin-info-exportspath').textContent = data.exportpath
    } else {
        issues.push("Bitte Ordner für Datenbank Exporte auswählen.")
        document.querySelector("#admin-db-export-btn").classList.add('disabled')
    }

    if(data.documentpath) {
        document.querySelector('#admin-info-documentspath').textContent = data.documentpath
    } else {
        issues.push("Bitte Ordner für Dokumente auswählen.")
    }

    if(data.db_backup_list) {
        let ul = '';
        for(let i=0; i<data.db_backup_list.length; i++) {
            const file = data.db_backup_list[i];
            if(file) {
                if(i===0) {
                    ul += `<li><b>${file}</b></li>`
                } else {
                    ul += `<li>${file}</li>`
                }
            }
        }
        document.querySelector('#admin-info-backup-list').innerHTML = `<ul>${ul}</ul>`
    }

    showIssues(issues)
}


function showIssues(issues) {
    let issueHtml = ''

    if(issues.length) {
        document.querySelector("#admin-info-error").classList.remove('hidden')

        issues.forEach(issue => {
            issueHtml += `<li><i class="fas fa-exclamation-triangle"></i> ${issue}</li>`
        });
        issueHtml = `<ul>${issueHtml}</ul>`
        document.querySelector("#admin-info-error").innerHTML = issueHtml
    } else {
        document.querySelector("#admin-info-error").innerHTML = ''
        document.querySelector("#admin-info-error").classList.add('hidden')
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
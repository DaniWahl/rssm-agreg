document.querySelector("#settings-submit").addEventListener("click", saveSettings)
document.querySelector("#admin-db-select-btn").addEventListener("click", selectDb)
document.querySelector("#admin-backup-select-btn").addEventListener("click", selectBackup)
document.querySelector("#admin-document-select-btn").addEventListener("click", selectDocuments)
document.querySelector("#admin-export-select-btn").addEventListener("click", selectExport)
document.querySelector("#admin-db-backup-btn").addEventListener("click", backupDb)
document.querySelector("#admin-db-export-btn").addEventListener("click", exportDb)

let originalSettings

function backupDb() {
    ipcRenderer.send("dbbackup:create")
}

function exportDb() {
    ipcRenderer.send("dbexport:create")
}

function selectDb() {
    ipcRenderer.send("dbpath:set")
}

function selectBackup() {
    ipcRenderer.send("backuppath:set")
}

function selectDocuments() {
    ipcRenderer.send("documentpath:set")
}

function selectExport() {
    ipcRenderer.send("exportpath:set")
}

function showSettings(e, data) {
    showElement("settings")

    const tabsEl = document.querySelectorAll("#settings-tabs")
    M.Tabs.init(tabsEl, { onShow: onTabSelect })

    originalSettings = data
    setValues(data)
}

function onTabSelect(el) {
    //console.log('onTabSelect()')
}

function saveSettings() {
    const settings = getValues()

    if (settings.A_CODE_SEQ == originalSettings.A_CODE_SEQ) {
        delete settings.A_CODE_SEQ
    } else {
        originalSettings.A_CODE_SEQ = settings.A_CODE_SEQ
    }

    if (settings.AG_SIGNTATURE2 == originalSettings.AG_SIGNTATURE2) {
        delete settings.AG_SIGNTATURE2
    } else {
        originalSettings.AG_SIGNTATURE2 = settings.AG_SIGNTATURE2
    }

    if (settings.AG_REGISTER == originalSettings.AG_REGISTER) {
        delete settings.AG_REGISTER
    } else {
        originalSettings.AG_REGISTER = settings.AG_REGISTER
    }

    if (settings.AG_REGISTER_ADDRESS == originalSettings.AG_REGISTER_ADDRESS) {
        delete settings.AG_REGISTER_ADDRESS
    } else {
        originalSettings.AG_REGISTER_ADDRESS = settings.AG_REGISTER_ADDRESS
    }

    if (settings.AG_REGISTER_POSTCODE == originalSettings.AG_REGISTER_POSTCODE) {
        delete settings.AG_REGISTER_POSTCODE
    } else {
        originalSettings.AG_REGISTER_POSTCODE = settings.AG_REGISTER_POSTCODE
    }

    if (settings.AG_REGISTER_CITY == originalSettings.AG_REGISTER_CITY) {
        delete settings.AG_REGISTER_CITY
    } else {
        originalSettings.AG_REGISTER_CITY = settings.AG_REGISTER_CITY
    }

    if (settings.EXPORT_PATH == originalSettings.EXPORT_PATH) {
        delete settings.EXPORT_PATH
    } else {
        originalSettings.EXPORT_PATH = settings.EXPORT_PATH
    }

    // is there something to save?
    if (Object.keys(settings).length) {
        ipcRenderer.send("settings:update", settings)
    }
}

function setValues(data) {
    issues = []

    if (data.A_CODE_SEQ) {
        document.querySelector("#setting-edit-A_CODE_SEQ").value = data.A_CODE_SEQ
    } else {
        issues.push("Bitte Nummer für A-Code Sequenz definieren.")
    }

    if (data.AG_SIGNATURE2) {
        document.querySelector("#setting-edit-AG_SIGNATURE2").value = data.AG_SIGNATURE2
    } else {
        issues.push("Bitte VR Mitglied für 2. Unterschrift definieren.")
    }

    if (data.AG_REGISTER) {
        document.querySelector("#setting-edit-AG_REGISTER").value = data.AG_REGISTER
    } else {
        issues.push("Bitte Vorname & Name für Aktienregisterführer definieren.")
    }

    if (data.AG_REGISTER_ADDRESS) {
        document.querySelector("#setting-edit-AG_REGISTER_ADDRESS").value = data.AG_REGISTER_ADDRESS
    } else {
        issues.push("Bitte Adresse für Aktienregisterführer definieren.")
    }

    if (data.AG_REGISTER_POSTCODE) {
        document.querySelector("#setting-edit-AG_REGISTER_POSTCODE").value = data.AG_REGISTER_POSTCODE
    } else {
        issues.push("Bitte Postleitzahl für Aktienregisterführer definieren.")
    }

    if (data.AG_REGISTER_CITY) {
        document.querySelector("#setting-edit-AG_REGISTER_CITY").value = data.AG_REGISTER_CITY
    } else {
        issues.push("Bitte Ort für Aktienregisterführer definieren.")
    }

    document.querySelector("#admin-info-appversion").textContent = data.app_version
    document.querySelector("#admin-info-dbversion").textContent = data.db_version

    document.querySelector("#admin-info-configfile").textContent = data.user_config_file
    document.querySelector("#admin-info-configset").textContent = data.user_config_set

    if (data.dbpath) {
        document.querySelector("#admin-info-dbpath").textContent = data.dbpath
    } else {
        issues = []
        issues.push("Bitte Datenbank Datei auswählen.")
        document.querySelector("#admin-db-backup-btn").classList.add("disabled")
        document.querySelector("#admin-db-export-btn").classList.add("disabled")
    }

    if (data.backuppath) {
        document.querySelector("#admin-info-dbbackuppath").textContent = data.backuppath
    } else {
        issues.push("Bitte Ordner für Datenbank Backups auswählen.")
        document.querySelector("#admin-db-backup-btn").classList.add("disabled")
    }

    if (data.exportpath) {
        document.querySelector("#admin-info-exportspath").textContent = data.exportpath
    } else {
        issues.push("Bitte Ordner für Datenbank Exporte auswählen.")
        document.querySelector("#admin-db-export-btn").classList.add("disabled")
    }

    if (data.documentpath) {
        document.querySelector("#admin-info-documentspath").textContent = data.documentpath
    } else {
        issues.push("Bitte Ordner für Dokumente auswählen.")
    }

    if (data.db_backup_list) {
        let ul = ""
        for (let i = 0; i < data.db_backup_list.length; i++) {
            const file = data.db_backup_list[i]
            if (file) {
                ul += `<li>${file}</li>`
            }
        }
        document.querySelector("#admin-info-backup-list").innerHTML = `<ul>${ul}</ul>`
    }

    if (data.db_export_list) {
        let ul = ""
        for (let i = 0; i < data.db_export_list.length; i++) {
            const file = data.db_export_list[i]
            if (file) {
                ul += `<li>${file}</li>`
            }
        }
        document.querySelector("#admin-info-export-list").innerHTML = `<ul>${ul}</ul>`
    }

    showIssues(issues)
}

function showIssues(issues) {
    let issueHtml = ""

    if (issues.length) {
        document.querySelector("#admin-info-error").classList.remove("hidden")

        issues.forEach((issue) => {
            issueHtml += `<li><i class="fas fa-exclamation-triangle"></i> ${issue}</li>`
        })
        issueHtml = `<ul>${issueHtml}</ul>`
        document.querySelector("#admin-info-error").innerHTML = issueHtml
    } else {
        document.querySelector("#admin-info-error").innerHTML = ""
        document.querySelector("#admin-info-error").classList.add("hidden")
    }
}

function getValues() {
    const data = {}

    data.A_CODE_SEQ = parseInt($("#setting-edit-A_CODE_SEQ").val())
    data.AG_SIGNATURE2 = $("#setting-edit-AG_SIGNATURE2").val()
    data.AG_REGISTER = $("#setting-edit-AG_REGISTER").val()
    data.AG_REGISTER_ADDRESS = $("#setting-edit-AG_REGISTER_ADDRESS").val()
    data.AG_REGISTER_POSTCODE = $("#setting-edit-AG_REGISTER_POSTCODE").val()
    data.AG_REGISTER_CITY = $("#setting-edit-AG_REGISTER_CITY").val()
    data.EXPORT_PATH = $("#setting-edit-EXPORT_PATH").val()

    return data
}

function appendBackup(e, backup) {
    M.toast({
        html: "Datenbank Backup wurde erstellt: " + backup,
        displayLength: 5000,
        classes: `rounded green lighten-1 z-depth-4`,
    })
    // new backup to backup file list
    const backupListEl = document.getElementById("admin-info-backup-list").firstChild
    const newLiEl = document.createElement("li")
    newLiEl.innerHTML = backup
    newLiEl.classList.add("new")
    backupListEl.insertBefore(newLiEl, backupListEl.firstChild)
}

module.exports = {
    showSettings,
    appendBackup,
}

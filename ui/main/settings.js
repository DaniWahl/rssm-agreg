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
    M.Tabs.init(tabsEl, { onShow: () => {} })

    // prepare the a_codes suggestion list
    const a_codes_persons = {}
    data.persons.forEach((person) => {
        const suggest = `${person.name} ${person.first_name}  (${person.a_code})`
        a_codes_persons[suggest] = null

        // reformat
        if (person.a_code === data.AG_REGISTER_PERSON_1) {
            data.AG_REGISTER_PERSON_1 = suggest
        }
        if (person.a_code === data.AG_REGISTER_PERSON_2) {
            data.AG_REGISTER_PERSON_2 = suggest
        }
    })

    originalSettings = data
    setValues(data)

    // initialize the a_code autocomplete field with suggestion list event handler
    const selectField1 = document.querySelectorAll("#setting-edit-AG_REGISTER_PERSON_1")
    M.Autocomplete.init(selectField1, {
        data: a_codes_persons,
        limit: 20, // The max amount of results that can be shown at once. Default: Infinity.
        onAutocomplete: function (val) {
            saveSettings()
        },
    })

    // initialize the a_code autocomplete field with suggestion list event handler
    const selectField2 = document.querySelectorAll("#setting-edit-AG_REGISTER_PERSON_2")
    M.Autocomplete.init(selectField2, {
        data: a_codes_persons,
        limit: 20, // The max amount of results that can be shown at once. Default: Infinity.
        onAutocomplete: function (val) {
            saveSettings()
        },
    })
}

function saveSettings() {
    const values = getValues()
    const settings = {}

    if (values.AG_REGISTER_PERSON_1 && values.AG_REGISTER_PERSON_1 != originalSettings.AG_REGISTER_PERSON_1) {
        // parse a-code
        const regex1 = /.+ \((.+)\)$/g
        const matches1 = regex1.exec(values.AG_REGISTER_PERSON_1)
        settings["AG_REGISTER_PERSON_1"] = matches1[1]
        originalSettings.AG_REGISTER_PERSON_1 = values.AG_REGISTER_PERSON_1
    }

    if (values.AG_REGISTER_PERSON_2 && values.AG_REGISTER_PERSON_2 != originalSettings.AG_REGISTER_PERSON_2) {
        // parse a-code
        const regex2 = /.+ \((.+)\)$/g
        const matches2 = regex2.exec(values.AG_REGISTER_PERSON_2)
        settings["AG_REGISTER_PERSON_2"] = matches2[1]
        originalSettings.AG_REGISTER_PERSON_2 = values.AG_REGISTER_PERSON_2
    }

    // is there something to save?
    if (Object.keys(settings).length) {
        ipcRenderer.send("settings:update", settings)
    }
}

function setValues(data) {
    issues = []

    if (data.AG_REGISTER_PERSON_1) {
        document.querySelector("#setting-edit-AG_REGISTER_PERSON_1").value = data.AG_REGISTER_PERSON_1
    } else {
        issues.push("Bitte Aktienregisterführer für 1. Unterschrift definieren.")
    }

    if (data.AG_REGISTER_PERSON_2) {
        document.querySelector("#setting-edit-AG_REGISTER_PERSON_2").value = data.AG_REGISTER_PERSON_2
    } else {
        issues.push("Bitte Aktienregisterführer für 2. Unterschrift definieren.")
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
    data.AG_REGISTER_PERSON_1 = $("#setting-edit-AG_REGISTER_PERSON_1").val()
    data.AG_REGISTER_PERSON_2 = $("#setting-edit-AG_REGISTER_PERSON_2").val()
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

function appendExport(e, exportFile) {
    M.toast({
        html: "Datenbank wurde exportiert: " + exportFile,
        displayLength: 5000,
        classes: `rounded green lighten-1 z-depth-4`,
    })
    // new export to export file list
    const exportListEl = document.getElementById("admin-info-export-list").firstChild
    const newLiEl = document.createElement("li")
    newLiEl.innerHTML = exportFile
    newLiEl.classList.add("new")
    exportListEl.insertBefore(newLiEl, exportListEl.firstChild)
}

function updateBackupPath(e, backupPath) {
    M.toast({
        html: "Neuer Backup Ordner ausgewählt: " + backupPath,
        displayLength: 5000,
        classes: `rounded green lighten-1 z-depth-4`,
    })
    // update backup path to UI
    const backupPathEl = document.getElementById("admin-info-dbbackuppath")
    backupPathEl.innerHTML = backupPath
    backupPathEl.classList.add("new")
}

function updateExportPath(e, exportPath) {
    M.toast({
        html: "Neuer Export Ordner ausgewählt: " + exportPath,
        displayLength: 5000,
        classes: `rounded green lighten-1 z-depth-4`,
    })
    // update export path to UI
    const exportPathEl = document.getElementById("admin-info-exportspath")
    exportPathEl.innerHTML = exportPath
    exportPathEl.classList.add("new")
}

function updateDocumentPath(e, documentPath) {
    M.toast({
        html: "Neuer Dokumente Ordner ausgewählt: " + documentPath,
        displayLength: 5000,
        classes: `rounded green lighten-1 z-depth-4`,
    })
    // update export path to UI
    const documentPathEl = document.getElementById("admin-info-documentspath")
    documentPathEl.innerHTML = documentPath
    documentPathEl.classList.add("new")
}

module.exports = {
    showSettings,
    appendBackup,
    appendExport,
    updateBackupPath,
    updateExportPath,
    updateDocumentPath,
}

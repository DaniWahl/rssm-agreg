const electron = require("electron")
const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = electron
const fs = require("fs")
const RSSMShares = require("./lib/RSSMShares").RSSMShares
const RSSMDocs = require("./lib/RSSMDocs")
const helpers = require("./lib/app.helpers")

const VERSION = "1.8.1"
const CONFIGNAME = "config.json"
const assetPath = __dirname + "/assets"

let rssm = null
let mainWindow = null
app.allowRendererProcessReuse = true

// handle application events
app.on("ready", app_init)
ipcMain.on("content:show", loadContentData)
ipcMain.on("repurchase:execute", executeRepurchase)
ipcMain.on("transfer:execute", executeTransfer)
ipcMain.on("mutation:execute", executeMutation)
ipcMain.on("sale:execute", executeSale)
ipcMain.on("issuereserved:execute", executeIssueReserved)
ipcMain.on("enterperson:execute", executeEnterPerson)
ipcMain.on("report:execute", executeReport)
ipcMain.on("report:export", exportReport)
ipcMain.on("dbpath:set", setDbPath)
ipcMain.on("backuppath:set", setBackupPath)
ipcMain.on("documentpath:set", setDocumentPath)
ipcMain.on("exportpath:set", setExportPath)
ipcMain.on("dbbackup:create", createDbBackup)
ipcMain.on("dbexport:create", createDbExport)
ipcMain.on("settings:update", saveSettings)
ipcMain.on("personinfo:load", loadPersonInfo)
ipcMain.on("journalinfo:load", loadJournalInfo)
ipcMain.on("journalcomment:set", setJournalComment)
ipcMain.on("personcomment:set", setPersonComment)
ipcMain.on("dialog:show", showDialog)
process.on("uncaughtException", errorHandler)

/**
 * application startup handler
 */
async function app_init() {
    const PATHSEP = getPathSeparator()
    const configSet = process.env.ELECTRON_DEV ? "dev" : "default"
    const configFile = app.getPath("userData") + PATHSEP + CONFIGNAME

    // initialize main RSSMShares object
    rssm = new RSSMShares(configFile, configSet)
    await rssm.init()

    // create UI window
    if (mainWindow === null) {
        mainWindow = new BrowserWindow({
            width: 1600,
            height: 1000,
            show: false,
            backgroundColor: "#ffffff",

            webPreferences: {
                nodeIntegration: true,
            },
        })
    }
    mainWindow.loadURL(`file://${__dirname}/ui/main/mainWindow.html`)

    mainWindow.webContents.on("dom-ready", () => {
        mainWindow.webContents.send("version:show", VERSION)

        let loadPanel = "dashboard"

        if (rssm.config.get("dbpath") === null) {
            loadPanel = "settings"
        }
        if (rssm.config.get("backuppath") === null) {
            loadPanel = "settings"
        }
        if (rssm.config.get("exportpath") === null) {
            loadPanel = "settings"
        }
        if (rssm.config.get("documentpath") === null) {
            loadPanel = "settings"
        }

        // load default panel
        loadContentData(null, loadPanel)
    })
    mainWindow.on("ready-to-show", () => {
        console.log("mainWindow ready-to-show")
        mainWindow.show()
    })
    mainWindow.once("closed", app_quit)

    // build application menu
    const mainMenu = Menu.buildFromTemplate(getMainMenuTemplate())
    Menu.setApplicationMenu(mainMenu)
}

async function loadPersonInfo(e, data) {
    const person_info = await rssm.getPersonDetail(data["person_id"])
    mainWindow.webContents.send("personsinfo:show", person_info)
}

async function loadJournalInfo(e, data) {
    const journal_info = await rssm.getJournalDetail(data["journal_id"])
    mainWindow.webContents.send("journalinfo:show", journal_info)
}

async function saveSettings(e, data) {
    if (data.A_CODE_SEQ) {
        rssm.setConfig("A_CODE_SEQ", data.A_CODE_SEQ)
        mainWindow.webContents.send("toast:show", "A-Code Sequenz gespeichert : " + data.A_CODE_SEQ)
    }

    if (data.AG_SIGNATURE2) {
        rssm.setConfig("AG_SIGNATURE2", data.AG_SIGNATURE2)
        mainWindow.webContents.send("toast:show", "AG VR 2. Unterschrift gespeichert : " + data.AG_SIGNATURE2)
    }

    if (data.AG_REGISTER) {
        await rssm.setConfig("AG_REGISTER", data.AG_REGISTER)
        mainWindow.webContents.send("toast:show", "AG Aktienregisterführer gespeichert : " + data.AG_REGISTER)
    }

    if (data.AG_REGISTER_ADDRESS) {
        rssm.setConfig("AG_REGISTER_ADDRESS", data.AG_REGISTER_ADDRESS)
        mainWindow.webContents.send(
            "toast:show",
            "AG Aktienregisterführer, Adresse gespeichert : " + data.AG_REGISTER_ADDRESS
        )
    }

    if (data.AG_REGISTER_POSTCODE) {
        rssm.setConfig("AG_REGISTER_POSTCODE", data.AG_REGISTER_POSTCODE)
        mainWindow.webContents.send(
            "toast:show",
            "AG Aktienregisterführer, PLZ gespeichert : " + data.AG_REGISTER_POSTCODE
        )
    }

    if (data.AG_REGISTER_CITY) {
        rssm.setConfig("AG_REGISTER_CITY", data.AG_REGISTER_CITY)
        mainWindow.webContents.send("toast:show", "AG Aktienregisterführer, Ort gespeichert : " + data.AG_REGISTER_CITY)
    }

    if (data.EXPORT_PATH) {
        rssm.setConfig("EXPORT_PATH", data.EXPORT_PATH)
        mainWindow.webContents.send("toast:show", "Export Pfad für Dokumente gespeichert : " + data.EXPORT_PATH)
    }
}

async function createDbBackup() {
    const backup = await rssm.backupDatabase(true)
    mainWindow.webContents.send("toast:show", "Datenbank Backup erstellt: " + backup)
    restartApp(2000)
}

async function createDbExport(e) {
    const exportFile = await rssm.exportToExcel(true)
    mainWindow.webContents.send("toast:show", "Datenbank exportiert: " + exportFile)
    restartApp(2000)
}

function restartApp(time = 1000) {
    mainWindow.webContents.send("toast:show", "Applikation wird neu initalisiert ...", "orange")

    setTimeout(function () {
        rssm = null
        app.relaunch()
        app.exit()
    }, time)
}

/**
 *
 */
async function selectDirectory(title) {
    // prompt for backup directory
    const paths = dialog.showOpenDialogSync(mainWindow, {
        title: `${title} Ordner`,
        message: `${title} Ordner auswählen`,
        properties: ["openDirectory"],
    })

    if (paths) {
        return paths[0]
    }
}

/**
 * prompts user to select database file saves selected file to settings
 * @param e
 */
function setDbPath(e) {
    // prompt for new database file
    const paths = dialog.showOpenDialogSync(mainWindow, {
        title: "Datenbank auswählen",
        message: "Datenbank Datei auswählen",
        filters: [{ name: "SQLite Datenbank", extensions: ["db"] }],
        properties: ["openFile"],
    })

    if (!paths) {
        mainWindow.webContents.send("toast:show", "Keine Datenbank ausgewählt!", "red")
        return
    }

    // updating new path to app config
    rssm.config.save("dbpath", paths[0])
    mainWindow.webContents.send("toast:show", "Neue Datenbank ausgewählt: " + paths[0])

    // initialize application
    restartApp(2000)
}

/**
 * prompts user to select backup directory, saves selected directory to config
 * @param e
 */
async function setBackupPath(e) {
    // prompt for new database file
    const path = await selectDirectory("Backup")

    if (!path) {
        mainWindow.webContents.send("toast:show", "Kein Ordner ausgewählt!", "red")
        return
    }

    // updating new path to app config
    rssm.config.save("backuppath", path)
    mainWindow.webContents.send("toast:show", "Neuer Backup Ordner ausgewählt: " + path)

    // initialize application
    restartApp(2000)
}

/**
 * prompts user to select document directory, saves selected directory to config
 * @param e
 */
async function setDocumentPath(e) {
    // prompt for new database file
    const path = await selectDirectory("Dokumente")

    if (!path) {
        mainWindow.webContents.send("toast:show", "Kein Ordner ausgewählt!", "red")
        return
    }

    // updating new path to app config
    rssm.config.save("documentpath", path)
    mainWindow.webContents.send("toast:show", "Neuer Dokumente Ordner ausgewählt: " + path)

    // initialize application
    restartApp(2000)
}

/**
 * prompts user to select export directory, saves selected directory to config
 * @param e
 */
async function setExportPath(e) {
    // prompt for new database file
    const path = await selectDirectory("Exporte")

    if (!path) {
        mainWindow.webContents.send("toast:show", "Kein Ordner ausgewählt!", "red")
        return
    }

    // updating new path to app config
    rssm.config.save("exportpath", path)
    mainWindow.webContents.send("toast:show", "Neuer Export Ordner ausgewählt: " + path)

    // initialize application
    restartApp(2000)
}

/**
 * initiates the repurchase process and displays success or error on UI
 * @param e
 * @param data
 */
async function executeRepurchase(e, data) {
    // convert booking date to correctly formatted db date string
    let booking_date
    if (data.booking_date) {
        booking_date = helpers.dateToDbString(helpers.dmyToDate(data.booking_date))
    } else {
        booking_date = helpers.dateToDbString()
    }

    rssm.repurchase(data.shares, data.a_code, booking_date)
        .then(async function (info) {
            mainWindow.webContents.send("journal:show", rssm.data.journal)
            mainWindow.webContents.send("toast:show", "Rückkauf erfolgreich durchgeführt")

            // generate journal document
            const journal_path = await RSSMDocs.makeJournalRepurchase(info, rssm)
            rssm.registerDocument({
                journal_id: info.journal_id,
                path: journal_path,
            })

            // open document
            shell.openExternal("file://" + journal_path)
        })
        .catch((err) => {
            console.error(err)

            dialog.showMessageBox(mainWindow, {
                type: "error",
                title: "Rückkauf",
                message: "Rückkauf fehler!",
                detail: err.message,
            })
        })
}

/**
 * initiates the repurchase process and displays success or error on UI
 * @param e
 * @param data
 */
async function executeTransfer(e, data) {
    rssm.transfer(data.shares, data.holder, data.reciever, data.comment)
        .then(async function (info) {
            mainWindow.webContents.send("journal:show", rssm.data.journal)
            mainWindow.webContents.send("toast:show", "Übertrag erfolgreich durchgeführt")

            // generate journal document
            const journal_path = await RSSMDocs.makeJournalTransfer(info, rssm)
            rssm.registerDocument({
                journal_id: info.journal_id,
                path: journal_path,
            })

            // open document
            shell.openExternal("file://" + journal_path)
        })
        .catch((err) => {
            console.error(err)

            dialog.showMessageBox(mainWindow, {
                type: "error",
                title: "Übertrag",
                message: "Übertrag fehler!",
                detail: err.message,
            })
        })
}

/**
 * initiates the process to issue reserved shares and displays success or error on UI
 * @param e
 * @param data
 */
async function executeIssueReserved(e, data) {
    const repurchase_info_path = assetPath + "/repurchase_info2013.pdf"

    // convert booking date to correctly formatted db date string
    if (data.transaction.booking_date) {
        data.transaction.booking_date = helpers.dateToDbString(helpers.dmyToDate(data.transaction.booking_date))
    } else {
        data.transaction.booking_date = helpers.dateToDbString()
    }

    info = await rssm.saleReserved(data.transaction, data.buyer)
    mainWindow.webContents.send("journal:show", rssm.data.journal)
    mainWindow.webContents.send("toast:show", "Ausstellung reservierter Zertifikate erfolgreich durchgeführt")

    // generate documents
    switch (data.transaction.cert_type) {
        case "paper":
            const cert_path = await RSSMDocs.makeCertificates(info, rssm)
            rssm.registerDocument({
                journal_id: info.journal_id,
                path: cert_path,
            })
            const letter1_path = await RSSMDocs.makeSharesLetter(info, rssm)
            rssm.registerDocument({
                journal_id: info.journal_id,
                path: letter1_path,
            })
            shell.openExternal("file://" + letter1_path)
            shell.openExternal("file://" + cert_path)
            shell.openExternal("file://" + repurchase_info_path)
            break

        case "electronic":
            const letter2_path = await RSSMDocs.makeSharesLetterElectronic(info, rssm)
            rssm.registerDocument({
                journal_id: info.journal_id,
                path: letter2_path,
            })
            shell.openExternal("file://" + letter2_path)
            shell.openExternal("file://" + repurchase_info_path)
            break
    }

    if (info.transfer != null) {
        const transfer_journal_path = await RSSMDocs.makeJournalTransfer(info.transfer, rssm)
        rssm.registerDocument({
            journal_id: info.transfer.journal_id,
            path: transfer_journal_path,
        })
        shell.openExternal("file://" + transfer_journal_path)
    }

    const journal_path = await RSSMDocs.makeJournalIssueReserved(info, rssm)
    rssm.registerDocument({
        journal_id: info.journal_id,
        path: journal_path,
    })
    shell.openExternal("file://" + journal_path)
}

/**
 * initiates the sale process and displays success or error on UI
 * @param e
 * @param data
 */
async function executeSale(e, data) {
    // convert booking date to correctly formatted db date string
    if (data.transaction.booking_date) {
        data.transaction.booking_date = helpers.dateToDbString(helpers.dmyToDate(data.transaction.booking_date))
    } else {
        data.transaction.booking_date = helpers.dateToDbString()
    }

    rssm.sale(data.transaction, data.buyer)
        .then(async function (info) {
            const repurchase_info_path = assetPath + "/repurchase_info2013.pdf"

            mainWindow.webContents.send("journal:show", rssm.data.journal)
            mainWindow.webContents.send("toast:show", "Verkauf erfolgreich durchgeführt")

            // generate documents
            switch (data.transaction.cert_type) {
                case "reservation":
                    const naming_form_path = await RSSMDocs.makeNamingForm(info, rssm)
                    rssm.registerDocument({
                        journal_id: info.journal_id,
                        path: naming_form_path,
                    })
                    shell.openExternal("file://" + naming_form_path)
                    break

                case "paper":
                    const cert_path = await RSSMDocs.makeCertificates(info, rssm)
                    rssm.registerDocument({
                        journal_id: info.journal_id,
                        path: cert_path,
                    })

                    const letter1_path = await RSSMDocs.makeSharesLetter(info, rssm)
                    rssm.registerDocument({
                        journal_id: info.journal_id,
                        path: letter1_path,
                    })

                    shell.openExternal("file://" + cert_path)
                    shell.openExternal("file://" + letter1_path)
                    shell.openExternal("file://" + repurchase_info_path)
                    break

                case "electronic":
                    const letter2_path = await RSSMDocs.makeSharesLetterElectronic(info, rssm)
                    rssm.registerDocument({
                        journal_id: info.journal_id,
                        path: letter2_path,
                    })
                    shell.openExternal("file://" + letter2_path)
                    shell.openExternal("file://" + repurchase_info_path)
                    break

                default:
                    console.error("invalid transaction type ", data.transaction.cert_type)
            }

            const journal_path = await RSSMDocs.makeJournalSale(info, rssm)
            rssm.registerDocument({
                journal_id: info.journal_id,
                path: journal_path,
            })
            shell.openExternal("file://" + journal_path)
        })
        .catch((err) => {
            console.error(err)

            dialog.showMessageBox(mainWindow, {
                type: "error",
                title: "Verkauf",
                message: "Verkauf fehler!",
                detail: err.message,
            })
        })
}

/**
 * initiates the enter person process and displays success or error on UI
 * @param e
 * @param data
 */
async function executeEnterPerson(e, person) {
    rssm.enterPerson(person).then(async function (info) {
        mainWindow.webContents.send("toast:show", "Personendaten erfolgreich erfasst")
    })
}

/**
 * initiates the mutation process and displays success or error on UI
 * @param e
 * @param data
 */
async function executeMutation(e, person) {
    rssm.mutation(person)
        .then(async function (info) {
            mainWindow.webContents.send("journal:show", rssm.data.journal)
            mainWindow.webContents.send("toast:show", "Mutation erfolgreich durchgeführt")

            // generate documents
            const journal_path = await RSSMDocs.makeJournalMutation(info, rssm)
            rssm.registerDocument({
                journal_id: info.journal_id,
                path: journal_path,
            })

            // open document
            shell.openExternal("file://" + journal_path)
        })
        .catch((err) => {
            console.error(err)

            dialog.showMessageBox(mainWindow, {
                type: "error",
                title: "Mutation",
                message: "Mutation fehler!",
                detail: err.message,
            })
        })
}

async function setJournalComment(e, data) {
    await rssm.logComment(data.remark, { journal: data.journal_id })
    mainWindow.webContents.send("toast:show", "Kommentar gespeichert")
}

async function setPersonComment(e, data) {
    await rssm.logComment(data.remark, { person: data.person_id })
    mainWindow.webContents.send("toast:show", "Kommentar gespeichert")
}

/**
 * collect data for annual report and send to report ui
 * @param {Event} e
 * @param {Object} range  constains report start and end date
 */
async function executeReport(e, range) {
    const today = new Date()
    const todayStr = helpers.dateToDbString(today)
    const startDateStr = helpers.dateToDbString(range.startDate)
    const endDateStr = helpers.dateToDbString(range.endDate)
    const endDate = Date.parse(endDateStr)

    const kapital = await rssm.getShareKapital(endDateStr) // total number of shares and kapital values
    const rssmShares = await rssm.getRSSMShares() // get all RSSM shares as of today
    let rssmStock = rssmShares.length // todays stock of RSSM shares
    const transactionsAll = await rssm.getTransactionList(startDateStr, todayStr) // get all transactions between today and beginning of report
    const transactions = []
    let sharesBought = 0
    let sharesSold = 0

    // evaluate transactions
    for (i = transactionsAll.length - 1; i >= 0; i--) {
        const t = transactionsAll[i]
        const transactionDate = Date.parse(t["transaction_date"])

        if (transactionDate > endDate) {
            // transaction is after report range, correct rssmStock towards report endDate
            rssmStock = rssmStock + t["stock_change"]
        } else {
            // transaction is in report range, add to list if there is stock change
            if (t["stock_change"] != 0) {
                transactions.unshift(t)
                if (t["stock_change"] < 0) {
                    sharesSold = sharesSold + Math.abs(t["stock_change"])
                } else {
                    sharesBought = sharesBought + t["stock_change"]
                }
            }
        }
    }

    // Send data to report ui
    mainWindow.webContents.send("report:data:show", {
        today: helpers.dateToString(),
        startDate: helpers.dateToString(range.startDate),
        endDate: helpers.dateToString(range.endDate),
        transactions: transactions,
        stock: rssmStock,
        shares_total: kapital[0].shares_total,
        shares_kapital: kapital[0].shares_kapital,
        shares_bought: sharesBought,
        shares_sold: sharesSold,
    })
}

/**
 * renerate and open report document
 * @param {Event} e
 * @param {Object} reportData
 */
async function exportReport(e, reportData) {
    const report_path = await RSSMDocs.makeAnnualReport(reportData, rssm)
    shell.openExternal("file://" + report_path)
}

/**
 * handler for the main window content:show event.
 * send appropriate data to element
 * @param {Event} e
 * @param {String} element_id
 */
async function loadContentData(e, element_id) {
    switch (element_id) {
        case "dashboard":
            mainWindow.webContents.send("dashboard:show", {
                shares: rssm.data.shares,
                series: rssm.data.series,
                journal: rssm.data.journal,
                persons: rssm.data.persons,
                rssm: await rssm.getConfig("RSSM_A_CODE"),
            })
            break

        case "content-register":
            mainWindow.webContents.send("shareregister:show", rssm.data.history)
            break

        case "content-persons":
            mainWindow.webContents.send("persons:show", rssm.data.persons)
            break

        case "content-journal":
            mainWindow.webContents.send("journal:show", rssm.data.journal)
            break

        case "content-report":
            mainWindow.webContents.send("report:show", [])
            break

        case "content-enter-person":
            mainWindow.webContents.send("enterperson:show", [])
            break

        case "content-sale":
            mainWindow.webContents.send("sale:show", {
                nextJournal: rssm.getNextJounalNo(),
                a_codes: rssm.data.a_codes,
                shares: rssm.data.shares,
                rssm_shares: rssm.data.rssmShares,
            })
            break

        case "content-repurchase":
            mainWindow.webContents.send("repurchase:show", {
                nextJournal: rssm.getNextJounalNo(),
                a_codes: rssm.data.a_codes,
                shares: rssm.data.shares,
            })
            break

        case "content-transfer":
            mainWindow.webContents.send("transfer:show", {
                nextJournal: rssm.getNextJounalNo(),
                a_codes: rssm.data.a_codes,
                shares: rssm.data.shares,
                persons: rssm.data.persons,
            })
            break

        case "content-mutation":
            mainWindow.webContents.send("mutation:show", {
                nextJournal: rssm.getNextJounalNo(),
                a_codes: rssm.data.a_codes,
            })
            break

        case "settings":
            mainWindow.webContents.send("admin:settings:show", {
                app_version: VERSION,
                user_config_file: rssm.config.file,
                user_config_set: rssm.config.set,
                dbpath: rssm.config.get("dbpath"),
                backuppath: rssm.config.get("backuppath"),
                exportpath: rssm.config.get("exportpath"),
                documentpath: rssm.config.get("documentpath"),
                db_backup_list: rssm.config.get("backups"),
                db_export_list: rssm.config.get("exports"),
                db_version: await rssm.getConfig("VERSION"),
                A_CODE_SEQ: await rssm.getConfig("A_CODE_SEQ"),
                AG_SIGNATURE2: await rssm.getConfig("AG_SIGNATURE2"),
                AG_REGISTER: await rssm.getConfig("AG_REGISTER"),
                AG_REGISTER_ADDRESS: await rssm.getConfig("AG_REGISTER_ADDRESS"),
                AG_REGISTER_POSTCODE: await rssm.getConfig("AG_REGISTER_POSTCODE"),
                AG_REGISTER_CITY: await rssm.getConfig("AG_REGISTER_CITY"),
            })
            break
    }
}

/**
 * returns the last 5 backup files
 * @returns {Promise<Array>}
 */
async function getBackupList() {
    const backups = []
    const slots = 5
    const backupPath = (await rssm.getConfig("BACKUP_PATH")) || ""
    const lastSlot = await rssm.getConfig("BACKUP_LAST")
    let nextSlot = lastSlot

    for (let i = 0; i < slots; i++) {
        const file = await rssm.getConfig(`BACKUP_${nextSlot}`)
        if (file) {
            backups.push(file)
        }

        nextSlot++
        if (nextSlot === slots) {
            nextSlot = 0
        }
    }

    return backups
}

/**
 * read application config from application user data space
 * @returns {{dbpath: string, version: string}}
 */
function readAppConfig() {
    const settingsFile = app.getPath("userData") + "/" + SETTINGS.config

    let configSet = "default"

    let config = {
        dbpath: undefined,
        version: SETTINGS.version,
    }

    // read setting from file if it exists
    if (fs.existsSync(settingsFile)) {
        const settingsContent = fs.readFileSync(settingsFile)
        config = JSON.parse(settingsContent)
    } else {
        console.log(`settings file ${settingsFile} not found. Starting with no database`)
    }

    if (isDev()) {
        console.log("Application is running in development mode - using dev database")
        config.dbpath = "./db/RSSM_DB_DEV.db"
        config.isDev = true
    }

    return config
}

/**
 * returns true if application is in development mode
 * @returns {boolean}
 */
function isDev() {
    return process.env.ELECTRON_DEV || false
}

/**
 * save application config to application user data space
 * @param newConfig
 * @returns {{dbpath: string, version: string}}
 */
function writeAppConfig(newConfig) {
    const settingsFile = app.getPath("userData") + "/" + SETTINGS.config
    let config = readAppConfig()

    for (key in newConfig) {
        config[key] = newConfig[key]
    }

    // writing default settings to file
    fs.writeFileSync(settingsFile, JSON.stringify(config))
    console.log("app configuration file updated: " + settingsFile)

    return config
}

/**
 * application shutdown handler
 */
function app_quit() {
    app.quit()
}

function errorHandler(e) {
    console.log(e)
    //SETTINGS.error = e.name;

    dialog.showMessageBox({
        type: "error",
        message: e.name,
        detail: e.message,
        title: "Error",
    })
}

function showDialog(e, message) {
    dialog.showMessageBox(message)
}

function getPathSeparator() {
    return process.platform == "win32" ? "\\" : "//"
}

function getMainMenuTemplate() {
    const mainMenuTemplate = [
        {
            label: "AG RSSM",
            submenu: [
                {
                    label: "Info",
                    click(item, window, e) {
                        // this is the first menu for MacOS and will be removed if not on platform darwin
                        mainWindow.webContents.send("information:show", VERSION)
                    },
                },
            ],
        },
        {
            label: "Ablage",
            submenu: [
                {
                    label: "Einstellungen",
                    click(item, window, e) {
                        loadContentData(e, "settings")
                    },
                },
                {
                    label: "Beenden",
                    role: "close",
                },
            ],
        },
        {
            label: "Bearbeiten",
            submenu: [
                {
                    label: "Rückgängig",
                    role: "undo",
                },
                {
                    label: "Wiederholen",
                    role: "redo",
                },
                {
                    type: "separator",
                },
                {
                    label: "Ausschneiden",
                    role: "cut",
                },
                {
                    label: "Kopieren",
                    role: "copy",
                },
                {
                    label: "Einfügen",
                    role: "paste",
                },
            ],
        },
        {
            label: "Aktienregister",
            submenu: [
                {
                    label: "Dashboard",
                    click(item, window, e) {
                        loadContentData(e, "dashboard")
                    },
                },
                {
                    label: "Aktienregister",
                    click(item, window, e) {
                        loadContentData(e, "content-register")
                    },
                },
                {
                    label: "Aktionäre",
                    click(item, window, e) {
                        loadContentData(e, "content-persons")
                    },
                },
                {
                    label: "Journal",
                    click(item, window, e) {
                        loadContentData(e, "content-journal")
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: "Verkauf",
                    click(item, window, e) {
                        loadContentData(e, "content-sale")
                    },
                },
                {
                    label: "Rückkauf",
                    click(item, window, e) {
                        loadContentData(e, "content-repurchase")
                    },
                },
                {
                    label: "Übertrag",
                    click(item, window, e) {
                        loadContentData(e, "content-transfer")
                    },
                },
                {
                    label: "Mutation",
                    click(item, window, e) {
                        loadContentData(e, "content-mutation")
                    },
                },
                {
                    label: "Person Erfassen",
                    click(item, window, e) {
                        loadContentData(e, "content-enter-person")
                    },
                },
                {
                    label: "Jahresbericht",
                    click(item, window, e) {
                        loadContentData(e, "content-report")
                    },
                },
            ],
        },
        {
            label: "Hilfe",
            submenu: [
                {
                    label: "Information",
                    click(item, window, e) {
                        mainWindow.webContents.send("information:show", VERSION)
                    },
                },
                {
                    label: "Entwickler Tools",
                    accelerator: process.platform === "darwin" ? "Command+I" : "Control+I",
                    click(item, focusedWindiow) {
                        focusedWindiow.toggleDevTools()
                    },
                },
            ],
        },
    ]

    // remove developer tools if in production
    if (!process.env.ELECTRON_DEV) {
        mainMenuTemplate[4].submenu.pop()
    }

    // handle macs first menu item
    if (process.platform !== "darwin") {
        // remove first menu if not on Mac
        mainMenuTemplate.shift()
    }

    return mainMenuTemplate
}

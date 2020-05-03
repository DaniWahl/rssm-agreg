const electron = require('electron')
const {app, BrowserWindow, Menu, ipcMain, dialog, shell} = electron
const fs = require('fs');
const RSSMShares = require('./lib/RSSMShares').RSSMShares
const RSSMDocs = require('./lib/RSSMDocs');
const helpers = require('./lib/app.helpers');

const VERSION = '1.5.0'
const CONFIGNAME = 'config.json'

let rssm = null
let mainWindow = null
app.allowRendererProcessReuse = true


// handle application events
app.on('ready',                   app_init);
ipcMain.on('content:show',        loadContentData);
ipcMain.on('repurchase:execute',  executeRepurchase);
ipcMain.on('transfer:execute',    executeTransfer);
ipcMain.on('mutation:execute',    executeMutation);
ipcMain.on('sale:execute',        executeSale);
ipcMain.on('enterperson:execute', executeEnterPerson);
ipcMain.on('report:execute',      executeReport);
ipcMain.on('report:export',       exportReport);
ipcMain.on('dbpath:set',          setDbPath);
ipcMain.on('backuppath:set',      setBackupPath);
ipcMain.on('documentpath:set',    setDocumentPath);
ipcMain.on('exportpath:set',      setExportPath);
ipcMain.on('dbbackup:create',     createDbBackup);
ipcMain.on('dbexport:create',     createDbExport);
ipcMain.on('settings:update',     saveSettings);
process.on('uncaughtException',   errorHandler);



/**
 * application startup handler
 */
function app_init() {

    const PATHSEP    = process.platform == 'win32' ? '\\' : '//' 
    const configSet  = process.env.ELECTRON_DEV ? 'dev' : 'default'
    const configFile = app.getPath('userData') + PATHSEP + CONFIGNAME
    
    // initialize main RSSMShares object
    rssm = new RSSMShares(configFile, configSet);
    rssm.init();


    // create UI window
    if(mainWindow === null) {
        mainWindow = new BrowserWindow({
            width  : 1600,
            height : 1000,
            show   : false,
            backgroundColor : '#ffffff',
    
            webPreferences: {
                nodeIntegration: true
            }
        })
    } 
    mainWindow.loadURL(`file://${__dirname}/ui/main/mainWindow.html`)


    mainWindow.webContents.on('dom-ready', () => {

        mainWindow.webContents.send('version:show', VERSION);

        let loadPanel = 'dashboard' 

        if(rssm.config.get('dbpath') === null) {
            loadPanel = 'settings'
        }
        if(rssm.config.get('backuppath') === null) {
            loadPanel = 'settings'
        }
        if(rssm.config.get('exportpath') === null) {
            loadPanel = 'settings'
        }
        if(rssm.config.get('documentpath') === null) {
            loadPanel = 'settings'
        }

        // TODO: load settings panel if problems detected
        loadContentData(null, loadPanel)

    });
    mainWindow.on('ready-to-show', () => {
        console.log('mainWindow ready-to-show')
        mainWindow.show()
    })
    mainWindow.once('closed', app_quit)



    // TODO: build menu from template
    // const mainMenu = Menu.buildFromTemplate( getMainMenuTemplate() )
    // Menu.setApplicationMenu(mainMenu)
}



async function saveSettings(e, data) {

    if(data.A_CODE_SEQ) {
        rssm.setConfig('A_CODE_SEQ', data.A_CODE_SEQ);
        mainWindow.webContents.send('toast:show', 'A-Code Sequenz gespeichert : ' + data.A_CODE_SEQ);
    }

    if(data.AG_SECRETARY) {
        rssm.setConfig('AG_SECRETARY', data.AG_SECRETARY);
        mainWindow.webContents.send('toast:show', 'AG Sekretariat gespeichert : ' + data.AG_SECRETARY);
    }

    if(data.AG_REGISTER) {
        await rssm.setConfig('AG_REGISTER', data.AG_REGISTER);
        mainWindow.webContents.send('toast:show', 'AG Aktien Register gespeichert : ' + data.AG_REGISTER);
    }

    if(data.AG_REGISTER_INITIALS) {
        rssm.setConfig('AG_REGISTER_INITIALS', data.AG_REGISTER_INITIALS);
        mainWindow.webContents.send('toast:show', 'Aktien Register, Initialen gespeichert : ' + data.AG_REGISTER_INITIALS);
    }

    if(data.AG_REGISTER_CITY) {
        rssm.setConfig('AG_REGISTER_CITY', data.AG_REGISTER_CITY);
        mainWindow.webContents.send('toast:show', 'Aktien Register, Ort gespeichert : ' + data.AG_REGISTER_CITY);
    }

    if(data.EXPORT_PATH) {
        rssm.setConfig('EXPORT_PATH', data.EXPORT_PATH);
        mainWindow.webContents.send('toast:show', 'Export Pfad für Dokumente gespeichert : ' + data.EXPORT_PATH);
    }

}

async function createDbBackup() {

    let backupPath = await rssm.getConfig('BACKUP_PATH');

    if(!backupPath) {
        backupPath = await selectDirectory('Backup');

        if(backupPath) {
            mainWindow.webContents.send('toast:show', 'Backup Directory bespeichert: ' + backupPath);
            await rssm.setConfig('BACKUP_PATH', backupPath);
        } else {
            mainWindow.webContents.send('toast:show', 'kein Backup Directory!', 'red');
            return;
        }

    }

    const backup = await rssm.backupDatabase(true);
    mainWindow.webContents.send('toast:show', 'Datenbank Backup erstellt: ' + backup);

    restartApp(2000);
}


async function createDbExport(e) {

    let exportPath = await rssm.getConfig('EXPORT_PATH');

    if(!exportPath) {
        exportPath = await selectDirectory('Export');

        if(exportPath) {
            mainWindow.webContents.send('toast:show', 'Export Directory gespeichert: ' + exportPath);
            await rssm.setConfig('EXPORT_PATH', exportPath);
        } else {
            mainWindow.webContents.send('toast:show', 'kein Export Directory!', 'red');
            return;
        }

    }

    const exportFile = await rssm.exportToExcel(true);
    mainWindow.webContents.send('toast:show', 'Datenbank exportiert: ' + exportFile);

}


function restartApp(time=1000) {

    mainWindow.webContents.send('toast:show', 'Applikation wird neu initalisiert ...', 'orange');

    setTimeout(function() {
        rssm = null
        app.relaunch()
        app.exit()
    }, time);
}


/**
 *
 */
async function selectDirectory(title) {

    // prompt for backup directory
    const paths = dialog.showOpenDialogSync(mainWindow, {
        title : `${title} Ordner`,
        message : `${title} Ordner auswählen`,
        properties : ['openDirectory']
    });

    if(paths) {
        return paths[0];
    }
}

/**
 * prompts user to select database file saves selected file to settings
 * @param e
 */
function setDbPath(e) {


    // prompt for new database file
    const paths = dialog.showOpenDialogSync(mainWindow, {
        title : "Datenbank auswählen",
        message : "Datenbank Datei auswählen",
        filters : [
            {name : "SQLite Datenbank", extensions: ['db']}
        ],
        properties : ['openFile']
    });

    if(!paths) {
        mainWindow.webContents.send('toast:show', 'Keine Datenbank ausgewählt!', 'red');
        return;
    }

    // updating new path to app config
    rssm.config.save('dbpath', paths[0])
    mainWindow.webContents.send('toast:show', 'Neue Datenbank ausgewählt: ' + paths[0])
   
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

    if(!path) {
        mainWindow.webContents.send('toast:show', 'Kein Ordner ausgewählt!', 'red')
        return;
    }

    // updating new path to app config
    rssm.config.save('backuppath', path)
    mainWindow.webContents.send('toast:show', 'Neuer Backup Ordner ausgewählt: ' + path)

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

    if(!path) {
        mainWindow.webContents.send('toast:show', 'Kein Ordner ausgewählt!', 'red')
        return;
    }

    // updating new path to app config
    rssm.config.save('documentpath', path)
    mainWindow.webContents.send('toast:show', 'Neuer Dokumente Ordner ausgewählt: ' + path)

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

        if(!path) {
            mainWindow.webContents.send('toast:show', 'Kein Ordner ausgewählt!', 'red')
            return;
        }
    
        // updating new path to app config
        rssm.config.save('exportpath', path)
        mainWindow.webContents.send('toast:show', 'Neuer Export Ordner ausgewählt: ' + path)
    
        // initialize application
        restartApp(2000)
}



/**
 * initiates the repurchase process and displays success or error on UI
 * @param e
 * @param data
 */
async function executeRepurchase(e, data) {

    rssm.repurchase(data.shares, data.a_code, data.booking_date)
        .then(async function(info) {

            mainWindow.webContents.send('journal:show', rssm.data.journal);
            mainWindow.webContents.send('toast:show', 'Rückkauf erfolgreich durchgeführt');


            // generate journal document
            const journal_path = await RSSMDocs.makeJournalRepurchase(info, rssm);
            rssm.registerDocument({
                journal_id : info.journal_id,
                path : journal_path
            });


            // open document
            shell.openItem(journal_path);

        })
        .catch(err => {

            console.error(err);

            dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Rückkauf',
                message: 'Rückkauf fehler!',
                detail: err.message
            });

        });

}

/**
 * initiates the repurchase process and displays success or error on UI
 * @param e
 * @param data
 */
async function executeTransfer(e, data) {

    rssm.transfer(data.shares, data.holder, data.reciever, data.comment)
        .then(async function(info) {

            mainWindow.webContents.send('journal:show', rssm.data.journal);
            mainWindow.webContents.send('toast:show', 'Übertrag erfolgreich durchgeführt');

            // generate journal document
            const journal_path = await RSSMDocs.makeJournalTransfer(info, rssm);
            rssm.registerDocument({
                journal_id : info.journal_id,
                path : journal_path
            });


            // open document
            shell.openItem(journal_path);

        })
        .catch(err => {

            console.error(err);

            dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Übertrag',
                message: 'Übertrag fehler!',
                detail: err.message
            });

        });
}

/**
 * initiates the sale process and displays success or error on UI
 * @param e
 * @param data
 */
async function executeSale(e, data) {

    rssm.sale(data.transaction, data.buyer)
        .then(async function(info) {

            mainWindow.webContents.send('journal:show', rssm.data.journal);
            mainWindow.webContents.send('toast:show', 'Verkauf erfolgreich durchgeführt');

            // generate documents
            const cert_path = await RSSMDocs.makeCertificates(info, rssm);
            rssm.registerDocument({
                journal_id : info.journal_id,
                path : cert_path
            });

            const letter_path = await RSSMDocs.makeSharesLetter(info, rssm);
            rssm.registerDocument({
                journal_id : info.journal_id,
                path : letter_path
            });


            const journal_path = await RSSMDocs.makeJournalSale(info, rssm);
            rssm.registerDocument({
                journal_id : info.journal_id,
                path : journal_path
            });


            // open documents
            shell.openItem(cert_path);
            shell.openItem(letter_path);
            shell.openItem(journal_path);

        })
        .catch(err => {

            console.error(err);

            dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Verkauf',
                message: 'Verkauf fehler!',
                detail: err.message
            });

        });
}

/**
 * initiates the enter person process and displays success or error on UI
 * @param e
 * @param data
 */
async function executeEnterPerson(e, person) {

    rssm.enterPerson(person)
        .then(async function(info){
            mainWindow.webContents.send('toast:show', 'Personendaten erfolgreich erfasst');
        });
}


/**
 * initiates the mutation process and displays success or error on UI
 * @param e
 * @param data
 */
async function executeMutation(e, person) {

    rssm.mutation(person)
        .then(async function(info) {

            mainWindow.webContents.send('journal:show', rssm.data.journal);
            mainWindow.webContents.send('toast:show', 'Mutation erfolgreich durchgeführt');


            // generate documents
            const journal_path = await RSSMDocs.makeJournalMutation(info, rssm);
            rssm.registerDocument({
                journal_id : info.journal_id,
                path : journal_path
            });

            // open document
            shell.openItem(journal_path);


        })
        .catch(err => {

            console.error(err);

            dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Mutation',
                message: 'Mutation fehler!',
                detail: err.message
            });

        });
}


async function executeReport(e, range) {

    const transactions = await rssm.getTransactionList(range.startDate, range.endDate);
    const kapital = await rssm.getShareKapital(range.endDate);

    //console.log("executeReport", range, transactions, kapital);

    mainWindow.webContents.send('report:data:show', {
        today          : helpers.dateToString(),
        startDate      : helpers.dateToString(new Date(range.startDate)),
        endDate        : helpers.dateToString(new Date(range.endDate)),
        transactions   : transactions,
        stock          : transactions[transactions.length-1].share_stock,
        shares_total   : kapital[0].shares_total,
        shares_kapital : kapital[0].shares_kapital
    });

}


async function exportReport(e, reportData) {

    // generate document
    const report_path = await RSSMDocs.makeAnnualReport(reportData, rssm);

    // open document
    shell.openItem(report_path);
}


/**
 * handler for the main window content:show event.
 * send appropriate data to element
 * @param {Event} e
 * @param {String} element_id
 */
async function loadContentData(e, element_id) {

    switch(element_id) {
        case 'dashboard':
            mainWindow.webContents.send('dashboard:show', {
                shares: rssm.data.shares,
                series: rssm.data.series,
               journal: rssm.data.journal,
               persons: rssm.data.persons,
                rssm : await rssm.getConfig('RSSM_A_CODE')
            });
            break;

        case 'content-share-holders-current':
            mainWindow.webContents.send('holders:current:show', rssm.data.shareHolders);
            break;

        case 'content-share-holders-all':
            mainWindow.webContents.send('holders:all:show', rssm.data.history);
            break;

        case 'content-persons':
            mainWindow.webContents.send('persons:show', rssm.data.persons);
            break;

        case 'content-journal':
            mainWindow.webContents.send('journal:show', rssm.data.journal);
            break;

        case 'content-report':
            mainWindow.webContents.send('report:show', []);
            break;

        case 'content-enter-person':
            mainWindow.webContents.send('enterperson:show', []);
            break;

        case 'content-sale':
            mainWindow.webContents.send('sale:show', {
                nextJournal : rssm.getNextJounalNo(),
                a_codes     : rssm.data.a_codes,
                shares      : rssm.data.shares,
                rssm_shares : rssm.data.rssmShares
            });
            break;

        case 'content-repurchase':
            mainWindow.webContents.send('repurchase:show', {
                nextJournal : rssm.getNextJounalNo(),
                a_codes     : rssm.data.a_codes,
                shares      : rssm.data.shares
            });
            break;

        case 'content-transfer':
            mainWindow.webContents.send('transfer:show', {
                nextJournal : rssm.getNextJounalNo(),
                a_codes     : rssm.data.a_codes,
                shares      : rssm.data.shares,
                persons     : rssm.data.persons
            });
            break

        case 'content-mutation':
            mainWindow.webContents.send('mutation:show', {
                nextJournal : rssm.getNextJounalNo(),
                a_codes     : rssm.data.a_codes
            });
            break

        case 'settings':
            mainWindow.webContents.send('admin:settings:show', {
                version : VERSION,
                user_config_file : rssm.config.file, 
                user_config_set : rssm.config.set,
                dbpath : rssm.config.get('dbpath'),
                backuppath : rssm.config.get('backuppath'),
                exportpath : rssm.config.get('exportpath'),
                documentpath : rssm.config.get('documentpath'),
                db_backup_list : await getBackupList(),
                
                db_export_path : await rssm.getConfig('EXPORT_PATH'),
                documents_path : undefined,

                A_CODE_SEQ : await rssm.getConfig('A_CODE_SEQ'),
                AG_SECRETARY : await rssm.getConfig('AG_SECRETARY'),
                AG_REGISTER : await rssm.getConfig('AG_REGISTER'),
                AG_REGISTER_INITIALS : await rssm.getConfig('AG_REGISTER_INITIALS'),
                AG_REGISTER_CITY : await rssm.getConfig('AG_REGISTER_CITY')
            });
            break;

    }

}


/**
 * returns the last 5 backup files
 * @returns {Promise<Array>}
 */
async function getBackupList() {
    const backups = [];
    const slots = 5;
    const backupPath = await rssm.getConfig('BACKUP_PATH') || '';
    const lastSlot = await rssm.getConfig('BACKUP_LAST');
    let nextSlot = lastSlot;

    for(let i=0; i<slots; i++) {

        const file = await rssm.getConfig(`BACKUP_${nextSlot}`);
        if(file) {
            backups.push(file);
        }

        nextSlot++;
        if(nextSlot === slots) {
            nextSlot = 0;
        }
    }

    return backups;
}


/**
 * read application config from application user data space
 * @returns {{dbpath: string, version: string}}
 */
function readAppConfig() {
    const settingsFile = app.getPath('userData') + '/' + SETTINGS.config

    let configSet = 'default'


    let config = {
        dbpath : undefined,
        version : SETTINGS.version
    }

    // read setting from file if it exists
    if(fs.existsSync(settingsFile)) {
        const settingsContent = fs.readFileSync(settingsFile)
        config = JSON.parse(settingsContent)
    } else {
        console.log(`settings file ${settingsFile} not found. Starting with no database`)
    }


    if (isDev()) {
        console.log("Application is running in development mode - using dev database")
        config.dbpath = './db/RSSM_DB_DEV.db'
        config.isDev = true
    }

    return config
}

/**
 * returns true if application is in development mode
 * @returns {boolean}
 */
function isDev() {
    return process.env.ELECTRON_DEV || false;
}

/**
 * save application config to application user data space
 * @param newConfig
 * @returns {{dbpath: string, version: string}}
 */
function writeAppConfig(newConfig) {
    const settingsFile = app.getPath('userData') + '/' + SETTINGS.config
    let config = readAppConfig()

    for(key in newConfig) {
        config[key] = newConfig[key]
    }

    // writing default settings to file
    fs.writeFileSync(settingsFile, JSON.stringify(config))
    console.log('app configuration file updated: ' + settingsFile)

    return config
}


/**
 * application shutdown handler
 */
function app_quit() {
    app.quit()
}


function errorHandler(e) {
    console.log( e );
    //SETTINGS.error = e.name;

    dialog.showMessageBox({
        type: "error",
        message:  e.name,
        detail: e.message,
        title: "Error"
    });

}


function getMainMenuTemplate() {

    // create menu template
    const mainMenuTemplate = [
        {
            label : 'AG RSSM',
            submenu : [{
                label : 'Info'
            }]
        },{
            label : 'Aktienregister',
            submenu: [
                {
                    label: 'Aktionäre Aktuell',
                    click() {  }
                },
                {
                    label: 'Aktionäre Historie ',
                    click() {  }
                },
                {
                    label: 'Aktien',
                    click() {  }
                },{
                    label: 'Journal',
                    click() {}
                }
            ]
        },
        {
            label : 'Aktionen',
            submenu: [
                {
                    label: 'Verkauf',
                    click() {  }
                },
                {
                    label: 'Rückkauf',
                    click() {  }
                },
                {
                    label: 'Übertrag',
                    click() {  }
                },
                {
                    label: 'Mutation',
                    click() {  }
                }
            ]
        },
        {
            label : 'Admin',
            submenu : [
                {
                    label : 'Datenbank'
                }
            ]
        },
        {
            label : 'Developer Tools',
            submenu: [{
                label : 'Toggle DevTools',
                accelerator: process.platform === 'darwin' ? 'Command+I' : 'Control+I',
                click(item, focusedWindiow) {
                    focusedWindiow.toggleDevTools()
                }
            },{
                role: 'reload'
            }]
        }
    ]

// handle macs first menu item
    if(process.platform !== 'darwin') {
        // remove first menu if not on Mac
        mainMenuTemplate.shift();
    }
// remove developer tools if in production
    if(process.env.NODE_ENV === 'production') {
        mainMenuTemplate.pop()
    }

    return mainMenuTemplate
}


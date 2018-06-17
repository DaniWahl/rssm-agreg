const electron = require('electron')
const {app, BrowserWindow, Menu, ipcMain, dialog} = electron
const fs = require('fs');
const RSSMShares = require('./lib/RSSMShares').RSSMShares
const RSSMDocs = require('./lib/RSSMDocs');

// read the basic settings
const SETTINGS = require('./settings');
let rssm;
let mainWindow = null



// handle application events
app.on('ready',                  app_init);
ipcMain.on('content:show',       loadContentData);
ipcMain.on('repurchase:execute', executeRepurchase);
ipcMain.on('transfer:execute',   executeTransfer);
ipcMain.on('mutation:execute',   executeMutation);
ipcMain.on('sale:execute',       executeSale);
ipcMain.on('dbpath:set',         setDbPath);
ipcMain.on('dbbackup:create',    createDbBackup);
ipcMain.on('dbexport:create',    createDbExport);
process.on('uncaughtException',  errorHandler);



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
            mainWindow.webContents.send('toast:show', 'Export Directory bespeichert: ' + exportPath);
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

    mainWindow.webContents.send('toast:show', 'Applikation wird neu gestartet', 'orange');

    setTimeout(function() {
        rssm = null;
        mainWindow = null;
        app_init();
    }, time);
}


/**
 *
 */
async function selectDirectory(title) {

    // prompt for backup directory
    const paths = dialog.showOpenDialog(mainWindow, {
        title : `${title} Directory`,
        message : `${title} Directory auswählen`,
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
    const paths = dialog.showOpenDialog(mainWindow, {
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


    // updating new path to settings
    let newSettings = {
        dbpath : paths[0],
        version : SETTINGS.version
    };
    newSettings = JSON.stringify(newSettings);

    // write new setting to file
    fs.writeFile('./settings.json', newSettings, 'utf8', function (err) {
        if(err) {
            errorHandler(err);
            return;
        }

        SETTINGS.dbpath = paths[0];
        delete SETTINGS.error;
        mainWindow.webContents.send('toast:show', 'Neue Datenbank ausgewählt');

        // initialize application
        rssm = null;
        mainWindow = null;
        app_init();

    });

}



/**
 * initiates the repurchase process and displays success or error on UI
 * @param e
 * @param data
 */
function executeRepurchase(e, data) {

    rssm.repurchase(data.shares, data.a_code)
        .then(res => {

            mainWindow.webContents.send('journal:show', rssm.data.journal);
            mainWindow.webContents.send('toast:show', 'Rückkauf erfolgreich durchgeführt');

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
function executeTransfer(e, data) {

    rssm.transfer(data.shares, data.holder, data.reciever, data.comment)
        .then(res => {

            mainWindow.webContents.send('journal:show', rssm.data.journal);
            mainWindow.webContents.send('toast:show', 'Übertrag erfolgreich durchgeführt');

            //2DO: need to generate & print new certificate documents

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

            const cert_path = await RSSMDocs.makeCertificates(info, rssm);
            const letter_path = RSSMDocs.makeSharesLetter(info);
            const journal_path = RSSMDocs.makeJournalSale(info);


            let cert_win = new BrowserWindow({
                webPreferences: {
                    plugins: true
                }
            });
            cert_win.loadURL(cert_path);


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
 * initiates the mutation process and displays success or error on UI
 * @param e
 * @param data
 */
function executeMutation(e, person) {

    rssm.mutation(person)
        .then(res => {

            mainWindow.webContents.send('journal:show', rssm.data.journal);
            mainWindow.webContents.send('toast:show', 'Mutation erfolgreich durchgeführt');

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


/**
 * handler for the main window content:show event.
 * send appropriate data to element
 * @param {Event} e
 * @param {String} element_id
 */
async function loadContentData(e, element_id) {

    switch(element_id) {
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
                shares      : rssm.data.shares
            });
            break

        case 'content-mutation':
            mainWindow.webContents.send('mutation:show', {
                nextJournal : rssm.getNextJounalNo(),
                a_codes     : rssm.data.a_codes
            });
            break

        case 'admin-db':

            mainWindow.webContents.send('admin:database:show', {
                version : SETTINGS.version,
                dbpath : SETTINGS.dbpath,
                db_backup_path : await rssm.getConfig('BACKUP_PATH'),
                db_load_date : await rssm.getConfig('DB_LOAD'),
                db_creation_date : await rssm.getConfig('DB_CREATION'),
                db_backup_list : await getBackupList()
            });
            break

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
 * application startup handler
 */
function app_init() {


    rssm = new RSSMShares(SETTINGS.dbpath);
    rssm.init();


    // create UI window
    mainWindow = new BrowserWindow({
        width  : 1600,
        height : 1000,
        show   : false,
        backgroundColor : '#ffffff'
    })
    mainWindow.loadURL(`file://${__dirname}/ui/main/mainWindow.html`)
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        // send application version to display
        mainWindow.webContents.send('version:show', SETTINGS.version);

        if(SETTINGS.error) {
            // we started with error, let's handle this on the ui
            mainWindow.webContents.send('admin:database:show', SETTINGS);

        }

    });
    mainWindow.on('closed', app_quit)


    // build menu from template
    const mainMenu = Menu.buildFromTemplate( getMainMenuTemplate() )
    Menu.setApplicationMenu(mainMenu)
}


/**
 * application shutdown handler
 */
function app_quit() {
    app.quit()
}

function errorHandler(e) {
    console.log( e );
    SETTINGS.error = e.name;

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


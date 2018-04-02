const electron = require('electron')
const {app, BrowserWindow, Menu, ipcMain, dialog} = electron
const RSSMShares = require('./lib/RSSMShares').RSSMShares
const RSSM_DB = 'db/agregRSSM_test.db'


// create application objects
const rssm = new RSSMShares(RSSM_DB)
rssm.init();
let mainWindow = null


// handle application events
app.on('ready',                  app_init);
ipcMain.on('content:show',       loadContentData);
ipcMain.on('repurchase:execute', executeRepurchase);
ipcMain.on('transfer:execute',   executeTransfer);


/**
 * initiates the repurchase process and displays success or error on UI
 * @param e
 * @param data
 */
function executeRepurchase(e, data) {

    rssm.repurchase(data.shares, data.a_code)
        .then(res => {

            mainWindow.webContents.send('journal:show', rssm.data.journal);

            dialog.showMessageBox(mainWindow,{
                type: 'info',
                title: 'Rückkauf',
                message: 'Rückkauf erfolgreich durchgeführt.'
            });

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

}


/**
 * handler for the main window content:show event.
 * send appropriate data to element
 * @param {Event} e
 * @param {String} element_id
 */
function loadContentData(e, element_id) {

    switch(element_id) {
        case 'content-share-holders-current':
            mainWindow.webContents.send('holders:current:show', rssm.data.shareHolders);
            break;

        case 'content-share-holders-all':
            mainWindow.webContents.send('holders:all:show', rssm.data.history);
            break;

        case 'content-journal':
            mainWindow.webContents.send('journal:show', rssm.data.journal);
            break;

        case 'content-purchase':
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
            break

    }

}


/**
 * application startup handler
 */
function app_init() {

    // create UI window
    mainWindow = new BrowserWindow({
        width  : 1600,
        height : 1000
    })
    mainWindow.loadURL(`file://${__dirname}/ui/main/mainWindow.html`)
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
                    label: 'Kauf',
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


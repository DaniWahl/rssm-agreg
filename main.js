const electron = require('electron')
const {app, BrowserWindow, Menu, ipcMain} = electron
const RSSMShares = require('./lib/db.rssm.shares').RSSMShares
const RSSM_DB = 'db/agregRSSM_test.db'


// create application objects
const rssm = new RSSMShares(RSSM_DB)
const windows = {
    main                : null,
    shareHoldersCurrent : null,
    shareHoldersHistory : null,
    sharesList          : null
}


// handle application events
app.on('ready', app_init)
ipcMain.on('main:click:holders-current-btn', createShareHoldersCurrentWindow )
ipcMain.on('main:click:holders-history-btn', createShareHoldersHistoryWindow )
ipcMain.on('main:click:shares-btn',          createSharesListWindow )



function loadShares() {

    // load shares and send to window
    rssm.getAllShares().then(shares => {

        windows.sharesList.webContents.send('shares:show', shares)

    }).catch(err => {
        console.error(err)
    })
}



function loadShareHoldersCurrent() {

    rssm.getCurrentShareHolders().then(holders => {

        windows.shareHoldersCurrent.webContents.send('holders:current:show', holders)

    }).catch(err => {
        console.error(err)
    })
}


function loadShareHoldersHistory() {

    rssm.getAllShareHolders().then(holders => {

        windows.shareHoldersHistory.webContents.send('holders:all:show', holders)

    }).catch(err => {
        console.error(err)
    })
}


/**
 * handler creating the shares  ui
 */
function createSharesListWindow() {

    if(windows.sharesList) {
        windows.sharesList.show()
        return
    }

    windows.sharesList = new BrowserWindow({
        width  : 800,
        height : 800,
        title  : 'Aktien'
       // show   : false
    })

    windows.sharesList.loadURL(`file://${__dirname}/ui/shares_list/sharesList.html`)

    windows.sharesList.on('close', function() {
        windows.sharesList = null;
    })


    windows.sharesList.webContents.on('did-finish-load', loadShares)

}





/**
 * handler creating the shareholder current ui
 */
function createShareHoldersCurrentWindow() {

    windows.shareHoldersCurrent = new BrowserWindow({
        width  : 1200,
        height : 800,
        title  : 'Aktionäre - Aktuell'
    })

    windows.shareHoldersCurrent.loadURL(`file://${__dirname}/ui/share_holders/shareHolderWindow.html`)

    windows.shareHoldersCurrent.on('close', function() {
        windows.shareHoldersCurrent = null;
    })

    windows.shareHoldersCurrent.webContents.on('did-finish-load', loadShareHoldersCurrent)
}

/**
 * handler creating the shareholder current ui
 */
function createShareHoldersHistoryWindow() {

    windows.shareHoldersHistory = new BrowserWindow({
        width  : 1200,
        height : 800,
        title  : 'Aktionäre - Historie'
    })

    windows.shareHoldersHistory.loadURL(`file://${__dirname}/ui/share_holders/shareholderWindow.html`)

    windows.shareHoldersHistory.on('close', function() {
        windows.shareHoldersHistory = null;
    })

    windows.shareHoldersHistory.webContents.on('did-finish-load', loadShareHoldersHistory)
}


/**
 * application startup handler
 */
function app_init() {
    windows.main = new BrowserWindow()
    windows.main.loadURL(`file://${__dirname}/ui/main/mainWindow.html`)

    windows.main.on('closed', app_quit)

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
                    click() { createShareHoldersCurrentWindow() }
                },
                {
                    label: 'Aktionäre Historie ',
                    click() { createShareHoldersHistoryWindow() }
                },
                {
                    label: 'Aktien',
                    click() { createSharesListWindow() }
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

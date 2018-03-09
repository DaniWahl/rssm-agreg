const electron = require('electron')
const path = require('path')
const {app, BrowserWindow, Menu, ipcMain} = electron


const windows = {
    main                : null,
    shareHoldersCurrent : null,
    shareHoldersHistory : null
}


// handle application events
app.on('ready', app_init)
ipcMain.on('main:click:holders-current-btn', createShareHoldersCurrent )
ipcMain.on('main:click:holders-history-btn', createShareHoldersHistory )




/**
 * handler creating the shareholder current ui
 */
function createShareHoldersCurrent() {

    windows.shareHoldersCurrent = new BrowserWindow({
        width  : 1200,
        height : 800,
        title  : 'Aktionäre - Aktuell'
    })

    windows.shareHoldersCurrent.loadURL('ui/share_holders/shareHolderWindow.html')

    windows.shareHoldersCurrent.on('close', function() {
        windows.shareHoldersCurrent = null;
    })
}

/**
 * handler creating the shareholder current ui
 */
function createShareHoldersHistory() {

    windows.shareHoldersHistory = new BrowserWindow({
        width  : 1200,
        height : 800,
        title  : 'Aktionäre - Historie'
    })

    windows.shareHoldersHistory.loadURL('ui/share_holders/shareHolderWindow.html')

    windows.shareHoldersHistory.on('close', function() {
        windows.shareHoldersHistory = null;
    })
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
                    click() { createShareHoldersWindow('current') }
                },
                {
                    label: 'Aktionäre Historie ',
                    click() { createShareHoldersWindow('history') }
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

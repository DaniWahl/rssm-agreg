const electron = require('electron')
const {app, BrowserWindow, Menu, ipcMain} = electron
const RSSMShares = require('./lib/db.rssm.shares').RSSMShares
const RSSM_DB = 'db/agregRSSM_test.db'


// create application objects
const rssm = new RSSMShares(RSSM_DB)
let mainWindow = null



// handle application events
app.on('ready',             app_init)
ipcMain.on('content:show',  loadContentData)







/**
 * handler for the main window content:show event.
 * send appropriate data to element
 * @param {Event} e
 * @param {String} element_id
 */
function loadContentData(e, element_id) {

    switch(element_id) {
        case 'content-share-holders-current':
            loadShareHoldersCurrent()
            break

        case 'content-share-holders-all':
            loadShareHoldersHistory()
            break

        case 'content-journal':
            loadJournal()
            break

        case 'content-purchase':
            break

        case 'content-repurchase':
            prepareUI()
            break

        case 'content-transfer':
            break

        case 'content-mutation':
            break

    }

}



function prepareUI() {
    // send rssm object to window
    mainWindow.webContents.send('receive:data', rssm)
}



function loadShareHoldersCurrent() {

    rssm.getCurrentShareHolders().then(holders => {

        mainWindow.webContents.send('holders:current:show', holders)

    }).catch(err => {
        console.error(err)
    })
}

function loadShareHoldersHistory() {

    rssm.getAllShareHolders().then(holders => {

        mainWindow.webContents.send('holders:all:show', holders)

    }).catch(err => {
        console.error(err)
    })
}

function loadJournal() {
    rssm.getJournal().then(journal => {

        mainWindow.webContents.send('journal:show', journal)

    }).catch(err => {
        console.error(err)
    })
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


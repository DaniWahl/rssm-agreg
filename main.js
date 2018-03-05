const electron = require('electron')
const path = require('path')


const {app, BrowserWindow, Menu, ipcMain} = electron

let mainWindow



// start application when ready
app.on('ready', app_init)






/**
 * application startup handler
 */
function app_init() {
    mainWindow = new BrowserWindow()
    mainWindow.loadURL(`file://${__dirname}/ui/mainWindow.html`)

    mainWindow.on('closed', app_quit)

    // build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    Menu.setApplicationMenu(mainMenu)
}

/**
 * application shutdown handler
 */
function app_quit() {
    app.quit()
}


// create menu template
const mainMenuTemplate = [
    {
        label : 'AG RSSM'
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
    }
]
// handle macs first menu item
if(process.platform !== 'darwin') {
    // add an empty menu first
   // mainMenuTemplate.unshift({});
}
// add developper tools if not in production
if(process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label : 'Tools',
        submenu: [{
            label : 'Toggle DevTools',
            accelerator: process.platform == 'darwin' ? 'Command+I' : 'Control+I',
            click(item, focusedWindiow) {
                focusedWindiow.toggleDevTools()
            }
        },{
            role: 'reload'
        }]
    })
}
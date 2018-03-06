const electron = require('electron')
const path = require('path')
const mainMenuTemplate = require(__dirname + '/ui/main/mainAppMenu').mainMenuTemplate


const {app, BrowserWindow, Menu, ipcMain} = electron

let mainWindow



// start application when ready
app.on('ready', app_init)






/**
 * application startup handler
 */
function app_init() {
    mainWindow = new BrowserWindow()
    mainWindow.loadURL(`file://${__dirname}/ui/main/mainWindow.html`)

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


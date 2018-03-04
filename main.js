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
}

/**
 * application shutdown handler
 */
function app_quit() {
    app.quit()
}
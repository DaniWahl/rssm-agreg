const electron = require('electron')
const path = require('path')


const {app, BrowserWindow, Menu, ipcMain} = electron

let mainWindow

app.on('ready', function() {
    mainWindow = new BrowserWindow()
})
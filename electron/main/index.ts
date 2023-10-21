import { app, BrowserWindow, shell, ipcMain, globalShortcut, Tray, Menu, MenuItem } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
const Store = require('electron-store');
const store = new Store();

process.env.DIST_ELECTRON = join(__dirname, '../')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Mute Mic',
    autoHideMenuBar: true,
    width: 81,
    height: 81,
    minHeight:80,
    minWidth:80,
    icon: join(process.env.VITE_PUBLIC, 'favicon.ico'),
    transparent: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  win.setAlwaysOnTop(true, 'normal')

  // https://github.com/electron/electron/issues/2170
 

  if (url) { // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
  } else {
    win.loadFile(indexHtml)
  }


  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })


}

app.whenReady().then(() => {
  createWindow()

  globalShortcut.unregisterAll()
  globalShortcut.register('F5', () => {
    win?.webContents.reloadIgnoringCache()
  })
  globalShortcut.register('Control+F12', () => {
    win?.webContents.send('changeMuteStatus')
  })
  globalShortcut.register('Control+A+Z', () => {
    win?.close()
  })
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

ipcMain.on('pageLoaded', (event, value) => {

  let contextMenuElements:IMenuItem[] = []

  type IMenuItem = {
    label: string,
    type: 'radio',
    checked: boolean,
    click: (menuItem:MenuItem) => void
  }
  

  const handleClick = (menuItem:MenuItem) => {
    win?.webContents.send('changeMicrophone', menuItem.label)
    store.set('lastMicrophone', menuItem.label)
  }

  for(let element of value){
    contextMenuElements.push({label: element.name, type: 'radio', checked: false, click: handleClick})
  }

  let lastMicrophone = store.get('lastMicrophone')
  let selectedMicrophone = contextMenuElements.find(e => e.label === lastMicrophone)!
  let indexSelectMicrophone = contextMenuElements.indexOf(selectedMicrophone)
  contextMenuElements[indexSelectMicrophone].checked = true

  const contextMenu = Menu.buildFromTemplate(contextMenuElements)
  let tray = new Tray(join(process.env.VITE_PUBLIC, 'favicon.ico'))

  tray.setToolTip('mute-micro.')
  tray.setContextMenu(contextMenu)
})

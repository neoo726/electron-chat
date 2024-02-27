const { app, BrowserWindow,ipcMain } = require('electron')
const path = require('node:path')
const redis=require('redis');
const { dialog } = require('electron');


const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences:{
        preload: path.join(__dirname,"preload.js")
    }
  })

  win.loadFile('index.html')
}
app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong')
  ipcMain.handle('getTagValue',async (event,host,port,portName,machineName,tagName)=>{
    const client= await redis.createClient({
      url:'redis://'+host+':'+port
     }).on('error', err => {
      console.log('Redis Client Error', err)
      return false
     })
     .connect();
     const intervalId=setInterval(async ()=>{
       const value=await client.get('1:WebDV_ROS01:DV_ROS:ROS:ROS:EXR_CraneID_FB')
       event.sender.send('updateTagValue0,value');
     },1000)
     let curVal=0;
     const intervalId2=setInterval(async ()=>{
      const value=await client.set('1:WebDV_ROS01:DV_ROS:ROS:ROS:EXR_CraneID_FB',1-curVal)
    },5000)
     app.on('before-quit',()=>{
      clearInterval(intervalId);
      clearInterval(intervalId2);
      client.disconnect();
     })
  })
  ipcMain.handle('testConnect',async (event,host,port)=>{
    console.log("testConnect in main.js")
     const client= await redis.createClient({
      url:'redis://'+host+':'+port
     }).on('error', err => {
      console.log(client.url)
      console.log('Redis Client Error', err)
      dialog.showMessageBox({
        type: 'warn',
        message: 'Connect Redis failed',
        buttons: ['OK']
      });
      return false
     })
     .connect();
     await client.disconnect();
     
     dialog.showMessageBox({
      type: 'info',
      message: 'Connect Redis success',
      buttons: ['OK']
    });
    return true;
  })
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  console.log(process.platform)
const { app, BrowserWindow,ipcMain } = require('electron')
const path = require('node:path')
const redis=require('redis');
const axios=require('axios')
const { dialog } = require('electron');

let win;
const createWindow = () => {
   win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences:{
        preload: path.join(__dirname,"preload.js")
    }
  })
  win.loadFile('index.html')
}
let intervalReadId;
let intervalWriteId;
async function fetchTagValue(event, host, port, portName, machineName, tagName) {
  const url = `http://${host}:${port}/v1/item/value/${tagName}?portName=${portName}&machineryName=${machineName}`;
  try {
    const response = await axios.get(url);
    const { itemName, value, quality } = response.data;
    const valueField = `${value.dataType}Val`;
    const realValue = value[valueField].value;
    win.webContents.send('updateTagValuee', itemName.itemName, realValue, quality);
  } catch (error) {
    console.error('Error fetching tag value:', error);
  }
  app.on('before-quit', () => {
    if (intervalReadId) {
      clearInterval(intervalReadId);
    }
    if (intervalWriteId) {
      clearInterval(intervalWriteId);
    }
  });
}
app.whenReady().then(() => {
  ipcMain.handle('readTagValue',fetchTagValue)
  // ipcMain.handle('readTagValue',async (event,host,port,portName,machineName,tagName)=>{
  //   const url = `http://${host}:${port}/v1/item/value/${tagName}?portName=${portName}&machineryName=${machineName}`;
  //   try {
  //     const response = await axios.get(url);
    
  //     const {itemName,value, quality} = response.data;
  //     // 构建属性名
  //     const valueField = `${value.dataType}Val`;
  //     // 获取值
  //     const realValue = value[valueField].value;
  //     win.webContents.send('updateTagValuee',itemName.itemName,realValue, quality);
  //     // event.sender.send('updateTagValue', itemName.itemName,value, quality);
  //   } catch (error) {
  //       console.error('Error fetching tag value:', error);
  //   }
  //   app.on('before-quit', () => {
  //     if(intervalReadId){
  //       clearInterval(intervalReadId);
  //     }
  //     if(intervalWriteId){
  //       clearInterval(intervalWriteId);
  //     }
  //   });
  // })
  ipcMain.handle('readTagValueByInterval',async (event,host,port,portName,machineName,tagName)=>{
    intervalReadId = setInterval(async () => {
      try {
          fetchTagValue(event,host,port,portName,machineName,tagName);
      } catch (error) {
          console.error('Error fetching tag value:', error);
      }
    }, 1000);
    app.on('before-quit', () => {
      if(intervalReadId){
        clearInterval(intervalReadId);
      }
      
    });
  })
  async function writeTagValue(event,host,port,portName,machineName,tagName,dataType,tagValue){
    const url = `http://${host}:${port}/v1/item/value/${tagName}?portName=${portName}&machineryName=${machineName}&sync=1`;
    const filedName=`${dataType}Val`;
    const payload = {
        isArray: false,
        dataType: dataType,
        [filedName]: {
            value: tagValue
        }
      }

    try {
        const response = await axios.put(url, payload);
        return response.data;
    } catch (error) {
        console.error('Error writing tag value:', error);
        return { error: error.message };
    }
  }
  ipcMain.handle('writeTagValue',writeTagValue)
  // ipcMain.handle('writeTagValue',async (event,host,port,portName,machineName,tagName,dataType,tagValue)=>{
  //   const url = `http://${host}:${port}/v1/item/value/${tagName}?portName=${portName}&machineryName=${machineName}&sync=1`;
  //   const filedName=`${dataType}Val`;
  //   const payload = {
  //       isArray: false,
  //       dataType: dataType,
  //       [filedName]: {
  //           value: tagValue
  //       }
  //     }

  //   try {
  //       const response = await axios.put(url, payload);
  //       return response.data;
  //   } catch (error) {
  //       console.error('Error writing tag value:', error);
  //       return { error: error.message };
  //   }
  // })
  
  ipcMain.handle('writeTagValueByInterval',async (event,host,port,portName,machineName,tagName,interval)=>{
    let curVal=0;  
    intervalWriteId = setInterval(async () => {
        try {
            curVal=1-curVal;
            const response =  writeTagValue(event,host, port, portName, machineName, tagName,'int16', curVal);           
            console.log(`Tag value written successfully: ${response}`);
        } catch (error) {
            console.error('Error writing tag value:', error);
        }
    }, interval);

    app.on('before-quit', () => {
      if(intervalWriteId){
        clearInterval(intervalWriteId);
      }
    });
  })
  ipcMain.handle('stop',async(event)=>{
    if(intervalWriteId){
      clearInterval(intervalWriteId);
    }
    if(intervalReadId){
      clearInterval(intervalReadId);
    }
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
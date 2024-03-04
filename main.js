const { app, BrowserWindow,ipcMain } = require('electron')
const path = require('node:path')
const redis=require('redis');
const axios=require('axios')
const { dialog } = require('electron');
const { isatty } = require('node:tty');

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
async function readTagValue(host, port, portName, machineName, tagName) {
  const url = `http://${host}:${port}/v1/item/value/${tagName}?portName=${portName}&machineryName=${machineName}`;
  try {
    const response = await axios.get(url);
    const {  value, quality } = response.data;
    const valueField = `${value.dataType}Val`;
    const realValue = value[valueField].value;
    return { quality:quality, value: realValue };
  } catch (error) {
    console.error('Error fetching tag value:', error);
    return { quality: null, value: null };
  }
}
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
  ipcMain.handle('startTaskSimulate',async (event,host,port,portName,machineName,tpos,hpos,spdLock,spdUnlock,spd20,spd40,spd45,spd2020,rosCraneIdFb)=>{
    GenerateTaskOnce(host,port,portName,machineName,tpos,hpos,spdLock,spdUnlock,spd20,spd40,spd45,spd2020,rosCraneIdFb)
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
//randorm generate unload / load 
async function GenerateTaskOnce(host,port,portName,machineName,tpos,hpos,spdLock,spdUnlock,spd20,spd40,spd45,spd2020,rosCraneIdFb){
   const randomNum=Math.random();
   //装船
     //起升小车位置为0，闭锁，吊具尺寸20
     const writePromise=[]
     if(tpos){
      writePromise.push(writeTagValue(null,host, port, portName, machineName, tpos,'int16', 0));
     }
     if(hpos){
      writePromise.push(writeTagValue(null,host, port, portName, machineName, hpos,'int16', 0));

     }
     writePromise.push(writeTagValue(null,host, port, portName, machineName, spdLock,'bool',true));
     writePromise.push(writeTagValue(null,host, port, portName, machineName, spdUnlock,'bool',false));
     writePromise.push(writeTagValue(null,host, port, portName, machineName, spd20,'bool',true));
     await Promise.all(writePromise);
     //起升平滑上升到40米
     await async(()=>{
       try{
        let isArrived=false;
        while(!isArrived){
         let curHpos=readTagValue(host,port,portName,machineName,hpos);
         if(curHpos>=40000){
          isArrived=true;
          break;
         }
         let newHpos = curHpos + 1000;
         writeTagValue(null, host, port, portName, machineName, hpos, 'int16', newHpos);
       }
       }
       catch(error){
         console.error(error);
       }
     })
     //小车平滑移动到60米
     await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
     await async(()=>{
      try{
       let isArrived=false;
       while(!isArrived){
        let curTpos=readTagValue(host,port,portName,machineName,tpos);
        if(curTpos>=60000){
         isArrived=true;
         break;
        }
        let newTpos = curTpos + 1000;
        writeTagValue(null, host, port, portName, machineName, tpos, 'int16', newTpos);
      }
      }
      catch(error){
        console.error(error);
      }
    })
     //起升平滑下降到10米
     await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
     await async(()=>{
      try{
       let isArrived=false;
       while(!isArrived){
        let curHpos=readTagValue(host,port,portName,machineName,hpos);
        if(curHpos<=10000){
         isArrived=true;
         break;
        }
        let newHpos = curHpos - 1000;
        writeTagValue(null, host, port, portName, machineName, hpos, 'int16', newHpos);
      }
      }
      catch(error){
        console.error(error);
      }
    })
     //吊具开锁
     await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
     writeTagValue(null,host, port, portName, machineName, spdLock,'bool',false)
     writeTagValue(null,host, port, portName, machineName, spdUnlock,'bool',true)
     //起升平滑上升至40米
     await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
     await async(()=>{
      try{
       let isArrived=false;
       while(!isArrived){
        let curHpos=readTagValue(host,port,portName,machineName,hpos);
        if(curHpos>=40000){
         isArrived=true;
         break;
        }
        let newHpos = curHpos + 1000;
        writeTagValue(null, host, port, portName, machineName, hpos, 'int16', newHpos);
      }
      }
      catch(error){
        console.error(error);
      }
    })
}
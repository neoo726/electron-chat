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
async function writeTagValue(event,host,port,portName,machineName,tagName,curDataType,tagValue){
  const url = `http://${host}:${port}/v1/item/value/${tagName}?portName=${portName}&machineryName=${machineName}&sync=1`;
  const filedName=`${curDataType}Val`;
  const payload = {
      isArray: false,
      dataType: curDataType,
      [filedName]: {
          value: tagValue
      }
    }

  try {
      console.log(payload)
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
  let isSimulateExecuting=false;
  //模拟一次完整装船过程
  ipcMain.handle('startTaskSimulateOnce',async (event,host,port,portName,machineName,tpos,hpos,spdLock,spdUnlock,spd20,spd40,spd45,spd2020,rosCraneIdFb)=>{
    GenerateTaskOnce(host,port,portName,machineName,tpos,hpos,spdLock,spdUnlock,spd20,spd40,spd45,spd2020,rosCraneIdFb)
  })
  //持续模拟装船过程
  ipcMain.handle('startTaskSimulate',async (event,host,port,portName,machineName,tpos,hpos,spdLock,spdUnlock,spd20,spd40,spd45,spd2020,rosCraneIdFb)=>{
    while(isSimulateExecuting){
      GenerateTaskOnce(host,port,portName,machineName,tpos,hpos,spdLock,spdUnlock,spd20,spd40,spd45,spd2020,rosCraneIdFb)
    }
  })
  ipcMain.handle('stopTaskSimulate',async (event,host,port,portName,machineName,tpos,hpos,spdLock,spdUnlock,spd20,spd40,spd45,spd2020,rosCraneIdFb)=>{
    isSimulateExecuting=false;
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
      writePromise.push(writeTagValue(null,host, port, portName, machineName, tpos,'int16', 10));
     }
     if(hpos){
      writePromise.push(writeTagValue(null,host, port, portName, machineName, hpos,'int16', 10));

     }
     writePromise.push(writeTagValue(null,host, port, portName, machineName, spdLock,'bool',true));
     writePromise.push(writeTagValue(null,host, port, portName, machineName, spdUnlock,'bool',false));
     writePromise.push(writeTagValue(null,host, port, portName, machineName, spd20,'bool',true));
     await Promise.all(writePromise);
     //起升平滑上升到40米
     await  smoothRisingToHeight(host, port, portName, machineName, hpos, 4000);
     //小车平滑移动到60米
     await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
     await smoothMovingToPosition(host, port, portName, machineName, tpos, 6000);
     //起升平滑下降到10米
     await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
     await smoothDescendingToHeight(host, port, portName, machineName, hpos, 1000)
     //吊具开锁
     await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
     writeTagValue(null,host, port, portName, machineName, spdLock,'bool',false)
     writeTagValue(null,host, port, portName, machineName, spdUnlock,'bool',true)
     //起升平滑上升至40米
     await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
     await smoothRisingToHeight(host, port, portName, machineName, hpos, 4000);
}
async function smoothRisingToHeight(host, port, portName, machineName, hpos, targetHeight) {
  try {
    let isArrived = false;
    while (!isArrived) {
      let curHpos = await readTagValue(host, port, portName, machineName, hpos);
      if(!curHpos.value){
        curHpos.value=100;
      }
      if (curHpos.value >= targetHeight) {
        isArrived = true;
        break;
      }
      
      let newHpos = curHpos.value + 500;
      await writeTagValue(null, host, port, portName, machineName, hpos, 'int16', newHpos);
      await new Promise(resolve => setTimeout(resolve, 200)); // 等待一秒钟
    }
  } catch (error) {
    console.error(error);
  }
}

async function smoothMovingToPosition(host, port, portName, machineName, tpos, targetPosition) {
  // 实现小车平滑移动到指定位置的逻辑
  try{
    let isArrived=false;
    while(!isArrived){
     let curTpos=await readTagValue(host,port,portName,machineName,tpos);
     if(!curTpos.value){
        curTpos.value=100;
      }
     if(curTpos.value>=targetPosition){
      isArrived=true;
      break;
     }
     let newTpos = curTpos.value + 500;
     writeTagValue(null, host, port, portName, machineName, tpos, 'int16', newTpos);
     await new Promise(resolve => setTimeout(resolve, 200)); // 等待一秒钟
   }
   }
   catch(error){
     console.error(error);
   }
}

async function smoothDescendingToHeight(host, port, portName, machineName, hpos, targetHeight) {
  // 实现起升平滑下降到指定高度的逻辑
  try {
    let isArrived = false;
    while (!isArrived) {
      let curHpos = await readTagValue(host, port, portName, machineName, hpos);
      if (curHpos.value <= targetHeight) {
        isArrived = true;
        break;
      }
      let newHpos = curHpos.value - 500;
      await writeTagValue(null, host, port, portName, machineName, hpos, 'int16', newHpos);
      await new Promise(resolve => setTimeout(resolve, 200)); // 等待一秒钟
    }
  } catch (error) {
    console.error(error);
  }
}
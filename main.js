const { app, BrowserWindow,ipcMain } = require('electron')
const path = require('node:path')
const redis=require('redis');
const axios=require('axios')
const { dialog } = require('electron');
const { isatty } = require('node:tty'); 
const http=require('http')
const { v4: uuidv4 } = require('uuid');

let win;
const createWindow = () => {
   win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences:{
        preload: path.join(__dirname,"preload.js")
    }
  })
  win.loadFile('newindex.html')
}
let isStop=false;
let intervalReadId;
let intervalWriteId;
const host="10.128.231.141";
const port="31082";
const portName="WebDV";
const machineName="ROS01";
const qcmsMachineName="UI"
const targetMemoryBusName="memory-bus";
const seasideTpos=7000;
const platformTpos=2000;
const truckLaneTpos=1500;
const mainSafeHeight=4500;
const secondSafeHeight=800

const t1posTag="DV_ROS.ROS.Crane.EXL_T1_POS";
const h1posTag="DV_ROS.ROS.Crane.EXL_H1_POS";
const h2posTag="DV_ROS.ROS.Crane.EXL_H3_POS";
const t2posTag="DV_ROS.ROS.Crane.EXL_T2_POS";
const sp1LockTag="DV_ROS.ROS.Crane.EXL_SP1_Lock";
const sp1UnlockTag="DV_ROS.ROS.Crane.EXL_SP1_UnlocK";
const sp3LockTag="DV_ROS.ROS.Crane.EXL_SP3_Lock";
const sp3UnlockTag="DV_ROS.ROS.Crane.EXL_SP3_UnlocK";
//qcms
const truckLaneTag="QC901.LANE_STATUS";
const mtCenterCmdTag="QC901.MT_CENTER_COMMAND";
const mtLeftCmdTag="QC901.MT_LEFT_COMMAND";
const mtRightCmdTag="QC901.MT_RIGHT_COMMAND";
const ptCenterCmdTag="QC901.PT_CENTER_COMMAND";
const ptLeftCmdTag="QC901.PT_LEFT_COMMAND";
const ptRightCmdTag="QC901.PT_RIGHT_COMMAND";
const qcmsExceptionTag="QC901.EXCEPTION";
const qcmsEventInfoTag="QC901.EVENT_INFO";
const qcmsCraneStatusTag="QC901.CRANE_STATUS";

const gantryPosTag="DV_ROS.ROS.Crane.EXL_GantryPOS";
const gantryRightTag="DV_ROS.ROS.Crane.EXL_GantryLeft";
const gantryLeftTag="DV_ROS.ROS.Crane.EXL_GantryRight";
const gantrySpdTag="DV_ROS.ROS.Crane.EXL_GantrySpd";
const boomPosTag="DV_ROS.ROS.Crane.EXL_BoomPOS";
const boomSpdTag="DV_ROS.ROS.Crane.EXL_BoomSPD";

const controlOnTag="DV_ROS.ROS.Crane.EXL_ControlOn";
const boomFaultTag="DV_ROS.ROS.Crane.EXL_BoomFault";
const controlFaultTag="DV_ROS.ROS.Crane.EXL_ControlFault";
const gantryFaultTag="DV_ROS.ROS.Crane.EXL_GantryFault";
const t1FaultTag="DV_ROS.ROS.Crane.EXL_T1_Fault";
const h1FaultTag="DV_ROS.ROS.Crane.EXL_H1_Fault";
const sp1FaultTag="DV_ROS.ROS.Crane.EXL_SP1_Fault";
const t2FaultTag="DV_ROS.ROS.Crane.EXL_T2_Fault";
const h3FaultTag="DV_ROS.ROS.Crane.EXL_H3_Fault";
const sp3FaultTag="DV_ROS.ROS.Crane.EXL_SP3_Fault";


const rosBindFbTag="DV_ROS.ROS.ROS.EXR_CraneID_FB";
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
async function writeTagValue(event,host,port,portName,machineName,tagName,curDataType,tagValue,tragetBus=null){
  let url = `http://${host}:${port}/v1/item/value/${tagName}?portName=${portName}&machineryName=${machineName}&sync=1`;
  if(tragetBus!=null){
    url=url+"&target="+tragetBus;
  }
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
  
  ipcMain.handle('stopSimulate',async ()=>{
    isStop=true;
    await setRosBind(host,port,portName,machineName,rosBindFbTag,0)
  })
  ipcMain.handle('many2many',async ()=>{
    isStop=false;
    let num=1;
    while(!isStop){
      await setRosBind(host,port,portName,machineName,rosBindFbTag,1);
      switch(num){
        case 1:
          await SeasidePickUp();
          break;
        case 2:
          await  PlatformGroundByMainSpreader();
          break;
        case 3:
          await PlatformPickUpBySecondSpreader();
          break;
        case 4:
          await LandsideGround();
          break;
        case 5:
          await  LandsidePickUp();
          break;
        case 6:
          await  PlatformGroundBySecondSpreader();
          break;
        case 7:
          await PlatformPickUpByMainSpreader();
          break;
        case 8:
          await SeasideGround();
          break;
      }
      await setRosBind(host,port,portName,machineName,rosBindFbTag,0);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
      num++;
      if(num>8){
        num=1;
      }
    }
    
  });
  ipcMain.handle('one2one',async ()=>{
     while(!isStop){
      //跳台-完整装卸船-持续作业
      await setRosBind(host,port,portName,machineName,rosBindFbTag,1);
      //跳台-抓箱/放箱-释放
      //1、海侧抓箱
      await SeasidePickUp();
      await moveTrolley(host,port,portName,machineName,t1posTag,platformTpos);
      if(isStop){  break; }
      //2、平台放箱（主吊具）      
      await PlatformGroundByMainSpreader();
      if(isStop){  break; }

      //3、平台抓箱（门架吊具）
      await moveTrolley(host,port,portName,machineName,t2posTag,platformTpos);
      await PlatformPickUpBySecondSpreader();
      if(isStop){  break; }
      //4、陆侧放箱（门架吊具）
      await moveTrolley(host,port,portName,machineName,t2posTag,truckLaneTpos);
      await LandsideGround();
      if(isStop){  break; }
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
      //5、陆侧抓箱（门架吊具）
      await LandsidePickUp();
      await moveTrolley(host,port,portName,machineName,t2posTag,truckLaneTpos);
      if(isStop){  break; }
      //6、平台放箱（门架吊具）
      await PlatformGroundBySecondSpreader();
      //7、平台抓箱（主吊具）
      await moveTrolley(host,port,portName,machineName,t1posTag,platformTpos);
      await PlatformPickUpByMainSpreader();
      if(isStop){  break; }
      //8、海侧放箱
      await moveTrolley(host,port,portName,machineName,t1posTag,seasideTpos);
      await SeasideGround();
      if(isStop){  break; }
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
     }
  });
  ipcMain.handle('gantryMove',async ()=>{
    //模拟动大车
    await setGantry(host,port,portName,machineName,gantryPosTag,gantryLeftTag,gantryRightTag,gantrySpdTag,30000);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
    await moveGantry(host,port,portName,machineName,gantryPosTag,40000)
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
  });
  let curStatusSignal=false;
  ipcMain.handle('statusSignal',async ()=>{
    //模拟状态信号
    await setRosBind(host,port,portName,machineName,rosBindFbTag,1)
    curStatusSignal=!curStatusSignal;
    await writeTagValue(null,host,port,portName,machineName,controlOnTag,'bool',true);
    await writeTagValue(null,host,port,portName,machineName,controlFaultTag,'bool',curStatusSignal);
    await writeTagValue(null,host,port,portName,machineName,gantryFaultTag,'bool',!curStatusSignal);
    await writeTagValue(null,host,port,portName,machineName,t1FaultTag,'bool',curStatusSignal);
    await writeTagValue(null,host,port,portName,machineName,h1FaultTag,'bool',!curStatusSignal);
    await writeTagValue(null,host,port,portName,machineName,sp1FaultTag,'bool',curStatusSignal);
    await writeTagValue(null,host,port,portName,machineName,t2FaultTag,'bool',!curStatusSignal);
    await writeTagValue(null,host,port,portName,machineName,h3FaultTag,'bool',curStatusSignal);
    await writeTagValue(null,host,port,portName,machineName,sp3FaultTag,'bool',!curStatusSignal);
  });
  ipcMain.handle('boomLatchDown',async ()=>{
    //模拟俯仰
    await setRosBind(host,port,portName,machineName,rosBindFbTag,1)
    await moveBoom(host,port,portName,machineName,boomPosTag,0);
  });
  ipcMain.handle('boomLatchUp',async ()=>{
    //模拟俯仰
    await setRosBind(host,port,portName,machineName,rosBindFbTag,1)
    await moveBoom(host,port,portName,machineName,boomPosTag,8000);
  });
  ipcMain.handle('truckLaneSimulate',async ()=>{
    //模拟集卡车道
    await setRosBind(host,port,portName,machineName,rosBindFbTag,1)
    let truckNum=Math.floor(Math.random()*10+1)
    if(truckNum>7){truckNum=7;}
    await setTruckLaneData(host,port,portName,qcmsMachineName,truckLaneTag,truckNum);
  });
  ipcMain.handle('platformSimulate',async ()=>{
    //模拟中转平台
  });
  let server;
  //rest其你去
  ipcMain.handle('restStart',async(event,restPort,urls)=>{
    if (server) {
      console.log('Server is already running.');
      return;
    }
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
          body += chunk.toString();
      });
      req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          const returnMsg=JSON.stringify({
            code: 200,
            data: null,
            msg: 'Success'
        });
          // Here you can process the request and send back the JSON response
          res.end(returnMsg);
          win.webContents.send('requestReceive', body, returnMsg);
      });
    });
    server.listen(restPort, () => {
        console.log(`Server running at http://localhost:${restPort}/`);
    });
    return true;
  });
  ipcMain.handle('restStop',async()=>{
    if (server) {
      server.close(() => {
          console.log('Server stopped.');
          server = null;
      });
    } else {
        console.log('Server is not running.');
    }

    return true;
  });
  ipcMain.handle('createMtTask',async()=>{
     setSingleTaskData(host,port,portName,qcmsMachineName,true)
     
  });
  ipcMain.handle('createPtTask',async()=>{
    setSingleTaskData(host,port,portName,qcmsMachineName,false)
    
 });
 ipcMain.handle('createQcmsEvent',async()=>{
    setEventInfoData(host,port,portName,qcmsMachineName);
 });
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
//初始化位置
async function InitializePos(t1pos,h1pos,t2pos,h2pos,sp1Lock,sp3Lock){
  
  const writePromise=[]
  writePromise.push(writeTagValue(null,host, port, portName, machineName, t1posTag,'int16', t1pos));
  writePromise.push(writeTagValue(null,host, port, portName, machineName, h1posTag,'int16', h1pos));
  writePromise.push(writeTagValue(null,host, port, portName, machineName, sp1LockTag,'bool',sp1Lock));
  writePromise.push(writeTagValue(null,host, port, portName, machineName, sp1UnlockTag,'bool',!sp1Lock));

  writePromise.push(writeTagValue(null,host, port, portName, machineName, t2posTag,'int16', t2pos));
  writePromise.push(writeTagValue(null,host, port, portName, machineName, h2posTag,'int16', h2pos));
  writePromise.push(writeTagValue(null,host, port, portName, machineName, sp3LockTag,'bool',sp3Lock));
  writePromise.push(writeTagValue(null,host, port, portName, machineName, sp3UnlockTag,'bool',!sp3Lock));
  
  await Promise.all(writePromise);
}
async function SeasidePickUp(){
   //设置默认安全高度
   await Promise.all([setTrolley(host,port,portName,machineName,t1posTag,seasideTpos),
    setHoist(host,port,portName,machineName,h1posTag,mainSafeHeight),
    setLock(host,port,portName,machineName,sp1LockTag,sp1UnlockTag,false)
   ])
   await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
   await moveHoist(host,port,portName,machineName,h1posTag,500);   
   await setLock(host,port,portName,machineName,sp1LockTag,sp1UnlockTag,true)
   await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
   await moveHoist(host,port,portName,machineName,h1posTag,mainSafeHeight);   
   await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
}
async function SeasideGround(){
  //设置默认安全高度
  await  setTrolley(host,port,portName,machineName,t1posTag,seasideTpos);
  await  setHoist(host,port,portName,machineName,h1posTag,mainSafeHeight);
  await  setLock(host,port,portName,machineName,sp1LockTag,sp1UnlockTag,true);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
  await moveHoist(host,port,portName,machineName,h1posTag,500);   
  await  setLock(host,port,portName,machineName,sp1LockTag,sp1UnlockTag,false)
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
  await  moveHoist(host,port,portName,machineName,h1posTag,mainSafeHeight);   
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
}
async function PlatformPickUpByMainSpreader(){
   //设置默认安全高度
   await  setTrolley(host,port,portName,machineName,t1posTag,platformTpos);
   await  setHoist(host,port,portName,machineName,h1posTag,mainSafeHeight);
   await  setLock(host,port,portName,machineName,sp1LockTag,sp1UnlockTag,false);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
  await moveHoist(host,port,portName,machineName,h1posTag,800);   
  await setLock(host,port,portName,machineName,sp1LockTag,sp1UnlockTag,true)
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
  await moveHoist(host,port,portName,machineName,h1posTag,mainSafeHeight);   
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
}
async function PlatformGroundByMainSpreader(){
  //设置默认安全高度
  await setTrolley(host,port,portName,machineName,t1posTag,platformTpos);
  await setHoist(host,port,portName,machineName,h1posTag,mainSafeHeight);
  await setLock(host,port,portName,machineName,sp1LockTag,sp1UnlockTag,true);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
  await moveHoist(host,port,portName,machineName,h1posTag,800);   
  await setLock(host,port,portName,machineName,sp1LockTag,sp1UnlockTag,false)
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
  await moveHoist(host,port,portName,machineName,h1posTag,mainSafeHeight); 
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟  
}
async function PlatformPickUpBySecondSpreader(){
  //设置默认安全高度
  await setTrolley(host,port,portName,machineName,t2posTag,platformTpos);
  await setHoist(host,port,portName,machineName,h2posTag,secondSafeHeight);
  await setLock(host,port,portName,machineName,sp3LockTag,sp1UnlockTag,false);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
  await moveHoist(host,port,portName,machineName,h2posTag,800);   
  await setLock(host,port,portName,machineName,sp3LockTag,sp1UnlockTag,true)
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
  await moveHoist(host,port,portName,machineName,h2posTag,secondSafeHeight); 
}
async function PlatformGroundBySecondSpreader(){
   //设置默认安全高度
   await setTrolley(host,port,portName,machineName,t2posTag,platformTpos);
   await setHoist(host,port,portName,machineName,h2posTag,secondSafeHeight);
   await setLock(host,port,portName,machineName,sp3LockTag,sp1UnlockTag,true);
   await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
   await moveHoist(host,port,portName,machineName,h2posTag,800);   
   await setLock(host,port,portName,machineName,sp3LockTag,sp1UnlockTag,false)
   await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
   await moveHoist(host,port,portName,machineName,h2posTag,secondSafeHeight);   
}
async function LandsidePickUp(){
  //设置默认安全高度
  await setTrolley(host,port,portName,machineName,t2posTag,truckLaneTpos);
  await setHoist(host,port,portName,machineName,h2posTag,secondSafeHeight);
  await setLock(host,port,portName,machineName,sp3LockTag,sp1UnlockTag,false);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
  await moveHoist(host,port,portName,machineName,h2posTag,800);   
  await setLock(host,port,portName,machineName,sp3LockTag,sp1UnlockTag,true)
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
  await moveHoist(host,port,portName,machineName,h2posTag,secondSafeHeight);   
}
async function LandsideGround(){
  //设置默认安全高度
  await setTrolley(host,port,portName,machineName,t2posTag,truckLaneTpos);
  await setHoist(host,port,portName,machineName,h2posTag,secondSafeHeight);
  await setLock(host,port,portName,machineName,sp3LockTag,sp1UnlockTag,true);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
  await moveHoist(host,port,portName,machineName,h2posTag,800);   
  await setLock(host,port,portName,machineName,sp3LockTag,sp1UnlockTag,false)
  await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
  await moveHoist(host,port,portName,machineName,h2posTag,secondSafeHeight);   
}
//randorm generate unload / load 
// async function GenerateTaskOnce(host,port,portName,machineName,tpos,hpos,spdLock,spdUnlock,spd20,spd40,spd45,spd2020,rosCraneIdFb){
//    const randomNum=Math.random();
//      //装船
//      //起升小车位置为0，闭锁，吊具尺寸20
//      const writePromise=[]
//      if(tpos){
//       writePromise.push(writeTagValue(null,host, port, portName, machineName, tpos,'int16', 10));
//      }
//      if(hpos){
//       writePromise.push(writeTagValue(null,host, port, portName, machineName, hpos,'int16', 10));

//      }
//      writePromise.push(writeTagValue(null,host, port, portName, machineName, spdLock,'bool',true));
//      writePromise.push(writeTagValue(null,host, port, portName, machineName, spdUnlock,'bool',false));
//      writePromise.push(writeTagValue(null,host, port, portName, machineName, spd20,'bool',true));
//      await Promise.all(writePromise);
//      //起升平滑上升到40米
//      //await  setHoist(host, port, portName, machineName, hpos, 4000);
//      //小车平滑移动到60米
//      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
//      await smoothMovingToPosition(host, port, portName, machineName, tpos, 6000);
//      //起升平滑下降到10米
//      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
//      await smoothDescendingToHeight(host, port, portName, machineName, hpos, 1000)
//      //吊具开锁
//      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
//      writeTagValue(null,host, port, portName, machineName, spdLock,'bool',false)
//      writeTagValue(null,host, port, portName, machineName, spdUnlock,'bool',true)
//      //起升平滑上升至40米
//      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待一秒钟
//      //await smoothRisingToHeight(host, port, portName, machineName, hpos, 4000);
// }
async function moveHoist(host, port, portName, machineName, hpos, targetHeight) {
  try {
    let isArrived = false;
    let lastReadValue=undefined;
    while (!isArrived) {
      let curHpos = await readTagValue(host, port, portName, machineName, hpos);
      if(curHpos.value==undefined){
        curHpos.value=100;
      }
      if (Math.abs(curHpos.value - targetHeight)<300) {
        isArrived = true;
        break;
      }
      
      let newHpos = curHpos.value ;
      if(curHpos.value>=targetHeight){
        newHpos = curHpos.value - 200;
      }
      else{
        newHpos = curHpos.value + 200;
      }
      await writeTagValue(null, host, port, portName, machineName, hpos, 'int16', newHpos);
      // await new Promise(resolve => setTimeout(resolve, 100)); // 等待一秒钟
    }
  } catch (error) {
    console.error(error);
  }
}

async function moveTrolley(host, port, portName, machineName, tpos, targetPosition) {
  // 实现小车平滑移动到指定位置的逻辑
  try{
    let isArrived=false;
    let lastReadValue=undefined;
    while(!isArrived){
     let curTpos=await readTagValue(host,port,portName,machineName,tpos);
     if(curTpos.value==undefined){
        curTpos.value=100;
      }
      if(lastReadValue==curTpos.value){
        await new Promise(resolve => setTimeout(resolve, 100)); // 等待一秒钟
        continue;
     }
     lastReadValue=curTpos.value;
     if(Math.abs(curTpos.value-targetPosition)<600){
      isArrived=true;
      break;
     }
     let newTpos = curTpos.value
     if(curTpos.value>=targetPosition){
      newTpos = curTpos.value - 500;
     }
     else{
      newTpos = curTpos.value + 500;
     }
     writeTagValue(null, host, port, portName, machineName, tpos, 'int16', newTpos);
     await new Promise(resolve => setTimeout(resolve, 200)); // 等待一秒钟
   }
   }
   catch(error){
     console.error(error);
   }
}
async function moveGantry(host, port, portName, machineName, gposTag, targetPosition) {
  // 实现大车平滑移动到指定位置的逻辑
  try{
    let isArrived=false;
    let lastReadValue=undefined;
    while(!isArrived){
     let curTpos=await readTagValue(host,port,portName,machineName,gposTag);
     if(curTpos.value==undefined){
        curTpos.value=0;
      }
      if(lastReadValue==curTpos.value){
        await new Promise(resolve => setTimeout(resolve, 100)); // 等待一秒钟
        continue;
     }
     lastReadValue=curTpos.value;
     if(Math.abs(curTpos.value-targetPosition)<600){
      isArrived=true;
      break;
     }
     let newTpos = curTpos.value 
     if(curTpos.value>=targetPosition){
      newTpos = curTpos.value - 500;
     }
     else{
      newTpos = curTpos.value + 500;
     }
     writeTagValue(null, host, port, portName, machineName, gposTag, 'int32', newTpos);
     await new Promise(resolve => setTimeout(resolve, 200)); // 等待一秒钟
   }
   }
   catch(error){
     console.error(error);
   }
}
async function moveBoom(host, port, portName, machineName, boomPosTag, targetPosition) {
  // 实现大车平滑移动到指定位置的逻辑
  try{
    let isArrived=false;
    let lastReadValue=undefined;
    while(!isArrived){
     let curTpos=await readTagValue(host,port,portName,machineName,boomPosTag);
     if(curTpos.value==undefined){
        curTpos.value=0;
      }
      if(lastReadValue==curTpos.value){
         await new Promise(resolve => setTimeout(resolve, 100)); // 等待一秒钟
         continue;
      }
      lastReadValue=curTpos.value;
     if(Math.abs(curTpos.value-targetPosition)<500){
      isArrived=true;
      break;
     }
     let newTpos = curTpos.value ;
     if(curTpos.value>=targetPosition){
      newTpos = curTpos.value - 500;
     }
     else{
      newTpos = curTpos.value+ 500
     }
     writeTagValue(null, host, port, portName, machineName, boomPosTag, 'int16', newTpos);
     await new Promise(resolve => setTimeout(resolve, 200)); // 等待一秒钟
   }
   }
   catch(error){
     console.error(error);
   }
}
async function setHoist(host, port, portName, machineName, hpos, targetHeight) {
  try {
    await writeTagValue(null, host, port, portName, machineName, hpos, 'int16', targetHeight);
    }
  catch (error) {
    console.error(error);
  }
}

async function setTrolley(host, port, portName, machineName, tpos, targetPosition) {
  // 实现小车平滑移动到指定位置的逻辑
  try{
    writeTagValue(null, host, port, portName, machineName, tpos, 'int16', targetPosition);
   }
   catch(error){
     console.error(error);
   }
}
async function setLock(host, port, portName, machineName, splock,spUnlock, isLock) {
  // 实现小车平滑移动到指定位置的逻辑
  try{
    writeTagValue(null, host, port, portName, machineName, splock, 'bool', isLock);
    writeTagValue(null, host, port, portName, machineName, spUnlock, 'bool', !isLock);
   }
   catch(error){
     console.error(error);
   }
}
async function setGantry(host, port, portName, machineName, gantryPosTag,gantryLeftTag,gantryRightTag,gantrySpdTag, gantryPos) {
  // 实现小车平滑移动到指定位置的逻辑
  try{
    writeTagValue(null, host, port, portName, machineName, gantryPosTag, 'int32', gantryPos);
    writeTagValue(null, host, port, portName, machineName, gantryLeftTag, 'bool', false);
    writeTagValue(null, host, port, portName, machineName, gantryRightTag, 'bool', false);
    writeTagValue(null, host, port, portName, machineName, gantrySpdTag, 'int16', 0);

   }
   catch(error){
     console.error(error);
   }
}
async function setRosBind(host, port, portName, machineName, rosBindFb, bindCraneId) {
  // 实现小车平滑移动到指定位置的逻辑
  try{
    writeTagValue(null, host, port, portName, machineName, rosBindFb, 'int16', bindCraneId);
   }
   catch(error){
     console.error(error);
   }
}
async function setTruckLaneData(host, port, portName, machineName, truckLaneTag, laneNum) {
  // 实现小车平滑移动到指定位置的逻辑
  try{
    const laneData=generateLaneData(laneNum);
    writeTagValue(null, host, port, portName, machineName, truckLaneTag, 'string', JSON.stringify(laneData),targetMemoryBusName);
   }
   catch(error){
     console.error(error);
   }
}
async function setSingleTaskData(host, port, portName, machineName, isMt) {
  // 实现小车平滑移动到指定位置的逻辑
  try{
    const task={
       taskId:null,
       moveKind:null,
       status:null,
       containerId:null,
       truckId:null,
       laneId:null,
       position:null,
       containerOriginLocation:null,
       containerDestLocation:null,
    }
    let leftCmd,centerCmd,rightCmd;
    const tmpTypeId=Math.floor(Math.random()*3)+1;
    if(tmpTypeId===1){
      //left
      leftCmd=JSON.stringify({
        taskId:uuidv4(),
        moveKind:'moveLeft',
        status:'idle',
        containerId:null,
        truckId:null,
        laneId:null,
        position:null,
        containerOriginLocation:null,
        containerDestLocation:null,
      });
      centerCmd=JSON.stringify(task);
      rightCmd=JSON.stringify(task);

    } else if(tmpTypeId===2){
      //center
      centerCmd=JSON.stringify({
        taskId:uuidv4(),
        moveKind:'moveLeft',
        status:'idle',
        containerId:null,
        truckId:null,
        laneId:null,
        position:null,
        containerOriginLocation:null,
        containerDestLocation:null,
      });
      leftCmd=JSON.stringify(task);
      rightCmd=JSON.stringify(task);

    } else if(tmpTypeId===3){
      //right
      rightCmd=JSON.stringify({
        taskId:uuidv4(),
        moveKind:'moveLeft',
        status:'idle',
        containerId:null,
        truckId:null,
        laneId:null,
        position:null,
        containerOriginLocation:null,
        containerDestLocation:null,
      });
      leftCmd=JSON.stringify(task);
      centerCmd=JSON.stringify(task);
    }
    if(isMt){
      writeTagValue(null, host, port, portName, machineName, mtCenterCmdTag, 'string', centerCmd,targetMemoryBusName);
      writeTagValue(null, host, port, portName, machineName, mtLeftCmdTag, 'string', leftCmd,targetMemoryBusName);
      writeTagValue(null, host, port, portName, machineName, mtRightCmdTag, 'string', rightCmd,targetMemoryBusName);

    }
    else{
      writeTagValue(null, host, port, portName, machineName, ptCenterCmdTag, 'string', centerCmd,targetMemoryBusName);
      writeTagValue(null, host, port, portName, machineName, ptLeftCmdTag, 'string', leftCmd,targetMemoryBusName);
      writeTagValue(null, host, port, portName, machineName, ptRightCmdTag, 'string', rightCmd,targetMemoryBusName);

    }
   }
   catch(error){
     console.error(error);
   }
}
async function setEventInfoData(host, port, portName, machineName) {
  // 实现小车平滑移动到指定位置的逻辑
  try{
    const task=JSON.stringify({
      taskId:null,
      gantry:null,
      mt:'手动卸船模式，等待主小车吊具抓箱',
      pt:'等待新的卸船任务',
      pf:null,
   })
    writeTagValue(null, host, port, portName, machineName, qcmsEventInfoTag, 'string', task,targetMemoryBusName);

   }
   catch(error){
     console.error(error);
   }
}
function generateLaneData(targetLaneNumber) {
  const provinces = ['沪', '津', '冀', '晋', '蒙', '辽', '吉', '黑', '苏', '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘', '粤', '桂', '琼', '渝', '川', '贵', '云', '藏', '陕', '甘', '青', '宁', '新'];
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '0123456789';

  const lanes = [];
  for (let i = 1; i <= 8; i++) {
    const laneNumber = `lane${i}`;
    const laneData = { [laneNumber]: [] };

    if (i === targetLaneNumber) {
      const randomTruckId = `${provinces[Math.floor(Math.random() * provinces.length)]}${characters[Math.floor(Math.random() * characters.length)]}${characters[Math.floor(Math.random() * characters.length)]}${numbers[Math.floor(Math.random() * numbers.length)]}${numbers[Math.floor(Math.random() * numbers.length)]}${numbers[Math.floor(Math.random() * numbers.length)]}`;
      const randomUpdateTime = new Date(Date.now() + Math.random() * 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 19).replace('T', ' ');
      const randomCpsState = Math.random() < 0.5 ? 'ScanComplete_I' : 'Close';

      laneData[laneNumber].push({
        truckId: randomTruckId,
        qcmsUpdateTime: randomUpdateTime,
        cpsState: randomCpsState,
        ocrtUpdateTime: null
      });
    } else {
      laneData[laneNumber].push({
        truckId: '',
        qcmsUpdateTime: '',
        cpsState: '',
        ocrtUpdateTime: ''
      });
    }

    lanes.push(laneData);
  }

  return lanes;
}

// async function smoothDescendingToHeight(host, port, portName, machineName, hpos, targetHeight) {
//   // 实现起升平滑下降到指定高度的逻辑
//   try {
//     let isArrived = false;
//     while (!isArrived) {
//       let curHpos = await readTagValue(host, port, portName, machineName, hpos);
//       if (curHpos.value <= targetHeight) {
//         isArrived = true;
//         break;
//       }
//       let newHpos = curHpos.value - 500;
//       await writeTagValue(null, host, port, portName, machineName, hpos, 'int16', newHpos);
//       await new Promise(resolve => setTimeout(resolve, 200)); // 等待一秒钟
//     }
//   } catch (error) {
//     console.error(error);
//   }
// }
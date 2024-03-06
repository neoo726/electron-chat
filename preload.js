const { contextBridge ,ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  ping: () => ipcRenderer.invoke('ping')
  // 除函数之外，我们也可以暴露变量
})
contextBridge.exposeInMainWorld('redisHelper', {  
  testConnect: (host, port) => {
    console.log("testConnect in exposeInMainWorld")
    return ipcRenderer.invoke('testConnect',host, port)
  },
  curTagValue:(host,port,portName,machineName,tagName)=>{
    console.log("curTagValue in exposeInMainWorld")
    return ipcRenderer.invoke('getTagValue',host,port,portName,machineName,tagName)
  }
  // 除函数之外，我们也可以暴露变量
})
contextBridge.exposeInMainWorld('api',{
   stop: ()=>ipcRenderer.invoke('stop'),
   readTagValue: (host,port,portName,machineName,tagName)=>ipcRenderer.invoke('readTagValue',host,port,portName,machineName,tagName),
   readTagValueByInterval:(host,port,portName,machineName,tagName,interval)=>ipcRenderer.invoke('readTagValueByInterval',host,port,portName,machineName,tagName,interval),

   writeTagValue:(host,port,portName,machineName,tagName,dataType,tagValue)=>ipcRenderer.invoke('writeTagValue',host,port,portName,machineName,tagName,dataType,tagValue),
   writeTagValueByInterval:(host,port,portName,machineName,tagName,interval)=>ipcRenderer.invoke('writeTagValueByInterval',host,port,portName,machineName,tagName,interval),

   onUpdateTagValue: (callback)=>ipcRenderer.on('updateTagValuee',(_event,tagName,tagValue,tagQuality)=>callback(tagName,tagValue,tagQuality)),

   startTaskSimulateOnce:(host,port,portName,machineName,tpos,hpos,spdLock,spdUnlock,spd20,spd40,spd45,spd2020,rosCraneIdFb)=>ipcRenderer.invoke('startTaskSimulateOnce',host,port,portName,machineName,tpos,hpos,spdLock,spdUnlock,spd20,spd40,spd45,spd2020,rosCraneIdFb),
   startTaskSimulate:(host,port,portName,machineName,tpos,hpos,spdLock,spdUnlock,spd20,spd40,spd45,spd2020,rosCraneIdFb)=>ipcRenderer.invoke('startTaskSimulate',host,port,portName,machineName,tpos,hpos,spdLock,spdUnlock,spd20,spd40,spd45,spd2020,rosCraneIdFb),
   stopTaskSimulate: ()=>ipcRenderer.invoke('stopTaskSimulate'),
   many2many: ()=>ipcRenderer.invoke('many2many'),
   one2one: ()=>ipcRenderer.invoke('one2one'),
   gantryMove: ()=>ipcRenderer.invoke('gantryMove'),
   statusSignal: ()=>ipcRenderer.invoke('statusSignal'),
   boomLatchUpSimulate: ()=>ipcRenderer.invoke('boomLatchUp'),
   boomLatchDownSimulate: ()=>ipcRenderer.invoke('boomLatchDown'),
   truckLaneSimulate: ()=>ipcRenderer.invoke('truckLaneSimulate'),
   platformSimulate: ()=>ipcRenderer.invoke('platformSimulate'),
   stopSimulate:()=>ipcRenderer.invoke('stopSimulate'),
})

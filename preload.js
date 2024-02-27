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
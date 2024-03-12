// 获取按钮和输入框元素
console.log("获取按钮和输入框元素");

// const simpleForm=document.querySelector('#simpleForm');
const taskForm=document.querySelector('#taskForm');
// simpleForm.addEventListener('submit',async(e)=>{
//   e.preventDefault();
//   const formData=new FormData(simpleForm);
//   const restIp=formData.get('restIp');
//   const restPort=formData.get('restPort');
//   const portName=formData.get('portName');
//   const machineName=formData.get('machineName');
//   const tagName=formData.get('tagName');
//   const writeValue=formData.get('writeValue');
//   const continousReadChk=formData.get('terms');
//   console.log(restIp);
//   if(e.submitter.textContent==='read'){
//     console.log('read');
//     console.log(`continousReadChk=${continousReadChk}`);
//     if(continousReadChk){
//       window.api.readTagValueByInterval(restIp,restPort,portName,machineName,tagName,1000);
//     }
//     else{
//       window.api.readTagValue(restIp,restPort,portName,machineName,tagName);
//     }
//   } else if(e.submitter.textContent==='write'){
//     console.log('write');
//     window.api.writeTagValue(restIp,restPort,portName,machineName,tagName,'int16',parseInt(writeValue));
//   } else if(e.submitter.textContent==='write by 0-1-0-1') {
//     window.api.writeTagValueByInterval(restIp,restPort,portName,machineName,tagName,5000);  
//   } else if(e.submitter.textContent==='stop'){
//     window.api.stop();
//   }
  
// })
window.api.onUpdateTagValue((tagName, tagValue, tagQuality) => {
  console.log('updateTagValue'+`quality: ${tagQuality}, value: ${tagValue}`);
  const rows = document.querySelectorAll('tbody tr');
  // 遍历每一行元素，并将值赋给对应的列
  rows.forEach((row, index) => {
    const cells = row.querySelectorAll('td');
    cells[0].textContent = tagName;
    cells[1].textContent = tagValue;
    cells[2].textContent = tagQuality;
    cells[3].textContent = 0;
  });
  //document.getElementById('writeValue').textContent = tagValue;
});
var many2manyBtn=document.getElementById('many2manyBtn');
var one2oneBtn=document.getElementById('one2oneBtn');
var gantryMoveBtn=document.getElementById('gantryMoveBtn');
var statusSignalBtn=document.getElementById('statusSignalBtn');
var boomSimulateBtn=document.getElementById('boomSimulateBtn');
var truckLaneSimulateBtn=document.getElementById('truckLaneSimulateBtn');
var platformSimulateBtn=document.getElementById('platformSimulateBtn');

var stopBtn=document.getElementById('stopBtn');
var currentButtonLabel=document.getElementById('currentButton');
many2manyBtn.addEventListener('click',async(e)=>{
  console.log('many2manyBtn');
  currentButtonLabel.textContent = 'many2manyBtn running!';
  window.api.many2many();
});
one2oneBtn.addEventListener('click',async(e)=>{
  console.log('one2oneBtn');
  currentButtonLabel.textContent = 'one2oneBtn running!';
  window.api.one2one();
})
gantryMoveBtn.addEventListener('click',async(e)=>{
  console.log('gantryMoveBtn');
  currentButtonLabel.textContent = 'gantryMoveBtn running!';

  window.api.gantryMove();
});
statusSignalBtn.addEventListener('click',async(e)=>{
  console.log('statusSignalBtn');
  currentButtonLabel.textContent = 'statusSignalBtn running!';

  window.api.statusSignal();
});
boomLatchUpBtn.addEventListener('click',async(e)=>{
  console.log('boomLatchUpBtn');
  currentButtonLabel.textContent = 'boomLatchUpBtn running!';

  window.api.boomLatchUpSimulate();
});
boomLatchDownBtn.addEventListener('click',async(e)=>{
  console.log('boomLatchDownBtn');
  currentButtonLabel.textContent = 'boomLatchDownBtn running!';

  window.api.boomLatchDownSimulate();
});
truckLaneSimulateBtn.addEventListener('click',async(e)=>{
  console.log('truckLaneSimulateBtn');
  currentButtonLabel.textContent = 'truckLaneSimulateBtn running!';

  window.api.truckLaneSimulate();
});
platformSimulateBtn.addEventListener('click',async(e)=>{
  console.log('platformSimulateBtn');
  currentButtonLabel.textContent = 'platformSimulateBtn running!';

  window.api.platformSimulate();
});
stopBtn.addEventListener('click',async(e)=>{
  console.log('stopBtn');
  currentButtonLabel.textContent = 'Stoping...';
  window.api.stopSimulate();
  currentButtonLabel.textContent = '';
})
//task form
const startHttpServerBtn=document.getElementById('startHttpServer');
const stopHttpServer=document.getElementById('stopHttpServer');
const createMtTask=document.getElementById('createMtTask');
const createPtTask=document.getElementById('createPtTask');
const createQcmsEventBtn=document.getElementById('createQcmsEvent');
const createQcmsExceptionBtn=document.getElementById('createQcmsException');
startHttpServerBtn.addEventListener('click',async(e)=>{
  window.rest.restStart(8889,'');
  startHttpServerBtn.disabled=true;
  stopRestBtn.disabled=false;
});
stopHttpServer.addEventListener('click',async(e)=>{
  window.rest.restStop();
  startHttpServerBtn.disabled=false;
  stopHttpServer.disabled=true;
})
createMtTask.addEventListener('click',async(e)=>{
  window.rest.createMtTask(restPort,'');
});
createPtTask.addEventListener('click',async(e)=>{
  window.rest.createPtTask(restPort,'');
});
createQcmsEventBtn.addEventListener('click',async(e)=>{
  window.rest.createQcmsEventTask();
});
createQcmsExceptionBtn.addEventListener('click',async(e)=>{
  window.rest.createQcmsException();
});
// 1. 配置按钮的弹窗功能,获取用户输入的端口号
const restPortElement = document.getElementById('restPort');
const addRestBtn=document.getElementById('addRestBtn');
const startRestBtn=document.getElementById('startRestBtn');
const stopRestBtn=document.getElementById('stopRestBtn');

restPortElement.textContent='8889';
let restServerStart=false;
// 2. 监听请求路由地址列表中地址的双击事件,实现地址的修改功能
const addressList = document.querySelector('.rest-address-list');
addRestBtn.addEventListener('click',async(e)=>{
  const li = document.createElement('li');
  const input = document.createElement('input');
  input.className = 'rest-address-input';
  input.placeholder = 'New address';
  input.disabled = false;
  li.appendChild(input);
  addressList.appendChild(li);
  
});
startRestBtn.addEventListener('click',async(e)=>{
   const restPort=document.getElementById('restPort').textContent;
   console.log('restPort='+restPort);
   const inputs=Array.from(addressList.querySelectorAll('li input'));
   const textContents=inputs.map(input => input.value);
   window.rest.restStart(restPort,textContents);
   startRestBtn.disabled=true;
   stopRestBtn.disabled=false;
});
stopRestBtn.addEventListener('click',async(e)=>{
  window.rest.restStop();
  startRestBtn.disabled=false;
  stopRestBtn.disabled=true;
});
function toggleEdit(event) {
  const input = event.target;
  if (!input.disabled) {
    input.disabled = true;
  } else {
    input.disabled = false;
    input.focus();
  }
}
function handleKeyPress(event) {
  if (event.key === 'Enter') {
      const input = event.target;
      input.disabled = true;
  }
}
addressList.addEventListener('dblclick', toggleEdit);

addressList.addEventListener('keypress', handleKeyPress);   

// 3. 实现左上角红色悬浮数字的显示和更新
let unreadCount = 0;
const unreadCountElement = document.createElement('span');
unreadCountElement.style.position = 'absolute';
unreadCountElement.style.top = '10px';
unreadCountElement.style.left = '10px';
unreadCountElement.style.backgroundColor = 'red';
unreadCountElement.style.color = 'white';
unreadCountElement.style.padding = '5px';
unreadCountElement.style.borderRadius = '50%';
document.body.appendChild(unreadCountElement);

// window.api.onNewRequest(() => {
//   unreadCount++;
//   unreadCountElement.textContent = unreadCount;
// });

// 4. 实现右侧请求地址和监听按钮的功能
const requestUrlElement = document.getElementById('requestUrl');
const startListeningBtn = document.querySelector('.rest-right-top button');

let selectedAddress = '';
addressList.addEventListener('click', (event) => {
  selectedAddress = event.target.textContent;
    requestUrlElement.textContent = selectedAddress;
});

startListeningBtn.addEventListener('click', () => {
  if (selectedAddress) {
    // 开始监听请求
    //window.api.startListening(selectedAddress);
  }
});

window.api.onRequestReceive((requestMsg,returnMsg) => {
  console.log('onRequestReceive.'+`requestMsg: ${requestMsg}, returnMsg: ${returnMsg}`);  
  //document.getElementById('writeValue').textContent = tagValue;
});

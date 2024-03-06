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

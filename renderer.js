// 获取按钮和输入框元素
console.log("获取按钮和输入框元素");

const simpleForm=document.querySelector('#simpleForm');
const taskForm=document.querySelector('#taskForm');
simpleForm.addEventListener('submit',async(e)=>{
  e.preventDefault();
  const formData=new FormData(simpleForm);
  const restIp=formData.get('restIp');
  const restPort=formData.get('restPort');
  const portName=formData.get('portName');
  const machineName=formData.get('machineName');
  const tagName=formData.get('tagName');
  const writeValue=formData.get('writeValue');
  const continousReadChk=formData.get('terms');
  console.log(restIp);
  if(e.submitter.textContent==='read'){
    console.log('read');
    console.log(`continousReadChk=${continousReadChk}`);
    if(continousReadChk){
      window.api.readTagValueByInterval(restIp,restPort,portName,machineName,tagName,1000);
    }
    else{
      window.api.readTagValue(restIp,restPort,portName,machineName,tagName);
    }
  } else if(e.submitter.textContent==='write'){
    console.log('write');
    window.api.writeTagValue(restIp,restPort,portName,machineName,tagName,'int16',parseInt(writeValue));
  } else if(e.submitter.textContent==='write by 0-1-0-1') {
    window.api.writeTagValueByInterval(restIp,restPort,portName,machineName,tagName,5000);  
  } else if(e.submitter.textContent==='stop'){
    window.api.stop();
  }
  
})
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

//task form
taskForm.addEventListener('submit',async(e)=>{
  e.preventDefault();
  const formData=new FormData(taskForm);
  const restIp=formData.get('restIp');
  const restPort=formData.get('restPort');
  const portName=formData.get('portName');
  const machineName=formData.get('machineName');

  const trolleyPosTag=formData.get('trolleyPos');
  const hoistPosTag=formData.get('hoistPos');
  const spreaderLockTag=formData.get('spreaderLock');
  const spreaderUnlockTag=formData.get('spreaderUnlock');
  const spreader20Tag=formData.get('spreader20');
  const spreader40Tag=formData.get('spreader40');
  const spreader45Tag=formData.get('spreader45');
  const spreader2020Tag=formData.get('spreader2020');

  const rosCraneIDFBTag=formData.get('rosCraneIdFeedback');

  console.log(restIp);
  if(e.submitter.textContent==='Start simulate task once'){
    console.log('Start simulate task once');
    window.api.startTaskSimulateOnce(restIp,restPort,portName,machineName,trolleyPosTag,hoistPosTag,spreaderLockTag,spreaderUnlockTag,spreader20Tag,spreader40Tag,spreader45Tag,spreader2020Tag,rosCraneIDFBTag);

  } else if(e.submitter.textContent==='Start simulate task continuously'){
    console.log('Start simulate task continuously');
    window.api.startTaskSimulate(restIp,restPort,portName,machineName,trolleyPosTag,hoistPosTag,spreaderLockTag,spreaderUnlockTag,spreader20Tag,spreader40Tag,spreader45Tag,spreader2020Tag,rosCraneIDFBTag);

  } else if(e.submitter.textContent==='stop'){
    console.log('stop simulate task ');
    window.api.stopTaskSimulate();
  }

})
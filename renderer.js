// 获取按钮和输入框元素
console.log("获取按钮和输入框元素");
// const testRedisConnectionBtn = document.getElementById('testRedisConnection');
// const startEvaluationBtn = document.getElementById('startEvaluation');

// const redisAddressInput = document.getElementById('redisAddress');
// const redisPortInput = document.getElementById('redisPort');
// const redisDBInput = document.getElementById('redisDB');

// const portNameInput = document.getElementById('portName');
// const machineNameInput = document.getElementById('machineName');
// const tagNameInput = document.getElementById('tagName');
// const tagValueLabel = document.getElementById('tagValue');

// tagValueLabel.innerText="not read"

// document.addEventListener('DOMContentLoaded', function() {
//   portNameInput.value="WebDV"
//   machineNameInput.value="ROS01"
//   tagNameInput.value="DV_ROS.ROS.ROS.EXR_CraneID_FB"
//   redisAddressInput.value="10.128.231.141"
//   redisPortInput.value="31079"
// });

// // 绑定测试连接按钮点击事件
// testRedisConnectionBtn.addEventListener('click', async () => {

//   // 获取按钮和输入框元素
//   console.log("testRedisConnectionBtn click");

//   const address = redisAddressInput.value;
//   const port = redisPortInput.value;
//   const db = redisDBInput.value;
//   // 这里可以编写测试连接的逻辑

//   try {
//     const response = await window.redisHelper.testConnect(address,port);
//     console.log(response);
//     alert(response?'connect success!':'connect failed!')
//   }
//   catch(error){
//     console.error(error);
//     alert(error)
//   }
// });

// // 绑定启动评估按钮点击事件
// startEvaluationBtn.addEventListener('click', async () => {
//   // 获取按钮和输入框元素
//   console.log("startEvaluationBtn click");
//   try {
//     const address = redisAddressInput.value;
//     const port = redisPortInput.value;
//     const portName=portNameInput.value;
//     const machineName=machineNameInput.value;
//     const tagName=tagNameInput.value;
//     const response = await window.redisHelper.curTagValue(address,port,portName,machineName,tagName);
//     console.log(response);
//     var jsonObj=JSON.parse(response);
//     tagValueLabel.innerText='quality:'+jsonObj.quality+',value:'+jsonObj.value;
//   }
//   catch(error){
//     console.error(error);
//   }
//   // const expression = expressionInput.value;
//   // // 这里可以编写启动评估的逻辑
//   // resultParagraph.textContent = `Evaluating expression: ${expression}...`;
// });




const form=document.querySelector('form');

form.addEventListener('submit',async(e)=>{
  e.preventDefault();
  const formData=new FormData(form);
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
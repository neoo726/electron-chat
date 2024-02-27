
// 获取按钮和输入框元素
console.log("获取按钮和输入框元素");
const testRedisConnectionBtn = document.getElementById('testRedisConnection');
const startEvaluationBtn = document.getElementById('startEvaluation');

const redisAddressInput = document.getElementById('redisAddress');
const redisPortInput = document.getElementById('redisPort');
const redisDBInput = document.getElementById('redisDB');

const portNameInput = document.getElementById('portName');
const machineNameInput = document.getElementById('machineName');
const tagNameInput = document.getElementById('tagName');
const tagValueLabel = document.getElementById('tagValue');

tagValueLabel.innerText="not read"

document.addEventListener('DOMContentLoaded', function() {
  portNameInput.value="WebDV"
  machineNameInput.value="ROS01"
  tagNameInput.value="DV_ROS.ROS.ROS.EXR_CraneID_FB"
  redisAddressInput.value="10.128.231.141"
  redisPortInput.value="31079"
});

// 绑定测试连接按钮点击事件
testRedisConnectionBtn.addEventListener('click', async () => {

  // 获取按钮和输入框元素
  console.log("testRedisConnectionBtn click");

  const address = redisAddressInput.value;
  const port = redisPortInput.value;
  const db = redisDBInput.value;
  // 这里可以编写测试连接的逻辑

  try {
    const response = await window.redisHelper.testConnect(address,port);
    console.log(response);
    alert(response?'connect success!':'connect failed!')
  }
  catch(error){
    console.error(error);
    alert(error)
  }
});

// 绑定启动评估按钮点击事件
startEvaluationBtn.addEventListener('click', async () => {
  // 获取按钮和输入框元素
  console.log("startEvaluationBtn click");
  try {
    const address = redisAddressInput.value;
    const port = redisPortInput.value;
    const portName=portNameInput.value;
    const machineName=machineNameInput.value;
    const tagName=tagNameInput.value;
    const response = await window.redisHelper.curTagValue(address,port,portName,machineName,tagName);
    console.log(response);
    var jsonObj=JSON.parse(response);
    tagValueLabel.innerText='quality:'+jsonObj.quality+',value:'+jsonObj.value;
  }
  catch(error){
    console.error(error);
  }
  // const expression = expressionInput.value;
  // // 这里可以编写启动评估的逻辑
  // resultParagraph.textContent = `Evaluating expression: ${expression}...`;
});
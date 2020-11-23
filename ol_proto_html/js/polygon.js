var imgWidth = 24000;
var imgHeight = 24000;
var zoomifyUrl = 'http://braincircuits.org/cgi-bin/iipsrv.fcgi?FIF=/PMD2057/PMD2057%262056-F9-2015.03.06-17.55.48_PMD2057_1_0025.jp2&GAM=1&MINMAX=1:0,255&MINMAX=2:0,255&MINMAX=3:0,255&JTL={z},{tileIndex}';


var dropdown = document.getElementById('dd_interaction'); 
var combine  = document.getElementById("combine");
var saveFile  = document.getElementById("saveFeatures");
var loadFile  = document.getElementById("loadFeatures");

mapInit(imgWidth,imgHeight,zoomifyUrl);
addInteractions();
addListerner();

dropdown.addEventListener('change', function (event) {
    var value = event.currentTarget.value;
    if(value=="Add"){
      setActive(1);
    }
    else if(value=="Erase"){
      setActive(2);
    }
    else {
      setActive();
    }

});
  
combine.addEventListener('click',function(){
  unionDifference();
});

saveFile.addEventListener('click',function(){
  console.log("e")
  var json = saveFeatures();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(json, null, 2)], {
    type: "text/plain"
  }));
  a.setAttribute("download", "feature.json");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

loadFeatures.addEventListener('change',function(){
 
  console.log("Files",loadFeatures);

});

function loadData(){
  const reader = new FileReader();
  reader.readAsText(loadFile.files[0]);
  reader.onload = handleFileLoad;
}

function handleFileLoad(event){
  console.log(event.target.result);
  loadFeatures(event.target.result);
  //document.getElementById('fileContent').textContent = event.target.result;
}








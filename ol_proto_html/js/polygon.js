var imgWidth = 24000;
var imgHeight = 24000;
var zoomifyUrl = 'http://braincircuits.org/cgi-bin/iipsrv.fcgi?FIF=/PMD2057/PMD2057%262056-F9-2015.03.06-17.55.48_PMD2057_1_0025.jp2&GAM=1&MINMAX=1:0,255&MINMAX=2:0,255&MINMAX=3:0,255&JTL={z},{tileIndex}';


var dropdown = document.getElementById('dd_interaction'); 
var combine  = document.getElementById("combine");
var saveFile  = document.getElementById("saveFeatures");
var loadFile  = document.getElementById("loadFeatures");


var map = 0;
var vector = 0;
var styleAdd = 0;
var styleErase = 0;
var addPolygonInteraction = 0;
var erasePolygonInteraction = 0;
var format = new ol.format.GeoJSON();
//const polygonClipping = require('polygon-clipping')
var saveJson = {
  "firstpassAtlas":{

  },
  "userActions":[],
  "outputCombine":{

  }
}

function mapInit(imgWidth,imgHeight,zoomifyUrl){
    
    var source = new ol.source.Zoomify({
        url: zoomifyUrl,
        size: [imgWidth, imgHeight],
        crossOrigin: 'anonymous',
        zDirection: -1, // Ensure we get a tile with the screen resolution or higher
      });
    var extent = source.getTileGrid().getExtent();
    var imagery = new ol.layer.Tile({
        source: source,
    });
      
    vector = new ol.layer.Vector({
        source: new ol.source.Vector({wrapX: false}),
    });
    
    map = new ol.Map({
        layers: [imagery,vector],
        target: 'map',
        view: new ol.View({
          resolutions: imagery.getSource().getTileGrid().getResolutions(),
          extent: extent,
          constrainOnlyCenter: true,
        }),
      });
    map.getView().fit(extent);
    createInteraction();

}

function createInteraction(){
  styleAdd = new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(0, 255, 0, 0.1)',
      }),
      stroke: new ol.style.Stroke({
        color: '#28a745',
        width: 3,
      }),
      image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
              color: '#28a745'
            }),
            stroke: new ol.style.Stroke({
              color: 'white',
              width: 2,
            }),
      })
  });
  
  styleErase = new  ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 170, 70, 0.1)',
    }),
    stroke: new ol.style.Stroke({
      color: '#f0ad4e',
      width: 3,
    }),
    image: new ol.style.Circle({
          radius: 7,
          fill: new ol.style.Fill({
            color: '#f0ad4e'
          }),
          stroke: new ol.style.Stroke({
            color: 'white',
            width: 2,
          }),
    })
  });

  addPolygonInteraction = new ol.interaction.Draw({
      source: vector.getSource(),
      type: "Polygon",
      style: styleAdd,
   });
    
  erasePolygonInteraction = new ol.interaction.Draw({
      source: vector.getSource(),
      type: "Polygon",
      style: styleErase,
  });
}


function addInteractions(){

    map.addInteraction(addPolygonInteraction);
    map.addInteraction(erasePolygonInteraction);
    addPolygonInteraction.setActive(true);
    erasePolygonInteraction.setActive(false);

}


function addListerner(){
    vector.on("prerender",function(event){
        var vector_sr = vector.getSource();
        var features = vector_sr.getFeatures();
        if(erasePolygonInteraction.getActive() == true && features[features.length - 1].getStyle() == null){
              features[features.length -1].setStyle(styleErase);
              features[features.length -1].set("name","erase");
              var temp = {"action":"Erase","geoJson":JSON.parse(format.writeFeatures([features[features.length -1]]))}
              saveJson["userActions"].push(temp);

        }
        else if(addPolygonInteraction.getActive() == true && features[features.length - 1].getStyle() == null){
              features[features.length -1].setStyle(styleAdd);
              features[features.length -1].set("name","add");
              
              var temp = {"action":"Add","geoJson":JSON.parse(format.writeFeatures([features[features.length -1]]))}
              saveJson["userActions"].push(temp);
        }
    
    });
}


function saveFeatures(){
  var vector_sr = vector.getSource();
  var features = vector_sr.getFeatures();
   return format.writeFeatures(features) ;
}

function loadFeatures(content){
  var vector_sr = vector.getSource();
  var features = vector_sr.getFeatures();
  console.log(JSON.parse(content)["outputCombine"],"ertyui")
  content = JSON.parse(content);
  if(content["outputCombine"] != undefined){
      var featuresToLoad = format.readFeatures(content["outputCombine"]);
      console.log(featuresToLoad);
      for(var i=0;i<featuresToLoad.length;i++){
          if(featuresToLoad[i].get("name")=="add"){
              featuresToLoad[i].setStyle(styleAdd);
          }
          else if(featuresToLoad[i].get("name")=="erase"){
              featuresToLoad[i].setStyle(styleErase);
          }
          vector_sr.addFeature(featuresToLoad[i]);
      }
    saveJson["firstpassAtlas"] =  content["outputCombine"]; 
  }
  
}






mapInit(imgWidth,imgHeight,zoomifyUrl);
addInteractions();
addListerner();

dropdown.addEventListener('change', function (event) {
    var value = event.currentTarget.value;
    if(value=="Add"){
      addPolygonInteraction.setActive(true);
      erasePolygonInteraction.setActive(false);
    }
    else if(value=="Erase"){
      addPolygonInteraction.setActive(false);
      erasePolygonInteraction.setActive(true);
    }
    else {
      addPolygonInteraction.setActive(false);
      erasePolygonInteraction.setActive(false);
    }

});
  
combine.addEventListener('click',function(){
  unionDifference();
  var vector_sr = vector.getSource();
  var features = vector_sr.getFeatures();
  saveJson["outputCombine"] = JSON.parse(format.writeFeatures(features));

});

saveFile.addEventListener('click',function(){
  console.log("Saving File")
  var json = saveJson;///saveFeatures();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(json, null, 2)], {
    type: "text/plain"
  }));
  a.setAttribute("download", "feature.json");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

function loadData(){
  const reader = new FileReader();
  reader.readAsText(loadFile.files[0]);
  reader.onload = handleFileLoad;
}

function handleFileLoad(event){
  loadFeatures(event.target.result);
}








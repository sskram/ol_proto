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
var featureStack = [];
var lastol_uid=0;
var last_size = 0;
var format = new ol.format.GeoJSON(); //Geojson to read and write features

//json format
var saveJson = {
  "firstpassAtlas":{},
  "userActions":[],
  "outputCombine":{}
};


// create interactions for the vector layer and create styles for interactions
function createInteraction(){

  styleAdd = new ol.style.Style({ //Create style for add interaction
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

  styleErase = new  ol.style.Style({ //Create style for erase interaction
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

  addPolygonInteraction = new ol.interaction.Draw({ //create polygon interaction for add
      source: vector.getSource(),
      type: "Polygon",
      style: styleAdd,
  });
    
  erasePolygonInteraction = new ol.interaction.Draw({ //create polygon interaction for erase
      source: vector.getSource(),
      type: "Polygon",
      style: styleErase,
  });
}


//Function to initalize map and layers
function mapInit(imgWidth,imgHeight,zoomifyUrl){
    
    var source = new ol.source.Zoomify({ //init zoomify source
        url: zoomifyUrl,
        size: [imgWidth, imgHeight],
        crossOrigin: 'anonymous',
        zDirection: -1, // Ensure we get a tile with the screen resolution or higher
      });
    var extent = source.getTileGrid().getExtent();
    var imagery = new ol.layer.Tile({ 
        source: source,
    });
      
    vector = new ol.layer.Vector({ // init vector layer
        source: new ol.source.Vector({wrapX: false}),
    });
    
    map = new ol.Map({ //init map
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

//add interactions to the map
function addInteractions(){

    map.addInteraction(addPolygonInteraction);
    map.addInteraction(erasePolygonInteraction);
    addPolygonInteraction.setActive(true);
    erasePolygonInteraction.setActive(false);

}

//add prerender eventlistener for vector layer to avoid styele change after drawing polygon.
function addListener(){
    vector.on("prerender",function(event){
        var vector_sr = vector.getSource();
        var features = vector_sr.getFeatures();
        var bugFeature = [];
        if(parseInt(features[features.length-1].ol_uid)>lastol_uid == true)
        { 
            if(erasePolygonInteraction.getActive() == true && features[features.length - 1].getStyle() == null ){ //check if style is already set
                  features[features.length -1].setStyle(styleErase);
                  features[features.length -1].set("name","erase");
                  featureStack.push(features[features.length -1]);
                  var temp = {"action":"Erase","geoJson":JSON.parse(format.writeFeatures([features[features.length -1]]))}
                  saveJson["userActions"].push(temp);   
                  lastol_uid = parseInt(features[features.length -1].ol_uid);
                  last_size = last_size+1;    
            }
            else if(addPolygonInteraction.getActive() == true && features[features.length - 1].getStyle() == null){//check if style is already set
                  features[features.length -1].setStyle(styleAdd);
                  features[features.length -1].set("name","add");
                  featureStack.push(features[features.length -1]);
                  var temp = {"action":"Add","geoJson":JSON.parse(format.writeFeatures([features[features.length -1]]))}
                  saveJson["userActions"].push(temp);
                  lastol_uid = parseInt(features[features.length -1].ol_uid);
                  last_size = last_size+1;     
            }
        }
        else if(features.length > last_size){ // the feature in vector source are not ordered due to last feature added to vector.
            
            var flag = 0;
            for(var i =0;i<features.length;i++){
              if(parseInt(features[i].ol_uid)>lastol_uid){//get the feature which caused disorder in vector source
                    bugFeature = features[i];
                    
                    flag = 1;
                    vector_sr.removeFeature(vector_sr.getFeatureByUid(features[i].ol_uid));      
              } 
            }
            if(flag == 1){
              if(addPolygonInteraction.getActive() == true){
                bugFeature.setStyle(styleAdd);
                bugFeature.set("name","add");
              }
              else{
                bugFeature.setStyle(styleErase);
                bugFeature.set("name","erase");
              }
              vector_sr.addFeature(bugFeature);
              featureStack.push(bugFeature);
              var temp = {"action":"Erase","geoJson":JSON.parse(format.writeFeatures([bugFeature]))}
              saveJson["userActions"].push(temp);
              last_size = last_size+1;
              lastol_uid = parseInt(bugFeature.ol_uid);
            }
          
        }     
    });  
}

//function to combine the polygons and convert features to json for downloading
function saveFeatures(){
    combinePolygon();
    var vector_sr = vector.getSource();
    var features = vector_sr.getFeatures();
    return format.writeFeatures(features) ;
}

//function to load the features from json
function loadFeatures(content){
    var vector_sr = vector.getSource();
    var features = vector_sr.getFeatures();
  
    content = JSON.parse(content);
    if(content["outputCombine"]["type"]!= undefined || content["outputCombine"].length!=undefined ){
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

mapInit(imgWidth,imgHeight,zoomifyUrl); //initialize map
addInteractions(); //add interactions to map
addListener(); //add eventlistner to map

//function to handle interactions with map 
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

//set check point
function setCheckpoint(){
    saveJson["userActions"] = [];
    saveJson["firstpassAtlas"] = saveJson["outputCombine"]
    saveJson["outputCombine"] = {};
}

//function to combine all the features
function combinePolygon(){
    var vector_sr = vector.getSource();
    
    var sty = new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(0,255,255, 0.1)',
      }),
      stroke: new ol.style.Stroke({
        color: '	#00FFFF',
        width: 3,
      })
    });
    var obj = unionDifference(vector_sr,featureStack,format);
    var polygon = obj["polygon"];
    var count = obj["count"];
    if(count>0 && polygon!=null){  
      polygon = format.readFeatures(polygon)[0]
      polygon.setStyle(sty);
      lastol_uid = parseInt(polygon.ol_uid);
      last_size = 1;
      featureStack = [polygon];
      console.log("combined",lastol_uid);
      var features = vector_sr.getFeatures();
      
      vector_sr.addFeature(polygon);
    }
    vector.setSource(vector_sr);
    
    saveJson["outputCombine"] = JSON.parse(format.writeFeatures(features));
}


combine.addEventListener('click',function(){
    combinePolygon();
});

//save the features as json 
saveFile.addEventListener('click',function(){
    console.log("Saving File");
    combinePolygon();
    var json = saveJson;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(json, null, 2)], {
      type: "text/plain"
    }));
    a.setAttribute("download", "feature.json");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setCheckpoint();  
});

//load file from input and read file
function loadData(){
    const reader = new FileReader();
    reader.readAsText(loadFile.files[0]);
    reader.onload = handleFileLoad;
}

function handleFileLoad(event){
    loadFeatures(event.target.result);
}
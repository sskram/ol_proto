var map = 0;
var vector = 0;
var styleAdd = 0;
var styleErase = 0;
var addPolygonInteraction = 0;
var erasePolygonInteraction = 0;
var format = new ol.format.GeoJSON();
//const polygonClipping = require('polygon-clipping')


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

function addInteractions(){

    map.addInteraction(addPolygonInteraction);
    map.addInteraction(erasePolygonInteraction);
    addPolygonInteraction.setActive(true);
    erasePolygonInteraction.setActive(false);

}

function setActive(state=0){

    if(state==1){
        addPolygonInteraction.setActive(true);
        erasePolygonInteraction.setActive(false);
    }
    else if(state==2){
        addPolygonInteraction.setActive(false);
        erasePolygonInteraction.setActive(true);
    }
    else if(state==0) {
        addPolygonInteraction.setActive(false);
        erasePolygonInteraction.setActive(false);
    }

}

function addListerner(){
    vector.on("prerender",function(event){
        var vector_sr = vector.getSource();
        var features = vector_sr.getFeatures();
        if(erasePolygonInteraction.getActive() == true && features[features.length - 1].getStyle() == null){
              features[features.length -1].setStyle(styleErase);
              features[features.length -1].set("name","erase");
        }
        else if(addPolygonInteraction.getActive() == true && features[features.length - 1].getStyle() == null){
              features[features.length -1].setStyle(styleAdd);
              features[features.length -1].set("name","add");
        }
    
    });
}

function unionDifference(){
    var vector_sr = vector.getSource();
    var features = vector_sr.getFeatures();
    var turfpoly;
    var polygon;
    var count = 0;
    var sty = new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(0,255,255, 0.1)',
      }),
      stroke: new ol.style.Stroke({
        color: '	#00FFFF',
        width: 3,
      })
    });

    var last = 0;
    
    for(var i = 0;i<features.length;i++){
      
        turfpoly = format.writeFeatureObject(features[i]);
        if(count>0){
            if(features[i].get('name')=="add"){
              var uid = features[i].ol_uid;
              vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));
              //console.log(isIntersected," check");
              polygon = turf.union(polygon,turfpoly);
            }
            else if(count>0 && features[i].get('name')=="erase"){
              var uid = features[i].ol_uid;
              vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));
              last = polygon;
              polygon = turf.difference(polygon,turfpoly);
              if(polygon==null){
                //console.log(turf.getCoords(polygon)[0],"points");
                //var points = turf.points(turf.getCoords(polygon)[0]);
                //var len = points.features.length;
                //if(false && turf.pointsWithinPolygon(points,turfpoly).features.length==len){
                //  polygon = turf.difference(polygon,turfpoly);
                //}
                //else{
                  //polygon = turf.difference(turf.toWgs84(polygon),turf.toWgs84(turfpoly));//
                  var poly1 = turf.getCoords(last);
                  var poly2 = turf.getCoords(turfpoly);
                  var polyDiff = polygonClipping.difference(poly1,poly2);
                  polyDiff = turf.multiPolygon(polyDiff);
                  polygon = polyDiff;
                //} 
              }
            }
        }
        else{ 
          var uid = features[i].ol_uid;
          vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));
          polygon = format.writeFeatureObject(features[i]);
          count = count+1;
        }
    }
    if(count>0 && polygon!=null){  
        polygon = format.readFeatures(polygon)[0]
        polygon.setStyle(sty);
        vector_sr.addFeature(polygon);
    }
    //console.log(vector_sr.getFeatures());
    vector.setSource(vector_sr);
}

function saveFeatures(){
    var vector_sr = vector.getSource();
    var features = vector_sr.getFeatures();
     return format.writeFeatures(features) ;
}

function loadFeatures(content){
    var vector_sr = vector.getSource();
    var features = vector_sr.getFeatures();
    var featuresToLoad = format.readFeatures(JSON.parse(content));
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
}
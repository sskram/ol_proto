/*import 'ol/ol.css';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import GeoJSON from 'ol/format/GeoJSON';
import View from 'ol/View';
import Zoomify from 'ol/source/Zoomify';
import Draw from 'ol/interaction/Draw';
import  VectorSource from 'ol/source/Vector'; 
import VectorLayer from 'ol/layer/Vector';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
*/
var imgWidth = 24000;
var imgHeight = 24000;
var zoomifyUrl = 'http://braincircuits.org/cgi-bin/iipsrv.fcgi?FIF=/PMD2057/PMD2057%262056-F9-2015.03.06-17.55.48_PMD2057_1_0025.jp2&GAM=1&MINMAX=1:0,255&MINMAX=2:0,255&MINMAX=3:0,255&JTL={z},{tileIndex}';

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
  
var vector = new ol.layer.Vector({
    source: new ol.source.Vector({wrapX: false}),
});

var map = new ol.Map({
    layers: [imagery,vector],
    target: 'map',
    view: new ol.View({
      resolutions: imagery.getSource().getTileGrid().getResolutions(),
      extent: extent,
      constrainOnlyCenter: true,
    }),
  });
map.getView().fit(extent);

var dropdown = document.getElementById('dd_interaction'); 
var combine  = document.getElementById("combine");


var styleAdd = new ol.style.Style({
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

var styleErase = new  ol.style.Style({
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


var addPolygonInteraction = new ol.interaction.Draw({
    source: vector.getSource(),
    type: "Polygon",
    style: styleAdd,
  });
  
var erasePolygonInteraction = new ol.interaction.Draw({
    source: vector.getSource(),
    type: "Polygon",
    style: styleErase,
  });

map.addInteraction(addPolygonInteraction);
map.addInteraction(erasePolygonInteraction);
addPolygonInteraction.setActive(true);
erasePolygonInteraction.setActive(false);


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
      s
    }

});

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

combine.addEventListener('click',function(){
    var vector_sr = vector.getSource();
    var features = vector_sr.getFeatures();
    var format = new ol.format.GeoJSON();
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
    var isIntersected = 0;
    for(var i = 0;i<features.length;i++){
      
        turfpoly = format.writeFeatureObject(features[i]);
        if(count>0){
            if(features[i].get('name')=="add"){
              var uid = features[i].ol_uid;
              vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));
              isIntersected = turf.intersect(polygon,turfpoly);
              //console.log(isIntersected," check");
              polygon = turf.union(polygon,turfpoly);
            }
            else if(count>0 && features[i].get('name')=="erase"){
              var uid = features[i].ol_uid;
              vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));
              polygon = turf.difference(polygon,turfpoly);
            }
        }
        else{ 
          var uid = features[i].ol_uid;
          vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));
          polygon = format.writeFeatureObject(features[i]);
          count = count+1;
        }
    }
    if(count>0){  
        polygon = format.readFeatures(polygon)[0]
        polygon.setStyle(sty);
        vector_sr.addFeature(polygon);
    }
    console.log(vector_sr.getFeatures());
    vector.setSource(vector_sr);
  });









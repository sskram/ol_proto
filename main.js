import 'ol/ol.css';
import ol from 'ol';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import GeoJSON from 'ol/format/GeoJSON';
import View from 'ol/View';
import Zoomify from 'ol/source/Zoomify';
import Draw from 'ol/interaction/Draw';
import  VectorSource from 'ol/source/Vector';
import Static from 'ol/source/ImageStatic';
import ImageLayer from 'ol/layer/Image';
import ImageSource from './ImageCanvas.js';
import Projection from 'ol/proj/Projection';  
import VectorLayer from 'ol/layer/Vector';
import ImageCanvasSource from 'ol/source/ImageCanvas';
import MousePosition from 'ol/control/MousePosition';
import {createStringXY} from 'ol/coordinate';
import DragPan from 'ol/interaction/DragPan';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';

var imgWidth = 12000;
var imgHeight = 12000;
//iipbase = "http://braincircuits.org/cgi-bin";
//sectionaccessurl = 'http://mitradevel.cshl.org/webtools/seriesbrowser/getsectionjp2path/'+sectionid;
var zoomifyUrl = 'http://braincircuits.org/cgi-bin/iipsrv.fcgi?FIF=/PMD2057/PMD2057%262056-F9-2015.03.06-17.55.48_PMD2057_1_0025.jp2&GAM=1&MINMAX=1:0,255&MINMAX=2:0,255&MINMAX=3:0,255&JTL={z},{tileIndex}';
//var zoomifyUrl = 'https://ol-zoomify.surge.sh/zoomify/';
var proj = new Projection({
  code: 'ZOOMIFY',
  units: 'pixels',
  extent: [0, 0, imgWidth, imgHeight]
});

var source = new Zoomify({
  url: zoomifyUrl,
  size: [imgWidth, imgHeight],
  crossOrigin: 'anonymous',
  zDirection: -1, // Ensure we get a tile with the screen resolution or higher
});
var extent = source.getTileGrid().getExtent();
//source.setTileGridForProjection(proj, tilegrid);

var imagery = new TileLayer({
  source: source,
});

var vector = new VectorLayer({
  source: new VectorSource({wrapX: false}),
});

var draw = true;
var canvas = document.createElement('canvas');
// Set dimensions of image.
canvas.width = imgWidth;
canvas.height = imgHeight;
var ctx = canvas.getContext('2d');
ctx.fillStyle = 'red';
//ctx.fillRect(0,0,1000,1000);
console.log(canvas.width,canvas.height)
let extent_1 = [0, -canvas.width, canvas.height ,0];
let projection = new Projection({
   code: 'OVERLAY',
   units: 'pixels',
   extent: source.getTileGrid().getExtent(),
});

//https://stackoverflow.com/questions/49169150/creating-custom-canvas-on-top-of-openlayers-map
//static canvas image - https://gist.github.com/mzur/d0ca83858c0f4e3bae807e1857801621
//Overlay -- https://stackoverflow.com/questions/33824105/openlayers3-more-than-one-overlay-at-a-time

var static_layer =new ImageLayer({
  source: new ImageSource({
    canvas: canvas,
    projection: projection,
    imageExtent: source.getTileGrid().getExtent(),
  }),
});


var map = new Map({
  layers: [imagery,vector,static_layer],
  target: 'map',
  view: new View({
    // adjust zoom levels to those provided by the source
    resolutions: imagery.getSource().getTileGrid().getResolutions(),
    // constrain the center: center cannot be set outside this extent
    extent: extent,
    constrainOnlyCenter: true,
  }),
});
map.getView().fit(extent);
static_layer.setZIndex(1001);


var stringifyFunc = createStringXY(4);

var mousepos = new MousePosition( {
  coordinateFormat: stringifyFunc,
  projection: map.getView().getProjection(),  
  target: 'mouse-position',
  undefinedHTML: '-position-'
});

map.addControl(mousepos);

var dropdown = document.getElementById('dd_interaction'); 

var drawinteraction = new Draw({
  source: vector.getSource(),
  type: "Polygon",
});

var lineinteraction = new Draw({
  source:vector.getSource(),
  type:"LineString",
  freehand: true,
})

map.addInteraction(drawinteraction);
map.addInteraction(lineinteraction);

drawinteraction.setActive(false);
lineinteraction.setActive(false);

var paninteraction;
map.getInteractions().forEach(function(intr,idx,all) {
  if (intr instanceof DragPan) {
    intr.setActive(false);
    paninteraction = intr;
  }
});

dropdown.addEventListener('change', function (event) {
    var value = event.currentTarget.value;
    if (value == "polygon") {
      draw = false;
      drawinteraction.setActive(true);
      paninteraction.setActive(false);
      lineinteraction.setActive(false);
    }
    else if(value=="pan"){1
      draw = false;
      drawinteraction.setActive(false);
      paninteraction.setActive(true);
      lineinteraction.setActive(false);
    }
    else if(value=="LineString"){
      draw = false;
      drawinteraction.setActive(false);
      paninteraction.setActive(false);
      lineinteraction.setActive(true);
    }
    else if(value=="Add"){
      draw = false;
      drawinteraction.setActive(false);
      paninteraction.setActive(false);
      lineinteraction.setActive(false);
    }
    else if(value=="Erase"){
      draw = false;
      drawinteraction.setActive(false);
      paninteraction.setActive(false);
      lineinteraction.setActive(false);
    }
    else {
      
      drawinteraction.setActive(false);
      paninteraction.setActive(false);
      lineinteraction.setActive(false);
      //set flags for paint
      if(value=="threshold") {
        thresholdred(imagerycontext);
      }
      if(value=="paint") {
        draw = true;
      }
    }

});

function get_points(coords){
  
  var points = [];
  
  points[0] = Math.round(coords[0]);
  points[1] = Math.round(coords[1]);
  points[1] = Math.abs(points[1]);

  return points;
}


map.on('click', function(event) {
  //if paint flag ...
      if(draw == true){
        var pix = event.pixel;
        var coords = get_points(event.coordinate);
        ctx.fillStyle='red';
        //console.log(pix[0],pix[1])
        ctx.fillRect(coords[0],coords[1],50,50);

        var vector_sr = vector.getSource();
        var features = vector_sr.getFeatures();

        var sor = static_layer.getSource();
        sor.image_.canvas_ = canvas;
        var static_source = new ImageSource({
          canvas: canvas,
          projection: projection,
          imageExtent: source.getTileGrid().getExtent(),
        });
      
        static_layer.setSource(static_source);

      }


});


vector.on("prerender",function(event){
  //console.log("ended");
    var vector_sr = vector.getSource();
    var features = vector_sr.getFeatures();
    //console.log( features[features.length-1].get("name") );
    if(features.length>=1)
      {   
          var coord = features[0].values_.geometry.flatCoordinates;
          var uid = features[0].ol_uid;
          //console.log(features[0],coord.length,coord,uid,vector_sr.getFeatureByUid(uid));

          var points = [];
          if(features[features.length-1].getGeometry().getType()=="Polygon" || features[0].getGeometry().getType()=="LineString"){
              
              ctx.strokeStyle="red";
              ctx.lineWidth = 5;

              if(features[0].getGeometry().getType()=="LineString"){
                ctx.strokeStyle="cyan";
                ctx.lineWidth = 5;
              }
              ctx.beginPath();
              
              for(var i=0;i<coord.length;){

                  points = get_points([coord[i],coord[i+1]]);
                  //console.log(points[0],points[1],i);
                  
                  if(i == 0){
                    ctx.moveTo(points[0],points[1]);
                  }
                  if(i<coord.length){
                    
                    ctx.lineTo(points[0],points[1]);
                  }

                  i = i+2;
              }
              
              ctx.stroke();
          }
          
          vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));

          var sor = static_layer.getSource();
          sor.image_.canvas_ = canvas;
          var static_source = new ImageSource({
              canvas: canvas,
              projection: projection,
              imageExtent: source.getTileGrid().getExtent(),
          });
    
          static_layer.setSource(static_source);

      }
});


map.on("pointerdrag",function(event){
  if(draw == true){
      
      var pix = event.pixel;
    
      var coords = get_points(event.coordinate);
      ctx.fillRect(coords[0],coords[1],50,50);
      var sor = static_layer.getSource();
      sor.image_.canvas_ = canvas;

      var static_source = new ImageSource({
        canvas: canvas,
        projection: projection,
        imageExtent: source.getTileGrid().getExtent(),
      });
      //console.log(coords);
      static_layer.setSource(static_source);

  }

});

var imagerycontext;
imagery.on('postrender', function (event) {
  // var context = event.context;
  imagerycontext = event.context;  
});

function thresholdred(context) {
  var width = context.canvas.width;
  var height = context.canvas.height;

  var inputData = context.getImageData(0, 0, width, height).data;

  var output = context.createImageData(width, height);
  var outputData = output.data;
  for (var pixelY = 0; pixelY < height; ++pixelY) {
    for (var pixelX = 0; pixelX < width; ++pixelX) {
      var inputIndex = (pixelY * width + pixelX) * 4;
      //  var rgba = inputData.slice(inputIndex,inputIndex+4);
        var  r = inputData[inputIndex];
        var  g = inputData[inputIndex + 1];
        var  b = inputData[inputIndex + 2];
        var  a = inputData[inputIndex + 3];
        if (r>g) {
          outputData[inputIndex]=0;
        }
        else {
          for(var ci=0;ci<4;ci++) {
            outputData[inputIndex+ci]=inputData[inputIndex+ci];
          }
        }
      }
    }
    context.putImageData(output, 0, 0);
}
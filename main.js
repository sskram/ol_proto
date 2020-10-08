import 'ol/ol.css';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import Image from 'ol/layer/Image'
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

var imgWidth = 4000;
var imgHeight = 3000;

var zoomifyUrl = 'https://ol-zoomify.surge.sh/zoomify/';

var source = new Zoomify({
  url: zoomifyUrl,
  size: [imgWidth, imgHeight],
  crossOrigin: 'anonymous',
  zDirection: -1, // Ensure we get a tile with the screen resolution or higher
});
var extent = source.getTileGrid().getExtent();


var imagery = new TileLayer({
  source: source,
});

var vector = new VectorLayer({
  source: new VectorSource({wrapX: false}),
});


var  canvas = document.createElement('canvas');
// Set dimensions of image.
canvas.width = imgWidth;
canvas.height = imgHeight;
var ctx = canvas.getContext('2d');
ctx.fillStyle = 'red';
ctx.fillRect(0, 0, 100, 100);
ctx.fillRect(3500, 2900,100,100);

let extent_1 = [0, -canvas.width, canvas.height ,0];
let projection = new Projection({
   code: 'OVERLAY',
   units: 'pixels',
   extent: source.getTileGrid().getExtent(),
});

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
map.addInteraction(drawinteraction);
drawinteraction.setActive(false);

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
    drawinteraction.setActive(true);
    paninteraction.setActive(false);
  }
  else if(value=="pan"){
    drawinteraction.setActive(false);
    paninteraction.setActive(true);
  }
  else {
    
    drawinteraction.setActive(false);
    paninteraction.setActive(false);
    //set flags for paint
    if(value=="threshold") {
      thresholdred(imagerycontext);
    }
  }

});

map.on('click', function(event) {
  //if paint flag ...
  var pix = event.pixel;
  
  imagerycontext.fillStyle='blue';
  imagerycontext.fillRect(pix[0],pix[1],10,10);
  ctx.fillStyle='blue';
  console.log(pix[0],pix[1])
  ctx.fillRect(pix[0],pix[1],10,10);
  ctx.stroke();
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
import 'ol/ol.css';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import Zoomify from 'ol/source/Zoomify';
import Draw from 'ol/interaction/Draw';
import  VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';

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

// var retinaPixelRatio = 2;
// var retinaSource = new Zoomify({
//   url: zoomifyUrl,
//   size: [imgWidth, imgHeight],
//   crossOrigin: 'anonymous',
//   zDirection: -1, // Ensure we get a tile with the screen resolution or higher
//   tilePixelRatio: retinaPixelRatio, // Display retina tiles
//   tileSize: 256 / retinaPixelRatio, // from a higher zoom level
// });

var layer = new TileLayer({
  source: source,
});

var vector = new VectorLayer({
  source: new VectorSource({wrapX: false}),
});

var map = new Map({
  layers: [layer,vector],
  target: 'map',
  view: new View({
    // adjust zoom levels to those provided by the source
    resolutions: layer.getSource().getTileGrid().getResolutions(),
    // constrain the center: center cannot be set outside this extent
    extent: extent,
    constrainOnlyCenter: true,
  }),
});
map.getView().fit(extent);

var control = document.getElementById('dd_interaction');

var draw;
control.addEventListener('change', function (event) {
  var value = event.currentTarget.value;
  if (value == "polygon") {
    draw = new Draw({
      source: vector.getSource(),
      type: "Polygon",
    });
    map.addInteraction(draw);
  }
  else {
    map.removeInteraction(draw);
  }
  // if (value === 'zoomify') {
  //   layer.setSource(source);
  // } else if (value === 'zoomifyretina') {
  //   layer.setSource(retinaSource);
  // }
});

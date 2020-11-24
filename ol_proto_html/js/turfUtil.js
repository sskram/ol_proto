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


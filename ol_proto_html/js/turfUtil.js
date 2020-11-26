//function to return the union of two polygons
function union(vector_sr,uid,polygon,turfpoly){
    vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));
    polygon = turf.union(polygon,turfpoly);
    return polygon;
}

//function to return the differnce of two polygons
function differnce(vector_sr,uid,polygon,turfpoly){

    var poly1;
    var poly2;
    vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));
    last = polygon;
    polygon = turf.difference(polygon,turfpoly);
    if(polygon==null){ //check if difference misbihaves
        poly1 = turf.getCoords(last); 
        poly2 = turf.getCoords(turfpoly);
        var polyDiff = polygonClipping.difference(poly1,poly2); //use polygon-clipping difference instead of turf
        polyDiff = turf.multiPolygon(polyDiff); // convert to multipolygon
        polygon = polyDiff;
    }
    return polygon;

}

//Funtion to union and difference all the features and return a single multipolygon
function unionDifference(vector_sr,features,format){

    var turfpoly;
    var polygon;
    var count = 0;
    
    for(var i = 0;i<features.length;i++){
        turfpoly = format.writeFeatureObject(features[i]);
        if(count>0){
            if(features[i].get('name')=="add"){
              var uid = features[i].ol_uid;
              polygon = union(vector_sr,uid,polygon,turfpoly) 
            }
            else if(count>0 && features[i].get('name')=="erase"){
              var uid = features[i].ol_uid;
              polygon = differnce(vector_sr,uid,polygon,turfpoly)
            }
        }
        else{ 
          var uid = features[i].ol_uid;
          vector_sr.removeFeature(vector_sr.getFeatureByUid(uid));
          polygon = format.writeFeatureObject(features[i]);
          count = count+1;
        }
    }

    return {
            "polygon":polygon,
            "count" : count
          }  
}


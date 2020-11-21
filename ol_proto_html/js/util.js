app = [];
app.atlas_info = '/assert/h.json'; 

function loadAtlasInfo(){

    $(".search-input").keyup(function () {
      var searchString = $(this).val();
      $('#atlas_info').jstree('search', searchString);
    });
  
    $.getJSON(app.atlas_info,function(jsonresponse) {
      dataNode=nodeExpand(jsonresponse.msg[0]);
      $('#atlas_info')
      .on("changed.jstree", function (e, data) {
        if(data.selected.length) {
          //alert('The selected node is: ' + data.instance.get_node(data.selected[0]).text);
          //console.log(data.selected);
          layer.destroyChildren();
          console.log('The selected node is: ' + data.selected[0]);//data.instance.get_node(data.selected[0]).text);
          var id = data.selected[0];
          app.regionID = id;
          addFirstPass_geojson(id);
          // if(data.selected.length == 1)
          //   drawAtlasRegion(data.selected);
          // else{
          //   failMessage('<h5>Please select only one</h5>');
          //   return;
          // }
        }
      })
      .jstree({ 
        "plugins" : [ "wholerow", "search"],
        'core' : {
          'themes': {
            'name': 'proton',
            'responsive': true
          },
          'multiple': false,
          // 'check_callback': true,
          'data' :function(node,cb){
                if(node.id === '#'){
                  cb({...dataNode},dataNode.children);
                  }
              }
        },
        "search": {
          "case_insensitive": true,
          "show_only_matches" : true
        }});
    })
  }
      
  
  function nodeExpand(node){
    if (node.children.length === 0)
      return {text:node.name,...node};
    else 
      for(var i=0;i<node.children.length;i++){
        node.children[i] = nodeExpand(node.children[i]);
      }
      return {text:node.name,...node};
  }
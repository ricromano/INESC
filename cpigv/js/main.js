var map;

/**
 * Elements that make up the popup.
 */
var container;
var content;
var closer;

// TODO - workarround, select on selected
var feature_selected;

var vectorSource = new ol.source.Vector({
  //create empty vector
});

var overlay;
 
// Geometry type
var $geom_type = 'Point';
// Data type to save in
$data_type = 'GeoJSON'; 

// Create the style for Features
var iconStyle = new ol.style.Style({
 // image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
 /*   anchor: [0.5, 46],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    opacity: 0.75,
    src: 'images/icons/pin56_32.png'
  }))*/
  image: new ol.style.Circle({
    radius: 7,
    fill: new ol.style.Fill({
      color: '#FF0000'
    }),
    stroke: new ol.style.Stroke({
      color: '#FFFFFF',
      width: 1.5
    })
  })    
});

// Create the style for selected Features
var style_selected = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 7,
    fill: new ol.style.Fill({
      color: [0, 153, 255, 1]
    }),
    stroke: new ol.style.Stroke({
      //color: [255, 255, 255, 0.75],
      color: '#FFFFFF',
      width: 1.5
    })
  })
});

// make interactions global so they can later be removed
// select interaction
var select_interaction = new ol.interaction.Select({
  // make sure only the desired layer can be selected
  layers: function(vector_layer) {
    return vector_layer.get('name') === 'vectorlayer_cases';
  },
  style: style_selected
  //condition: ol.events.condition.mouseMove
  });

// grab the features from the select interaction to use in the modify interaction
var selected_features = select_interaction.getFeatures();

// when a feature is selected...
selected_features.on('add', function(event) {

  // Only one selected Feature at a time (because shift key)
  if (selected_features.getLength() > 1){
    selected_features.removeAt(0);
  }

  // TODO - workarround
  if (event.element.getId() != undefined){
    // grab the feature
    feature_selected = event.element;
  }
  
  // show popup
  var coordinate = feature_selected.getGeometry().getCoordinates();
  //var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326'));
  overlay.setPosition(coordinate);
  content.innerHTML = '<p>ID: ' + feature_selected.getId() + '</p>';
  // initial popup configuration
  popupConfiguration(true, false)
  container.style.display = 'block';
    
  // ...listen for changes and save them
  feature_selected.on('change', function(event) {
    // move popup (if it block) - TODO
    container.style.display = 'none';
    // listen the end of moving Feature
    $(document).on('mouseup', function(event) {
      coordinate = feature_selected.getGeometry().getCoordinates();
      //hdms = ol.coordinate.toStringHDMS(ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326'));
      overlay.setPosition(coordinate);
      content.innerHTML = '<p>ID: ' + feature_selected.getId() + '</p>';
      container.style.display = 'block';
      // remove listener
      $(document).off('mouseup');
    });
          
    //TODO - save changes to DB
  });
});

// when a feature is deselected...
selected_features.on('remove', function(event) {
  // hide popup
  container.style.display = 'none';
});

// modify interaction
var modify_interaction = new ol.interaction.Modify({
  features: select_interaction.getFeatures()
});

// draw  interaction
var draw_interaction = new ol.interaction.Draw({
    source: vectorSource,
    type: 'Point'
});
  
// when a new feature has been drawn...
draw_interaction.on('drawend', function(event) {
 
  // remove draw interaction
  map.removeInteraction(draw_interaction);
  // add select and modify interaction
  map.addInteraction(select_interaction);
  map.addInteraction(modify_interaction);   
  
  // Save new Feature
  // grab the feature
  var feature = event.feature;
  var coordinate = feature.getGeometry().getCoordinates();
  var newID = savePoint(coordinate);
  feature.setId(newID);

  //features.push(feature);
});
    

function init() {
  //Clean Input fields
  //cleanInputs();
  
  container = document.getElementById('popup');
  content = document.getElementById('popup-content');
  closer = document.getElementById('popup-closer');
  
  // Add a click handler to hide the popup.
  closer.onclick = function() {
    //overlay.setPosition(undefined);
    container.style.display = 'none';
    closer.blur();
    return false;
  };
  
  // Create an overlay to anchor the popup to the map.
  overlay = new ol.Overlay({
    element: container
  });
  
  //Read Features from DB
  readFeatures();

  //add the feature vector to the layer vector, and apply a style to whole layer
  var vectorLayer = new ol.layer.Vector({
    name: 'vectorlayer_cases',
    source: vectorSource,
    style: iconStyle
  });    
  
  // Create the map
  map = new ol.Map({
    target: 'main_map',
    overlays: [overlay],
    interactions: ol.interaction.defaults().extend([select_interaction, modify_interaction]),
    renderer : 'canvas',
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      }),
      vectorLayer
    ],
    view: new ol.View({
      zoom: 2,
      center: [0, 0]
    })
  });
   
  
  // Show divs Home
  goToStep(2);
  
  // Update main_button_searchAddress state
  disable("main_button_searchAddress", true);
     
  // Load case information (description and image)
  getCaseInfo($("#main_select_case").val());

	//Full Screen
	var myFullScreenControl = new ol.control.FullScreen();
	map.addControl(myFullScreenControl);

	//ZoomToExtent
	var myExtentButton = new ol.control.ZoomToExtent({
	  extent: vectorLayer.getSource().getExtent()
	});
	map.addControl(myExtentButton);
  
  // handles with edit Feature button
  $("#popup_button_edit").click(function(){
    popupConfiguration(false, true)          
  });
  
  // handles with delete Feature button
  $("#popup_button_delete").click(function(){
    var delFeature = confirm('Está prestes a remover a ocorrência selecionada.\nTem a certeza que pretende continuar?');
    if (delFeature){
      var feature = select_interaction.getFeatures().item(0);
      // delete from DB
      deleteFeature(feature.getId());
      //TODO - if deleted from DB (callback)
      // hide popup and remove feature
      //container.style.display = 'none';
      select_interaction.getFeatures().clear();
      //alert(select_interaction.getFeatures().item(0).getId());
      vectorSource.removeFeature(feature); 
    }
  });    
  
  // handles with save edit Feature button
  $("#popup_button_save_edit").click(function(){
    // TODO - save BD
    popupConfiguration(false, false)       
  });
  
  // handles with cancel edit Feature button
  $("#popup_button_cancel_edit").click(function(){
    // TODO - revert the changes...
    popupConfiguration(false, false)              
  });
  
 
  // handles with comments button
  $("#popup_button_comments").click(function(){
    var button_text = $("#popup_button_comments").text();
    if (button_text === 'Mostrar Comentários'){
      // Change button text
      $("#popup_button_comments").text("Mostrar Imagem");
      $("#main_caseImage, #popup-main-comments").slideToggle("slow");
      //document.getElementById('main_caseImage').style.display = 'none';
      //document.getElementById('popup-main-comments').style.display = 'block';
    }
    else{
      // Change button text
      $("#popup_button_comments").text("Mostrar Comentários");
      $("#main_caseImage, #popup-main-comments").slideToggle("slow");
      //document.getElementById('main_caseImage').style.display = 'block';
      //document.getElementById('popup-main-comments').style.display = 'none';    
    }               
  });   
   
}

// Configuration of the popup
//  initial -> true or false
//  edit -> true or false
function popupConfiguration(initial, edit){
 
  if (initial){
    edit = false;
    // Change button text
    $("#popup_button_comments").text("Mostrar Comentários");
    // Image
    document.getElementById('main_caseImage').style.display = 'block';
    // Comments
    document.getElementById('popup-main-comments').style.display = 'none';   
  }
  
  // readonly inputs
  disable("main_select_case", !edit);
  $('#popup_comments').prop('readonly', !edit);
  
  // Buttons
  if (edit){
    document.getElementById('popup-main-buttons').style.display = 'none';  
    document.getElementById('popup-edit-buttons').style.display = 'block';
  }
  else{
    document.getElementById('popup-main-buttons').style.display = 'block';  
    document.getElementById('popup-edit-buttons').style.display = 'none'
  }

}


/**
 * Go to one specific step. 
 * Options:
 *   0 - home,
 *   1 - search,
 *   2 - map,
 *   3 - grid.
 */
function goToStep(val){
  switch(val){
    case 0:
      document.getElementById('main_home').style.display = 'block';
      document.getElementById('main_search').style.display = 'none';
      document.getElementById('main_map').style.display = 'none';    
      break;
    case 1:
      document.getElementById('main_home').style.display = 'none';
      document.getElementById('main_search').style.display = 'block';   
      document.getElementById('main_map').style.display = 'none';     
      break;
    case 2:
      document.getElementById('main_home').style.display = 'none';
      document.getElementById('main_search').style.display = 'block';
      document.getElementById('main_map').style.display = 'block';  
      break;        
  }   
}


/**
 * Updates the main_button_searchAddress state.
 */
function searchTextLenth(val){ 
    if(val.length > 0) {
         // Enable button
         disable("main_button_searchAddress", false);
    } else {
         // Disable button
         disable("main_button_searchAddress", true);
    }
}


/**
 * Search an address and center the map in the location. 
 */
function searchAddress(){
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
	  var addresses = JSON.parse(this.responseText);
	  var searchOutputText = document.getElementById('main_searchOutputText');
	  document.getElementById('main_searchBar').style.height = '110px';
	  if (addresses.length > 0){
	    searchOutputText.innerHTML = "<b>"+ addresses[0].display_name +"</b>";
	    //document.getElementById('main_searchOutputCoordinates').innerHTML = addresses[0].geojson.coordinates;
	    var lat = Number(addresses[0].lat);
      var lon = Number(addresses[0].lon);

      // Center the map
      CenterMap(lon, lat);
      // Show the map and action selection
      goToStep(2);
    }
    else{
    searchOutputText.innerHTML = "A pesquisa por <b>" + main_searchText.value + "</b> não devolveu nenhum resultado.\nPor favor redefina o texto.";
    }
  };
  //xhr.open("get", 'http://nominatim.openstreetmap.org/search?q='+main_searchText.value+'&format=JSON&addressdetails=1', true);
  xhr.open("get", 'http://nominatim.openstreetmap.org/search/'+main_searchText.value+'?format=jsonv2&addressdetails=1&limit=1&polygon_geojson=1', true);

  xhr.send();
}


/**
 * Center the map based on coordinates.
 */
function CenterMap(long, lat) {
    //console.log("Long: " + long + " Lat: " + lat);
    map.getView().setCenter(ol.proj.transform([long, lat], 'EPSG:4326', 'EPSG:3857'));
    map.getView().setZoom(16);
}


/**
 * Enable or disable an element.
 */
function disable(i, val){
    $("#"+i).prop("disabled",val);
}


/**
 * Read one specific case description.
 */
function getCaseInfo(sel) {
  
  $(document).ready(function()
  {
    $.get('cases.xml', function(d){

      $(d).find('case').each(function(){

          var $cases = $(this); 
          var title = $cases.attr("title");
          if (title === sel){
            var description = $cases.find('description').text();
            var imageurl = $cases.attr('imageurl');
            document.getElementById("main_caseDescription").innerHTML = description;
            document.getElementById("main_caseImg").src = imageurl;
            document.getElementById("main_caseImg").alt = sel;
          }
      });
    });
  });
}


/**
 * Keyboard interaction.
 */
$(function(){
  $("#main_searchText").keyup(function (e) {
  if (e.which == 13 && !$("#main_button_searchAddress").is(':disabled')) {
    $("#main_button_searchAddress").trigger('click');
    return false;
  }
  });
});


/**
 * Clean input fields.
 */
 /*
function cleanInputs() {
  $(':input')
   .not(':button, :submit, :reset, :hidden')
   .val('')
   .removeAttr('checked')
   .removeAttr('selected');
}
*/

/**
 * Save point to DB.
 * Returns the Feature ID
 */
function savePoint(coordinates) {

  var data = {
    "action": "savePoint",
    "values": coordinates[0]+","+coordinates[1]
  };
  
  data = $(this).serialize() + "&" + $.param(data);
  var featureID = 0;
  
  $.ajax({
    type: "POST",
    dataType: "json",
    url: "db.php",
    async: false,
    data: data,
    success: function(data) {
      //alert("Successfull.\nReturned json: " + data["json"]);
      // assync or sync - TODO
      featureID = data[0];
    }
    });
  return featureID;
}

function deleteFeature(featureID) { 
  
  var data = {
    "action": "deleteFeature",
    "values": featureID
  };
  
  data = $(this).serialize() + "&" + $.param(data);
  
  $.ajax({
    type: "POST",
    dataType: "json",
    url: "db.php",
    async: false,
    data: data,
    success: function(data) {
      // assync or sync - TODO
    }
    });  
    
}


/**
 * Map button to draw interaction.
 */
function addFeature() {

  map.addInteraction(draw_interaction);
  // remove other interactions
  map.removeInteraction(select_interaction);
  map.removeInteraction(modify_interaction);
  
  // clean selected feature
  select_interaction.getFeatures().clear();
}


/**
 * Map button to select/modify interaction.
 */
function selectFeature() {
 
  map.removeInteraction(draw_interaction);
  map.addInteraction(select_interaction);
  map.addInteraction(modify_interaction);     
}


/**
 * Read Features from DB.
 */
function readFeatures() {

  var data = {
    "action": "readPoints"
  };
  
  data = $(this).serialize() + "&" + $.param(data);
  
  $.ajax({
    type: "POST",
    dataType: "json",
    url: "db.php",
    async: true,
    data: data,
    success: function(data) {
      $.each(data, function(idx, obj) {
        coord = obj.pontos_coordenadas.replace(/[()]/g, '');
        coord = coord.split(',');
        var iconFeature = new ol.Feature({
          geometry: new ol.geom.Point([Number(coord[0]),Number(coord[1])]),
          name: 'name '
        });
        iconFeature.setId(obj.pontos_id);
        vectorSource.addFeature(iconFeature);
      });
    }
  });  
 // return false;
}

    

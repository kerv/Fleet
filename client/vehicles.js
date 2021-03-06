Vehicles = new Meteor.Collection("vehicles");
var map;
var m_markerDict = {};
var m_markersLayer;
var spinner;
var m_requiresUpdate = false;


var m_spinnerOptions = {
  lines: 13, // The number of lines to draw
  length: 10, // The length of each line
  width: 5, // The line thickness
  radius: 11, // The radius of the inner circle
  corners: 1, // Corner roundness (0..1)
  rotate: 0, // The rotation offset
  color: '#000', // #rgb or #rrggbb
  speed: 2, // Rounds per second
  trail: 60, // Afterglow percentage
  shadow: true, // Whether to render a shadow
  hwaccel: false, // Whether to use hardware acceleration
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: 'auto', // Top position relative to parent in px
  left: 'auto' // Left position relative to parent in px
};

// ID of currently selected list
Session.set('vehicle_id', null);

Meteor.subscribe('vehicles', function () {
      
    // initialize the markers layer
    m_markersLayer = new L.MarkerClusterGroup({ spiderfyOnMaxZoom: true, showCoverageOnHover: true, zoomToBoundsOnClick: true });
 
    
    var allVehicles = Vehicles.find();
    allVehicles.forEach(function (vehicle) 
    {      
        var newMarker = L.marker(new L.LatLng(vehicle.lat, vehicle.lon)); //.addTo(map);

        newMarker.bindPopup("<b>" + vehicle.name + "<br\>" + vehicle.time + "</b><div style='clear: both'></div>");
        m_markersLayer.addLayer(newMarker);        

        m_markerDict[vehicle.name] = newMarker;
    });

    map.addLayer(m_markersLayer);

    spinner.stop();
             
    var handle = allVehicles.observe({
      added: function (vehicle) { /*
      
        var newMarker = L.marker(new L.LatLng(vehicle.lat, vehicle.lon));//.addTo(map);
               
        newMarker.bindPopup("<b>" + vehicle.name + "<br\>" + vehicle.time + "</b>");

        m_requiresUpdate = false;
        m_markersLayer.addLayer(newMarker);        

        m_markerDict[vehicle.name] = newMarker;
        */
       }, // run when vehicle is added
      changed: function (vehicle) { 
        
        var changedMarker = m_markerDict[vehicle.name];
        // remove old marker
        if (m_markersLayer.hasLayer(changedMarker))
        {
          //console.log('Removing marker: ' + vehicle.name);
          m_markersLayer.removeLayer(changedMarker);

             
          changedMarker = L.marker(new L.LatLng(vehicle.lat, vehicle.lon));//.addTo(map);        
         
          changedMarker.bindPopup("<b>" + vehicle.name + "<br\>" + vehicle.time + "</b>");
          m_markerDict[vehicle.name] = changedMarker;   
          
          m_markersLayer.addLayer(changedMarker);

          m_requiresUpdate = false;
        }
       }, // run when vehicle is changed
      removed: function (vehicle) { 
       
        // remove old marker
        m_markersLayer.removeLayer(m_markerDict[vehicle.name]);
        
        m_requiresUpdate = false;
       } // run when vehicle is removed
    });        
});


Template.vehicles.vehicles = function () {
  return Vehicles.find({}, {sort: {name: 1}});
};


function refreshMapIfNeeded() {
/*
      if (m_requiresUpdate && map != null && m_markersLayer != null && m_markerDict != null)
      {
        console.log('Reloading clusters...');
      
        map.removeLayer(m_markersLayer);
        
        // initialize the markers layer
        m_markersLayer = new L.MarkerClusterGroup({ spiderfyOnMaxZoom: true, showCoverageOnHover: false, zoomToBoundsOnClick: true });
        
        for(var networkID in m_markerDict) 
        {
            var vehicleMarker = m_markerDict[networkID];
            m_markersLayer.addLayer(vehicleMarker);         
        };
        
        map.addLayer(m_markersLayer);
        
        console.log('Reloading clusters DONE...');
      
      }*/
}

Meteor.startup(function () {
  //Backbone.history.start({pushState: true});
  
  map = L.map('map').setView([51.000, -114], 6);
  L.Icon.Default.imagePath = '/images';
  L.tileLayer('http://{s}.tile.cloudmade.com/5cd98e6d9903414793ac85e5ea9c7cf2/997/256/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery � <a href="http://cloudmade.com">CloudMade</a>',
      maxZoom: 18
  }).addTo(map);  

  var tid = setInterval(refreshMapIfNeeded, 10000);
  
  map.on('zoomend', function(e) {
    if (m_requiresUpdate)
    {
      //map.removeLayer(m_markersLayer);
      
      //// initialize the markers layer
      //m_markersLayer = new L.MarkerClusterGroup({ spiderfyOnMaxZoom: true, showCoverageOnHover: false, zoomToBoundsOnClick: true });
      
      //m_markerDict.forEach(function (vehicle) 
      //{      
      //    var newMarker = L.marker(new L.LatLng(vehicle.lat, vehicle.lon)); //.addTo(map);
      //    m_markersLayer.addLayer(newMarker);
      //    newMarker.bindPopup("<b>" + vehicle.name + "<br\>" + vehicle.time + "</b>");
          
      //    //m_markerDict[vehicle.name] = newMarker;
      //});
      
      //map.addLayer(m_markersLayer);
    
    }
  });
 

  var target = document.getElementById('map');
  spinner = new Spinner(m_spinnerOptions).spin(target);

});
var map = new L.map('map').setView([42.36, -71.09], 13);

var toner = 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png';
var tonerAttrib = 'Map data &copy;2013 OpenStreetMap contributors, Tiles &copy;2013 Stamen Design';
var tonerLayer = new L.TileLayer(toner, {maxZoom: 18, attribution: tonerAttrib});
map.addLayer(tonerLayer);

map.attributionControl.setPrefix('');

var stations = {};

$.get("data/stations.csv", function(station_csv){
  var station_data = $.csv.toArrays(station_csv);
  for(var s=1;s<station_data.length;s++){
    //console.log(station_data[s]);
    var id = station_data[s][0];
    //var terminal = station_data[s][1];
    var name = station_data[s][2];
    //var installed = (station_data[s][3] == "TRUE");
    //var locked = (station_data[s][4] == "TRUE");
    //var temporary = (station_data[s][5] == "TRUE");
    var lat = 1.0 * station_data[s][6];
    var lng = 1.0 * station_data[s][7];
    
    var r = (Math.round( Math.random() * 16 )).toString(16);
    var g = (Math.round( Math.random() * 16 )).toString(16);
    var b = (Math.round( Math.random() * 16 )).toString(16);
    
    var marker = new L.CircleMarker( new L.LatLng(lat, lng), { color: "#" + r + g + b, fillOpacity: 0.9 } );
    marker.bindPopup(name);
    map.addLayer(marker);
    
    stations[ id ] = {
      marker: marker,
      name: name,
      capacities: [ ]
    };
  }
  
  station_csv = null;
  station_data = null;
  
  $.get("data/stationcapacity.csv", function(capacity_csv){
    var capacity_data = $.csv.toArrays(capacity_csv);
    for(var s=1;s<capacity_data.length;s++){
      //var id = capacity_data[s][0];
      var station_id = capacity_data[s][1];
      var date = new Date( capacity_data[s][2] );
      var count = 1 * capacity_data[s][3];
      if( ! stations[ station_id ] ){
        continue;
      }
      if( count != lookUpCapacity( stations[ station_id ], date * 1 ) ){
        stations[ station_id ].capacities.push({
          dt: date * 1,
          count: count
        });
      }
    }
    capacity_csv = null;
    capacity_data = null;
    
    $("#timeline").slider({
      orientation: "horizontal",
      range: "min",
      // min and max from when trips and station capacity CSVs overlap
      min: 1 * ( new Date( "2011/08/23 04:08:00-04" ) ),
      max: 1 * ( new Date( "2012/04/30 20:32:00-04" ) ),
      value: 1 * ( new Date( "2011/08/23 00:08:00-04" ) ),
      slide: function(event, ui){
        var dt = ui.value;
        updateView(dt);
      }
    });
    
    updateView( 1 * ( new Date( "2011/08/23 00:08:00-04" ) ) );
    
  });
});

function updateView(dt){

  $("#day").text( moment(dt).format('MMMM D, YYYY') );
  var myd = new Date(dt);
  $("#shares").attr("href", "share.html?day=" + (myd.getMonth()+1) + "-" + myd.getDate() + "-" + myd.getFullYear() );

  for(station_id in stations){
    var count = lookUpCapacity(stations[ station_id ], dt);
    stations[ station_id ].marker.setRadius(count);
  }
}

function lookUpCapacity(station, datetime){
  var dt = datetime * 1;
  for(var c=station.capacities.length-1;c>=0;c--){
    if(station.capacities[c].dt < dt){
      //console.log( c + ": " + station.capacities[c].count );
      return station.capacities[c].count;
    }
  }
  return 0;
}
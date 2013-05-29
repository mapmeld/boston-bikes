var map = new L.map('map').setView([42.36, -71.09], 13);

var toner = 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png';
var tonerAttrib = 'Map data &copy;2013 OpenStreetMap contributors, Tiles &copy;2013 Stamen Design';
var tonerLayer = new L.TileLayer(toner, {maxZoom: 18, attribution: tonerAttrib});
map.addLayer(tonerLayer);

map.attributionControl.setPrefix('');

var stations = {};
var trips = {};

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
    var color = "#" + r + g + b;
    
    var marker = new L.CircleMarker( new L.LatLng(lat, lng), { color: color, fillOpacity: 0.9 } );
    marker.bindPopup(name);
    map.addLayer(marker);
    
    stations[ id ] = {
      marker: marker,
      name: name,
      color: color,
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
    
    
    var viewday = gup("day") || "2012-06-29";
    var dt_min = 1 * ( new Date( viewday + " 00:00:00-04" ) );
    var dt_max = 1 * ( new Date( viewday + " 23:59:59-04" ) );
    
    $("#timeline").slider({
      orientation: "horizontal",
      range: "min",
      // min and max from when trips and station capacity CSVs overlap
      min: dt_min,
      max: dt_max,
      value: dt_min + (8 * 60 * 60 * 1000),
      slide: function(event, ui){
        var dt = ui.value;
        updateView(dt);
      }
    });
    
    updateView( 1 * ( new Date( viewday + " 08:00:00-04" ) ) );
    
    $.get("data/trips.csv", function(trips_csv){
      var trips_data = $.csv.toArrays(trips_csv);

      for(var t=1;t<trips_data.length;t++){
        var start = 1 * ( new Date( trips_data[t][3] ) );
        var end = 1 * ( new Date( trips_data[t][5] ) );
        if(((start > dt_min) && (start < dt_max)) || ((end > dt_min) && (end < dt_max))){
          // notice this trip
          var trip_id = trips_data[t][0];
          var station_id = trips_data[t][4];
          var dest_id = trips_data[t][6];
          if((! stations[ station_id ] ) || ( ! stations[ dest_id ] )){
            continue;
          }
          trips[ trip_id ] = {
            start: start,
            end: end,
            station_id: station_id,
            dest_id: dest_id
          };
        }
        else if(start > dt_max){
          // all following trips are in the future, break loop
          break;
        }
      }
      
      trips_csv = null;
      trips_data = null;
      
      updateView( 1 * ( new Date( viewday + " 08:00:00-04" ) ) );
      $(".loading").css({ display: "none" });

    });
  });
});


var sizedOnce = false;

function updateView(dt){

  $("#day").text( moment(dt + 4 * 60 * 60 * 1000 ).format('MMMM D, YYYY -- h:mm:ss a') );

  if(!sizedOnce){
    for(station_id in stations){
      var count = lookUpCapacity(stations[ station_id ], dt);
      stations[ station_id ].marker.setRadius( Math.floor( count * 2/3 ) );
    }
    sizedOnce = true;
  }
  
  for(trip_id in trips){
    if(trips[trip_id].start < dt && trips[trip_id].end > dt){
      // trip in progress!
      
      var start_station = stations[ trips[trip_id].station_id ].marker.getLatLng();
      var end_station = stations[ trips[trip_id].dest_id ].marker.getLatLng();
      
      var ilat = start_station.lat + (end_station.lat - start_station.lat) * (( dt - trips[trip_id].start ) /  ( trips[trip_id].end - trips[trip_id].start ));
      var ilng = start_station.lng + (end_station.lng - start_station.lng) * (( dt - trips[trip_id].start ) /  ( trips[trip_id].end - trips[trip_id].start ));
      
      var interpolated = new L.LatLng( ilat, ilng );
      
      if(!trips[trip_id].marker){
        marker = new L.CircleMarker( interpolated, { color: stations[ trips[trip_id].station_id ].color, fillOpacity: 0.7, radius: 3 } );
        map.addLayer(marker);
        trips[trip_id].marker = marker;
      }
      else{
        trips[trip_id].marker.setLatLng( interpolated );
      }
    }
    else if(trips[trip_id].marker){
      map.removeLayer(trips[trip_id].marker);
      trips[trip_id].marker = null;
    }
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

function gup(nm){nm=nm.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");var rxS="[\\?&]"+nm+"=([^&#]*)";var rx=new RegExp(rxS);var rs=rx.exec(window.location.href);if(!rs){return null;}else{return rs[1];}}
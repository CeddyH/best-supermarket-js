var span1 = document.getElementById("span1");
var span2 = document.getElementById("span2");
var span3 = document.getElementById("span3");

var geocoder;
var map;
var loc;
var pinging = false;

function initMap() {
  geocoder = new google.maps.Geocoder();
  var latlng = new google.maps.LatLng(37.0902, -95.7129);
  var mapOptions = {
    zoom: 11,
    center: latlng
  }
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
}

function codeAddress() {
  var address = document.getElementById('inp').value;
  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == 'OK') {
        map.setCenter(results[0].geometry.location);
        loc = results[0].geometry.location;
        span1.classList.add("animate");
        span2.classList.add("animate");
        span3.classList.add("animate");
        pinging = true;
    } else {
      alert('Invalid Address Entered ' + status);
    }
  });
}
function addPin(addy)
{
    geocoder.geocode({'address':addy}, function(results, status)
    {
        if (status == 'OK')
        {
            var marker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location
            });  
        }
    })
}


function foo()
{
    var address = document.getElementById('inp').value;
    var apiKey = "pri_4ee55ff4779b4c52a68d9866f1e52bec";
    var googleKey = "AIzaSyBYJ_dVZVpq_zo3NOyzCL8HqN_xu2U1Ijc";
    initMap();
    codeAddress();
    var q = "supermarkets near " + address;
    var params = new URLSearchParams({
        'api_key_private': apiKey,
        'q': q,
        'num': 20,
        'fast': true,
        'opened': 'now'
    });
    var searchUrl = `https://besttime.app/api/v1/venues/search?${params}`;
    const startSearch = async (url) => {
        var response = await fetch(url, {
            method: 'POST'
        });
        var data = await response.json();
        re = data;
        job_id = re.job_id;
        collection_id = re.collection_id;
        params = new URLSearchParams({
            'job_id': job_id,
            'collection_id': collection_id
        });
        searchUrl = `https://besttime.app/api/v1/venues/progress?${params}`;
        job_finished = false;
        var num_tries = 0;
        while(job_finished == false)
        {
            if(num_tries >= 3000)
            {
                console.log("waited more than 2000 tries");
                return;
            }
            response = await fetch(searchUrl, {
                method: 'GET'
            });
            data = await response.json();
            r = data;
            job_finished = r.job_finished;
            num_tries++;
        }
        var num_venues = r.count_completed;
        var best_decision_value = 9999999999999;
        var best_venue_address = "";
        var best_venue_name = "";
        let array = r.venues;
        
        for(let x = 0; x < num_venues; x++)
        {
            var venue_address = array[x].venue_address;
            var venue_lat = array[x].venue_lat;
            var venue_lon = array[x].venue_lon;
            var venue_name = array[x].venue_name;
            var venue_id = array[x].venue_id;

            params = new URLSearchParams({ 
                'api_key_private': apiKey,
                'venue_id': venue_id
            });
            searchUrl = `https://besttime.app/api/v1/forecasts/live?${params}`;
            response = await fetch(searchUrl, {
                method: 'POST'
            });
            data = await response.json();
            r = data;
            var live_busyness = -1
            var forecasted_busyness = -1
            var forecasted_busyness_available = r.analysis.venue_forecasted_busyness_available
            if (forecasted_busyness_available == true){
                forecasted_busyness = r.analysis.venue_forecasted_busyness;}
            var live_busyness_available = r.analysis.venue_live_busyness_available
            if (live_busyness_available == true){
                live_busyness = r.analysis.venue_live_busyness;}
            var min_time = r.venue_info.venue_dwell_time_min;
            var max_time = r.venue_info.venue_dwell_time_max;
            var avg_time = r.venue_info.venue_dwell_time_avg;
            var origin = loc;
            var distance;
            var duration; 
            var from;
            var to;
            var dest = new google.maps.LatLng(venue_lat, venue_lon);
            var service = new google.maps.DistanceMatrixService();
            service.getDistanceMatrix({
                  origins: [origin],
                  destinations: [dest],
                  travelMode: 'DRIVING'
            }, callback);
            function callback(response, status) {
                if (status == 'OK') {
                  var origins = response.originAddresses;
                  var destinations = response.destinationAddresses;
              
                  for (var i = 0; i < origins.length; i++) {
                    var results = response.rows[i].elements;
                    for (var j = 0; j < results.length; j++) {
                         element = results[j];
                         distance = element.distance.text;
                         duration = element.duration.value;
                         from = origins[i];
                         to = destinations[j];
                    }
                  }
                }
            }
            venue_busyness = 0;
            if (forecasted_busyness_available == false && live_busyness_available == false)
            {
                continue;
            }
            if (live_busyness_available == true)
            {
                venue_busyness = live_busyness;
            }
            else
            {
                venue_busyness = forecasted_busyness;
            }
            decision_value = (venue_busyness * max_time) + duration;
            if (decision_value < best_decision_value)
            {
                best_decision_value = decision_value;
                best_venue_address = venue_address;
                best_venue_name = venue_name;
            }
        }
        document.getElementById("answer").innerHTML = ("Best supermarket option: " + best_venue_name + 
        "\n\nlocated at: " + best_venue_address);
        addPin(best_venue_address);
    };
    startSearch(searchUrl);
    span1.classList.remove("animate");
    span2.classList.remove("animate");
    span3.classList.remove("animate");

}
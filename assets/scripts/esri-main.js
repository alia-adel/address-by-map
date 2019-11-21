// This file includes Esri Map API calls using API v4.12
// Features Used:
//     == Create a map: https://developers.arcgis.com/javascript/latest/guide/create-a-starter-app/
//     == Draw points and lines: https://developers.arcgis.com/javascript/latest/guide/display-point-line-and-polygon-graphics/
//     == Change point symbol to picture: https://developers.arcgis.com/javascript/latest/api-reference/esri-symbols-PictureMarkerSymbol.html
//     == Display popup: https://developers.arcgis.com/javascript/latest/guide/configure-pop-ups/
//     == Home Button: https://developers.arcgis.com/javascript/latest/sample-code/widgets-home/index.html (but the widget was used on MapView instead of ViewScene)
//     == Search for Address by name: https://developers.arcgis.com/rest/geocode/api-reference/geocoding-find-address-candidates.htm
/*
    Known Limitations:   
    ==================

    Rendering SVG documents is not supported in IE11.
    SVG documents must include a definition for width and height to load properly in Firefox.
    Animated gif/png images are not supported. See the Custom WebGL layer view sample to learn how to accomplish this using WebGL.
    The height and width of the symbol is restricted to no more than 200px.
*/

var map, view, lang = 'EN';
var self = this;
var currentPoint;
// Abu Dhabi Coordinates
var mapCenterCoordinates = [54.366669, 24.466667];
this.clearForm();

function clearForm() {
    $('#coordinates').val('');
    $('#name').val('');
    $('#address').val('');
    $('#street').val('');
    $('#sector').val('');
    $('#city').val('');
    $('#emirate').val('');
    document.getElementById('needArabic').checked = false;
}

function loadAddress(data) {
    if(data.location){
        $('#coordinates').val(data.location);
    }    
    $('#name').val(data.PlaceName);
    $('#address').val(data.LongLabel);
    $('#street').val(data.Address);
    $('#sector').val(data.City);
    $('#city').val(data.Subregion);
    $('#emirate').val(data.Region);
    console.log(data);
}

function reverseCodeAddress(long, lat) {
    // Get address
    var url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=pjson&langCode=' + this.lang + '&featureTypes=&location=' + long + ',' + lat;
    return fetch(url).then((response) => {
        return response.json();
    }).then((response) => {
        loadAddress(response.address);
    }).catch((error) => {
        console.error(error);
    });
}

function searchForAddress(options) {
    if (options) {
        // Get address
        options= 'SingleLine=' + options;
        var url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?outFields=*&langCode=' + this.lang + '&forStorage=false&f=pjson&' + encodeURI(options);
        return fetch(url).then((response) => {
            return response.json();
        }).then((response) => {
            if(response && response.candidates && response.candidates.length > 0) {
                var topSearch = response.candidates.sort((res1, res2) => {
                    return res1.score > res2.score;
                })[0];
                topSearch = topSearch.attributes;
                var data = {
                    PlaceName: topSearch.PlaceName,
                    LongLabel: topSearch.LongLabel,
                    Address: topSearch.StAddr,
                    Region: topSearch.Region,
                    Subregion: topSearch.Subregion,
                    City: topSearch.City,
                    location: topSearch.X + ',' + topSearch.Y
                };
                self.currentPoint = [topSearch.X, topSearch.Y];
                loadAddress(data);
                self.addPoint(topSearch.X, topSearch.Y);
                self.view.goTo({
                    target: [topSearch.X, topSearch.Y],
                    zoom: 18
                });
            }
            
            console.log(response);
        }).catch((error) => {
            console.error(error);
        });
    }
}

function addPoint(long, lat){
    require([
        "esri/Graphic" /* For points */,
    ], function (Graphic) {
        var point = {
            type: "point",
            longitude: long,
            latitude: lat
        };
        pictureMarkerSymbol = {
            type: "picture-marker",
            url: "https://alia-adel.github.io/ad-transport-map/assets/images/marker.png",
            width: "25px",
            height: "26px",
            declaredClass: "map-point"
        };
        pointGraphic = new Graphic({
            geometry: point,
            symbol: pictureMarkerSymbol
        });
        // clear all exiting points
        view.graphics.items = [];
        // add new point to map
        view.graphics.add(pointGraphic);
    });
}

require([
    "esri/Map" /* Create a 2D map */,
    "esri/views/MapView",
    "esri/widgets/Home"
], function (Map, MapView, Home) {

    map = new Map({
        basemap: "streets-navigation-vector"
    });

    view = new MapView({
        container: "map",
        map: map,
        center: mapCenterCoordinates,
        zoom: 11
    });

    var homeBtn = new Home({
        view: view
    });

    // Add the home button to the top left corner of the view
    view.ui.add(homeBtn, "top-left");

    view.on("click", function (event) {
        // Search for graphics at the clicked location. View events can be used
        // as screen locations as they expose an x,y coordinate that conforms
        // to the ScreenPoint definition.
        console.log(`Long: ${event.mapPoint.longitude}, Lat: ${event.mapPoint.latitude}`);
        // Update text field        
        $('#coordinates').val(`${event.mapPoint.latitude},${event.mapPoint.longitude}`);
        self.addPoint(event.mapPoint.longitude, event.mapPoint.latitude);
        currentPoint = null;
        self.reverseCodeAddress(event.mapPoint.longitude, event.mapPoint.latitude);
        currentPoint = [event.mapPoint.longitude, event.mapPoint.latitude];
    });
});
$(function () {
    $('#needArabic').change((event) => {
        if (event.currentTarget.checked) {
            self.lang = 'AR';
        } else {
            self.lang = 'EN';
        }
        if (currentPoint) {
            self.reverseCodeAddress(currentPoint[0], currentPoint[1]);
        }
    });
    $('#address-form button.search').click(() => {
        var form = document.getElementById('address-form');
        var searchQueryParam = '';
        var valueAdded = false;
        for (var input of form) {
            if (input.type === 'text' && input.value && input.value.trim() !== '') {
                valueAdded = false;
                switch (input.id) {
                    case ('name'):
                        searchQueryParam += input.value;
                        valueAdded = true;
                        break;
                    case ('sector'):
                        searchQueryParam += input.value;
                        valueAdded = true;
                        break;
                    case ('street'):
                        searchQueryParam += input.value;
                        valueAdded = true;
                        break;
                    case ('emirate'):
                        searchQueryParam += input.value;
                        valueAdded = true;
                        break;
                }
                searchQueryParam += (valueAdded) ? ',' : '';
            }
        }
        if (searchQueryParam && searchQueryParam.length > 0) {
            searchQueryParam = searchQueryParam.substring(0, searchQueryParam.length - 1);
            self.searchForAddress(searchQueryParam);
        }
        console.log(searchQueryParam);
    });
});


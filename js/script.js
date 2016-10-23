var map, lat, lng;
var travelMode = 'driving'; // por defecto en coche
var loc = {}; // objeto donde guadar la última localización 
var hayRutas = false;
var locations = [];
var loc_ini = {}; // objeto donde guardar la localización actual (inicial)

$(function(){
  // Guarda unas coordenadas(lat, lng) en el array de localizaciones
  function guardarLoc(lat, lng) {
    var loc = {};
    loc.lat = lat;
    loc.lng = lng;
    locations.push(loc);
  }
  
  function enlazarMarcador(e){
  // muestra ruta entre marcas anteriores y actuales
    var lat_ori, lng_ori;
    lat_ori = locations[locations.length-1].lat;
    lng_ori = locations[locations.length-1].lng;
    map.drawRoute({
      origin: [lat_ori, lng_ori],  // origen en coordenadas anteriores
      // destino en coordenadas del click o toque actual
      destination: [e.latLng.lat(), e.latLng.lng()],
      travelMode: travelMode,
      strokeColor: '#34495D',
      strokeOpacity: 0.7,
      strokeWeight: 5
    });

    lat = e.latLng.lat();   // guarda coords para marca siguiente
    lng = e.latLng.lng();

    guardarLoc(lat, lng);
    map.addMarker({ lat: lat, lng: lng});  // pone marcador en mapa
    hayRutas = true;
  };

  function geolocalizar(){
    GMaps.geolocate({
      success: function(position){
      lat = position.coords.latitude;  // guarda coords en lat y lng
      lng = position.coords.longitude;

      loc_ini.lat = lat;
      loc_ini.lng = lng;

      guardarLoc(lat, lng);

      map = new GMaps({  // muestra mapa centrado en coords [lat, lng]
              el: '#map-canvas',
              lat: lat,
              lng: lng,
              click: enlazarMarcador,
              tap: enlazarMarcador,
              zoomControlOptions: {
                  position: google.maps.ControlPosition.LEFT_CENTER
              },
              panControlOptions: {
                position: google.maps.ControlPosition.LEFT_CENTER
              },
              mapTypeControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
              }
            });
            map.addMarker({ lat: lat, lng: lng});  // marcador en [lat, lng]
      },
      error: function(error) { alert('Geolocalización falla: '+error.message); },
      not_supported: function(){ alert("Su navegador no soporta geolocalización"); },
    });
  };

  // Función para compactar tu ubicación actual con el último marcador añadido
  function compactarRuta(){
    if(hayRutas) {
      map.cleanRoute(); // Limpiar las rutas del mapa
      map.removeMarkers(); // eliminar marcadores existentes
      map.addMarker({ lat: loc_ini.lat, lng: loc_ini.lng}); // añadir marcador con ubicación actual (inicial)
      map.addMarker({ lat: lat, lng: lng}); // añadir marcador en el último marcador añadido
      map.drawRoute({ // dibujar nueva ruta "compacta"
        origin: [loc_ini.lat, loc_ini.lng],  // origen en coordenadas anteriores
        // destino en coordenadas del click o toque actual
        destination: [lat, lng],
        travelMode: travelMode,
        strokeColor: '#34495D',
        strokeOpacity: 0.7,
        strokeWeight: 5
      });

      locations = [];
      guardarLoc(loc_ini.lat,loc_ini.lng);
      guardarLoc(lat, lng);
    }
  }
  
  // Función para eliminar rutas previas establecidas
  function eliminarRutas(){
    if(hayRutas){
      // Borrar localizaciones
      locations = [];

      map.cleanRoute(); // Limpiar las rutas del mapa
      map.removeMarkers(); // eliminar marcadores existentes
      map.addMarker({ lat: loc_ini.lat, lng: loc_ini.lng});  // añadir marcador con ubicación actual (inicial)
      map.setCenter(loc_ini.lat, loc_ini.lng);
      // Guardar coordenadas iniciales
      lat = loc_ini.lat;
      lng = loc_ini.lng;
      hayRutas = false;
      guardarLoc(lat, lng);
    }
  }

  // Mueve el mapa a tu posición actual (inicial)
  function reubicarPosicion() {
    map.setCenter(loc_ini.lat, loc_ini.lng);
  }

  function cambiarModo() {
    var cambioModo = false;
    if($("#modo-coche").is(':checked')) {
      if(travelMode != 'driving') {
        travelMode = 'driving'
        cambioModo = true;
      }
    } 
    else if($("#modo-pie").is(':checked')) {
      if(travelMode != 'walking') {
        travelMode = 'walking'
        cambioModo = true;
      }
    }
    else if($("#modo-bici").is(':checked')) {
      if(travelMode != 'bicycling') {
        travelMode = 'bicycling'
        cambioModo = true;
      }
    }
    if(hayRutas && cambioModo) {
      recalcularRuta();
    }
  }

  function dibujarRuta(lat_i, lng_i, lat_f, lng_f) {
    map.drawRoute({
      origin: [lat_i, lng_i],  // origen en coordenadas anteriores
      // destino en coordenadas del click o toque actual
      destination: [lat_f, lng_f],
      travelMode: travelMode,
      strokeColor: '#34495D',
      strokeOpacity: 0.7,
      strokeWeight: 5
    });

    map.addMarker({ lat: lat_f, lng: lng_f});  // pone marcador en mapa
  }

  function recalcularRuta() {
    map.cleanRoute(); // Limpiar las rutas del mapa
    map.removeMarkers(); // eliminar marcadores existentes
    map.addMarker({ lat: loc_ini.lat, lng: loc_ini.lng});
      
    var i;
    for(i = 0; i < (locations.length - 1); i++){
      dibujarRuta(locations[i].lat, locations[i].lng, locations[i+1].lat, locations[i+1].lng);
    }
  }

  function buscarDireccion(e) {
    var p = e.which;
     if(p == 13){
        e.preventDefault();
        GMaps.geocode({
          address: $('#buscar').val(),
          callback: function(results, status) {
            if (status == 'OK') {
                var latLng = results[0].geometry.location;
                if(hayRutas){
                  map.cleanRoute();
                  map.removeMarkers();
                  locations = [];
                  guardarLoc(loc_ini.lat, loc_ini.lng);
                }
                
                map.setCenter(latLng.lat(), latLng.lng());
                map.addMarker({
                    lat: latLng.lat(),
                    lng: latLng.lng()
                });

                map.addMarker({
                    lat: loc_ini.lat,
                    lng: loc_ini.lng
                });
                hayRutas = true;
                guardarLoc(latLng.lat(), latLng.lng());
                console.log(locations.length);
                dibujarRuta(loc_ini.lat,loc_ini.lng,latLng.lat(),latLng.lng());
            }
          }
      });
    }
  }

  geolocalizar();

  


  // eventos asociados a los botones
  $("#compactar").on('click',compactarRuta);
  $("#eliminar").on('click',eliminarRutas);
  $("#reubicar").on('click',reubicarPosicion);
  $("input[type=radio]").on('click',cambiarModo);
  $("#buscar").on('keypress',buscarDireccion);
});
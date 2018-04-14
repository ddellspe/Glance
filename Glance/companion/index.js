// Import the messaging module
import * as messaging from "messaging";
import { encode } from 'cbor';
import { outbox } from "file-transfer";
import { settingsStorage } from "settings";
import { me } from "companion";
import { geolocation } from "geolocation";


// // default URL pointing at xDrip Plus endpoint
 var URL = null;
//WeatheyAPI connection
var API_KEY = null;
var ENDPOINT = null


// Fetch the weather from OpenWeather
function queryOpenWeather() {
  return fetch(getWeatherEndPoint() + "&APPID=" + getWeatherApiKey())
  .then(function (response) {
     return response.json()
      .then(function(data) {
        // We just want the current temperature
        var weather = {
          temperature: Math.round(data["main"]["temp"])
        }
        // Send the weather data to the device
        return weather;
      });
  })
  .catch(function (err) {
    console.log("Error fetching weather.You need an API key from openweathermap.org to view weather data. otherwise this error is fine to ignore. " + err);
  });
}


function queryBGD() {
  let url = getSgvURL()
  return fetch(url)
  .then(function (response) {
      return response.json()
      .then(function(data) {
        let date = new Date();
        let currentBgDate = new Date(data[0].dateString);
        let diffMs = (date - currentBgDate); // milliseconds between now & today

        // Check sense last pull and see if time is over 15 mins 
        if(diffMs > 900000) {
          diffMs = false
        }else {
           if(diffMs > 300000) {
            diffMs = 300000
          } else {
            diffMs = Math.round(300000 - diffMs)
          }
          
        }
        let bloodSugars = []
        
        // if there is no delta calc it 
        let delta = 0;
        let count = data.length - 1;
        if(!data[count].delta) {
          delta = data[count].sgv - data[count - 1].sgv 
        }
        
        data.forEach(function(bg, index){
           bloodSugars.push({
             sgv: bg.sgv,
             delta: ((Math.round(bg.delta)) ? Math.round(bg.delta) : delta),
             nextPull: diffMs,
             units_hint: ((bg.units_hint) ? bg.units_hint : 'mgdl')

          })
        })   
        // Send the data to the device
        return bloodSugars.reverse();
      });
  })
  .catch(function (err) {
    console.log("Error fetching bloodSugars: " + err);
  });
}


// Send the weather data to the device
function returnData(data) {  
  const myFileInfo = encode(data);
  outbox.enqueue('file.txt', myFileInfo)
   
}

// Listen for messages from the device
messaging.peerSocket.onmessage = function(evt) {
  if (evt.data) {
   
    let weatherPromise = new Promise(function(resolve, reject) {
      resolve( queryOpenWeather() );
    });
    
    let BGDPromise = new Promise(function(resolve, reject) {
      resolve( queryBGD() );
    });
    
    Promise.all([weatherPromise, BGDPromise]).then(function(values) {
      let dataToSend = {
        'weather':values[0],
        'BGD':values[1],
        'settings': {
          'bgColor': getSettings('bgColor'),
          'highThreshold': ((getSettings("highThreshold")) ? getSettings("highThreshold").name : 200),
          'lowThreshold': ((getSettings("lowThreshold")) ? getSettings("lowThreshold").name : 70),
          'timeFormat' : getSettings('timeFormat')
        }
      }
      returnData(dataToSend)
    });
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}


//----------------------------------------------------------
//
// This section deals with settings
//
//----------------------------------------------------------
// settingsStorage.onchange = function(evt) {
//  console.log( getSettings(evt.key) )

// }

// getters 
function getSettings(key) {
  if(settingsStorage.getItem( key )) {
    return JSON.parse(settingsStorage.getItem( key ));
  } else {
    return undefined
  }
}

function getSgvURL() {
  if(getSettings('endpoint').name) {
    return getSettings('endpoint').name  
  } else {
    // Default xDrip web service 
    return  "http://127.0.0.1:17580/sgv.json"
  }
}

function getWeatherApiKey() {
  if(getSettings('owmAPI')){
     return getSettings('owmAPI').name;
  } else {
    return false;
  }
}


function getWeatherEndPoint() {
  let city = ((getSettings("city")) ? getSettings("city").name : 'charlottesville');

  return "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=" +  getTempType();
}

function getTempType() {
   if(getSettings('tempType')){
     return 'imperial'
   } else {
      return 'metric'
   }
}

// TODO make this work Lat and Lon auto detect based on location. 
function locationSuccess(position) {
  return "lat=" + position.coords.latitude + "&lon=" + position.coords.longitude;
}

function locationError(error) {
  console.log("Error: " + error.code,
              "Message: " + error.message);
}

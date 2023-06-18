//初始化
let StationArr = [];
let AvailabilityArr = [];
let FilterData = [];
let accesstoken = {};
const map = L.map('map').setView([0, 0], 13);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 20,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoibWVnYW40Z3NkIiwiYSI6ImNsOXM1ZjRocTA4NWIzcXBvZDFoY2d3MDIifQ.ljoVvi0M0l5m3BuXXfB3NA'
    }).addTo(map);
const list = document.querySelector(".list");


$(function () {
    GetAuthorizationHeader();    
    GetGPS();    
});

// 取得API accesstoken
function GetAuthorizationHeader() {    
    const parameter = {
        grant_type:"client_credentials",
        client_id: "megan4gsd-2a6bc14c-095a-4417",
        client_secret: "d23a92f7-c5ee-4627-92dd-fafea4affdf3"
    };
    let auth_url = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
        
    $.ajax({
        type: "POST",
        url: auth_url,
        crossDomain:true,
        dataType:'JSON',                
        data: parameter,
        async: false,       
        success: function(data){            
            accesstoken = data;                         
        },
        error: function (xhr, textStatus, thrownError) {
            
        }
    });          
}

//取得經緯度
function GetGPSuceess(position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;
    GetStation(lat,lon);
    GetAvailability(lat,lon);
    map.setView([lat,lon], 16);
    let RedMarker = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    const marker = L.marker([lat,lon], {icon: RedMarker}).addTo(map);
}

function GetGPError() {
    window.alert('無法判斷您的所在位置，無法使用此功能。');
}


function GetGPS(){
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(GetGPSuceess, GetGPError);
    } else {
        window.alert('您的裝置不具備GPS，無法使用此功能');
    }
}

//取得站名資訊
function GetStation(lat,lon){
    if(accesstoken !=undefined){
        $.ajax({
            type: 'GET',
            url: `https://tdx.transportdata.tw/api/advanced/v2/Bike/Station/NearBy?%24top=10&%24spatialFilter=nearby%28${lat}%2C%20${lon}%2C%20500%29&%24format=JSON`,             
            headers: {
                "authorization": "Bearer " + accesstoken.access_token,                
            },            
            async: false,
            success: function (Data) {
                StationArr =  Data;
                console.log(StationArr);           
            },
            error: function (xhr, textStatus, thrownError) {
                console.log('errorStatus:',textStatus);
                console.log('Error:',thrownError);
            }
        });
    }
}

//取得可租.可還資訊
function GetAvailability(lat,lon){    
    if(accesstoken !=undefined){
        $.ajax({
            type: 'GET',
            url: `https://tdx.transportdata.tw/api/advanced/v2/Bike/Availability/NearBy?%24top=10&%24spatialFilter=nearby%28${lat}%2C%20${lon}%2C%20500%29&%24format=JSON`,             
            headers: {
                "authorization": "Bearer " + accesstoken.access_token,                
            },            
            async: false,
            success: function (Data) {
                AvailabilityArr =  Data;
                StationArr.forEach(function(stationItem){
                    AvailabilityArr.forEach(function(availableItem){
                        if(stationItem.StationUID == availableItem.StationUID){
                            let obj = {};
                            obj.StationUID = stationItem.StationUID;
                            obj.Name = stationItem.StationName.Zh_tw;
                            obj.ServiceStatus = availableItem.ServiceStatus;
                            obj.AvailableRentBikes = availableItem.AvailableRentBikes;
                            obj.AvailableReturnBikes = availableItem.AvailableReturnBikes;
                            obj.StationLon = stationItem.StationPosition.PositionLon;
                            obj.StationLat = stationItem.StationPosition.PositionLat;
                            FilterData.push(obj);
                        }
                    })
                })                  
            console.log(FilterData);
            RenderFilterData(); 
            FilterData.forEach(function(item){
                L.marker([item.StationLat, item.StationLon], {icon: L.icon.glyph({ prefix: 'mif', glyph: 'bicycle' }) }).addTo(map).bindPopup(`${item.Name}，可租借車數：${item.AvailableRentBikes}，可還車數${item.AvailableReturnBikes}`);
            })  
            },
            error: function (xhr, textStatus, thrownError) {
                console.log('errorStatus:',textStatus);
                console.log('Error:',thrownError);
            }
        });
    }
}

//渲染畫面
function RenderFilterData(){    
    let str="";
    FilterData.forEach(function(item){
        str+=`<li>${item.Name}，可租${item.AvailableRentBikes}，可還${item.AvailableReturnBikes}</li>`
    })
    list.innerHTML = str;
}




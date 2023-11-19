// ==UserScript==
// @name         Waze Editor Dutch helper
// @namespace    https://github.com/bruvv/Waze-Editor-Dutch-helper
// @version      2023.11.19.001
// @description  Open various map services from Waze Editor
// @author       Nivong
// @match        *://*.waze.com/*editor*
// @exclude      *://*.waze.com/user/editor*
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.7.2/proj4.js
// @updateURL    https://raw.githubusercontent.com/bruvv/Waze-Editor-Dutch-helper/main/waze_map_editor_budy.js
// @downloadURL  https://raw.githubusercontent.com/bruvv/Waze-Editor-Dutch-helper/main/waze_map_editor_budy.js
// @supportURL   https://github.com/bruvv/Waze-Editor-Dutch-helper/issues
// ==/UserScript==

/* global proj4 */
proj4.defs(
	"EPSG:28992",
	"+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.237,50.0087,465.658,-0.406857,0.350733,-1.87035,4.0812 +units=m +no_defs"
);

(function () {
	"use strict";

	window.setInterval(function () {
		let permaElement = document.querySelector("a.permalink");

		if (permaElement != null) {
			let fullURL = document.querySelector("a.permalink").href;
			let index = fullURL.indexOf("/editor");
			let path = fullURL.substr(index, fullURL.length);
			path = path.replace(/&s=[0-9]*/, "");
			path = path.replace(/&marker=(true|false)*/, "");
			window.history.replaceState("", "", path);
		}
	}, 1000);
})();

function calculateBAGZoom(wazeZoom) {
	// Map Waze zoom levels to BAG zoom levels
	return wazeZoom - 4;
}
function calculateMapillaryZoom(wazeZoom) {
	// Convert Waze zoom level to Mapillary zoom level
	// Adjust this mapping as needed
	return wazeZoom - 1;
}
function calculateSatellietDataPortaalZoom(wazeZoom) {
	// Convert Waze zoom level to Satelliet Data Portaal zoom level
	// Adjust this mapping as needed
	return wazeZoom;
}

(function () {
	"use strict";

	GM_addStyle(`
        .dropdown {
            position: fixed;
            top: 3%;
            right: 30%;
            transform: translateY(-50%);
            z-index: 1000;
        }
        .dropdown-logo {
            cursor: pointer;
            display: block;
            width: 50px;
            height: 50px;
        }
        .dropdown-content {
            display: none;
            position: absolute;
            right: 0;
            background-color: #f9f9f9;
            min-width: 160px;
            box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
            z-index: 1;
        }
        .dropdown-content a {
            color: black;
            padding: 12px 16px;
            text-decoration: none;
            display: flex;
            align-items: center;
        }
        .dropdown-content img {
            width: 20px;
            height: 20px;
            margin-right: 8px;
        }
        .dropdown-content a:hover {background-color: #f1f1f1}
        .dropdown:hover .dropdown-content {
            display: block;
        }
    `);

	let dropdown = document.createElement("div");
	dropdown.className = "dropdown";

	let logo = document.createElement("img");
	logo.className = "dropdown-logo";
	logo.src = "https://dronevlieger.nl/wazelogo.png";
	dropdown.appendChild(logo);

	let dropdownContent = document.createElement("div");
	dropdownContent.className = "dropdown-content";

	let maps = [
		{
			name: "Google Maps",
			logo: "https://www.google.com/favicon.ico",
		},
		{
			name: "Mapillary",
			logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Mapillary_logo.svg/1024px-Mapillary_logo.svg.png",
		},
		{
			name: "Satellietdataportaal",
			logo: "https://satellietdataportaal.nl/favicon.ico",
		},
		{ name: "Wegstatus", logo: "https://www.wegstatus.nl/favicon.ico" },
		{
			name: "Melvin",
			logo: "https://melvin.ndw.nu/assets/icon/favicon-32.png",
		},
		{
			name: "BAG Viewer",
			logo: "https://bagviewer.kadaster.nl/lvbag/bag-viewer/favicon.ico",
		},
	];

	maps.forEach(function (map) {
		let link = document.createElement("a");
		link.href = "#";

		let img = document.createElement("img");
		img.src = map.logo;
		link.appendChild(img);

		let text = document.createTextNode(map.name);
		link.appendChild(text);

		link.addEventListener("click", function () {
			openMap(map.name); // Function to handle map opening
		});

		dropdownContent.appendChild(link);
	});

	dropdown.appendChild(dropdownContent);
	document.body.appendChild(dropdown);

	function openMap(mapName) {
		// Extract coordinates from the current URL
		let params = new URLSearchParams(window.location.search);
		let lat = parseFloat(params.get("lat"));
		let lon = parseFloat(params.get("lon"));
		let wazeZoom = parseInt(params.get("zoomLevel"));
		let mapillaryZoom = calculateMapillaryZoom(wazeZoom);
		let satellietZoom = calculateSatellietDataPortaalZoom(wazeZoom);
		let bagZoom = calculateBAGZoom(wazeZoom);
		let transformedCoordinates = proj4("EPSG:4326", "EPSG:28992", [lon, lat]);

		if (!isFinite(lat) || !isFinite(lon)) {
			alert("Invalid coordinates!");
			return;
		}

		let url = "";
		switch (mapName) {
			case "Google Maps":
				url = `https://www.google.com/maps/?q=${lat},${lon}`;
				break;
			case "Mapillary":
				url = `https://www.mapillary.com/app/?lat=${lat}&lng=${lon}&z=${mapillaryZoom}`; // Adjust zoom level as needed
				break;
			case "Satellietdataportaal":
				url = `https://www.satellietdataportaal.nl/?base=brtachtergrondkaart&loc=${lat}%2C${lon}%2C${satellietZoom}z&overlay=mos-0`;
				break;
			case "Wegstatus":
				url = `https://www.wegstatus.nl/?lat=${lat}&lon=${lon}`;
				break;
			case "Melvin": {
				const offsetLat = 0.002; // Latitude offset for bounding box
				const offsetLon = 0.003; // Longitude offset for bounding box

				let swLat = lat - offsetLat;
				let swLon = lon - offsetLon;
				let neLat = lat + offsetLat;
				let neLon = lon + offsetLon;

				url = `https://melvin.ndw.nu/public?sw=${swLat},%20${swLon}&ne=${neLat},%20${neLon}&showHeader=false`;
				break;
			}
			case "BAG Viewer":
				url = `https://bagviewer.kadaster.nl/lvbag/bag-viewer/?geometry.x=${transformedCoordinates[0]}&geometry.y=${transformedCoordinates[1]}&zoomlevel=${bagZoom}`;
				break;
		}

		if (url) {
			window.open(url, "_blank");
		}
	}
})();

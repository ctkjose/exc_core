exc.components.register({ ///NST:MARK:CLASS:select
	id: 'map',
	selectors: ["[data-uiw='map']"],
	inherits: ['generic'],
	getter: function(o){
		return undefined;
	},
	setter: function(o, value){
		o.val(value);
		o.attr("data-uiw-value", value);
	},
	fn : { //additional functionality added to the element
		setAction: function(a){
			this.data('action-message',a);
		},
		getMap: function(){
			return this.m.map;
		}
	},
	init: function(o){

	},
	build: function(e){
		
		var o = $.htmlToNode("<div data-uiw='map' class='excmap' id='" + e.name + "_ID'></div>");
		o.attr("name", e.name );

		if(window["L"] == undefined){
			console.log("[EXC][ERROR] Leaftlet.js is not available.");
			return o;
		}

		var namedLayers = {
			'OSMBASIC': {
				name: 'OSMBASIC',
				url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}',
				attrib: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
				maxzoom: 19,
			},
			'OSMTOPO': {
				name: 'OSMTOPO',
				url:'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
				attrib: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
				maxzoom: 17,
			},
			'ESRISAT':{
				name: 'ESRISAT',
				url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
				attrib: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
				maxzoom: 17,
			},
		};

		o.m = {
		
			map: undefined,
			layers:{},
			config: {
				id:  e.name + "_ID",
				layers:[],
				start: [18.50519374209859, -67.12562263011934], //start location
				zoom: 17,
				bounds: [[18.5499,-65.2176], [17.8846,-67.2775]]
			}
		};

		if( e.hasProperty("layers") && Array.isArray(e.property("layers"))){
			var clayers = e.property("layers");
			for(var i in clayers){
				var ln = clayers[i];
				if(typeof(ln) == "string"){
					if(!namedLayers.hasOwnProperty(ln)) continue;
					
					o.m.config.layers.push(namedLayers[ln]);
				}else if(ln && typeof(ln) == "object"){
					o.m.config.layers.push(ln);
				}
			}
		}
		if( e.hasProperty("bounds") && Array.isArray(e.property("bounds"))){
			o.map.config.bounds = e.property("bounds");
		}
		if( e.hasProperty("start") && Array.isArray(e.property("start"))){
			o.map.config.bounds = e.property("start");
		}

		

		
		
		return o;
	},
	renderCompleted: function(o){
		o.m.map = L.map( o.m.config.id );
		var map = o.m.map;

		
		for(var ly in o.m.config.layers){
			var layer = L.tileLayer(osmUrl, {foo: 'bar', attribution: osmAttrib});
			o.m.layers[ly.name] = layer;
			layer.addTo(o.m.map);
		}

		map.setMaxBounds(o.m.config.bounds);
		map.setView(o.m.config.start, o.m.config.zoom);

	},

});

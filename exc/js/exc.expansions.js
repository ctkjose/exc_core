exc.expansions = {
	registry:[],
	define: function(d){
		if( !this.registry.hasOwnProperty(d.event) ){
			//this.registry[d.event] = [];
		}

		var def = core.extend({}, {applies: "*"}, d );


		this.registry.push(def);
	},
	install: function(selector){
		var o = (typeof selector == "undefined") ? $.get("body") : $.get(selector);

		if(!o) return;
		
		var e1 = [];
		var def;
		var fn = function(e){ ///NST:IGNORE
			if(e.hasClass("e1")) return;
			if(e1.indexOf(e) < 0) e1.push(e);
			def.install(e);
		};
		for(var k in this.registry){
			def = this.registry[k];
			if( !def.hasOwnProperty('install') || (typeof(def.install) != "function") ) continue;
			var n = def.name.toLowerCase().replace(/\:/g, '-');
			var sel = '[data-' + n + ']';
			$.getAll(sel, o).forEach(fn);
		}
		
		for(var i=0; i< e1.length; i++){
			e1[i].addClass("e1");
		}
		e1 = null;
	},
	apply: function(o){
		if(!o || !o.nodeType ) return;
		if(o.hasClass("e1")) return;
		
		var def;
		for(var i in this.registry){
			def = this.registry[i];
			if( !def.hasOwnProperty('install') || (typeof(def.install) != "function") ) continue;
			
			var n = def.name.toLowerCase().replace(/\:/g, '-');
			var sel = '[data-' + n + ']';
		
			if( def.hasOwnProperty('apply') && (typeof(def.apply) == "function") ){
				if(!def.apply(o)) continue;
			}

			if(!$.is(o,sel)) continue;
				
			def.install(o);
		}
		o.addClass("e1");
	}
};


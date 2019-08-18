exc.expansions = {
	registry:[],
	actionsMap: [],
	define: function(d){
		if( !this.registry.hasOwnProperty(d.event) ){
			//this.registry[d.event] = [];
		}

		var def = core.extend({}, {applies: "*"}, d );


		this.registry.push(def);
	},
	addAction: function(def){
		this.actionsMap.push(def);
	},
	performAction: function(attr, e, params){

		var a = this.getActionFromAttr(attr);
		if(!a) return false;

		

		if(a.type == "msg"){
			var msg = a.args.msg;
			app.publish(msg, {'cmd':msg, 'event': e, 'params': params});

			return true;
		}else if(a.type == "cfn"){
			var cn = a.args.controller;
			if(!exc.app.hasController(cn)){
				return false;
			}
			var o = exc.app.getController(cn);
			if(!o || (typeof(o) != "object")) return false;
			if(!o.hasOwnProperty(a.args.fn)) return false;
			if(typeof(o[a.args.fn]) != "function") return false;
			o[a.args.fn].apply(o, [e, params]);

			return true;
		}else if(a.type=='hndl'){
			a.handler(e, a.args);
		}
		
		return false;
	},
	getActionFromAttr: function(attr){
		

		var m, e, v;
		for(var i=0; i<this.actionsMap.length; i++){
			e = this.actionsMap[i];
			m = e.r.exec(attr);
			if(!m) continue;
			
			var o = {'type': e.type, 'args':{} };
			for(var j=0;j<e.args.length;j++){
				v = m[e.args[j].idx];
				if(typeof(v) == "undefined"){
					v = e.args[j].default;
				}

				switch( e.args[j].type ){
					case "bool":
						v = (v=="true") ? true : ((v=="1") ? true: false);
						break;
					case "integer":
						v = parseInt(v);
						break;
					case "numeric":
						v = parseFloat(v);
						break;
				}
					
				o.args[ e.args[j].name ] = v;
			}
			return o;
		}
		return undefined;
	},
	install: function(selector){
		var o = (typeof selector == "undefined") ? $.get("body") : $.get(selector);

		if(!o) return;
		
		var e1 = [];
		var def;
		var fn = function(e){ ///NST:IGNORE
			console.log("expansion found node %o", o);
			if(e.hasClass("e1")) return;
			if(e1.indexOf(e) < 0) e1.push(e);
			def.install(e);
		};
		for(var k in this.registry){
			def = this.registry[k];
			if( !def.hasOwnProperty('install') || (typeof(def.install) != "function") ) continue;
			var n = def.name.toLowerCase().replace(/\:/g, '-');
			var sel = '[' + n + ']';
			console.log("expansion for %s", n);
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
			var sel = '[' + n + ']';
		
			if( def.hasOwnProperty('apply') && (typeof(def.apply) == "function") ){
				if(!def.apply(o)) continue;
			}

			if(!$.is(o,sel)) continue;
				
			def.install(o);
		}
		o.addClass("e1");
	}
};


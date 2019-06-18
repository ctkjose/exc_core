var exc = exc || {};

//estensions for the DOM helper $
$.getComponent = function(a){
	var cmp = a.getAttribute("data-uiw");
	if(typeof(cmp) == "string"){
		return (exc.components.items.hasOwnProperty(cmp) ? exc.components.items[cmp] : undefined );
	}

	return undefined;
};
$.value = function(a, v) {
	var cmp = $.getComponent(a);
	if(typeof(cmp) == "object"){
		if((typeof(v) != "undefined")){
			if(cmp.hasOwnProperty("setter") && (typeof(cmp.setter)=="function") ){
				cmp.setter(a,v);
				return a;
			}
		}else{
			if(cmp.hasOwnProperty("getter") && (typeof(cmp.getter)=="function") ){
				return cmp.getter(a);
			}
		}
	}
	if(typeof(v) != "undefined"){
		return $.val(a,v);
	}
	return $.val(a);
};
$.component = function(a, t){
	a = $.get(a);
	return exc.components.get(a, t);
};

		
exc.components = {
	items: {},
	register: function(component){
		var def = { ///NST:IGNORE
			vs: undefined,
			isContainer: false,
			observers: {
				"value":[],
				"state":[],
			}
		};

		core.extend(def, component);
		
		this.items[def.id] = def;
		//console.log("[EXC][COMPONENTS] Definition %s created.", def.id);
		return def;
	},
	get: function(any, type){
		var o = $.get(any);
		
		if(!o) return null;
		if(o.hasOwnProperty("_cmpType")){ //already a cmp instance
			return o;
		}
		
		var uiw = (type) ? type : o.getAttribute("data-uiw"); 
		if(!uiw) return null;
		
		if( !this.items.hasOwnProperty(uiw) ){
			uiw = 'generic';
		}
		
		var def = exc.components.items[uiw];
		if(!def) return null;
		o.isComponent = true;
		o._cmpType = def.id;
		o._cmpUID = core.createUID();
		

		this.componentInit(o);
		this.decorate(def, o);

		if(typeof(def.init) == "function"){
			def.init(o);
		}
		return o;
	},
	decorate: function(def, o){
		
		var obj;
		if( def.hasOwnProperty('fn') ){
			obj = core.extend({}, this.defaultBehavior, def.fn);
		}else{
			obj = core.extend({}, this.defaultBehavior);
		}
		
		if( def.hasOwnProperty('inherits') ){
			for(i=0; i<def.inherits.length;i++){
				var k = def.inherits[i];
				if(!this.items.hasOwnProperty(k)) continue;
				if(!this.items[k].hasOwnProperty('fn')) continue;
				core.extend(obj, this.items[k].fn);
			}
		}

		Object.setPrototypeOf(obj, Object.getPrototypeOf(o));
		Object.setPrototypeOf(o, obj);

		var i=0;
		var keys = [];
		var vs = 'value';
		if( def.hasOwnProperty('vs') ){
			vs = def.vs;
		}else{
			keys = Object.keys(this.vs);
			for(i=0; i<keys.length;i++){
				if(o.hasClass('uiw-vs-' + keys[i])){
					vs = keys[i];
					break;
				}
			}
		}

		this.installValueInterface(o,vs,def);
	},
	makeNodeMessageEmitter: function(o){
		if(!o || !o.nodeType) return;
		
		o.sendMessage = function(msg){
			var e = new Event("excm", {bubbles: true, cancelable: false, view: window});
			e.target = o;
			e.message = {
				name: msg,
				target: o,
				params: Array.prototype.slice.call(arguments, 1)
			};

			o.dispatchEvent(e);
		};
	},
	attachNodeToController: function(o, controller){
		if(!o || !o.nodeType) return;
		if(!controller) return;
		o.addEventListener("excm", function(e){
			var msg = e.message.name;
			var args = e.message.params;
			//console.log("[EXC][EXCM][CONTROLLER=%s][%s] %o", controller._name, msg, args);
			var fn = controller.getMessageHandler(msg);
			if(fn){
				e.preventDefault();
				e.stopImmediatePropagation();

				fn.apply(controller, args);
				return;
			}
			
			if(controller.isMain){
				controller.publish.apply(controller, [msg].concat(args) );
			}
		});
	},
	buildComponentForContainer: function(e, container){
		var node = null;
		
		if(!exc.components.items.hasOwnProperty(e.type)){
			console.log("[EXC][COMPONENTS] Element has a component type of [%s] that is not implemented.", e.type);
			return  out;
		}

		var def = exc.components.items[e.type];

		var t; //main cmp target
		var list = exc.components.renderComponent(e);
		if(!Array.isArray(list) && list){
			node = list;
			t = node;
		}else if(Array.isArray(list)){
			if(list.length == 1){
				node = list[0];
				t = node;
			}else{
				node = new DocumentFragment();
				list.forEach(function(o){
					if($.is(o, def.selectors[0])) t = o;
					exc.expansions.apply(o);
					node.appendChild(o);
				});
			}
		}

		if( def.hasOwnProperty('renderCompleted') && (typeof(def.renderCompleted) == "function") ){
			def.renderCompleted(t);
		}

		return node;
	},
	renderComponents: function(selector){
		var parent = $.get(selector);
		var items = parent.find("[data-cmp]");

		if(!items || (items.length <= 0)) return;

		var process = {containers: [], items:[]};
		items.forEach(function(o){
			if(o.hasClass("e2")) return;

			var e = exc.components.createDefinition(o);
			if(typeof(e) != "object"){
				console.log("[EXC][COMPONENTS] Element is missing attribute data-component.");
				return;
			}

			if(typeof(e.type) == "undefined"){
				console.log("[EXC][COMPONENTS] Element has invalid content in attribute data-component.");
				return;
			}

			if(!exc.components.items.hasOwnProperty(e.type)){
				console.log("[EXC][COMPONENTS] Element has a component type of [%s] that is not implemented.", e.type);
				return;
			}

			var def = exc.components.items[e.type];

			if(def.isContainer){
				process.containers.push( {"o":o,"e":e, "def":def} );
			}else{
				process.items.push( {"o":o,"e":e, "def":def} );
			}

		});
		var fnProcessEntry = function(entry){
			var t;
			var list = exc.components.renderComponent(entry.e);
			if(typeof(list) == "undefined") return;
			if(!Array.isArray(list)){
				t = list;
			}else if(list.length == 1){
				t = list[0];
			}

			
			if(Array.isArray(list)){
				var df = new DocumentFragment();
				list.forEach(function(o){
					if($.is(o, entry.def.selectors[0])) t = o;
					exc.expansions.apply(o);
					df.appendChild(o);
				});
				entry.o.parentNode.replaceChild(df, entry.o);
			}else{
				entry.o.parentNode.replaceChild(t, entry.o);
			}

			if(!t) return;
			if(entry.def.isContainer){
				entry.o.childNodes.forEach(function(o1){
					if(o1.nodeType != 1) return;
					t.appendChild(o1);
				});
			}

			if( entry.def.hasOwnProperty('renderCompleted') && (typeof(entry.def.renderCompleted) == "function") ){
				entry.def.renderCompleted(t);
			}
		};

		process.containers.forEach(fnProcessEntry);
		process.items.forEach(fnProcessEntry);
	},
	renderComponent: function(e){
		//console.log("render component [%o].....", e);

		
		if(typeof(e) != "object"){
			console.log("[EXC][COMPONENTS] Element is missing attribute data-component.");
			return;
		}

		if(typeof(e.type) == "undefined"){
			console.log("[EXC][COMPONENTS] Element has invalid content in attribute data-component.");
			return;
		}

		if(!this.items.hasOwnProperty(e.type)){
			console.log("[EXC][COMPONENTS] Element has a component type of [%s] that is not implemented.", e.type);
			return;
		}

		var def = this.items[e.type];
		if( !def.hasOwnProperty('build') || (typeof(def.build) != "function") ) return undefined;


		//console.log(e);
		
		var list = def.build(e);
		//console.log("cmp %o", cmp);
		if(typeof(list) == "undefined") return undefined;
		if(!Array.isArray(list)){
			list = [list];
		}
		//cmp = this.instance(cmp);

		//console.log(o.data('exc-data'));
		for(var i in list){
			exc.expansions.apply(list[i]);
		}
		
		
		return list;
	},
	componentInit: function(cmp){
	

	},
	sendMessage: function(o, msg){
		var e = new Event("excm", {bubbles: true, cancelable: false, view: window});
		e.target = this;
		e.message = {
			name: msg,
			target: o,
			params: Array.prototype.slice.call(arguments, 2)
		};

		o.dispatchEvent(e);
	},
	createDefinition: function(any){
		
		if(typeof(any) != "object") return undefined;
		if(any._cmpType) return undefined;
	
		var e = {  ///NST:IGNORE
			name:"generic",
			type:"generic",
			properties: {},
			hasProperty: function(n){  ///NST:IGNORE
				return (this.properties.hasOwnProperty(n)) ? true : false;
			},
			removeProperty: function(n){ ///NST:IGNORE
				if(this.properties.hasOwnProperty(n)) delete this.properties[n];
				return this;
			},
			property: function(n,v){ ///NST:IGNORE
				var p = this.properties;
	
				if(typeof(v) == "undefined"){
					return (p.hasOwnProperty(n)) ? p[n] : undefined;
				}
	
				if(p.hasOwnProperty(n)){
					if(!Array.isArray(p[n])){
						p[n] = [p[n]];
					}
					p[n].push(v);
				}else{
					p[n] = v;
				}
			},
		};
		
		var prop = {};
		var keys = [];
		var i = 0, k ='';
		
		if( any.nodeType ){
			prop = any.getAttribute("data-cmp");
			prop = JSON.parse(prop);
			if(typeof(prop) != "object"){
				prop = {};
			}
			
			if(!prop.hasOwnProperty("classes")) prop.classes = []; ///NST:IGNORE
			if(!prop.hasOwnProperty("attributes")) prop.attributes = {}; ///NST:IGNORE
		
			var al = $.getAttr(any);
			//console.log("attr %o", al);
			for(k in al){
				if(k == "class"){
					prop.classes = al[k].split(/\s+/);
					continue;
				}
				if(k == "data-cmp") continue;
				if(k == "data-uiw"){
					e.type = al[k];
					continue;
				}
				if(k == "name"){
					e.name = al[k];
					continue;
				}
				prop.attributes[k] = al[k];
			}
			
			e.contents = "";
			var child = any.firstChild;
			while(child && child.nodeType != 1) child =  child.nextSibling;
			if(!child){
				child = any.firstChild;
				if(child && child.nodeType == 3){
					e.contents = child.nodeValue;
					any.removeChild(child);
				}
			}

			//console.log("component %s %o", e.name, e);	
		}else{
			prop = any;
			
			if(!prop.hasOwnProperty("classes")) prop.classes = [];  ///NST:IGNORE
			if(!prop.hasOwnProperty("attributes")) prop.attributes = {};  ///NST:IGNORE
		}
		
		var cfgObjValues = ["name", "type"];
		for(k in prop){
			if(cfgObjValues.indexOf(k) >= 0){
				e[k] = prop[k];
				continue;
			}
			e.properties[k] = prop[k];
		}
		
		if(!e.properties.hasOwnProperty("classes")){
			e.properties.classes = [];
		}
		
		return e;
	},
	defaultBehavior:{
		magic: function(){
			console.log("called magic");
		},
	},
	installValueInterface: function(elm, vs, def){
		var vp;
		
		if(elm.hasOwnProperty("_vsCBO")) return;
		console.log("@installValueInterface1 TYPE=%s ID=%s %o", elm._cmpType,elm._cmpUID, elm);

		var setter, getter;

		elm._vsCBO = false; //Changed By Owner Flag

		if( (typeof(vs) == "string") && exc.components.vs.hasOwnProperty(vs) ){
			vp = exc.components.vs[vs]; //use a built in value setter/getter
		}else if( (typeof(vs) == "object") ){
			vp = vs;
		}

		if( typeof(def.setter) == "function"){
			setter = def.setter;
		}else if( typeof(vp) != "undefined" ){
			setter = vp.setter; 
		}

		var ops = {
			owner: elm,
			setter: setter,

		};
		if( typeof(def.transformValue) == "function"){
			ops.transform = def.transformValue;
		};

		elm.vs = exc.ds.makeValueStore(ops);

		if( typeof(setter) == "function"){
			elm.vs.observe(function(v, cookie){
				if(cookie.owner._vsCBO) return;
				setter(elm, v);
			}, {owner:elm});
		}
		elm.assignValue = function(v){ //assignValue by owner
			this._vsCBO = true;
			this.vs.value = v;
			this._vsCBO = false;
			return this;
		};
		elm.setValue = function(v){
			this.vs.setValue(v);
			return this;
		};

		elm.getValue = function(dv){
			return this.vs.getValue(dv);
		};

	},
	installValueInterface_BK: function(elm, vs, def){
		var vp;
		var setter, getter;

		console.log("@installValueInterface %o", elm);

		if( (typeof(vs) == "string") && exc.components.vs.hasOwnProperty(vs) ){
			vp = exc.components.vs[vs];
		}else if( (typeof(vs) == "object") ){
			vp = vs;
		}

		if( typeof(def.setter) == "function"){
			setter = def.setter;
		}else if( typeof(vp) != "undefined" ){
			setter = vp.setter;
		}

		if( typeof(def.getter) == "function"){
			getter = def.getter;
		}else if( typeof(vp) != "undefined" ){
			getter = vp.getter;
		}

		
		elm.setValue = function(v){
			setter(elm, v);
			return elm;
		};

		elm.getValue = function(dv){
			return getter(elm, dv);
		};
		//value observers	
		if(!$.hasData(elm, "vo")){
			var vo = {
				observers: [],

			};

			$.data(elm,"vo", vo);
			
			elm.addValueObserver = function(callback){
				var vo = $.data(elm,"vo");
				vo.observers.push(callback);
				return this;
			};
		}
	},
	vs : { //value source,
		attr: {
			setter : function(elm, v){
				elm.attr('data-uiw-value', v);
				return elm;
			},
			getter: function(elm){
				var v = elm.attr('data-uiw-value');
				if(elm.hasClass("value-use-suffix")){
					var s = $.next(elm, ".decoration:last-child");
					if(s){
						v = v.replace(s.html(), "");
					}
				}
				//v = exc.ui.widget.valueBehaviors.getValueForNode(elm, v);
				return v;
			}
		},
		value: {
			setter : function(elm, v){
				elm.val(v);
				return elm;
			},
			getter: function(elm){
				var v = elm.val();
				if(elm.hasClass("value-use-suffix")){
					var s = $.next(elm, ".decoration:last-child");
					if(s){
						v = v.replace(s.html(), "");
					}
				}

				//v = exc.ui.widget.valueBehaviors.getValueForNode(elm, v);
				return v;
			}
		},
		hidden: {
			setter: function(elm, v){
				var hn = elm.attr("data-uiw-hidden");
				var h = elm.child("[name='" + hn + "']");
				if(!h) return elm;
				h.val(v);
				return elm;
			},
			getter: function(elm, dv){
				var hn = elm.attr("data-uiw-hidden");
				var h = elm.child("[name='" + hn + "']");
				if(!h) return dv;

				var v = h.val();
				if(elm.hasClass("value-use-suffix")){
					var s = $.next(elm, ".decoration:last-child");
					if(s){
						v = v.replace(s.html(), "");
					}
				}
				//v = exc.ui.widget.valueBehaviors.getValueForNode(elm, v);
				return v;
			}
		}
	},
};


function test1(){
	
	
	var o = exc.components.get("fname", "btn");


	return o;
}
exc.components.register({ ///NST:MARK:CLASS:generic
	id: 'generic',
	fn: {
		disable: function(){
			$.prop(this, 'disabled',true);
			$.prop(this, 'readonly',true);
			this.addClass('is-disabled');
			return this;
		},
		enable: function(){
			$.prop(this, 'disabled',false);
			$.prop(this, 'readonly',false);
			this.removeClass('is-disabled');
			return this;
		},
		focus: function(){
			this.focus();
			return this;
		}
	},
	install: function(o){
		

	}
});
exc.components.register({ ///NST:MARK:CLASS:field
	id: 'field',
	fn : {
		clear: function(){
			$.html(this, '');
		}
	},
	build: function(o){
		return o;
	},
	createFieldForElement: function (o, label, prefix, suffix, helpText){
		var container = $.htmlToNode('<div class="field"></div>');
		
		var uiw = o.getAttribute("data-uiw");
		container.addClass('exc-' + uiw + "-container");
		container.setAttribute("data-container-uiw", uiw );
		var s = "" + $.name(o);
		if(s.length > 0){
			container.setAttribute("name", "field_" + s );
			container.setAttribute("data-field-for", s );
		}

		if(label && (typeof(label)=="string")){
			var lbl = "<label class=\"label\">" + label + "</label>";
			$.append(container, lbl);
		}
		//txt = o.clone(true);
		
		var t = container;
		var dw;

		if((typeof(prefix)=="string") && (prefix.length > 0)){
			dw = $.htmlToNode("<div class=\"decoration-wrap\"></div>");
			$.append(dw, '<div class="field-group-decoration">'  + prefix + "</div>");
			t = dw;
		}

		if((typeof(suffix)=="string") && (suffix.length > 0)){
			if(!dw){
				dw = $.htmlToNode("<div class=\"decoration-wrap\"></div>");
				t = dw;
			}
			$.append(dw,'<div class="decoration">'  + suffix + "</div>");
		}

		$.append(t, o);


		if(helpText && (typeof(helpText)=="string")){
			var hlp = "<div class=\"help-text\">" + helpText + "</label>";
			$.append(container, hlp);
		}
		return container;
	}
});
exc.components.register({ ///NST:MARK:CLASS:container
	id: 'container',
	fn : {
		clear: function(){
			this.html('');
		}
	},
	build: function(o){
		return o;
	},
	createContainerForElement: function (o, prefix, suffix){
		var container = $.htmlToNode('<div class="field-group is-full-width"></div>');
		
		var uiw = o.getAttribute("data-uiw");
		container.addClass('exc-' + uiw + "-container");
		container.setAttribute("data-container-uiw", uiw );
		var s = "" + $.name(o);
		if(s.length > 0){
			container.setAttribute("name", "container_" + s );
			container.setAttribute("data-container-for", s );
		}
		//txt = o.clone(true);
		$.append(container, o);

		if((typeof(suffix)=="string") && (suffix.length > 0)){
			$.append(container, '<div class="decoration">'  + suffix + "</div>");
		}
		if((typeof(prefix)=="string") && (prefix.length > 0)){
			$.prepend(container, '<div class="decoration">'  + prefix + "</div>");
		}

		return container;
	}
});
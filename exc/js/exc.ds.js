exc.ds = {
	source: {},
	create: function(ops){
		var ds = {
			items:[],
		};
		var observers = [];
		var state = { 
			sourceType:"",
			sourceParams: {},
			idx:-1,
			
			ready:false,
			current: null,
			params:{},
			observers: {},
		};
		ds.getState = function(){
			return state;
		};

		//Object.setPrototypeOf(ds.__proto__, this.fn);
		ds.__proto__ = this.fn;

		
		if(ops){
			if(ops.hasOwnProperty("type") && this.source.hasOwnProperty(ops.type)){
				var sourcePlugin = this.source[ops.type];
				state.sourceType = ops.type;

				core.extend(state.sourceParams, ops);
				sourcePlugin.init(ds, ops);
				
			}
		}
		
		core.makePublisher(ds);

		var _fnOn = ds.on;
		ds.on = function(topic, listener){
			_fnOn.apply(this, [topic, listener]);

			if((topic.toLowerCase() == "itemsloaded")  && this.getState().ready){
				core.callbackWithArguments(listener, [ds]);
			}
		};

		return ds;
	},
	query: function(){
		
	},
	parse: function(statement){
		var tk, n;
		
		
		var parser = exc.helper.simpleParser.create(statement);

		var dsq = {
			fields:[],
			sourceParam:"",
			sourceType:"",
			criteria:"",
		};
		
		var verbs = {
			verb_select: function(){
				var fields = [];
				var tk = parser.nextToken();
				if(tk.type != 4){
					parser.saveToken(tk);
					return;
				}

				dsq.fields.push(tk.value);
				tk = parser.nextToken();
				while(tk && (tk.value == ",")){
					tk = parser.nextToken();
					if(tk.type == 4){
						dsq.fields.push(tk.value);
						tk = parser.nextToken();
					}
				}
				if(tk) parser.saveToken(tk);
				
			}
		};
		tk = parser.nextToken();
		//console.log(tk);
		//return;

		while(tk && tk.value != ''){
			if(tk.type==4){ //identifier
				n = "verb_" + tk.value.toLowerCase();
				if(verbs.hasOwnProperty(n)){
					verbs[n]();
				}
			}

			tk = parser.nextToken();
		}

		console.log(dsq);
	},
	loadData:function(ds, data){
		var st = ds.getState();
		st.idx = -1;
		st.ready = true;
		st.current = null;

		if(typeof(st.sourceParams.processData) == "function"){
			data = st.sourceParams.processData(data);
		}
		ds.items = [];
		if(Array.isArray(data)){
			ds.items = data;

		}else if(data && (typeof(data) == "object")){
			st.current = data;
			st.idx = 0;
			ds.items.push(st.current);
		}

		ds.publisherReady(true);
		ds.publish("itemsLoaded", ds);
	},
	registerSource: function(name, behavior){
		var engine = behavior;

		var fnVerb = function(){
			var ds = exc.ds.instance();
			var st = ds.getState();
			st.sourceType = name;

			engine.init(ds);

			ds.getEngine = function(){
				return engine;
			};

			return ds;
		}


		this.source[name] = behavior;
		this[name] = fnVerb;
	},
	fn: {
		item: function(idx){
			var st = this.getState();

			if(idx == undefined){
				return st.current;
			}

			try {
				return this.items[idx];
			} catch (error) {
				return undefined;
			}
			
			return undefined;
		},
		itemAsCollection: function(idx){
			var item  = this.item(idx);
			if(item == undefined) return undefined;

			var collection = exc.ds.makeValueCollection(item);

			var _ds = this;
			var myObserver = function(aCollection, keyName){
				console.log("ds key [%s] changed to ", keyName, aCollection[keyName]);
				item[keyName] = aCollection[keyName];
				_ds.publish("itemKeyChanged", _ds, item, keyName);
			};
			collection.subscribe(myObserver);
			return collection;
		},
		appendItem: function(item){
			var i = this.items.length;
			this.items.push(item);

			this.publish("itemAdded", this, i);
			return this;
		},
		removeItem: function(idx){
			var st = this.getState();
			if(idx == undefined){
				if( (st.idx >= this.items.length-1) || (st.idx < 0)) return this;
				this.items.splice(st.idx, 1);
				var idxRemoved = st.idx;
				if(st.idx > 0) st.idx--;
				this.publish("itemRemoved", this, idxRemoved);
				return this;
			}

			try {
				if( (idx >= this.items.length-1) || (idx < 0)) return this;
				this.items.splice(idx, 1);
				this.publish("itemRemoved", this, idxRemoved);
			} catch (error) {
				
			}
			
			return this;
		},
		forEach: function(callback){
			this.items.forEach(callback);
		},
		rewind: function(){
			var st = this.getState();
			st.idx = -1;
			if(!Array.isArray(this.items)){ //ensure we have an array
				this.items = [];
			}
		},
		next: function(){
			var st = this.getState();
			if( st.idx >= this.items.length-1 ) return false;
			++st.idx;

			st.current = this.items[st.idx];
			return true;
		},
		previous: function(){
			var st = this.getState();
			if(st.idx == 0) return false;
			--st.idx;

			st.current = this.items[st.idx];
			return true;
		},
		getKeyValue: function(k){
			var st = this.getState();
			if(k == "@count") return this.items.length;
			if(k == "@index") return st.idx;
			if(st.current && st.current.hasOwnProperty(k)){
				return st.current[k];
			}
			return undefined;
		},
		hasKey: function(k){
			var st = this.getState();
			if(st.current && st.current.hasOwnProperty(k)){
				return true;
			}
			return false;
		},
		setKeyValue: function(k, v){
			var st = this.getState();
			if(st.current){
				st.current[k] = v;
				this.publish("itemKeyChanged", this, st.current, k);
			}
			return this;
		},
		setEngine: function(name){
			if(!exc.ds.source.hasOwnProperty(name)){
				console.log("[EXC][DS][ERROR] DataSource engine %s is not valid.", name);
				this.engine = null;
				return false;
			}

			this.engine = exc.ds.source[name];
			return this;
		},
		params: function(){
			var st = this.getState();
			st.params= {};

			var args = arguments;
			c = args.length;

			if(c == 1){
				if(Array.isArray(args[0]) && (args[0].length > 0)){
					args[0].forEach(function(e){
						this.params.apply(this, e);
					});
				}else if(args[0] && typeof(args[0])=="object"){
					var keys = Object.keys(args[0]);
					keys.forEach(function(k){
						st.params[k] = args[0][k];
					});
				}
			}else if((c % 2) == 0){
				for(var i = 0; i <= c-1; i+=2){
					var k = args[i];
					var v = args[i+1];
					st.params[k] = v;
				}
			}
			return this;
		},
	}
};

/** Create a ValueCollection from a plain object passed in item.
 *  A valueCollection lets your subscribe to be notified of changes to the collection, or a change in a particular key.
 *  Use subscribe/unsubcribe to listen to changes to the collection.
 *  Use addObserverForKey/removeObserverForKey to listen for changes on a particular key.
 *  A notification callback has the signature aCallback(aValueCollection, keyName, cookie).
 * 
 * @param item a plain object to convert to a ValueCollection
 * @returns an instance of a valueCollection
 * 
*/
exc.ds.makeValueCollection = function(item){
	var out = {};
	var observers = [];
	var keys = Object.keys(item);

	function createProperty(obj, keyName, initialValue){
		var value = initialValue;
		var owner = obj;
		var key = keyName;
		var t = typeof(value);
		if((t == "function") || (t=="object")) return;

		var desc = {enumerable: true};
		desc.set  = function(newValue){
			value = newValue
			this.notifyKeyChange(key);
		};
		desc.get  = function(){
			return value;
		};

		Object.defineProperty(obj, key, desc);
	}

	var proto = {
		notify: function(key){
			console.log("@valueStore.notify()");
			observers.forEach(function(efn){
				if(efn[1] != null) return;
				core.callbackWithArguments(efn[0], [this, key, efn[2]]);
			}, this);
			return this;
		},
		notifyKeyChange: function(key){
			console.log("@valueStore.notifyKeyChange()");
			observers.forEach(function(efn){
				if(efn[1] != key) return;
				core.callbackWithArguments(efn[0], [this, key, efn[2]]);
			}, this);

			this.notify(key);
			return this;
		},
		addObserverForKey: function(key, callback, cookie){
			observers.push([callback, key, cookie]);
			return this;
		},
		removeObserverForKey: function(key, callback){
			observers = observers.filter(function(efn){
				return ((efn[0] != callback) || (efn[1] != key));
			});
			return this;
		},
		subscribe: function(callback, cookie){
			observers.push([callback, null, cookie]);
			return this;
		},
		unsubscribe: function(callback){
			observers = observers.filter(function(efn){
				return efn[0] != callback;
			});
			return this;
		},
		appendKey: function(key, value){
			if((key in keys)){
				this[key] = value
				return this;
			}

			keys.push(key);
			createProperty(this, key, value);
			return this;
		},
		hasKey: function(key){
			return (keys.indexOf(key) >= 0);
		},
		asPrimitive: function(){
			var o = {};
			for(var i in keys){
				var k = keys[i];
				o[k] = this[k];
			}
			return o;
		},
		serialize: function(){
			return JSON.stringify(this.asPrimitive());
		},
		assign: function(obj){
			//Assigns a plain object to this 
			for(var i in keys){
				var k = keys[i];
				if(!obj.hasOwnProperty(k)) continue;
				this[k] = obj[k];
			}
			return this;
		},
		toString: function(){
			return this.serialize();
		}
	};

	//define magic prop keys
	var propKeys = {enumerable: false};
	propKeys.set  = function(newValue){};
	propKeys.get  = function(){
		return keys;
	};
	Object.defineProperty(out, "keys", propKeys);
	

	out.__proto__ = proto;

	keys.forEach(function(k){
		createProperty(out, k, item[k]);
	});
	
	return out;

};
exc.ds.makeValueStore = function(aValue, options){

	var observers = [];
	var value = aValue;

	var proto = {
		setValue: function(newValue){
			var v = newValue;
			if( typeof(ops.transform) == "function"){
				v = ops.transform(value);
			}
			value = v;
			this.notify();
		},
		getValue: function(dv){
			return value;
		},
		notify: function(){
			observers.forEach(function(efn){
				core.callbackWithArguments(efn[0], [value, efn[1]]);
			}, this);
		},
		observe: function(callback, cookie){
			observers.push([callback, cookie]);
			return this;
		},
		removeObserver: function(callback){
			observers = observers.filter(function(efn){
				return efn[0] != callback;
			});
			return this;
		},
		toString: function(){
			if(value === null){
				return "NULL";
			}
			if(value === undefined){
				return "UNDEFINED"
			}
			var t = typeof(value);
			if( t == "boolean"){
				return value ? "TRUE" : "FALSE";
			}else if( t == "object"){
				return JSON.stringify(value);
			}

			return value;
		}
	};

	var ops = core.extend({
		owner:null,
	}, options);

	var vs = {
	};
	
	vs.__proto__ = proto;
	
	//define magic prop keys
	var propValue = {enumerable: false};
	propValue.set  = function(newValue){
		this.setValue(newValue);
	};
	propValue.get  = function(){
		return value;
	};
	Object.defineProperty(vs, "value", propValue);

	return vs;
};


exc.ds.registerSource("rest", { ///NST:MARK:CLASS:DS_SOURCE_REST
	init: function(ds){

		core.extend(ds.__proto__, this.fn);
		var state = ds.getState();
		
		state.sourceParams.method = (state.sourceParams.method) ? state.sourceParams.method.toUpperCase() : "GET";
		if(!state.sourceParams.url) state.sourceParams.url = "";
	
	},
	fn: {
		load: function(){
			var ds = this;
			
			console.log("@rest.load");
			var ready = core.promise.create();
			var st = this.getState();
			st.ready = false;
			
			var params = {};
			
			var ops = core.extend({}, st.sourceParams);
	
			delete ops.method;

			if(st.params){
				var url = st.sourceParams.url;
				var keys = Object.keys(st.params);
				keys.forEach(function(k){
					var v = st.params[k];
					if(url.indexOf("{" + k + "}") >= 0){
						url = url.split("{" + k + "}").join(encodeURIComponent(v));
					}else{
						params[k] = v;
					}
				});

				st.sourceParams.url = url;

			}

			ops.url = st.sourceParams.url;
			var p;
			if(st.sourceParams.method == "GET"){
				p = http.get(ops, params);
			}else{
				p = http.post(ops, params);
			}

			if(!p) return;
			p.on("done", function(response){
				if(response && (typeof(response.data) == "object")){
					if(response.data.hasOwnProperty("status") && (response.data.status == "success") && response.data.hasOwnProperty("data")){
						exc.ds.loadData(ds, response.data.data);
						st.ready = true;

						ready.resolve(ds);
					}
				}
			});
			p.on("error", function(response){
				ready.reject(ds);
			});
			
			return ready;

		},
		
	}
});



exc.valueStore = {
	create: function(options){
		var ops = core.extend({
			owner:null,

		}, options);

		var v = {
			ops: ops,
			value:null,
			observers:[]
		};

		var value = null;
		v.__proto__ = this.fn;
		

		return v;
	}, 
	fn: {
		setValue: function(value){
			var v = value;
			if( typeof(this.ops.transform) == "function"){
				v = this.ops.transform(value);
			}
			this.value = v;
			this.notify();
			return this;
		},
		getValue: function(dv){
			return this.value;
		},
		notify: function(){
			this.observers.forEach(function(efn){
				core.callbackWithArguments(efn[0], [this.value, efn[1]]);
			}, this);
		},
		subscribe: function(callback, cookie){
			this.observers.push([callback, cookie]);
			return this;
		},
		unsubscribe: function(callback){
			this.observers = this.observers.filter(function(efn){
				return efn[0] != callback;
			});
			return this;
		}
	},
	vp: {



	}

};

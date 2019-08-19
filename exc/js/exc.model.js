/** Create a model from a plain object passed in item.
 *  A valueCollection lets your subscribe to be notified of changes to the collection, or a change in a particular key.
 *  Use subscribe/unsubcribe to listen to changes to the collection.
 *  Use addObserverForKey/removeObserverForKey to listen for changes on a particular key.
 *  A notification callback has the signature aCallback(aValueCollection, keyName, cookie).
 * 
 * @param item a plain object with initial values, or array of keys
 * @returns an instance of a valueCollection
 * 
*/
exc.model = function(item){
	var out = {};
	var observers = [];
	var keys = (item && Array.isArray(item)) ? item : (item && (typeof(item)=="object") ? Object.keys(item) : []);

	function createProperty(obj, keyName, initialValue){
		var value = initialValue;
		var owner = obj;
		var key = keyName;
		var t = typeof(value);
		if((t == "function") || (t=="object")) return;
		
		var desc = {enumerable: true, configurable: true};
		desc.set  = function(newValue){
			value = newValue
			owner.notifyKeyChange(key);
		};
		desc.get  = function(){
			return value;
		};
		
		Object.defineProperty(obj, key, desc);
	};
	var model_proto = {
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
		addObserver: function(callback, cookie){
			observers.push([callback, null, cookie]);
			return this;
		},
		removeObserver: function(callback){
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
	Object.defineProperty(this, "keys", propKeys);
	Object.setPrototypeOf(this, model_proto);

	var _self = this;
	keys.forEach(function(k){
		var v = (item && (typeof(item)=="object")) ? item[k] : undefined;
		createProperty(_self, k, v);
	});
};

exc.model.getItemsForSelector = function(modelName, selector){
	var parent = selector ? $.get(selector) : $.get(document.body);
	var items = parent.find('[m-model="' + modelName + '"]');

	if(!items || (items.length <= 0)) return [];

	console.log("items for model %s %o", modelName, items);

	return items;
};
exc.model.get = function(modelName, selector){
	
	var items = exc.model.getItemsForSelector(modelName, selector);

	if(!items || (items.length <= 0)) return undefined;


	var model = new exc.model();
	
	function bindToModelKey(o, name, model){
		var _me = o;
		var flgIsMe = false;
		$.onAction(_me, "change.value.done()",  function(e){
			console.log("@model.change.done(%s) for bindTo Control %o", modelName,n, e.target);
			
			var v;
			if(core.isCallable("getValue", _me)){
				v = _me.getValue();
			}else if(_me instanceof HTMLInputElement){
				v = _me.value;
			}
			flgIsMe = true;
			model[name] = v;
			flgIsMe = false;
		});
		model.addObserverForKey(name, function(model, key, cookie){
			if(flgIsMe) return;
			console.log("@model.keyChanged(%s) for bindTo Control %o",key, _me);
			if(core.isCallable("setValue", _me)){
				_me.setValue(model[key]);
			}else if(_me instanceof HTMLInputElement){
				_me.value = model[key];
			}
		});
	};

	for(var i in items){
		var o = $.get(items[i]);
		var n = $.name(o);
		
		var v;
		if(core.isCallable("getValue", o)){
			v = o.getValue();
		}else if(o instanceof HTMLInputElement){
			v = o.value;
		}

		model.appendKey(n, v);
		bindToModelKey(o, n, model);
	}

	return model;
};
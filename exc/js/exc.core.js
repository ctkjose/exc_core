(function(d){
	//jose
	self.core = self.core || {};

	core.ready = function(fn){
		if (d.readyState !== 'loading') {
			core.callbackWithArguments(fn, null, []);
			return;
		}
		
		d.addEventListener('DOMContentLoaded', () => {
			core.callbackWithArguments(fn, null, []);
		});
	};
	core.createUID= function(){
		var d = new Date().getTime();
		var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (d + Math.random()*16)%16 | 0;
			d = Math.floor(d/16);
			return (c=='x' ? r : (r&0x3|0x8)).toString(16).toUpperCase();
		});
		return uuid;
	};
	core.extend= function(a) {
		var k = arguments, l = null;
		for( i = 1; i < k.length; i++ ) {
		  if ( (l = k[ i ]) ) {
			for (var j in l){ a[j] = l[j]; }
		  }
		}
		return a;
	};
	core.objectHasMethod = function(obj, n){
		///N:checks if object has a fn
		///P:n: a string with function name
		if(!obj || (typeof(obj) != "object")) return false;
		
		var fn = obj[n];
		if(typeof(fn) != "function") return false;
		return true;
	};	
	core.objectCallMethod = function(obj, n, args){
		///N:executes a member fn of an object
		///P:n: a string with function name or an actual function

		if(!obj || (typeof(obj) != "object")) return undefined;
		
		var fn = (typeof(n) == "function") ? n : obj[n];
		if(typeof(fn) != "function") return undefined;
		return fn.apply(obj, args);
	};
	core.callback = function(fn){
		var args = Array.prototype.slice.call(arguments, 1);
		if(fn && Array.isArray(fn)){
			var cfn = (typeof fn[1] === 'string') ? fn[0][fn[1]] : fn[1];
			return cfn.apply(fn[0], args);
		}else if(typeof fn == "function"){
			return fn.apply(fn, args);
		}
		return undefined;
	};
	core.getCallback = function(any){
		var fn;
		if(typeof any == "function") return any;
		
		//Array [this,  fn]
		//Array [object,  fnName]
		if(any && Array.isArray(any) && (any.length == 2)){
			fn = function(){
				var cfn = (typeof any[1] === 'string') ? any[0][any[1]] : any[1];
				return cfn.apply(any[0], arguments);
			};
			return fn;
		}

		if(typeof(any) == "string"){
			var s = "" + any.toLocaleString();
		
			//must be an action
			var m = /\@\(([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\)/.exec(s);
			if( m ){ //is a controller callback
				console.log(m);
				fn = function(){
					var obj = window[m[1]];
					if(typeof(obj) != "object") return;
					console.log(obj);
					core.callbackWithArguments( [obj, m[2]], arguments);
				};
				return fn;
			}


			var msg = s;
			fn = function(){
				var args = [msg];
				args.push(arguments);
				console.log(args);
				app.publish.apply(app, args);
			};
		
		
			return fn;
		}

		return undefined;
	};
	/**
	* Invoke callbacks with an array of arguments
	*
	* @param {Object} fn - A function or an Array with [obj, "fn_name"]
	* @param {Array} args - An Array of arguments
	*/
	core.callbackWithArguments = function(fn, args){
		var a = [fn];
		Array.prototype.push.apply(a, args);
		core.callback.apply(core, a );
	};
	
	core.execCallback = function(fn, t, args){
		if(Array.isArray(fn)){				
			fn[1].apply(fn[0], args);
		}else{
			fn.apply(t, args);
		}
	};
	core.runCode = function(code, thisObj, selfObj, opLimitScope){
		//runs eval code
		return (function(){

			if(typeof(opLimitScope)=="undefined") opLimitScope = true;
			var obj = {};
			var exports = {};
			var module = {}; //nodejs style module
			module.exports = exports;

			var self = self;

			if(!thisObj) thisObj = {};
			if(opLimitScope){
				var window = obj;
				self = (!selfObj) ? obj: selfObj;
				code = "\"use strict\";\n" + code;
			} else if(selfObj){
				self = selfObj;
			}

			var ok = true;
			var fn = function(){
				try{
					eval(code);	
				}catch(e){
					ok = false;
					if (e instanceof SyntaxError) {
						console.log("[EXC][RUNCODE] SYNTAX ERROR IN CODE.");
						console.log(e.message);
					}
				}
			};
			fn.call(thisObj);
			return {status: ok, thisObj: thisObj, exports: exports};

		})();
	};
	core.runGlobalCode = function(code, thisObj){
		//runs eval code
		var n = document.createElement( "script" );
		n.text = code;
		var r = {status: true, thisObj: thisObj, exports: {} };
		n.onerror = function() {
			console.log("[EXC][RUNCODE] SYNTAX ERROR IN CODE.");
			r.status = false;
		};
		document.head.appendChild(n).parentNode.removeChild(n);

		return r;
	};
    core.objectCopy= function(a, b){
            if (null === a || "object" != typeof a) return b;
            for (var attr in a) {
              if (a.hasOwnProperty(attr)) b[attr] = a[attr];
            }
    };
	core.objectClone= function(o){
		function tpl() {}

		var hasOwn = Object.prototype.hasOwnProperty;

		var copyItems = function(a,b, types ){
			var ln, i, lt;
			var t = ["undefined","string", "number", "boolean", "object", "function"];
			if(Array.isArray(types)) t = types;

			var ls = Object.getOwnPropertyNames(a);
			if (ls.length === 0) return;

			for(i in ls) {
				ln = ls[i];
				lt = typeof(a[ln]);
				if(t.indexOf(lt) < 0) continue;
				b[ln] = a[ln];
			}
		};
		return function (o) {
			var i =0;
			var ln, obj;
			if (typeof(o) != 'object') {
				throw TypeError('Clone requires an Object');
			}

			var proto = Object.getPrototypeOf(o);
			if( typeof(proto) == "object" ){
				copyItems(proto, tpl.prototype, ["function"]);
			}

			obj = new tpl();
			tpl.prototype = null;

			copyItems(o, obj);

			return obj;
		}(o);
	};
	core.decorate= function(a, o){
		core.extend(a,o);
	};
	core.promise = {
		create:function(){
			var p = {_pstate:0,_pstate_args:[], success: undefined,failure: undefined, data: undefined};	
		
			core.extend(p, this.fn);
		
			var onSuccess = undefined;
			var onSuccessOps = {enumerable: true};
			var onFailure = undefined;
			var onFailureOps = {enumerable: true};

			onSuccessOps.set  = function(newValue){
				onSuccess = newValue;
				var fn = core.getCallback(newValue);
				if(fn){
					this.success = fn;
				}
			};
			onSuccessOps.get  = function(){
				return onSuccess;
			};

			onFailureOps.set  = function(newValue){
				onFailure = newValue;
				var fn = core.getCallback(newValue);
				if(fn){
					this.failure = fn;
				}
			};
			onFailureOps.get  = function(){
				return onFailure;
			};

			Object.defineProperty(p, 'onSuccess', onSuccessOps);
			Object.defineProperty(p, 'onFailure', onFailureOps);

			if(arguments.length > 0){
				p.onSuccess = arguments[0];
				if( (arguments.length >= 2)) p.onFailure = arguments[1];
			}
		
			return p;
		},
		fn: {
			reset: function(){
				this._pstate = 0;
				this._pstate_args = [];
			},
			resolve: function(){
				this._pstate = 1;
				this._pstate_args = arguments;
				if((typeof(this.success) == "function") || Array.isArray(this.success) ) {
					core.callbackWithArguments(this.success, arguments);
				}
			},
			reject: function(){
				this._pstate = 500;
				this._pstate_args = arguments;
				if((typeof(this.failure) == "function") || Array.isArray(this.failure) ) {
					core.callbackWithArguments(this.failure, arguments);
				}
			},
			chain: function(p){
				return this.then( function(){ p.resolve.apply(p, arguments); }, function(){ p.reject.apply(p, arguments); });
			},
			then: function(fn, fnr){
				var fnSuccess = null;
				fnSuccess = core.getCallback(fn);


				var p = core.promise.create();
				if(fnSuccess){
					this.success = function(){
						if((typeof(fnSuccess) == "function") || Array.isArray(fnSuccess) ) {
							core.callbackWithArguments(fnSuccess, arguments);
						}
						p.resolve.apply(p, arguments);
					};
				}
			
				var fnFail = null;
				fnFail = core.getCallback(fnr);
				
				if(fnFail){
					this.failure = function(){
						if((typeof(fnFail) == "function") || Array.isArray(fnFail) ) {
							core.callbackWithArguments(fnFail, arguments);
						}
						p.reject.apply(p, arguments);
					};
				}
			
				if(this._pstate == 1){
					this.resolve.apply(this, this._pstate_args);
				}else if(this._pstate == 500){
					this.reject.apply(this, this._pstate_args);
				}
				return p;
			}
		}
	};

	
	core.makePublisher = function(obj){
	
		if(!obj || (typeof(obj) != "object")) return;		
		var _p = {owner: obj, ready: false, delayedForReady:[], topics: {}};

		obj.on = function(topic, listener){
			topic = topic.toLowerCase();
			if(!hasOwnProperty.call(_p.topics, topic)) _p.topics[topic] = { listeners: [] };
			var index = _p.topics[topic].listeners.push(listener) - 1;
			
			var _this = obj;
			return {
				remove: function() {
					delete _p.topics[topic].listeners[index];
				}
			};
		};
		obj.publisherReady = function(newState){
			
			if(!newState){
				_p.ready = false;
				return;
			}
	
			_p.ready = true;
			_p.delayedForReady.forEach( function(e){
				var a = e.args;
				if(!hasOwnProperty.call(_p.topics, e.topic)) return;
				_p.topics[e.topic].listeners.forEach( function(fn) {
					core.callbackWithArguments(fn, a);
				});
			});
			_p.delayedForReady = [];
		};
		obj.publish = function(topic) {
			console.log("[PUBLISH][" + topic + "]");
			
			topic = topic.toLowerCase();
			var args = Array.prototype.slice.call(arguments, 1);
			//console.log(args);
			
			if(!_p.ready){
				_p.delayedForReady.push( {'topic' : topic, 'args': args });
				return this;
			}
			
			if(hasOwnProperty.call(_p.topics, topic)){
				_p.topics[topic].listeners.forEach(function(fn) {
					core.callbackWithArguments(fn, args);
				});
			}
			return this;
		};
	
	};
	core.controller = {
		decorate: function(obj){
			obj._state = {
				isready: false,
				topics: {},
				publishPromise: undefined,
				delayedForReady: [],
				readyHandlers: [],
			};
			
			core.extend(obj, this.fn);
			return obj;
		},
		fn:	{
			 /**
			* Register for an event
			* @param {String} topic - name of event
			* @param {callback} listener - A function or an Array with [obj, "fn_name"]
			*/
			on: function(topic, listener){
				if(!hasOwnProperty.call(this._state.topics, topic)) this._state.topics[topic] = { listeners: [] };
				var index = this._state.topics[topic].listeners.push(listener) -1;
				
				var _this = this;
				return {
					remove: function() {
						delete _this._state.topics[topic].listeners[index];
					}
				};
			},
			/**
			* Invoke an event
			* @param {String} topic - name of event
			* @param {any} [params...] - additional arguments to pass
			*/
			performMessage : function(msg) {
				var args = Array.prototype.slice.call(arguments, 1);

				var fn = this.getMessageHandler(msg);
				if(fn){
					return fn.apply(this, args);
				}else{
					return undefined;
				}
			},
			getMessageHandler: function(msg){
				msg = msg.toLowerCase();
				var keys = Object.keys(this);
			
				var fn, n, m;
				for(i=0;i<keys.length;i++){
					n = keys[i];
					if(typeof(this[n]) != "function") continue;
					if(n.toLowerCase() == msg){
						fn = this[n]; break;
					}
					if(!(m = n.match(/^on([A-Za-z0-9\\.\\-_]+)$/))) continue;
					if(m[1].toLowerCase() == msg){
						fn = this[n]; break;
					}
				}

				return fn;
			},
			publish : function(topic) {
				console.log("[EXC][CONTROLLER][PUBLISH][" + topic + "]");
				var state = this._state;
			
				var promise;
				if(typeof(state.publishPromise) != "undefined"){
					promise = state.publishPromise;
					state.publishPromise = undefined;
				}

				topic = topic.toLowerCase();
				var args = Array.prototype.slice.call(arguments, 1);
				//console.log(args);
				
				if(!state.isready){
					state.delayedForReady.push( {'topic' : topic, 'args': args, 'promise': promise });
					return this;
				}
				
				if(hasOwnProperty.call(state.topics, topic)){
					state.topics[topic].listeners.forEach(function(fn) {
						core.callbackWithArguments(fn, args);
					});
				}
				
				if(typeof(promise) == "function") promise();
			
			},
			hasListeners: function(topic){
				if(hasOwnProperty.call(this._state.topics, topic)){
					if(this._state.topics[topic].listeners.length > 0) return true;
				}
				return false;
			},
			done: function(fn){
				this._state.publishPromise = fn;
			},
			isReady: function(){
				return this._state.isready;
			},
			ready: function(fn){
				var state = this._state;
				var _this = this;

				if(typeof(fn) == "function"){
					if( state.isready === true){
						core.callback(fn);
						return;
					}
				
					state.readyHandlers.push(fn);
					return;
				}
			
				state.isready = true;
			
				for( var i in state.readyHandlers ){
					var afn = state.readyHandlers[i];
					core.callback(afn);
				}
			
				state.delayedForReady.forEach( function(e){
					var a = e.args;
					if(!hasOwnProperty.call(state.topics, e.topic)) return;
					state.topics[e.topic].listeners.forEach( function(fn) {
						core.callbackWithArguments(fn, a);
					});
			
					if(typeof(e.promise) == "function"){
						e.promise();
					}
				});
			},
			registerHandlers : function(obj, flgReplace){
				//console.log("@core.controller.registerHandlers(%o)", obj);
				if(typeof(obj) != "object") return;
				
				if(typeof(flgReplace) == "undefined") flgReplace=false;
				
				var i,j;
				var keys = Object.keys(obj);
				//console.log(keys);
				
				for(i=0;i<keys.length;i++){
					var fn_name = keys[i]; var evt = null;
					var m = /^on([A-Za-z0-9\\.\\-_]+)$/.exec(fn_name);

					if(!m) continue;
					evt = m[1]; evt = evt.toLocaleLowerCase();
					this.on(evt, [obj, fn_name]);
				}
			}
		}, //end fn
	};
})(document);

var loader = {
	history:[],
	create: function(a){
		var m = {
			_state :{
				items: [],
				busy: false,
				flgAbort: false,
				
				promise: undefined,
			}
		};
		core.extend(m, this.fn);

		if(arguments.length == 1){
			if(Array.isArray(a) && a.length > 0){
				for(var i in a){
					m.appendEntry(a[i]);
				}
			}
		}else if(arguments.length > 1){
			for(var i=0;i<arguments.length;i++){
				m.appendEntry(arguments[i]);
			}
		}
		return m;
	},
	fn: {
		isBusy: function(){
			return this._state.busy;
		},
		abort: function(){
			this._state.busy = false;
			this._state.flgAbort = true;
			
			if(this._state.promise) this._state.promise.reject();
		},
		checkDone: function(done){
			if(this._state.items.length  <= 0){

				if(this._state.busy) return false;
				
				this._state.busy = false;
				if(this._state.flgAbort){
					if(this._state.promise) this._state.promise.reject();
				}else{
					if(this._state.promise) this._state.promise.resolve();
				}
				if(typeof(done) == "function") core.callback(done, this);

				return true;
			}

			return false;
		},
		process: function(){

			if(this._state.busy) return;
			this._state.promise = core.promise.create();
		
			for(var i = 0; i<this._state.items.length;i++){
				var e = this._state.items[i];
				if(e.wait) continue;
				this._state.items.splice(i,1);

				this.processEntry(e);
				if(this._state.flgAbort) break;
				i=0;
			}
			if(this._state.flgAbort) return;

			this.processNext();
			return this._state.promise;
		},
		processNext: function(){
			if(this._state.flgAbort) return;
			//console.log("@processNext count=%d, %o", this._state.items.length, this._state.items[0]);
			if(this._state.items.length == 0){
				if(this._state.busy){
					this._state.busy = false;
					if(this._state.promise) this._state.promise.resolve();
				}
				return;
			}

			this._state.busy = true;
			var e = this._state.items[0];
			this._state.items.splice(0,1);
			this.processEntry(e);
		},
		processEntry: function(e){
			if( !e.force && (loader.history.indexOf(e.url) >=0) ){
				//console.log("@processEntry SKIP %o", e.url);
				if(e.wait) this.processNext();
				return;
			}
			
			var _this = this;

			var data = null;
			if(!e.cache){
				data = {"_t":  new Date().getTime()};
			}
			http.get({url: e.url, opRunJS: false}, data,  function(response){
				if(response.lastError > 0){
					_this._state.busy = false;
					_this._state.flgAbort = true;
			
					if(_this._state.promise) _this._state.promise.reject("[EXC][MANIFEST] FAILED TO LOAD [" + e.url + "]");
					return;
				}

				if(e.mime == "text/css"){
					_this.processCSS(e, response.data);
				}else if((e.mime == "text/javascript") || (e.mime == "application/javascript")){
					_this.processJavaScript(e, response.data);
				}
			});
		},
		processJavaScript: function(e, data){
			if( loader.history.indexOf(e.url) < 0 ) loader.history.push(e.url);

			var r;
			if(e.type && e.type == "export"){
				r = core.runCode(data, self, self, opLimitScope);

				if(e.name && r.status){
					window[e.name] = r.exports;
				}
			}else{
				r = core.runGlobalCode(data, self);
			}
			if(!r.status){
				e.loaded = false;
				_this._state.busy = false;
				_this._state.flgAbort = true;
			
				if(_this._state.promise) _this._state.promise.reject("[EXC][MANIFEST] FAILED TO LOAD [" + e.url + "]");
				return;
			}else{
				e.loaded = true;
				e.exports = (r.exports) ? r.exports : {};
			}
			if(e.wait){
				this.processNext();
			}else{
				this.checkDone();
			}
		},
		processCSS: function(e, data){
			if( loader.history.indexOf(e.url) < 0 ) loader.history.push(e.url);
			

			$.get("head").appendChild( $.htmlToNode('<style type="text/css" data-url="' + e.url + '">\n' + data + '</style>') );
			if(e.wait){
				this.processNext();
			}else{
				this.checkDone();
			}
		},
		appendEntry: function(o){

			if(typeof(o) == "string"){
				o = {url:o};
			}
			var e = {
				wait: true,
				ext: "",
				loading: false,
				cache: true,
				force: false,
			};
			core.extend(e, o);
			if(typeof(e.url) != "string") return;

			if(e.url.length > 0){
				var b = e.url.split('?')[0];
				e.ext = b.substr(b.lastIndexOf('.')+1).toLowerCase();
			}

			if(typeof(e.mime) != "string"){
				if(e.ext == "css"){
					e.mime = "text/css";
				}else if(e.ext == "js"){
					e.mime = "application/javascript";
				}
			}else{
				e.mime = mime;
			}
		
		
			this._state.items.push(e);
		},
	}
};
	
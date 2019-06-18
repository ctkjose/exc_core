(function(d){
	self.exc = self.exc || {};
	if(!exc.helper) exc.helper = {};

	exc.icons = {
		error: '<svg class="exc_icon_svg exc_icon_error" viewBox="0 0 50 50"><circle class="exc-icon-fillcolor" style="fill:#D75A4A;" cx="25" cy="25" r="25"/><polyline style="fill:none;stroke:#FFFFFF;stroke-width:2;stroke-linecap:round;stroke-miterlimit:10;" points="16,34 25,25 34,16"/><polyline style="fill:none;stroke:#FFFFFF;stroke-width:2;stroke-linecap:round;stroke-miterlimit:10;" points="16,16 25,25 34,34"/></svg>',
		success: '<svg class="exc_icon_svg exc_icon_success" viewBox="0 0 50 50"><circle class="exc-icon-fillcolor" style="fill:#25AE88;" cx="25" cy="25" r="25"/><polyline style="fill:none;stroke:#FFFFFF;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" points="38,15 22,33 12,25 "/></svg>',
		plus: '<svg class="exc_icon_svg exc_icon_plus" viewBox="0 0 50 50"><circle class="exc-icon-fillcolor" style="fill:#43B05C;" cx="25" cy="25" r="25"/><line style="fill:none;stroke:#FFFFFF;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" x1="25" y1="13" x2="25" y2="38"/><line style="fill:none;stroke:#FFFFFF;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" x1="37.5" y1="25" x2="12.5" y2="25"/></svg>'
	};
	exc.app = {
		kTypes: {
			CONTROLLER: 1,
			MANIFEST: 2,
			INTERACTION: 3
		},
		kAppStatus: {
			PENDING: 1,
			LOADING: 2,
			RUNNING: 10,
			ABORTED: 500,
		},
		kControlleStates: {
			DECLARED: 0,
			INITIALIZED: 1
		},
		state: {
			appStatus: 1,
			controllers: {},
			manifestCount: 0,
		},
		data: {},
		hasController: function(n){
			return this.state.controllers.hasOwnProperty(n);
		},
		getController: function(n){
			return this.state.controllers.hasOwnProperty(n) ? this.state.controllers[n].controller : undefined;
		},
		waitForAppInstance: function(){
			this.state.appStatus = this.kAppStatus.PENDING;
			if((typeof(self["app"]) != "object")){
			//if((typeof(self["app"]) != "object") || (typeof(self.app.config) != "function") ){
				setTimeout(function(){ exc.app.waitForAppInstance(); }, 200);
				return;
			}
			self.app.isMain = true;
			self.app._name = "main";
			self.app.data = {};
			var p = exc.app.loadController(self.app);
			p.then(function(o){
				console.log("App controller loaded %o", o);
			});
		},
		refreshState: function(){
			//init new controllers
			var n, e;
			if(this.state.appStatus <= exc.app.kAppStatus.LOADING) return;

			for(n in this.state.controllers){
				e = this.state.controllers[n];
				if(e.initState != this.kControlleStates.DECLARED) continue;
				this.initController(e.controller);
			}
		},
		loadControllerByName: function(n){
			if(!self[n] || this.state.controllers.hasOwnProperty(n)) return;
			self[n]._name = n;
			this.loadController(self[n]);
		},
		loadController: function(o){

			o._type = exc.app.kTypes.CONTROLLER;
			core.controller.decorate(o);
			
			var _state = {
				loaded: false,
				mainRunning: false,
				session: {},
				origin: {},
				states:{},
			};
			core.extend(o._state, _state);

			if(o.isMain){
				this.state.appStatus = this.kAppStatus.LOADING;
			}
			

			if(!o.hasOwnProperty("_name")){
				o._name = "C" + core.createUID();
			}

			if(o.hasOwnProperty("data")){
				core.extend(this.data, o.data);
				o.data = {};
			}

			var pLoadDone = core.promise.create();

			var pLoad = core.promise.create(function(){
				if(o.hasOwnProperty("manifest") && o.manifest) exc.app.processManifest(o.manifest);
				exc.app.processController(o);				
				pLoadDone.resolve(o);
			}, function(){
				if( exc.app.state.appStatus >= exc.app.kAppStatus.LOADING ){
					core.objectCallMethod(self.app, "onLoadFailed");	
				}

				pLoadDone.reject(o);
			});

			
			var p = undefined;

			if(o.hasOwnProperty("manifest") ){

				if( Array.isArray(o.manifest.require) && (o.manifest.require.length>0)){
					var m = loader.create(o.manifest.require);
					var pM = m.process();
					if(pM){
						p = pM.chain(pLoad);
					}
				}
				if( Array.isArray(o.manifest.include) && (o.manifest.include.length>0)){
					var m = loader.create(o.manifest.include);
					m.process();
				}
			}

			if(!p) pLoad.resolve();
			return pLoadDone;
		},
		loadInteraction: function(o){
			o._type = exc.app.kTypes.INTERACTION;

			if(o.hasOwnProperty("data")){
				core.extend(this.data, o.data);
				o.data = {};
			}

			var pLoadDone = core.promise.create();

			var pLoad = core.promise.create(function(){
				if(o.hasOwnProperty("manifest") && o.manifest) exc.app.processManifest(o.manifest);
				exc.app.processInteraction(o);				
				pLoadDone.resolve(o);
			}, function(){
				pLoadDone.reject(o);
			});
			
			var p = undefined;
			if(o.hasOwnProperty("manifest") ){

				if( Array.isArray(o.manifest.require) && (o.manifest.require.length>0)){
					var m = loader.create(o.manifest.require);
					var pM = m.process();
					if(pM){
						p = pM.chain(pLoad);
					}
				}
				if( Array.isArray(o.manifest.include) && (o.manifest.include.length>0)){
					var m = loader.create(o.manifest.include);
					m.process();
				}
			}


			if(!p) pLoad.resolve();
			return pLoadDone;
		},

		processController: function(controller){
			var i;
	
			var n = controller._name;
			this.state.controllers[n] = {
				name: n,
				initState: exc.app.kControlleStates.DECLARED,
				controller: controller
			};
			

			if( (this.state.appStatus >= exc.app.kAppStatus.LOADING) ){
				self.app.registerHandlers(controller);
			}
			this.refreshState();

		
			if(controller.isMain){
				this.initAppController(controller);
				return;
			}
		},
		processManifest: function(m){
			if(!m) return;
			var list, i, e, n;

			if( Array.isArray(m.require) && (m.require.length>0) ){
				list =m.require;
				for(i in list){
					e = list[i];
					if( typeof(e.controller) == "string"){
						this.loadControllerByName(e.controller);
					}
				}
			}
		},
		initController: function(controller){
			var n = controller._name;
			if(this.state.controllers[n].initState >= this.kControlleStates.INITIALIZED) return;

			this.state.controllers[n].initState = this.kControlleStates.INITIALIZED;		
			core.objectCallMethod(controller, "initialize", []);


			if(controller.hasOwnProperty("interactions") && Array.isArray(controller.interactions) && (controller.interactions.length > 0) ){
				this.processInteractions(controller.interactions);
				delete controller.interactions;
			}
		},
		initAppController: function(controller){
			this.firstResponder = null;
			core.extend(controller, this.fn);
			
			controller.registerHandlers(controller);


			controller.publish = controller.message;
			
			this.state.controllers.main.initState = this.kControlleStates.INITIALIZED;		
			core.objectCallMethod(controller, "initialize", []);
			

			if(exc.views) exc.views.initialize();
			if(controller.performMessage("AppStart")){
				this.run(controller);
			}
		},
		run: function(controller){

			controller.ready();

			if(!app.hasOwnProperty("opSessionName")){
				app.opSessionName = "es1";
			}
			this.state.appStatus = exc.app.kAppStatus.RUNNING;
			this.refreshState();
			
			$.hide($.get(".appls"));
			
			if(controller.hasOwnProperty("interactions") && Array.isArray(controller.interactions) && (controller.interactions.length > 0) ){
				this.processInteractions(controller.interactions);
				delete controller.interactions;
			}
		},
		processInteractions: function(list){
			if(!list) return;
			if(!Array.isArray(list) || (list.length==0)) return;

			for(var i in list){
				var e = list[i];
                var args = e.args || [];
				
                if( this.interactions.fn.hasOwnProperty(e.cmd) ){
					//run a client_interaction
					this.interactions.fn[e.cmd].apply(this, args);
				}else{
					app.publish( e.cmd, args);
				}
			}
		},
		processInteraction: function(st){
			if( st.payloads){
				if(st.payloads.hasOwnProperty("style") ){
					var css = document.createElement("style");
					css.innerHTML = st.payloads.style;
					document.head.appendChild(css);
				}
				if(st.payloads.hasOwnProperty("js") ){
					core.runGlobalCode(st.payloads.js, self);
				}
				if(st.payloads.hasOwnProperty("views") ){
					for(var i in st.payloads.views){
						exc.views.installEntry(st.payloads.views[i]);
					}
				}
			}
		
			if(st.interactions && Array.isArray(st.interactions)){
				exc.app.processInteractions(st.interactions);
			}

		},
		interactions: {
			fn : {
				publish: function(msg, params){
					app.publish(msg,params);
				},
				msr : function(n){
					app.sessionRemove(n);
				},
				mss : function(n, v){
					app.session(n, v);
				},
				alert : function(msg){
					alert(msg);
				},
				js : function(code){
					var fn = null;
					try{
					  eval(code);
					}catch(e){
						if (e instanceof SyntaxError) {
							console.log("[EXC][APP][INTERACTION] SYNTAX ERROR IN REMOTE CODE.");
							console.log(e.message);
						}
					}
					if( typeof fn !== "function") return;
					fn();
				},
				errorRemove : function(sel, msg){
					var o = $(sel);
					if(!o || (o.length <= 0) ) return;
					//  reasg_validator_removeError(o, msg);
				},
				errorSet : function(sel, msg){
					var o = $(sel);
					if(!o || (o.length <= 0) ) return;
					//reasg_validator_setError(o, msg);
				},
				redirect: function(url, msg){
					if(typeof(msg) !== 'undefined'){
						app.splashShowLoading(msg);
					}else{
						app.splashShowLoading("Redirecting please wait...");
					}	
					window.location.replace(url);
				},
			},

		},
		fn: {
			makeFirstResponder: function(o){
				this.firstResponder = undefined;
				if(typeof(o)=="string"){
					o = exc.app.getController(o);
				}
				if(o.isMain) return this;

				if(!o || (typeof(o) !="object")) return;
				if(!o._type || o._type != exc.app.kTypes.CONTROLLER) return;
				
				this.firstResponder = o;
				return this;
			},
			message: function(msg){
				if(!this.firstResponder){
					return core.controller.fn.publish.apply(this, arguments);
				}	
				console.log("CONTROLLER[%s].message(%s)", this._name,msg);

				var fn = this.firstResponder.getMessageHandler(msg);
				if(!fn){
					return core.controller.fn.publish.apply(this, arguments);
				}
				
				var args = Array.prototype.slice.call(arguments, 1);
				return fn.apply(this.firstResponder, args);
			},
			sessionRefresh: function(){
				var se = sessionStorage.getItem(this.opSessionName);
				if( typeof(se) == "string" && se.length > 0){
					this._state.session = JSON.parse(se);
				}
			},
			sessionCommit: function(){
				sessionStorage.setItem(this.opSessionName, JSON.stringify(this._state.session) );
			},
			session: function(n, v){
				if(typeof(v)!= "undefined"){
					this._state.session[n] = v;
					this.sessionCommit();
					return this;
				}
				
				if(!this._state.session.hasOwnProperty(n)) return undefined;
				return this._state.session[n];	
			},
			sessionHasKey: function(n){
				return this._state.session.hasOwnProperty(n);	
			},
			sessionRemove: function(n){
				if(this._state.session.hasOwnProperty(n)) {
					delete this._state.session[n];
					this.sessionCommit();
				}
			
				return this;		
			},
			splashShowLoading: function(html, opCheckLoad){
				var a = $.get(".appls");
				if(typeof(html) == 'undefined'){
					 $.html($.get(".appls > .msg"), "Loading, please wait...");
				}else{
					   $.html($.get(".appls > .msg"), html);
				}
				if(typeof(opCheckLoad) == "undefined") opCheckLoad = true;
				a.style.display = 'flex';
				
				var appnt = 0;
				var appcheckfn = function(){
					appnt++;
					var s = '';
					s = '';

					setTimeout(appcheckfn, 10000);
					if(appnt <= 1) return;
					if(appnt > 8){
						s = "Still loading!<br><i>This application is taking too long! Try to reload this application.</i><br>";
					}else if(appnt > 1){
						s = "Still loading! please wait...";
					}

					$.html($.get(".appls > .msg"), s);
					
				};


				if(opCheckLoad) setTimeout(appcheckfn, 5000);
			},
			splashShowFatalError: function(html){
				var a = $.get(".appls");
				$.get(".appls > .spinner").style.display = "none";

				var s = "";

				var logo = $.get(".appls > .logo");
				$.css(logo, {width:"100px", height:"100px"});
				//$.css($.get(".appls > .logo .ecircle"), "fill", "#fff");
				$.html(logo, exc.icons.error);
	
				if(typeof(html) == 'undefined'){
					 s = "Oops! An unexpected error occurred";
				}else{
					 s = html;
				}
					
				a.style.display = 'flex';
				
				

				$.html($.get(".appls > .msg"), s);
			},
		}
	};


	exc.backend = {
		action: function(){
			var args = arguments;
			var url = undefined;
			var a = {
				params: {},
				getURL: function(){
					return url;
				},
				exec: function(data){
					return exc.backend.commitAction( this, data);
				}
			};
			if(args.length == 0) return null;

			if(typeof(args[0]) == "string"){
				var m = /\@\(([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\)/.exec(args[0]);
				if( m ){
					url = new URL('./' + m[1] + "." + m[2], location);
				}else{
					m = /\@\(([A-Za-z0-9_\.\-\/]+)\/([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\)/.exec(args[0]);
					if( m ){ //is a backend action
						if(m[1].substr(0,1) == "/"){
							url = new URL(app.backend.base + "c" + m[1] + "/" + m[2] + "." + m[3], location);
						}else{
							url = new URL(app.backend.controller_directory + m[1] + "/" + m[2] + "." + m[3], location);
						}
					}else{

						m = /\url\(([A-Za-z0-9_\.\-\/\:\?\&\+\%\=\@]+)\)/.exec(args[0]);
						if( m ){
							url = new URL(m[1], location);
						}
					}
				}
			}

			return a;
		},
		commitAction: function(a, data){
			if(!a) return undefined;
			
			var p = core.promise.create();
			var url = a.getURL().toString();

			var pdata = {}, payload = {};
	
			if( a.hasOwnProperty("params") ){
				core.extend( pdata, a.params );
			}
			if( typeof(data) == "object" ){
				core.extend( pdata, data );
			}

			payload.api_return = 'json';
			payload.api_json_state = JSON.stringify(this.getState());
			payload.api_json_data = JSON.stringify(pdata);

			var request = http.post({
				url: url,
				headers: { "X-EXC-MS": this.ms },
				opRunJS: false
			}, payload);

			request.on("done", function(response){
				console.log("backend response %o", response);
				if(response.lastError){
					p.reject();
					return;
				}
				if(response.headers['CONTENT-TYPE-MIME'] == "text/javascript"){
					var bd = {};					
					var js = "" 
					js += response.data;
					js += "";
					console.log(js);
					var ok = true;
					try{
						eval(js);
					}catch(error){
						ok = false;
						if (error instanceof SyntaxError) {
							console.log("[EXC][BACKEND][INTERACTION] SYNTAX ERROR IN CODE.");
							console.log(e.message);
						}
						p.reject();
					}

					if(ok){
						p.resolve(bd);
					}
				}else if(response.data && typeof(response.data) == "object"){
					exc.app.loadInteraction(response.data);
			
				}
			});
			return p;
		},
		getMS: function(){
			return '';
		},
		getState: function(){
			var state = {
				'ms' : this.getMS(),
				'from_url' : location.href,
				'from_path' : location.pathname,
				'from_query' : location.search,
				'session' : {}
			};
			return state;
		},
		updateState: function(){

		}
	};
	core.ready(function(){
		exc.app.waitForAppInstance();
	});
})(document);

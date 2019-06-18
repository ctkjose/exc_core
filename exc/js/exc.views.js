if(!exc) exc = {};

exc.stage = {
	stack:[],
	v:null,
	flgCancelBack:false,

	appBar: null,
	container: null,
	currentView:null,
	
	find: function(name){
		var out ={idx:-1, view: undefined};

		for(var i=0;i<this.stack.length;i++){
			console.log( "[" + i + "][" + this.stack[i].name + "]==[" + name + "]");
			if(this.stack[i].name == name){
				out.idx = i;
				out.view = this.stack[i];
				break;
			}
		}
		return out;
	},
	push: function(view){
		this.stack.push(view);
	},
	initialize: function(){
		this.container = exc.views.items.appStage;
		this.appBar = exc.views.items.appBar;
		
		
		app.publish("stageReady", {'stage': this});
	},
	cleanStack: function(){
		console.log("@cleanStack....%o", this.currentView);
		if(!this.currentView) return;
		var flgFound = false;
		var i;
		for(i= this.stack.length-1; i>= 0; i--){
			var v = this.stack[i];
			if( v.name == this.currentView.name){
				flgFound = true;
				break;
			}
			v.o.removeClass("is-open").removeClass("view-is-hidden");
			v.o.removeClass("view-slide-to-right").removeClass("view-slide-to-left");

			this.stack.pop();
		}
	},
	closeCurrent: function(){
	
		var flgHasCurrent = (!this.currentView) ? false: true;

		if(!flgHasCurrent) return;
		if(this.stack.length === 0) return;

		var currentView = this.currentView;

		
		this.cancelShowView = false;
		exc.components.sendMessage(currentView.o, "viewShouldClose", {'stage': this, 'view': currentView});
		

		if(this.cancelShowView){
			this.cancelShowView=false;
			return;
		}

		var fnClose = function(){
			console.log("@fnClose");
			currentView.o.removeClass("is-open").removeClass("view-is-hidden");
			currentView.o.removeClass("view-slide-to-right").removeClass("view-slide-to-left");
			currentView.close();
		};

		if(currentView.options.modal){
			fnClose();
			return;
		}

		if(this.stack.length > 1){
			this.show(this.stack[this.stack.length-2], {push:false});
		}else{
			fnClose();
			this.stack.pop();
			this.currentView = null;
		}
	},
	show: function(any, options){
		var flgHasCurrent = (this.currentView ? true : false);
		var flgNeedsBuild = false, flgReveal = false, flgRevealIdx = -1, flgCurrentInStack = false, found;
		var view, viewCurrent;
	
		var en='';
		var _this = this;

		var ops = {push: true, navigate: false, slide: 'left', modal: false};

		var cw = this.container.o.offsetWidth;
		var ch = this.container.o.offsetHeight;

		if(typeof(options) == "object"){
			core.extend(ops, options);
		}

		
			
		var t = typeof(any);
		if(t == "string"){
			view = exc.views.find(any);
		}else if(t == "object"){
			view = any;
		}
		if(!view || (typeof(view) != "object")) return;

		if(view.state < exc.views.states.READY){
			flgNeedsBuild = true;
		}
		
		if(flgHasCurrent){
			if(view.name == this.currentView.name) return;
			viewCurrent = this.currentView;

			var found = this.find(viewCurrent.name); //is in stack?
			if(found.idx >= 0) flgCurrentInStack = true;

		}

		

		found = this.find(view.name); //is in stack?
		if(found.idx >= 0){
			flgReveal = true;
			flgRevealIdx = found.idx;
			ops.push =false;
		}
		
		if(ops.modal) view.type = "modal";
			
		if(view.type == "modal"){
			ops.push =false;
		}
		
		//console.log("@stage.show::panel=" + view.name + "::flgHasCurrent=" + flgHasCurrent + "::flgReveal=" + flgReveal + "::flgRevealIdx=" + flgRevealIdx);
		if(flgReveal && (flgRevealIdx != this.stack.length-1)){			
			//console.log("@stage.show::Cleaning stack after " + flgRevealIdx);
			//console.log(this.stack);
			//this.stack.splice(flgRevealIdx+1, Number.MAX_VALUE);
			//console.log(this.stack);
		}

	
		this.cancelShowView = false;
		if(flgHasCurrent){
			exc.components.sendMessage(viewCurrent.o, "viewShouldClose", {'stage': this, 'view': viewCurrent});
		}
		
		if(this.cancelShowView){
			this.cancelShowView=false;
			return;
		}
		
		if(view.controller){
			app.makeFirstResponder(view.controller);
		}

		exc.components.sendMessage(view.o, "viewWillEnterStage", {'stage': this, 'view': view, 'reveal': flgReveal} );

		if(this.cancelShowView){
			this.cancelShowView=false;
			return;
		}

		if( flgNeedsBuild ){
			exc.views.initializeView(view);
		}

	
		this.container.append(view.o);
		
		view.o.style.width = "" + cw + "px";
		view.o.style.height = "" + ch + "px";
		
		if(flgHasCurrent){
			var fnAnimationDone = function(){
				viewCurrent.o.addClass("view-is-hidden").removeClass("view-is-hiding");
				view.o.removeClass("view-is-showing");
				view.o.removeClass("view-slide-to-right").removeClass("view-slide-to-left");
				viewCurrent.o.style.transition = "";
				viewCurrent.o.style.transform = "";

				view.o.style.transition = "";
				view.o.style.transform = "";

				if(flgReveal && flgCurrentInStack){
					_this.cleanStack();
				}
				if(ops.push) _this.stack.push(view);
			};
			var tw1 = flgReveal ? (cw * -1) : cw;
			var tw2 = flgReveal ? cw : (cw * -1);
			var tcss = flgReveal ? "view-slide-to-right" : "view-slide-to-right";
			view.o.style.transition = "";
			view.o.style.transform = "translateX(" + tw1 + "px)";
			view.o.removeClass("view-is-hidden");
			view.o.addClass(tcss);


			viewCurrent.o.addClass("view-is-hiding");
			viewCurrent.o.style.transition = "all 440ms ease-out";
			viewCurrent.o.style.transform = "translateX(-" + tw2 + "px)";
			
			view.o.addClass("view-is-showing");
			view.o.style.transition = "all 450ms ease-out";
			view.show();
			
			this.currentView = view;
			exc.components.sendMessage(view.o, "viewDidEnterStage", {'stage': exc.stage, 'view': view, 'reveal': flgReveal} );

			setTimeout(function(){
				view.o.style.transform = "translateX(0)";
			}, 10);
			setTimeout(fnAnimationDone, 460);
		}else{
			this.currentView = view;
			view.show();
			if(ops.push) this.stack.push(view);
		}
	
		return this;
	},
	
}
exc.views = {
	items: {},
	initialized: false,
	states: {
		DESTROYED: 0,
		CREATED: 1,
		READY: 2,
		OPEN: 3,
		CLOSED: 4,
	},
	find: function(name){
		var v = null;		
		Object.keys(this.items).forEach(function(entry){
			if(entry == name) v = this.items[entry];
		}, this);
		return v;
	},
	register: function (o){
		var v = this.create(o);
		if(typeof(v) == "undefined") return undefined;
	
		//console.log("@exc.views.installing(" + v.name + ")");
	
		this.items[v.name] = v;

		if(this.initialized){
			//console.log("@exc.views.view.initialize(" + v.name + ")");
		}
	},
	initializeView: function(v){

		if(v.o.hasClass("e11")) return;
		
		if( typeof(v.controller) =="string" ){
			var c = exc.app.getController(v.controller);
			if(c){
				v.controller = c;
			}else{
				v.controller = app;
			}
		}
		exc.components.sendMessage(v.o, "viewBuild", {'view': v});
		exc.components.renderComponents(v.o);
		exc.components.sendMessage(v.o, "viewReady", {'view': v});
		
		if(v.type == "modal"){
			if(v.o.child(".view")) v.o.child(".view").addClass("e11");
		}else{
			v.o.addClass("e11");
		}

		exc.components.attachNodeToController(v.o, v.controller);
	},
	create: function(def){
		var v = {
			name: 'aview',
			type: "view",
			params:{},
			controller: "main",
			state: exc.views.states.CREATED,
			o:null,
			options: {
				modal : false,
				retain: true,
				back:{
					allow: true,
					confirm: false,
					confirmMessage: "",
					action: undefined,
				}
			}
		};

		
		if(def && (def.nodeType === 1)){
			v.name = def.attr("name");
			v.o = def;
			
			if(def.hasAttr("data-view")){
				var json = def.getAttribute("data-view").trim();
				def.removeAttribute("data-view");

				var data = null;
				if(json.indexOf("{") === 0){
					try{
						data = JSON.parse(json);
					} catch(err){

					}
				}
				if(data){
					if(data.hasOwnProperty("type")) v.type = data.type;
					if(data.hasOwnProperty("controller")) v.controller = data.controller;
					if(data.hasOwnProperty("params")) v.params = data.params;

					if(data.hasOwnProperty("options")) core.extend(v.options, data.options);
				}
			}
			if(def.hasAttr("data-controller")){
				v.controller = def.getAttribute("data-controller");
			}
		}else{
			if(def.hasOwnProperty("name")) v.name = def.name;
			if(def.hasOwnProperty("type")) v.type = def.type;
			if(data.hasOwnProperty("controller")) v.controller = data.controller;
			if(def.hasOwnProperty("params")) v.params = def.params;
			if(def.hasOwnProperty("options")) core.extend(v.options, def.options);
			if(def.hasOwnProperty("retain")) v.options.retain = def.retain;

			if(def.hasOwnProperty("body")){
				v.o = $.htmlToNode("<div class='view e10' name='" + v.name + "'></div>");
				$.append(v.o,  def.body);
			}
		}

		if(v.type == "modal"){
			v.options.modal = true;
			
			if(!v.params){
				v.params = {
					name: v.name,
					options: {
						retain: true,
						closeButton: false,
					},
				};
			}else{
				v.params.name = v.name;
				v.params.retain  = v.options.retain;
			}

			var modal = exc.views.modal.create(v.params);
			

			var p = modal.o.child( ".exc-modal-body");
			$.append(p, v.o);
			p.addClass("no-padding");

			v = modal;
		}
		
		this.decorate(v);
		return v;
	},
	decorate: function(v){
		v.isView = true;
		
		if(v.type == "modal"){
			

		}else{
			core.extend(v,this.fn);
		}
	},
	installEntry: function(e){
		var o = undefined;
		if(e.html){
			o = $.htmlToNode(e.html);
		}
		if(o){
			o.attr("name", e.name);
			$.append("body", o);
			exc.views.register(o);
			o.addClass('e10');
		}

	},
	initialize: function(){
		var found = $.getAll(".view");

		console.log("[EXC][VIEWS][INITIALIZE]");
	
		this.initialized = true;
	
		var installFn = function(o){
			exc.views.register(o);
			o.addClass('e10');
		};

		found.forEach(installFn);

		var o;
		var n="";
		var vs = ['.role-app-sidebar', '.role-app-bar', '.role-app-contents'];
		var vn = ['appSidebar', 'appBar', 'appStage'];
		for(var i in vs){
			o = $.get(vs[i]);
			if(!o) continue;
			n = vn[i];
			
			o.attr("data-view", '{"type":"view"}');
			o.attr("name", n);

			exc.views.register(o);
			o.addClass('e10');

			this.initializeView(this.items[n]);
		}

		
		exc.stage.initialize( );
		
	},
	processState: function(state){ //NST:MARK TODO
		console.log("@exc.views.processState(" + state.name + ")");
		
		if(!state.hasOwnProperty("manifest")) return;
		if(!state.manifest.hasOwnProperty("views") || !Array.isArray(state.manifest.views) || (state.manifest.views.length == 0) ) return;
		
		for(i=0; i<state.manifest.views.length;i++){
			e = state.manifest.views[i];
			console.log(e);
			exc.views.install(e);
		}
		delete state.manifest.views;
	},
	showAlert:function(name, title, msg, ok){
		this.showConfirm(name, title, msg, ok, undefined);
	},
	showConfirm:function(name, title, msg, ok, cancel){

		var dialog = exc.views.items[name];
		if(!dialog ){
		
			var def = { ///
				name: name,
				title: title,
				body: msg,
				
				options: {
					closeButton: false,
				},
				buttons: [
					{"name": "confirmDialogOk","publishOnClick":name + "_ok_click", "caption":((typeof ok !== "undefined") ? ok : 'Ok'), "color":"blue", "closeOnClick":1, },
				]
			};
			
			if(typeof cancel !== "undefined"){
				def.buttons.push({
					"name": "confirmDialogCancel",
					"caption": cancel,
					"color": "red",
					"publishOnClick": name + "_cancel_click",
					"closeOnClick":1
				});
			}
			
			exc.views.items[name] = this.modal.create(def);
			dialog = exc.views.items[name];
		}else{
			if( (typeof(title) == "string") && (title.length > 0)){
				dialog.setHeader(title);
			}
			if( (typeof(msg) == "string") && (msg.length > 0)){
				dialog.setContents(msg);
			}
		}
		
		dialog.show();
	},
	fn: {
		message: function(msg){ //shortHand
			if(this.controller){
				this.controller.performMessage.apply(this, arguments);
			}
			app.message.apply(app, arguments);
		},
		clear: function(){
			this.o.html("");
			exc.components.sendMessage(this.o, "viewChanged", {'view': this});
			return this;
		},
		append: function(a){
			$.append(this.o, a);
			exc.components.sendMessage(this.o, "viewChanged", {'view': this});
			return this;
		},
		setContents: function(any){
			this.o.html(any);
			return this;
		},
		show: function(){
			if( this.state < exc.views.states.READY){
				exc.views.initializeView(this);
			}

			exc.components.sendMessage(this.o, "viewShow", this);

			this.state = exc.views.states.OPEN;
			this.o.addClass('is-open');

			return this;
		},
		close: function(){

			exc.components.sendMessage(this.o, "viewWillClose", this);

			this.state = exc.views.states.CLOSED;
			this.o.removeClass('is-open');
			return this;
		}
	},
};
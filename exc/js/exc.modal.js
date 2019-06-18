
exc.views.modal = {
	create: function(def){
		var m = {
			name: 'amodal',
			type: "modal",
			state: exc.views.states.CREATED,
		};
		
		m.options = {
			modal : true,
			retain: (def.hasOwnProperty("retain") ? def.retain : true ),
			closeButton: true,
			back:{
				allow: false,
				confirm: false,
				confirmMessage: "",
				action: undefined,
			}
		};
		
		
		core.extend(m,def);
		
		
		m.o = $.htmlToNode('<div name="" class="exc-modal" aria-hidden="true"><div class="exc-modal-dialog"><div class="exc-modal-header"></div><div class="exc-modal-body"></div><div class="exc-modal-footer"></div></div></div>');
		$.prepend('body', m.o);
		
		m.o.setAttribute("name", m.name);
		if(typeof(m.html) != "undefined"){
		
		}
		
		if(m.options.hasOwnProperty("closeButton") && m.options.closeButton){
			var eicn =  '<svg class="exc_icon_svg exc_icon_error" viewBox="0 0 50 50"><circle class="exc-icon-fillcolor" style="fill:#D27F75;" cx="25" cy="25" r="25"/><polyline style="fill:none;stroke:#FFFFFF;stroke-width:2;stroke-linecap:round;stroke-miterlimit:10;" points="16,34 25,25 34,16"/><polyline style="fill:none;stroke:#FFFFFF;stroke-width:2;stroke-linecap:round;stroke-miterlimit:10;" points="16,16 25,25 34,34"/></svg>';
			var ebttn = '<div class="exc-modal-btn-close">' + eicn + '</div>';
			$.append(m.o.child(".exc-modal-dialog"), ebttn);
			$.on(m.o.child(".exc-modal-btn-close"), "click", function(e){
				m.close();
			});
		}
	
		if (typeof m.title !== "undefined"){
			$.child(m.o, 'div.exc-modal-header').html(m.title).style.display = "block";
		}else{
			$.child(m.o, 'div.exc-modal-header').style.display = "none";
		}
		
		if (typeof m.body !== "undefined"){
			$.child(m.o, 'div.exc-modal-body').html(m.body);
		}
		
		var flgHasFooter = false;
		var footer = $.child(m.o, 'div.exc-modal-footer');
		if (typeof m.footer !== "undefined"){
			flgHasFooter = true;
			footer.html(m.footer);
		}
		
		
		if( Array.isArray(m.buttons) ){
			m.buttons.forEach(function(entry){
				flgHasFooter = true;
				var def = exc.components.items.btn;
				var o;
				console.log(entry);
				var d = exc.components.createDefinition(entry);
				console.log(d);
				o = def.build(d);
					
				exc.expansions.apply(o);
			
				if(d.hasProperty("closeOnClick")){
					o.setAttribute("data-modal-actionClose", d.property('closeOnClick') );
				}else{
					o.setAttribute("data-modal-actionClose", 1);
				}
					
				var cmsg = $.name(o) + "_click";
				if(d.hasProperty("publishOnClick")){
					cmsg = d.property("publishOnClick");
				}
						
				o.setAttribute("data-modal-actionPublish", cmsg);
					
				var fn = function(e){ //static callback
					var o = $.fromEvent(e, "[data-uiw]");
					
					if(o.hasClass('is-disabled')) return;
					var m = $.fromEvent(e,".exc-modal");

					var id = m.attr("name");
					var msg = o.getAttribute("data-modal-actionPublish");
					if(o.hasAttr("data-modal-actionClose") && (o.getAttribute("data-modal-actionClose") == 1) ){
						m.removeClass("is-open");
					}
					app.publish(msg, {'cmd':msg, 'modal_name': id, 'o': o, 'modal': m, 'event': e});
				};
					
				$.onAction(o,"click.publishOnClick", fn);
				def.renderCompleted(o);
					
				$.append( footer, o);
			});

		}

		if(!flgHasFooter){
			footer.style.display = "none";
		}
		
		this.decorate(m);
		return m;
	},
	decorate: function(obj){
		obj.isView = true;
		core.extend(obj,this.fn);
	},
	fn: {
		setHeader: function(any){
			this.o.child('div.exc-modal-header').html(any);
		},
		setContents: function(any){
			this.o.child('div.exc-modal-body').html(any);
		},
		show: function(){
			if( this.state < exc.views.states.READY){
				exc.views.initializeView(this);
			}
			

			var h = this.o.child(".exc-modal-header");
			if(	(h.childNodes.length == 1) && (h.childNodes[0].nodeType == 3) && (h.style.display == "block")){
				h.addClass("with-text-header");
			}

			app.publish(this.name + "_view_show", {'view': this});

			this.state = exc.views.states.OPEN;

			var v = this.o.child(".view");
			if(v) v.addClass('is-open');

			this.o.addClass('is-open');
		},
		close: function(){
			app.publish(this.name + "_view_close", {'view': this});

			this.state = exc.views.states.CLOSED;
			this.o.removeClass('is-open');
		}
	}
};
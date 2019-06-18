exc.components.register({ ///NST:MARK:CLASS:select
	id: 'select',
	selectors: ["[data-uiw='select']"],
	inherits: ['generic'],
	getter1: function(o){
		return o.getAttribute("data-uiw-value");
	},
	setter: function(o, value){
		o.val(value);
		o.attr("data-uiw-value", value);
	},
	fn : { //additional functionality added to the element
		setAction: function(a){
			this.data('action-message',a);
		},
		updateValue: function(value){
			$.getAll("option", this).forEach(function(op){
				if(op.getAttribute("value")==value){
					op.addClass("is-selected", true).prop("selected", true);
				}else{
					op.addClass("is-selected", false).prop("selected", false);
				}
			});
		},
		optionsFromDS: function(ds, captionKey, valueKey){
			$.getAll("option", this).forEach($.remove);
			var value = this.val();

			this.bindDS = { ds:ds, caption: captionKey, value: valueKey };
			var select = this;
			var value = this.val();
			var fnReload = function(ds){
				console.log("loading select data...");
				$.getAll("option", select).forEach($.remove);
				ds.forEach(function(item){
					var opv = '', opc = '';
					if(!item.hasOwnProperty(select.bindDS.value)) return;
					opv = item[select.bindDS.value];
					opc = opv;

					if(item.hasOwnProperty(select.bindDS.caption)){
						opc = item[select.bindDS.caption];
					}
					select.optionAdd(opc, opv, (value == opv ));
				});
			};
			ds.on("itemsLoaded", reload);
			ds.on("itemRemoved", reload);
			ds.on("itemAdded", reload);
		},
		optionsDelete: function(){
			$.getAll("option", this).forEach($.remove);
		},
		optionAdd: function(caption, value, selected){
			var op = $.htmlToNode("<option class=\"exc-select-item\" value=\"" + value + "\">" + caption + "</option>");
			if(selected) op.addClass("is-selected", true).prop("selected", true);
			this.append(op);
			return op;
		},
		optionsSet: function(options){
			var o = this;
			var i = 0, k, v;
			var opl = {}, opv = '', opc = '';
	
			$.getAll("option", this).forEach($.remove);
			var value = this.val();
			
	
			var is_array = Array.isArray(options);
	
			for (k in options) {
				v = options[k];
				
				
				if(Array.isArray(v)){
					if(v.length >= 2){
						opv = v[0];
						opc = v[1];
					}
				}else if(typeof(v) === "string"){
					opv = v;
					opc = v;
				}else if(typeof(v) === "number"){
					opv = '' + v;
					opc = opv;
				}else if(typeof(v) === "object"){
					if(v.hasOwnProperty("value")){
						opv = v.value;
						opc = opv;
					}
					if(v.hasOwnProperty("caption")) opc = v.caption;
				}
				var op = exc.components.items.select.fn.optionAdd.apply(this, [opc, opv, (value == opv) ]);
				//opl[opv] = opc;
			}
		}
	},
	init: function(o){

	},
	build: function(e){
		var o = $.htmlToNode("<select class='select vs vs-v' data-uiw='select'></select>");
		o.attr("name", e.name );


		var v = 0;
		if( e.hasProperty("default") ) v = e.property("default");
		o.setAttribute("data-uiw-value", v);
		
		if( e.hasProperty("help") ){
			o.attr( "title", e.property("help") );
			o.attr( "aria-label", e.property("help") );
		}

		if( e.hasProperty("classes") ){
			for(var i in e.properties.classes) o.addClass(e.properties.classes[i]);
		}
		if( e.hasProperty("attributes") ){
			for(var ak in e.properties.attributes) o.setAttribute(ak, e.properties.attributes[ak]);
		}
		
		if(e.hasProperty("disabled") ){
			if(e.property("disabled")){
				o.addClass("is-disabled").prop('disabled',true).attr('aria-disabled',"true").prop('readonly',true);
			}else{
				o.removeClass("is-disabled").prop('disabled',false).attr('aria-disabled',"false").prop('readonly',false);
			}
		}

		exc.components.installValueInterface(o,"attr", this);
		o.vs.value = v

		var def, contents;
			
		if(e.hasOwnProperty("contents")){
			if(typeof(e.contents) == "string"){
				try{
					contents = JSON.parse(e.contents.trim());
				}catch(err){console.log(err.message);}
			}else if(e.contents && typeof(e.contents) == "object"){
				contents = e.contents;
			}
		}
		
		if(Array.isArray(contents)){//got values
			this.fn.optionsSet.apply(o, [contents]);
		}
		
		return o;
	},
	renderCompleted: function(o){
		$.onAction(o, "change.selectChange.validation()", function(e){
			var o = exc.components.get( $.fromEvent(e,".select") );
			if(o.hasClass('is-disabled')) return false;
			o.attr("data-uiw-value-last", o.getAttribute("data-uiw-value") );
			o.attr("data-uiw-value", o.val());
			return true;
		});
		if(!$.hasAction(o, {event:"change",name:"onChangePublish",handler:"handler"})){
			var fn = function(e){ //static callback
				var o = exc.components.get( $.fromEvent(e,".select") );
				if(o.hasClass('is-disabled')) return;

				var msg = $.name(o) + "_change";
				exc.components.sendMessage(o, msg, {'cmd':msg, 'event': e, 'value': o.val(), "previous_value": o.getAttribute("data-uiw-value-last") });
			};
			$.onAction(o,"change.selectChange.handler()", fn);
		}
	},

});

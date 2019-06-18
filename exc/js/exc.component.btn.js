exc.components.register({ ///NST:MARK:CLASS:button
	id: 'btn',
	selectors: ["[data-uiw='btn']"],
	vs: "value", //value source
	inherits: ['generic'],


	fn: {
		doThis: function(){
			console.log("called doThis");
		}
	},
	build: function(e){
		var o = $.htmlToNode("<button class='btn'></button>");
		o.attr("name", e.name );
		o.attr( "role", 'button' );

		var h = "";
		if( e.hasProperty("caption") ) h = e.property("caption");
		if(h.length > 0){
			$.append(o,h);
		}

		if( e.hasProperty("icon") ){
			var icon = e.property('icon');
			s = "<i class='exc-button-icon la la-" + icon + "'></i>";
			$.prepend(o, s);
			o.addClass("with-icon-" + icon);
		}

		if( e.hasProperty("decoration") ){
			s = e.property('decoration');
			$.prepend(o, s);
		}

		if( e.hasProperty("classes") ){
			for(var i in e.properties.classes) o.addClass(e.properties.classes[i]);
		}
		if( e.hasProperty("attributes") ){
			for(var ak in e.properties.attributes) o.attr(ak, e.properties.attributes[ak]);
		}
		
		if( e.hasProperty("help") ){
			o.setAttribute( "title", e.property("help") );
			o.setAttribute( "aria-label", e.property("help") );
		}

		if( e.hasProperty("class") ) o.addClass( e.property("class") );
		if( e.hasProperty("color") ) o.addClass( e.property("color") );
		
		if(e.hasProperty("outline") && e.property("outline")) o.addClass("is-outline");

		if(e.hasProperty("disabled") ){
			if(e.property("disabled")){
				o.addClass("is-disabled").prop('disabled',true).attr('aria-disabled',"true").prop('readonly',true);
			}else{
				o.removeClass("is-disabled").prop('disabled',false).attr('aria-disabled',"false").prop('readonly',false);
			}
		}

		o.addClass("exc-rendered").setAttribute("data-uiw", "btn");

		return o;
	},
	renderCompleted: function(o){
		if(!$.hasAction(o, {event:"click",name:"publishOnClick",handler:"handler"})){
			var fn = function(e){ //static callback
				var o = $.fromEvent(e, "[data-uiw]");
				if(o.hasClass('is-disabled')) return;

				var msg = $.name(o) + "_click";
				//app.publish(msg, {'cmd':msg, 'event': e});
				 exc.components.sendMessage(o, msg, {'cmd':msg, 'event': e});
			};
			$.onAction(o, "click.publishOnClick", fn);
		}
	},
});
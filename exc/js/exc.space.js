/*
Space is the default theme and app layout used by EXC
This script includes helpers for this theme and layout
*/


$.collapse = function(a, p, t, fn){
	var i;
	var sv = [];

	a.style.transition = "all " + t + "ms";
	if(p == "height"){
		a.style.height = a.scrollHeight + "px";
	}else if(p == "left"){
		a.style.left = "0px";
	}

	window.setTimeout(function() {
		if(p == "height"){
			a.style.height = "0";
		}else if(p == "left"){
			a.style.left = "-" + a.offsetWidth + "px";
		}
	}, 1);

	if(fn){
		window.setTimeout(function () {
			fn(a);
		}, t+1);
	}
};
$.expand = function(a, p, t, fn){
	var i;
	
	a.style.transition = "all " + t + "ms";
	var h = a.scrollHeight;
	var w = a.offsetWidth;

	if(p == "height"){
		a.style.height = h + "px";
	}else if(p == "left"){
		a.style.left = "0px";
	}
	console.log("expand  p=%p h=%d, w=%d", h, w, p);
	
	window.setTimeout(function () {
		if(p == "height"){
			a.style.height = h + "px";
		}else if(p == "left"){
			a.style.left = "0px";
		}
		if(fn) fn(a);
	}, t+1);

};
core.ready(function(){
	var list = $.getAll(".menu-group-caption");
	var e,i;
	//for(i in list){
	$.getAll(".menu-group-caption").forEach(function(a){
		//e = list[i];
		$.on(a, "click", function(e){
			var o = $.closest(e.target,".menu-group-caption");
			var m = $.next(o, ".menu-group");
			if(!m) return;
			
			if($.hasClass(o,"is-expanded")){
				$.removeClass(o,"is-expanded");
				$.collapse(m, "height", 500, function(){
					//m.removeClass("is-expanded");
				});
			}else{
				$.addClass(o, "is-expanded");
				$.expand(m, "height", 500, function(){
					$.addClass(m, "is-expanded");
				});
			}
		});
	});
	
	$.getAll(".role-app-sidebar-hamburger").forEach(function(a){
		$.on(a, "click", function(e){
			var o = e.target;
			var d = $.get(".role-app-sidebar");
			if(!d) return;
			var x = d.offsetLeft;
			if(x < 0){
				$.expand(d, "left", 500, function(){
					$.removeClass(d,"is-collapsed");
					$.addClass($.get("body"), "app-state-sidebar-visible");
				});
			}else{
				$.addClass(d,"is-collapsed");
				$.collapse(d, "left", 500, function(){
					$.removeClass($.get("body"), "app-state-sidebar-visible");
				});
			}
		});
	});

	$.getAll("[data-toggle]").forEach(function(a){
		$.on(a, "click", function(e){
			var o = e.target;
			o = $.closest(o, "[data-toggle]");
				
			var n = o.getAttribute("data-toggle");
			var t = o.getAttribute("data-toggle-target");
				
			if(typeof(t) != "string") return;
			if(t.charAt(0) != "#"){
				t = "[name=" + t + "]";
			}
			
			var q = $.get(t);
			if(!q) return;
				
			console.log(q.css("display"));
			if($.hasClass(q,n + "-off")){
				$.removeClass(q,n + "-off");
			}else{
				$.addClass(q,n + "-off");
			}
		});
	});
});
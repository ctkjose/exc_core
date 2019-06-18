var exc = exc || {};

(function(){
	exc.device = {
		size: '',
		view: {
			width: 0,
			height: 0,
		},
		wl: 0,
		 attr: {}
	};


	var deviceInfoUpdateAgent = function(){
		if(!navigator && !navigator.userAgent) return;
		var mlist = [
			['webkit', ["webkit"]],
			['android', ["android"]],
			['safari', ["safari"]],
			['chrome', ["chrome"]],
			['firefox', ["firefox", "gecko"]],
			['ios', ["iphone", "ipad", "ipod"]],
			['windows', ["iemobile"]],
			['mobile', ["iphone", "ipad", "ipod", "android", "iemobile", "kindle", "silk"]],
		];
		var u = navigator.userAgent.toLowerCase();
		for (var i in mlist){
			var e = mlist[i];
			exc.device.attr[e[0]] = false;
			for (var j in e[1]) {
				if(u.indexOf(e[1][j]) >= 0){
					exc.device.attr[e[0]] = true;
					break;
				}
			}
		}
	};
    var deviceInfoUpdate = function() {
		var w = (window.innerWidth > 0) ? window.innerWidth : window.screen.width;
			
		exc.device.view.width = w;
		exc.device.view.height = ((window.innerHeight > 0) ? window.innerHeight : window.screen.height) - 1;
        
		if(Math.abs(exc.device.wl- w) < 100) return;
		exc.device.wl = exc.device.view.width;

		var o = $.get("body");
		if(w <= 768) {
			$.removeClass(o,"sz-desktop");
			$.removeClass(o,"sz-desktop-lg");
			$.addClass(o,"sz-mobile");
			if(w <= 599){
				$.addClass(o,"sz-mobile-sm");
			}else{
				$.removeClass(o,"sz-mobile-sm");
			}
		}else{
			$.removeClass(o,"sz-mobile");
			$.removeClass(o,"sz-mobile-sm");
			$.addClass(o,"sz-desktop");
			if(w >= 1400){
				$.addClass(o,"sz-desktop-lg");
			}else{
				$.removeClass(o,"sz-desktop-lg");
			}
		}
    };

	$.on(window, "load", function() {
		deviceInfoUpdate();
		deviceInfoUpdateAgent();
	});
	$.on(window, "resize", function() {
		deviceInfoUpdate();
	});

})();


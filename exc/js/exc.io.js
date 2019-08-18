


var http = {

	create: function(method, args){
		var def = {
			method: "",
			headers: {},
			url:"",
			async: true,
			flgAbort: true,
			opRunJS: true,
			flgAborted: false,
			flgStreamingJSON: false,
			pollStreamTimer: undefined,
			response: {type:"",headers:{}, data: undefined, lastError: 0},
		};

		
		var ops = {};
		var data = undefined;
		var callback = undefined;

		if(!args || args.length == 0) return undefined;

		if( typeof(args[0]) == "string" ){
			def.url = args[0];
		}else if(args[0] && (typeof(args[0])=="object")){
			ops = args[0];
		}

		if(args.length >= 2 && args[1]){
			if( typeof(args[1]) == "function" || (typeof(args[1]) == "string" && args[1].substr(0,1)=="@") || Array.isArray(args[1])){
				callback = core.getCallback(args[1]);
			}else if(typeof(args[1])=="object" || typeof(args[1]) == "string"){
				data = args[1];
			}
		}
		if(args.length >= 3 && (typeof(args[2]) == "function" || (typeof(args[1]) == "string" && args[1].substr(0,1)=="@") || Array.isArray(args[2]))){
			callback = core.getCallback(args[2]);
		}


		var request = core.extend(def, ops);
		request.method = method.toUpperCase();

		request.url = new URL(request.url, location);
		request.xhr = new XMLHttpRequest();

		if(typeof(callback) == "function"){
			request.callback = callback;
		}
		core.makePublisher(request);
		request.publisherReady(true);

		var t = typeof(data);
		var qs = "";
		if(t == "string"){
			qs = data;
		}else if(t == "object" && data){
			var p=[];
			for(var k in data) {
				p.push(encodeURIComponent(k) + '=' + encodeURIComponent(data[k]));
			}
			qs = p.join('&').replace(/%20/g, '+');
		}
		
		
		if(request.method === "GET" && (qs.length > 0)) {
			if(request.url.search.indexOf('?') >= 0){
				request.url.search += "&";
			}else{
				request.url.search += "?";
			}

			request.url.search += qs;
		}
		

		if( request.url.pathname.length == 0){
			console.log("[EXC][HTTP][ERROR][INVALID URL PROVIDED]");
			return undefined;
		}

		request.xhr.withCredentials = false;
		if (request.user && request.password) {
			request.xhr.open(request.method, request.url.href, request.async !== false, request.user, request.password);
		}else{
			request.xhr.open(request.method, request.url.href, request.async !== false);
		}

		var headerKeys = [];
		if(request.headers){
			headerKeys = Object.keys(request.headers).map(function(key) {
				return key.toLowerCase();
			});
			for(var h in request.headers){
				request.xhr.setRequestHeader(h, request.headers[h]);
			}
		}

		if (request.method !== "GET" && headerKeys.indexOf("content-type") === -1) {
			request.xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		}


		if (request.mimeType) { //override response mime
			request.xhr.overrideMimeType( request.mimeType );
		}
		if( request.hasOwnProperty("timeout") ){
			request.xhr.timeout = request.timeout;
		}
		if( request.hasOwnProperty("withCredentials") ){
			request.xhr.withCredentials = request.withCredentials;
		}

		request.abort = function(){
			this.flgAborted = true;
			this.response.lastError = 503;
			console.log("[EXC][AJAX][ABORTING]");
			this.xhr.abort();
		};

		request.xhr.ontimeout = function (e) {
			request.response.lastError = 501;
			request.publish("error", request.response);
			if(request.callback) request.callback(request.response);
		};
		request.xhr.onerror = function (e) {
			console.log(e);
			request.response.lastError = 502;
			request.publish("error", request.response);
			if(request.callback) request.callback(request.response);
		};
		request.xhr.onabort = function (e) {
			console.log(e);
			request.flgAborted = true;
			request.response.lastError = 503;
			request.publish("error", request.response);
			if(request.callback) request.callback(request.response);
		};
		request.xhr.onreadystatechange = function () {
			if(request.xhr.readyState === 2){ //got headers
				http.processHeaders(request);
			}else if(request.xhr.readyState === 3){ //got data
				if(request.flgStreamingJSON){
					http.pollJSONStream(request);
				}
			}else if(request.xhr.readyState === 4){ //done
				request.response.status = request.xhr.status;
				request.response.url = request.xhr.responseURL;

				if(request.xhr.status != 200){
					request.response.lastError = 504;
					if(request.xhr.status == 403){
						request.response.lastError = 510;
					}else if(request.xhr.status == 404){
						request.response.lastError = 511;
					}

					request.publish("error", request.response);
					if(request.callback) request.callback(request.response);
					return;
				}

				var type = request.response.headers['CONTENT-TYPE-MIME'];
					
				if(["text/json","application/json"].indexOf(type)>=0){
					http.handleResponseJSON(request, request.xhr.responseText);
				}else if(type == "application/json-seq"){
					//https://en.wikipedia.org/wiki/JSON_streaming
					http.handleResponseJSON(request, "{}");
				}else if(type == "text/javascript"){
					http.handleResponseJS(request, request.xhr.responseText);
				}else{
					http.handleResponseData(request, request.xhr.responseText);
				}

				if(request.callback) request.callback(request.response);
			}
		};
		request.xhr.send(request.method === "GET" ? null : qs);
		return request;
	},
	pollJSONStream: function(request){
		var b = request.jsonBuffer;
		var cidx = request.xhr.responseText.length;
		
		var RS = String.fromCharCode(30);
		var LF = "\n";

		if (b.i == cidx) return;
		var s = request.xhr.responseText.substr(b.i, cidx);
		if(s.indexOf(LF)<0) return "";
	
		b.s += s;
		b.i = cidx;

		var i = 0, ps=0, pe=0;
		var js, ch, found=false, ok=true;
		var entries = [], data;
		while(ok){
			i = 0;
			found = false;
			if( b.s.charAt(i) == RS ){
				js = "";
				for(i=i+1; i< b.s.length; i++){
					ch = b.s.charAt(i);
					if((ch == LF) && ((i==b.s.length-1) || (b.s.substr(i+1,1)==RS)) ){
						found = true;
						try{
							data = JSON.parse(js);
							if(data) entries.push(data);
						}catch(e){}

						b.s = b.s.substr(i+1);
						break;
					}
					js += ch;
					//console.log("JS=[%s]", js);
				}
			}
		
			if(!found) break;
			if(this.flgAborted) break;
		}
		
		if( entries.length > 0){
			request.publish("jsonEntries", entries, request.response);
		}
		console.log(entries);
	},
	processHeaders: function(request){
		var h = request.xhr.getAllResponseHeaders();
		request.response.headers = {'CONTENT-TYPE-MIME': 'text/plain', 'CONTENT-TYPE-CHARSET':'UTF-8'};
		if(!h) return;

		var hp = h.split('\u000d\u000a');
		for (var i = 0; i < hp.length; i++) {
			var p = hp[i];
			var idx = p.indexOf('\u003a\u0020');
			if (idx < 0) continue;

			var k = p.substring(0, idx).toUpperCase();
			var v = p.substring(idx+2);
			request.response.headers[k] = v;

			if(k == "CONTENT-TYPE"){
				if(request.mimeType) v = request.mimeType;
				var rx = /([a-zA-Z\-0-9\_\/\*]+)\;?(\s+charset=([a-zA-Z\-0-9\_]+))?/.exec(v);
				if(rx){
					if(rx[1]) request.response.headers['CONTENT-TYPE-MIME'] = rx[1].toLowerCase();
					if(rx[3]) request.response.headers['CONTENT-TYPE-CHARSET'] = rx[3].toLowerCase();
				}
				request.response.mime = request.response.headers['CONTENT-TYPE-MIME'];
			}
		}

		console.log("[EXC][AJAX][CONTENT-TYPE][%s]", request.response.headers['CONTENT-TYPE-MIME']);
		if(request.response.headers['CONTENT-TYPE-MIME'] == "application/javascript"){
			request.response.headers['CONTENT-TYPE-MIME'] = "text/javascript";
		}
		if(request.response.headers['CONTENT-TYPE-MIME'] == "application/json-seq"){
			//we have a json stream
			request.response.type = "json";
			request.flgStreamingJSON = true;
			request.jsonBuffer = {i:0, s:""};
		}
	},
	handleResponseJSON: function(request, data){
		request.response.type = "json";
		var ok = true;

		try {
			request.response.data = JSON.parse(data);
		} catch(e){
			ok = false;
			console.log(e);
			console.log("[EXC][AJAX][INVALID JSON IN AJAX RESPONSE]");
			console.log(e.message);

			request.response.lastError = 520;
		}

		if(ok){
			request.publish("done", request.response);
		}else{
			request.publish("error", request.response);
		}
	},
	handleResponseJS: function(request, data){
		request.response.type = "js";
		
						
		var closurefn = function(){
			var ajaxResponse = {};
			try {
				var r = eval(data);
			} catch(e){
				if (e instanceof SyntaxError) {
					console.log("[EXC][AJAX][SYNTAX ERROR IN AJAX RESPONSE]");
					console.log(e.message);
				}else{
					console.log("[EXC][AJAX][EXECUTION ERROR IN AJAX RESPONSE]");
					console.log(e.message);
				}
				request.response.lastError = 521;
				
				return null;
			}
			return ajaxResponse;
		};
		
		if(!request.opRunJS){
			request.response.data = data;
			request.publish("done", request.response);
		}else{
			request.response.data = closurefn();
			if(request.response.data) {
				request.publish("done", request.response);
			}else{
				request.publish("error", request.response);
			}
		}	
		
	},
	handleResponseData: function(request, data){
		request.response.type = "blob";
		request.response.data = data;
		request.publish("done", request.response);
	},
	get: function(){
		return this.create("GET", arguments);
	},
	post: function(url, data, ops){
		return this.create("POST", arguments);
	},
};
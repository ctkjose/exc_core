


function testMessage(){
	
	

}
function testHTTP(){
	var r;

	var url = "http://localhost/exc_core/app1/testAPI.php?id=10";
	var ops = {
		url: url,
		//timeout: 10,
		//mimeType: "text/plain",
		withCredentials: true
	};
	
	var data = {id:25, category:"zip"};

	//r = http.get(url);
	//r = http.get(url, data);
	//r = http.get(ops, data);
	
/*
	r = http.get(ops, function(response){

		console.log("@response callback %o", response);
		console.log("Response Type: %s", response.type );
		console.log("Response.lastError=%d", response.lastError);
		console.log(response.data);
	});
*/

	r = http.get(ops, "n=10"); //passing query string
	//r = http.get(ops, "@(app.onTest)"); //call controller event

	if(!r){
		console.log("Unable to create ajax request");
		return;
	}
	console.log(r);

	r.on("done", function(response){
		console.log(response);
		console.log("Response Type: %s", response.type );
		if(response.data && (typeof(response.data) == "object")){
			console.log("got js object");
		}
		console.log(response.data);
	});

	

	r.on("error", function(response){
		console.log(response);
		console.log("ajax failed: " + response.lastError);
	});

	console.log("test done...");
}
function testDS(){
	var data = { 
		status: "success",
		data: [ 
			{ company:'A', product:'a1', color:'red' }, 
			{ company:'B', product:'b2', color:'blue' }, 
			{ company:'C', product:'c3', color:'white' } 
		]
	};


	var a = {
		name: "Jose",
		lname: "Cuevas",
		salary: 50
	};

	var fnPreProcess = function(data){ //optional pre-process function
		data.forEach(function(a){
			a.code = "12345";
		});
		return data;
	}
	ds1 = exc.ds.create({
		type: "rest",
		method: "post",
		url:"http://localhost/exc_core/app1/testAPI.php?id={id}",
		processData: fnPreProcess //optional pre-process function
	});

	console.log(ds1);
	console.log(ds1.getState());


	ds1.params("id", "259", "cat", "jose").load().then(function(ds){
		console.log("ds is ready...");
		console.log(ds);

		
		//var item = ds.itemAsCollection(0);
		///console.log("company=%s", item.company);
		//item.company = "JOSE.CO";
		
		while(ds.next()){
			var record = ds.item();
			var company = ds.getKeyValue("company");

			console.log(record);

		};

		ds.forEach(function(record){
			console.log(record);
		});
	});

	
	var callback1 = function(ds, item){
		console.log("inside callback for callback1");
		console.log(item);

	};
	var callback2 = function(ds, item){
		console.log("inside callback for callback2");
		console.log(item);

	};

	ds1.on("onChange", callback1);

}
function testSelectBinded(){

	exc.app.stage.show("recordView");

	ds1 = exc.ds.create({
		type: "rest",
		method: "post",
		url:"http://localhost/exc_core/app1/testAPI.php?id={id}",
	});

	var select = $.component("jobType");
	select.optionsFromDS(ds1, "company", "id");

	ds1.params("id", "259", "cat", "jose").load();


}
function testDSCollection(){
	var data = { 
		status: "success",
		data: [ 
			{ company:'A', product:'a1', color:'red' }, 
			{ company:'B', product:'b2', color:'blue' }, 
			{ company:'C', product:'c3', color:'white' } 
		]
	};


	var a = {
		name: "Jose",
		lname: "Cuevas",
		salary: 50
	};

	var collection = exc.ds.makeValueCollection(a);
	a1 = collection;

	var myObserver = function(aCollection, keyName){
		console.log("The Key [%s] changed to ", keyName, aCollection[keyName]);
	};

	collection.addObserverForKey("name", myObserver);
	
	//lets test our observer
	collection.name = "Joe";

	console.log(a1);
	return;

}
function testPromise1(){

	/*
	var p = core.promise.create(function(){
		console.log("@promise success");
	});
	*/
	var p = core.promise.create("@(app.onTest)", function(){
		console.log("@promise failure");
	});

	p.onSuccess1 = function(){
		console.log("@promise success from onSuccess property");
	};
	p.onFailure = function(){
		console.log("@promise failure from onFailure property");
	}

	p.onSuccess1 = "@(app.onTest)"; 
	
	p.resolve("jose");
	//p.reject();
}

function testPromiseR(){

	
	var p = core.promise.create();

	p.then(function(a,b){ console.log("first promise done %s", a);}).then(function(a,b){ console.log("second promise done");});

	var k = core.promise.create();
	k.then(function(a,b){ 
		console.log("k promise is done %s", a);
		p.resolve(a, "cuevas");
	});
	k.resolve("joe");

	p.then(function(a,b){ 
		console.log("testing after resolve %s", a);
	});
}
function testLookUp(){
	var ops = {
		valueGet: function(){
			return [
				["a1","Value1"],
				["a2","Value2"],
				["a3","Value3 Aguada"],
				["a4","Value4 Aguadilla"],
				["a5","Value5 Jose"],
				["a6","Value6"],
				["a7","Value7 Joe"],
				["a8","Value8 Moca"],
				["a9","Value9"],
			]
		},
		valueSet: function(value){
			console.log("@valueSet()");
			console.log(value);
		}
	};

	var dialog;

	ops.caption = "Select a Town";


	//valueSet() is a callback,
	//you may also use the publish option to broadcast a message instead	
	ops.valueSet = undefined;
	ops.publish = "gotLookupValueForTown";
	
	dialog = exc.views.showLookup(ops);

	//a lookup also has a promise that we can use to handle the dialog
	dialog.promise.then(function(v){
		console.log("got result v=%s", v);
	});

}

function testModal(){
	var ops = {
		name: "testModal1",
		title: "My App",
		body: "Hello world",
		options: {
			closeButton: false,
		},
		buttons: [
			{"name":"testModal1Close", "caption":"Close", "color":"red", "closeOnClick":1, },
			{"name":"testModal1Save", "caption":"Save", "color": "blue", "closeOnClick":0, "publishOnClick":"saveDialog1"},
		]
	};

	var m = exc.views.modal.create(ops);
	m.show();
}
function testTable(){
	//exc.components.renderComponents("body");

	exc.app.stage.show("recordView");
	myTable = $.component("table0");

	myTable.rowAdd({"fname":"Jose","lname":"Cuevas-1","email":"jcuevas@mac.com", "salary":1250, "type":"P", "active":0,"hiredate":"2/15/2019"});
	myTable.rowAdd({"fname":"Jose1","lname":"Cuevas-2","email":"jcuevas@icloud.com", "salary":3070.98, "type":"P","active":1,"hiredate":"2/16/2019"});
	myTable.rowAdd({"fname":"Joe2","lname":"Cuevas2-4","email":"jose.cuevas@gmail.com", "salary":5000, "type":"C","active":1,"hiredate":"2/17/2019"});

	myRecord = {"fname":"Joe","lname":"Cuevas-3","email":"info@expworks.io", "salary":3250.2, "type":"T","active":1,"hiredate":"2/18/2019"};
	myRecordUID = myTable.rowAdd(myRecord);
	


	myTable1 = $.component("table1");
	myTable1.rowAdd({"fname":"JoseTB1","lname":"Cuevas-1","email":"jcuevas@mac.com", "salary":1290, "type":"P", "active":0,"hiredate":"5/15/2019"});
	

	myTable.rowSetDataForIndex( 1, {"email":"jcuevas50@ma.com", "active": 1, "type": "T"});
}

function testEdit(){
	t1 = exc.support.makeEditable("t1");

}
//var data = RS + "{\"name\":\"Jose1\"}" + LF;

function testAjaxJSONStream(){
	var p;

	var url = "http://localhost/exc_core/app1/testJSONStream.php";
	var ops = {


	};

	p = http.get(url);
	if(!p){
		console.log("Unable to create ajax request");
		return;
	}

	//got json data
	p.on("jsonEntries", function(entries, response){
		console.log(response);
		console.log("Response Type: %s", response.type );
		console.log("entries %o", entries);
	});


	p.on("done", function(response){
		console.log("stream done...");
	});

	p.on("error", function(response){
		console.log(response);
		console.log("ajax failed: " + response.lastError);
	});

}
function testParseJSONStream(b, data){


	var RS = String.fromCharCode(30);
	var LF = "\n";

	//var data = RS + "{\"name\":\"Jose1\"}" + LF + RS + "{\"name\":\"Jose2\"}" + LF ;
	//var data = RS + "{\"name\":\"Jose1\"}" + LF;
	var cidx = data.length;

	if (b.i == cidx) return;
	var s = data.substr(b.i, cidx);
	if(s.indexOf(LF)<0) return "";

	b.s += s;
	b.i = cidx;

	var i = 0, ps=0, pe=0;
	var e, js, ch, found=false, ok=true;
	var entries = [];
	while(ok){
		i = 0;
		found = false;
		if( b.s.charAt(i) == RS ){
			js = "";
			for(i=i+1; i< b.s.length; i++){
				ch = b.s.charAt(i);
				if((ch == LF) && ((i==b.s.length-1) || (b.s.substr(i+1,1)==RS)) ){
					found = true;
					entries.push(js);
					b.s = b.s.substr(i+1);
					break;
				}
				js += ch;
				console.log("JS=[%s]", js);
			}
		}
	
		if(!found) break;
		ps++;
		if(ps > 4) break;
	}
console.log(entries);

}
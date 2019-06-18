self.testController1 = {
	manifest: {
		includes: [
			//{url: "../css/test2.css"},
		]
	},
	initialize: function(){
		console.log("@testController1:initialize()");
		
		app.on("alert1", [this,"debugFn"]);
	},
	debugFn: function(){
		console.log("@debugFn");
		console.log(arguments);
	},
	event_doThis: function(msg){
		console.log("@testController1:event_doThis()");
		console.log(arguments);
	}
};

console.log("executed testController1..----------------");
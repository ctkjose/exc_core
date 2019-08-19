/*
	exc.validation.when(undefined)
	exc.validation.when("V1,"V2","V3")
	.validation.when(["V1,"V2","V3"])
	.validation.when(100,200)

*/
exc.validations {
	required: function(v, params){
		if(typeof(v) != "string") return false;
		if(0===str.trim().length) return false;
		return true;
	},
	required: function(v, params){
		if(typeof(v) != "string") return false;
		if(0===str.trim().length) return false;
		return true;
	},
}
exc.validation {
	define: function(any){
		if(Array.isArray(any)){
		}
	}
	fn: {
		

	}
}
<?php

	//$id = $_REQUEST['id'];
	$data = '{ 
		"status": "success",
		"data": [ 
			{ "id": "01", "company":"A-1", "product":"a1", "color":"red" }, 
			{ "id": "02", "company":"B-2", "product":"b2", "color":"blue" }, 
			{ "id": "03", "company":"C-3", "product":"c3", "color":"white" } 
		]
	}';
	header("Content-Type: application/json");
	foreach($_SERVER as $k=>$v){
		if(is_array($v)) $v = "ARRAY";
		error_log("\$_SERVER[$k]=[$v]");
	}

	foreach($_REQUEST as $k=>$v){
		if(is_array($v)) continue;
		if(is_array($v)) $v = "ARRAY";
		error_log("\$_REQUEST[$k]=[$v]");
	}
	
	print $data;
	exit;


?>
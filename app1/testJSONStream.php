<?php
	//https://en.wikipedia.org/wiki/JSON_streaming
	//Record separator-delimited JSON

	$flg_end = false;
	$i = 0;

	error_log(print_r($_GET, true));
	error_log(print_r($_POST, true));

	header("content-type: application/json-seq; charset=UTF-8");

/*
	print "alert('hello ' + exc.sandbox.name);\n";
	print "exc.sandbox.name = 'jose';\n";
	print "console.log('hello ' + exc.sandbox.name);\n";
	exit;

	$data = ["name" => 'Joe' . $i, 'lname'=> 'Cuevas', 'id'=>uniqid(), 'txt'=> "hello\nwith\rhere\tJ1\2ose" ];
	//print json_encode($data);
	//exit;
*/

	//CouchDB continuous _changes feed
	$RS = chr(30); //record separator

	while(!$flg_end){
		$i+= 1;
		$data = ["name" => 'Joe' . $i, 'lname'=> 'Cuevas', 'id'=>uniqid() , 'txt'=> "hello\nwith\rhere\tJ1\2ose"];
		print $RS . json_encode($data) ."\n";
		flush();
		//sleep(2);
		if($i>20) $flg_end = true;
	}

	exit;
?>
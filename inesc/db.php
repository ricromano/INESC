<?php

require("postgresql.php");

if (is_ajax()) {
  if (isset($_POST["action"]) && !empty($_POST["action"])) { //Checks if action value exists
    $action = $_POST["action"];
    switch($action) { //Switch case for value of action
      case "savePoint": savePoint(); break;
      case "readPoints": readPoints(); break;
      case "deleteFeature": deleteFeature(); break;      
    }
  }
}

//Function to check if the request is an AJAX request
function is_ajax() {
  return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
}

function savePoint(){

  $config = [
	  "server" => "127.0.0.1",
	  "port" => "5432",
	  "database" => "CadastroPredial_IGV",
	  "username" => "postgres",
	  "password" => "postgres"
  ];

  $pg = new postgresql;

  $db = $pg->connect($config);
  
  if(!$db){
	  echo "Error : Unable to open database\n";
  } else {
	  //echo "Opened database successfully\n";
  }
  
  $values = $_POST["values"];

  $query = 'INSERT INTO Pontos (pontos_coordenadas) VALUES ($1) RETURNING pontos_ID';
  //$params = array("3,3");
  $params = array("$values");  
  
  $ret = $pg->insertRow($query, $params);

  //$return_str["result"] = $ret;
  //$return_str["lastID"] = $pg->lastInsertPKeys;
  $return = $pg->lastInsertPKeys;
  
  $pg->close(); 
  
  //$return["json"] = json_encode($return_str);
  echo json_encode($return);
}


function readPoints(){

  $config = [
	  "server" => "127.0.0.1",
	  "port" => "5432",
	  "database" => "CadastroPredial_IGV",
	  "username" => "postgres",
	  "password" => "postgres"
  ];

  $pg = new postgresql;

  $db = $pg->connect($config);
  
  if(!$db){
	  echo "Error : Unable to open database\n";
  } else {
	  //echo "Opened database successfully\n";
  } 
  
  $ret = $pg->getTable('*', 'Pontos');
  $arr = pg_fetch_all($ret);

  //$return_str["result"] = pg_fetch_all($ret);
  
  $pg->close(); 
  
  //$return["json"] = json_encode($return_str);
  echo json_encode($arr);
}

function deleteFeature(){

  $config = [
	  "server" => "127.0.0.1",
	  "port" => "5432",
	  "database" => "CadastroPredial_IGV",
	  "username" => "postgres",
	  "password" => "postgres"
  ];

  $pg = new postgresql;

  $db = $pg->connect($config);
  
  if(!$db){
	  echo "Error : Unable to open database\n";
  } else {
	  //echo "Opened database successfully\n";
  }
  
  $values = $_POST["values"]; 
  $ret = $pg->deleteRow('Pontos', 'pontos_id='.$values);
  ///$arr = pg_fetch_all($ret);

  //$return_str["result"] = pg_fetch_all($ret);
  
  $pg->close(); 
  
  //$return["json"] = json_encode($return_str);
  echo json_encode($ret);
}

/*
//$ret = $pg->getTable('*', 'cars');
//$arr = pg_fetch_all($ret);
//echo json_encode($arr);
echo json_encode($ret);
*/
?>

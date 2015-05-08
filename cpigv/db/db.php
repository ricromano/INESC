<?php
error_reporting(E_ALL);
ini_set("display_errors", 1);

require("postgresql.php");

$config = [
  "server" => "127.0.0.1",
  "port" => "5432",
  "database" => "CadastroPredial_IGV2",
  "username" => "CPIGV",
  "password" => "cpigv"
];

if (is_ajax()) {
  if (isset($_POST["action"]) && !empty($_POST["action"])) { //Checks if action value exists
    $action = $_POST["action"];
    switch($action) { //Switch case for value of action
      case "createFeature": createFeature(); break;
      case "modifyFeature": modifyFeature(); break;      
      case "readPoints": readPoints(); break;
      case "readCases": readCases(); break;
      case "deleteFeature": deleteFeature(); break;      
    }
  }
}

//Function to check if the request is an AJAX request
function is_ajax() {
  return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
}

function createFeature(){

  global $config;  

  $pg = new postgresql;

  $db = $pg->connect($config);
  
  if(!$db){
	  echo "Error : Unable to open database\n";
  } else {
	  //echo "Opened database successfully\n";
  }
  
  $values = $_POST["values"];

  $query = 'INSERT INTO features (features_coordinates) VALUES ($1) RETURNING features_ID';
  $params = array("$values");  
  
  $ret = $pg->insertRow($query, $params);

  //$return_str["result"] = $ret;
  //$return_str["lastID"] = $pg->lastInsertPKeys;
  $return = $pg->lastInsertPKeys;
  
  $pg->close(); 
  
  //$return["json"] = json_encode($return_str);
  echo json_encode($return);
}


function modifyFeature(){

  global $config;

  $pg = new postgresql;

  $db = $pg->connect($config);
  
  if(!$db){
	  echo "Error : Unable to open database\n";
  } else {
	  //echo "Opened database successfully\n";
  }
  
  $values = $_POST["values"];
  $featureID = $_POST["featureID"];
  $comments = $_POST["comments"];
  $caseID = $_POST["caseID"];   
  
  $query = 'UPDATE features SET features_coordinates=($1), features_comments=($3), features_case=($4), features_lastchanged=now() WHERE features_id=$2';
  $params = array("$values", $featureID, $comments, $caseID);  
  
  $ret = $pg->updateRow($query, $params);

  //$return_str["result"] = $ret;
  //$return_str["lastID"] = $pg->lastInsertPKeys;
  //$return = $pg->lastInsertPKeys;
  
  $pg->close(); 
  
  //$return["json"] = json_encode($return_str);
  echo json_encode($ret);
}



function readPoints(){

  global $config;

  $pg = new postgresql;

  $db = $pg->connect($config);
  
  if(!$db){
	  echo "Error : Unable to open database\n";
  } else {
	  //echo "Opened database successfully\n";
  } 
  
  $ret = $pg->getTable('features_id, features_coordinates, features_comments, features_case', 'features');
  $arr = pg_fetch_all($ret);

  //$return_str["result"] = pg_fetch_all($ret);
  
  $pg->close(); 
  
  //$return["json"] = json_encode($return_str);
  echo json_encode($arr);
}


function readCases(){

  global $config;

  $pg = new postgresql;

  $db = $pg->connect($config);
  
  if(!$db){
	  echo "Error : Unable to open database\n";
  } else {
	  //echo "Opened database successfully\n";
  } 
  
  $ret = $pg->getTable('cases_id AS value, cases_shortdescription as text, cases_description AS description, cases_path AS path', 'cases ORDER BY cases_id');
  $arr = pg_fetch_all($ret);

  //$return_str["result"] = pg_fetch_all($ret);
  
  $pg->close(); 
  
  //$return["json"] = json_encode($return_str);
  echo json_encode($arr);
}


function deleteFeature(){

  global $config;

  $pg = new postgresql;

  $db = $pg->connect($config);
  
  if(!$db){
	  echo "Error : Unable to open database\n";
  } else {
	  //echo "Opened database successfully\n";
  }
  
  $values = $_POST["values"]; 
  $ret = $pg->deleteRow('features', 'features_id='.$values);
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

<?php 

/*
  $file = $_FILES['image];
  $tag = BS/CDN/19/0001;
  $studid = 00000023323;
*/

function sendToPixo($file,$tag,$studid){
    $tmpfile = $file['image']['tmp_name'];
    $filename = basename($file['image']['name']);
    $app_token = 41329275;
    $data = array(
        'photos' => curl_file_create($tmpfile, $file['image']['type'], $filename),
        'tag' => $tag,
        'studid' => $studid
    );
    $url = "https://cdn.ucc.edu.gh/photo/webupload?group_id=01&token=".$app_token;
    $ch = curl_init();   
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 
    curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/4.0 (compatible;)");   
    curl_setopt($ch, CURLOPT_HTTPHEADER,array('Content-Type: multipart/form-data'));
    curl_setopt($ch, CURLOPT_FRESH_CONNECT, 1);   
    curl_setopt($ch, CURLOPT_FORBID_REUSE, 1);  
    curl_setopt($ch, CURLOPT_TIMEOUT, 100);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response,true);
}

?>
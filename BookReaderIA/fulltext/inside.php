<?php

$item_id=$_GET['item_id'];
$path=$_GET['path'];
$doc=$_GET['doc'];
$q=$_GET['q'];
$callback=$_GET['callback'];

function isValidCallback($identifier) {
    $pattern = '/^[a-zA-Z_$.][a-zA-Z0-9_$.]*$/';
    return preg_match($pattern, $identifier) == 1;
}

function checkPrivs($filename) {
    if (!is_readable($filename)) {        
        header('HTTP/1.1 403 Forbidden');
        exit(0);
    }
}

$filename = "$path/${doc}_abbyy.gz";
if (file_exists($filename)) {
    checkPrivs($filename);
} else {
    $filename = "$path/${doc}_abbyy.zip";
    if (file_exists($filename)) {
        checkPrivs($filename);
    }
}

$contentType = 'application/json'; // default
if ($callback) {
    if (!isValidCallback($callback) ) {
        throw new Exception("Invalid callback");
    }
    $contentType = 'text/javascript'; // JSONP is not JSON
}

header('Content-type: ' . $contentType . ';charset=UTF-8');
header('Access-Control-Allow-Origin: *'); // allow cross-origin requests

$item_id = escapeshellarg($item_id);
$doc = escapeshellarg($doc);
$path = escapeshellarg($path);
$q = escapeshellarg($q);

set_time_limit(120);
passthru("python inside.py $item_id $doc $path $q $callback 2>&1");
?>


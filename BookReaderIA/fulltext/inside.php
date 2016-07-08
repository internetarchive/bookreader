<?php
// Since this is intended to return JSON-P, which doesn't provide a good error
// handling mechanism, make sure all errors are wrapped nicely into a
// JSONP structure.

require @ia;

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
        renderError('One of the source files could not be read.');
    }
}

function renderError($msg) {
    global $callback;
    $out = json_encode(['ia' => $item_id, 'q' => $q, 'indexed' => true, 'matches' => [], 'error' => $msg]);
    if (isValidCallback($callback)) {
        $out = $callback . '(' . $out . ')';
    }
    echo $out;
    exit(0);
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
    if (!isValidCallback($callback)) {
        renderError('Invalid callback in search request.');
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
$cmd = "python inside.py $item_id $doc $path $q $callback 2>&1";
list($retval, $output) = Util::cmd($cmd, 'EXIT_STATUS', 'CONTINUE');
if ($retval != 0) {
    renderError('Whoops! ' . $output);
} else {
    echo $output;
}

<?php
$ia = escapeshellarg($_GET['ia']);
$path = escapeshellarg($_GET['path']);
$file = escapeshellarg($_GET['file']);

$full = $_GET['path'] . '/' . $_GET['file'];
if (!is_readable($full)) {
    header("HTTP/1.1 403 Forbidden");
    exit(0);
}
header('Content-type: text/plain');
passthru("python extract_paragraphs.py $ia $path $file 2>&1");
?>

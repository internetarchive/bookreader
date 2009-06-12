<?
/*
Copyright(c)2008 Internet Archive. Software license AGPL version 3.

This file is part of GnuBook.

    GnuBook is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    GnuBook is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with GnuBook.  If not, see <http://www.gnu.org/licenses/>.
*/

$id = $_REQUEST['id'];

if ("" == $id) {
    echo "No identifier specified!";
    die(-1);
}
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <title>bookreader demo</title>
    <link rel="stylesheet" type="text/css" href="/GnuBook/GnuBook.css">
    <!-- Set minimal style by overriding with embed-specific styles -->
    <link rel="stylesheet" type="text/css" href="/GnuBook/GnuBookEmbed.css">
    <script src="http://www.archive.org/includes/jquery-1.2.6.min.js" type="text/javascript"></script>
    <script type="text/javascript" src="/GnuBook/GnuBook.js"></script>
    <script type="text/javascript" src="/GnuBook/jquery.easing.1.3.js"></script>
</head>
<body style="background-color: rgb(249, 248, 208);margin:0px;">

<div id="GnuBook" style="width:100%;height:100%;border:0px;">x</div>

<script type="text/javascript">
  // Set some config variables -- $$$ NB: The configuration object format is not final
  var gbConfig = {};
  gbConfig["mode"] = 1;
</script>

<script type="text/javascript" src="/GnuBook/GnuBookJSLocate.php?id=<?echo $id;?>"></script>
<script type="text/javascript">
  gb.zoom1up(-1);
</script>
</body>
</html>

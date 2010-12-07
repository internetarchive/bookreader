<? require_once '/petabox/setup.inc';
/*
Copyright(c)2008 Internet Archive. Software license AGPL version 3.

This file is part of BookReader.

    BookReader is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    BookReader is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with BookReader.  If not, see <http://www.gnu.org/licenses/>.
*/


$id = urlencode($_REQUEST['id']); // Sanitize since we put this value in the page

$flippyURL = "/texts/flipbook/flippy.php?id=$id";

Nav::bar('Unsupported browser', 'home', null, null, 1, null,
         '<meta http-equiv="refresh" content="10;url=http://www.archive.org'.$flippyURL.'">',
         '', true);
?>


<div class="box">
<p>
Sorry, but our new viewer does not work in this browser.
</p>

<p>
Either go to our <a href="<?=$flippyURL?>">old viewer</a>,  
or download <a href="http://www.mozilla.com/en-US/firefox/">Firefox</a> or
  <a href="http://www.microsoft.com/windows/internet-explorer/download-ie.aspx">IE8 (or higher)</a>.
</p>

<p>
You will be automatically redirected to the older viewer in 10 seconds.
</p>

</div>

<?=footer();?>

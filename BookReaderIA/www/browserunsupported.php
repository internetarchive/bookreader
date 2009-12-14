<?
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


$id = $_REQUEST['id'];

// Sanitize since we put this value in the page
$id = urlencode($id);

$flippyURL = "http://" . $_SERVER['SERVER_NAME'] . "/texts/flipbook/flippy.php?id=" . $id;

?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <title>Unsupported browser</title>
    <meta http-equiv="refresh" content="10;url=<? echo($flippyURL); ?>">
    <link rel="stylesheet" href="http://www.archive.org/stylesheets/archive.css?v=1.99" type="text/css">
</head>
<body>

<table style="background-color:white " cellspacing="0" width="100%" border="0" cellpadding="0">
  <tbody>
    <tr> 
      <td style="width:100px; height:72px; vertical-align:top; background-color:#000000;">

        <a href="http://www.archive.org/"><img style="border:0;" alt="(logo)" src="http://www.archive.org/images/logo.jpg" width="84" height="70"/></a>
      </td>
      <td valign="bottom" style="background-image:url(http://www.archive.org/images/blendbar.jpg);">
        <table width="100%" border="0" cellpadding="5">
          <tr> 
            <td class="level1Header">
              <div class="tab"><a href="http://www.archive.org/web/web.php">Web</a></div><div class="tab"><a href="http://www.archive.org/details/movies">Moving Images</a></div><div class="tab"><a href="http://www.archive.org/details/texts">Texts</a></div><div class="tab"><a href="http://www.archive.org/details/audio">Audio</a></div><div class="tab"><a href="http://www.archive.org/details/software">Software</a></div><div class="tab"><a href="http://www.archive.org/details/education">Education</a></div><div class="tab"><a href="http://www.archive.org/account/login.changepw.php">Patron Info</a></div><div class="tab"><a href="http://www.archive.org/about/about.php">About IA</a></div>            </td>

          </tr>
                    
        </table>
      </td>
      <td style="width:80px; height:72px; vertical-align:top; text-align: right">
        <a href="http://www.archive.org/about/about.php"><img alt="(navigation image)" src="http://www.archive.org/images/main-header.jpg" style="margin:0; border:0; vertical-align:top;" /></a>      </td>
    </tr>
  </tbody>
</table>

<!--BEGIN HEADER 2-->
<table width="100%" class="level2Header">
  <tbody>
    <tr>
      <td align="left" valign="top" class="level2HeaderLeft">
        <a class="level2Header" href="http://www.archive.org/">Home</a>
      </td>
      <td style="width:100%;" class="level2Header">
        <a href="http://www.archive.org/donate/index.php">Donate</a> | 

<a href="http://www.archive.org/iathreads/forums.php">Forums</a> | 
<a href="http://www.archive.org/about/faqs.php">FAQs</a> | 
<a href="http://www.archive.org/contribute.php">Contributions</a> | 
<a href="http://www.archive.org/about/terms.php">Terms, Privacy, &amp; Copyright</a> | 
<a href="http://www.archive.org/about/contact.php">Contact</a> | 
<a href="http://www.archive.org/about/jobs.php">Jobs</a> | 

<a href="http://www.archive.org/about/bios.php">Bios</a>
      </td>
    </tr>
  </tbody>
</table>


<div class="box">
<p>
Sorry, but our new viewer does not work in this browser yet.
</p>

<p>
Either go to our <a href="<? echo($flippyURL); ?>">old viewer</a>,
or download <a href="http://www.mozilla.com/en-US/firefox/">Firefox</a> or
<a href="http://www.microsoft.com/windows/internet-explorer/download-ie.aspx">IE7 (or higher)</a>.
</p>

<p>
You will be automatically redirected to the older viewer in 10 seconds.
</p>

</div>

<p id="iafoot">
  <a href="http://www.archive.org/about/terms.php">Terms of Use (10 Mar 2001)</a>

</p>

</body>
</html>

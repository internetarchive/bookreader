<?
/*

Builds metadata about a book on the Internet Archive in json(p) format so that the book
can be accessed by other software including the Internet Archive BookReader.

Michael Ang <http://github.com/mangtronix>

Copyright (c) 2008-2010 Internet Archive. Software license AGPL version 3.

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

require_once('BookReaderMeta.inc.php');

$brm = new BookReaderMeta();
$brm->processRequest($_REQUEST);


?>

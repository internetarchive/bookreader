const cpx = require('cpx2');

// mmenu
cpx.copySync('node_modules/jquery.mmenu/dist/{css,js}/**/*', 'BookReader/mmenu/dist');
cpx.copySync('node_modules/jquery.mmenu/dist/addons/navbars/*', 'BookReader/mmenu/dist/addons/navbars');
cpx.copySync('node_modules/jquery.mmenu/dist/addons/offcanvas/*', 'BookReader/mmenu/dist/addons/offcanvas');
cpx.copySync('node_modules/jquery.mmenu/dist/addons/screenreader/*', 'BookReader/mmenu/dist/addons/screenreader');
cpx.copySync('node_modules/jquery.mmenu/dist/addons/searchfield/*', 'BookReader/mmenu/dist/addons/searchfield');
// This file has custom modifications -_- We'll delete it in v5 since it's unused.
// cpx.copySync('node_modules/jquery.mmenu/src/addons/searchfield/jquery.mmenu.searchfield.js', 'BookReader/mmenu');

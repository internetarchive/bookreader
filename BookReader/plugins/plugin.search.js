!function(t){var e={};function r(n){if(e[n])return e[n].exports;var o=e[n]={i:n,l:!1,exports:{}};return t[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}r.m=t,r.c=e,r.d=function(t,e,n){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r.t=function(t,e){if(1&e&&(t=r(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var o in t)r.d(n,o,function(e){return t[e]}.bind(null,o));return n},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=62)}([function(t,e,r){var n=r(1),o=r(15),i=r(27),a=r(46),c=n.Symbol,u=o("wks");t.exports=function(t){return u[t]||(u[t]=a&&c[t]||(a?c:i)("Symbol."+t))}},function(t,e,r){(function(e){var r=function(t){return t&&t.Math==Math&&t};t.exports=r("object"==typeof globalThis&&globalThis)||r("object"==typeof window&&window)||r("object"==typeof self&&self)||r("object"==typeof e&&e)||Function("return this")()}).call(this,r(64))},function(t,e){t.exports=function(t){try{return!!t()}catch(t){return!0}}},function(t,e){t.exports=function(t){return"object"==typeof t?null!==t:"function"==typeof t}},function(t,e){var r={}.hasOwnProperty;t.exports=function(t,e){return r.call(t,e)}},function(t,e,r){var n=r(8),o=r(6),i=r(12);t.exports=n?function(t,e,r){return o.f(t,e,i(1,r))}:function(t,e,r){return t[e]=r,t}},function(t,e,r){var n=r(8),o=r(38),i=r(7),a=r(17),c=Object.defineProperty;e.f=n?c:function(t,e,r){if(i(t),e=a(e,!0),i(r),o)try{return c(t,e,r)}catch(t){}if("get"in r||"set"in r)throw TypeError("Accessors not supported");return"value"in r&&(t[e]=r.value),t}},function(t,e,r){var n=r(3);t.exports=function(t){if(!n(t))throw TypeError(String(t)+" is not an object");return t}},function(t,e,r){var n=r(2);t.exports=!n((function(){return 7!=Object.defineProperty({},"a",{get:function(){return 7}}).a}))},function(t,e,r){var n=r(1),o=r(15),i=r(5),a=r(4),c=r(26),u=r(40),s=r(19),f=s.get,l=s.enforce,p=String(u).split("toString");o("inspectSource",(function(t){return u.call(t)})),(t.exports=function(t,e,r,o){var u=!!o&&!!o.unsafe,s=!!o&&!!o.enumerable,f=!!o&&!!o.noTargetGet;"function"==typeof r&&("string"!=typeof e||a(r,"name")||i(r,"name",e),l(r).source=p.join("string"==typeof e?e:"")),t!==n?(u?!f&&t[e]&&(s=!0):delete t[e],s?t[e]=r:i(t,e,r)):s?t[e]=r:c(e,r)})(Function.prototype,"toString",(function(){return"function"==typeof this&&f(this).source||u.call(this)}))},function(t,e,r){var n=r(37),o=r(14);t.exports=function(t){return n(o(t))}},function(t,e,r){var n=r(1),o=r(25).f,i=r(5),a=r(9),c=r(26),u=r(41),s=r(45);t.exports=function(t,e){var r,f,l,p,h,v=t.target,d=t.global,g=t.stat;if(r=d?n:g?n[v]||c(v,{}):(n[v]||{}).prototype)for(f in e){if(p=e[f],l=t.noTargetGet?(h=o(r,f))&&h.value:r[f],!s(d?f:v+(g?".":"#")+f,t.forced)&&void 0!==l){if(typeof p==typeof l)continue;u(p,l)}(t.sham||l&&l.sham)&&i(p,"sham",!0),a(r,f,p,t)}}},function(t,e){t.exports=function(t,e){return{enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}}},function(t,e){var r={}.toString;t.exports=function(t){return r.call(t).slice(8,-1)}},function(t,e){t.exports=function(t){if(null==t)throw TypeError("Can't call method on "+t);return t}},function(t,e,r){var n=r(18),o=r(65);(t.exports=function(t,e){return o[t]||(o[t]=void 0!==e?e:{})})("versions",[]).push({version:"3.3.3",mode:n?"pure":"global",copyright:"© 2019 Denis Pushkarev (zloirock.ru)"})},function(t,e,r){var n=r(14);t.exports=function(t){return Object(n(t))}},function(t,e,r){var n=r(3);t.exports=function(t,e){if(!n(t))return t;var r,o;if(e&&"function"==typeof(r=t.toString)&&!n(o=r.call(t)))return o;if("function"==typeof(r=t.valueOf)&&!n(o=r.call(t)))return o;if(!e&&"function"==typeof(r=t.toString)&&!n(o=r.call(t)))return o;throw TypeError("Can't convert object to primitive value")}},function(t,e){t.exports=!1},function(t,e,r){var n,o,i,a=r(66),c=r(1),u=r(3),s=r(5),f=r(4),l=r(20),p=r(21),h=c.WeakMap;if(a){var v=new h,d=v.get,g=v.has,y=v.set;n=function(t,e){return y.call(v,t,e),e},o=function(t){return d.call(v,t)||{}},i=function(t){return g.call(v,t)}}else{var b=l("state");p[b]=!0,n=function(t,e){return s(t,b,e),e},o=function(t){return f(t,b)?t[b]:{}},i=function(t){return f(t,b)}}t.exports={set:n,get:o,has:i,enforce:function(t){return i(t)?o(t):n(t,{})},getterFor:function(t){return function(e){var r;if(!u(e)||(r=o(e)).type!==t)throw TypeError("Incompatible receiver, "+t+" required");return r}}}},function(t,e,r){var n=r(15),o=r(27),i=n("keys");t.exports=function(t){return i[t]||(i[t]=o(t))}},function(t,e){t.exports={}},function(t,e,r){var n=r(43),o=r(29).concat("length","prototype");e.f=Object.getOwnPropertyNames||function(t){return n(t,o)}},function(t,e,r){var n=r(24),o=Math.min;t.exports=function(t){return t>0?o(n(t),9007199254740991):0}},function(t,e){var r=Math.ceil,n=Math.floor;t.exports=function(t){return isNaN(t=+t)?0:(t>0?n:r)(t)}},function(t,e,r){var n=r(8),o=r(36),i=r(12),a=r(10),c=r(17),u=r(4),s=r(38),f=Object.getOwnPropertyDescriptor;e.f=n?f:function(t,e){if(t=a(t),e=c(e,!0),s)try{return f(t,e)}catch(t){}if(u(t,e))return i(!o.f.call(t,e),t[e])}},function(t,e,r){var n=r(1),o=r(5);t.exports=function(t,e){try{o(n,t,e)}catch(r){n[t]=e}return e}},function(t,e){var r=0,n=Math.random();t.exports=function(t){return"Symbol("+String(void 0===t?"":t)+")_"+(++r+n).toString(36)}},function(t,e,r){var n=r(42),o=r(1),i=function(t){return"function"==typeof t?t:void 0};t.exports=function(t,e){return arguments.length<2?i(n[t])||i(o[t]):n[t]&&n[t][e]||o[t]&&o[t][e]}},function(t,e){t.exports=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"]},function(t,e,r){var n=r(13);t.exports=Array.isArray||function(t){return"Array"==n(t)}},function(t,e,r){var n=r(7),o=r(70),i=r(29),a=r(21),c=r(71),u=r(39),s=r(20)("IE_PROTO"),f=function(){},l=function(){var t,e=u("iframe"),r=i.length;for(e.style.display="none",c.appendChild(e),e.src=String("javascript:"),(t=e.contentWindow.document).open(),t.write("<script>document.F=Object<\/script>"),t.close(),l=t.F;r--;)delete l.prototype[i[r]];return l()};t.exports=Object.create||function(t,e){var r;return null!==t?(f.prototype=n(t),r=new f,f.prototype=null,r[s]=t):r=l(),void 0===e?r:o(r,e)},a[s]=!0},function(t,e,r){var n=r(6).f,o=r(4),i=r(0)("toStringTag");t.exports=function(t,e,r){t&&!o(t=r?t:t.prototype,i)&&n(t,i,{configurable:!0,value:e})}},function(t,e,r){var n=r(73),o=r(37),i=r(16),a=r(23),c=r(50),u=[].push,s=function(t){var e=1==t,r=2==t,s=3==t,f=4==t,l=6==t,p=5==t||l;return function(h,v,d,g){for(var y,b,m=i(h),x=o(m),S=n(v,d,3),R=a(x.length),w=0,k=g||c,O=e?k(h,R):r?k(h,0):void 0;R>w;w++)if((p||w in x)&&(b=S(y=x[w],w,m),t))if(e)O[w]=b;else if(b)switch(t){case 3:return!0;case 5:return y;case 6:return w;case 2:u.call(O,y)}else if(f)return!1;return l?-1:s||f?f:O}};t.exports={forEach:s(0),map:s(1),filter:s(2),some:s(3),every:s(4),find:s(5),findIndex:s(6)}},function(t,e){t.exports={}},function(t,e,r){"use strict";var n=r(7);t.exports=function(){var t=n(this),e="";return t.global&&(e+="g"),t.ignoreCase&&(e+="i"),t.multiline&&(e+="m"),t.dotAll&&(e+="s"),t.unicode&&(e+="u"),t.sticky&&(e+="y"),e}},function(t,e,r){"use strict";var n={}.propertyIsEnumerable,o=Object.getOwnPropertyDescriptor,i=o&&!n.call({1:2},1);e.f=i?function(t){var e=o(this,t);return!!e&&e.enumerable}:n},function(t,e,r){var n=r(2),o=r(13),i="".split;t.exports=n((function(){return!Object("z").propertyIsEnumerable(0)}))?function(t){return"String"==o(t)?i.call(t,""):Object(t)}:Object},function(t,e,r){var n=r(8),o=r(2),i=r(39);t.exports=!n&&!o((function(){return 7!=Object.defineProperty(i("div"),"a",{get:function(){return 7}}).a}))},function(t,e,r){var n=r(1),o=r(3),i=n.document,a=o(i)&&o(i.createElement);t.exports=function(t){return a?i.createElement(t):{}}},function(t,e,r){var n=r(15);t.exports=n("native-function-to-string",Function.toString)},function(t,e,r){var n=r(4),o=r(67),i=r(25),a=r(6);t.exports=function(t,e){for(var r=o(e),c=a.f,u=i.f,s=0;s<r.length;s++){var f=r[s];n(t,f)||c(t,f,u(e,f))}}},function(t,e,r){t.exports=r(1)},function(t,e,r){var n=r(4),o=r(10),i=r(68).indexOf,a=r(21);t.exports=function(t,e){var r,c=o(t),u=0,s=[];for(r in c)!n(a,r)&&n(c,r)&&s.push(r);for(;e.length>u;)n(c,r=e[u++])&&(~i(s,r)||s.push(r));return s}},function(t,e){e.f=Object.getOwnPropertySymbols},function(t,e,r){var n=r(2),o=/#|\.prototype\./,i=function(t,e){var r=c[a(t)];return r==s||r!=u&&("function"==typeof e?n(e):!!e)},a=i.normalize=function(t){return String(t).replace(o,".").toLowerCase()},c=i.data={},u=i.NATIVE="N",s=i.POLYFILL="P";t.exports=i},function(t,e,r){var n=r(2);t.exports=!!Object.getOwnPropertySymbols&&!n((function(){return!String(Symbol())}))},function(t,e,r){var n=r(43),o=r(29);t.exports=Object.keys||function(t){return n(t,o)}},function(t,e,r){e.f=r(0)},function(t,e,r){var n=r(42),o=r(4),i=r(48),a=r(6).f;t.exports=function(t){var e=n.Symbol||(n.Symbol={});o(e,t)||a(e,t,{value:i.f(t)})}},function(t,e,r){var n=r(3),o=r(30),i=r(0)("species");t.exports=function(t,e){var r;return o(t)&&("function"!=typeof(r=t.constructor)||r!==Array&&!o(r.prototype)?n(r)&&null===(r=r[i])&&(r=void 0):r=void 0),new(void 0===r?Array:r)(0===e?0:e)}},function(t,e,r){var n=r(0),o=r(31),i=r(5),a=n("unscopables"),c=Array.prototype;null==c[a]&&i(c,a,o(null)),t.exports=function(t){c[a][t]=!0}},function(t,e,r){"use strict";var n=r(10),o=r(51),i=r(34),a=r(19),c=r(53),u=a.set,s=a.getterFor("Array Iterator");t.exports=c(Array,"Array",(function(t,e){u(this,{type:"Array Iterator",target:n(t),index:0,kind:e})}),(function(){var t=s(this),e=t.target,r=t.kind,n=t.index++;return!e||n>=e.length?(t.target=void 0,{value:void 0,done:!0}):"keys"==r?{value:n,done:!1}:"values"==r?{value:e[n],done:!1}:{value:[n,e[n]],done:!1}}),"values"),i.Arguments=i.Array,o("keys"),o("values"),o("entries")},function(t,e,r){"use strict";var n=r(11),o=r(81),i=r(55),a=r(56),c=r(32),u=r(5),s=r(9),f=r(0),l=r(18),p=r(34),h=r(54),v=h.IteratorPrototype,d=h.BUGGY_SAFARI_ITERATORS,g=f("iterator"),y=function(){return this};t.exports=function(t,e,r,f,h,b,m){o(r,e,f);var x,S,R,w=function(t){if(t===h&&T)return T;if(!d&&t in B)return B[t];switch(t){case"keys":case"values":case"entries":return function(){return new r(this,t)}}return function(){return new r(this)}},k=e+" Iterator",O=!1,B=t.prototype,P=B[g]||B["@@iterator"]||h&&B[h],T=!d&&P||w(h),j="Array"==e&&B.entries||P;if(j&&(x=i(j.call(new t)),v!==Object.prototype&&x.next&&(l||i(x)===v||(a?a(x,v):"function"!=typeof x[g]&&u(x,g,y)),c(x,k,!0,!0),l&&(p[k]=y))),"values"==h&&P&&"values"!==P.name&&(O=!0,T=function(){return P.call(this)}),l&&!m||B[g]===T||u(B,g,T),p[e]=T,h)if(S={values:w("values"),keys:b?T:w("keys"),entries:w("entries")},m)for(R in S)!d&&!O&&R in B||s(B,R,S[R]);else n({target:e,proto:!0,forced:d||O},S);return S}},function(t,e,r){"use strict";var n,o,i,a=r(55),c=r(5),u=r(4),s=r(0),f=r(18),l=s("iterator"),p=!1;[].keys&&("next"in(i=[].keys())?(o=a(a(i)))!==Object.prototype&&(n=o):p=!0),null==n&&(n={}),f||u(n,l)||c(n,l,(function(){return this})),t.exports={IteratorPrototype:n,BUGGY_SAFARI_ITERATORS:p}},function(t,e,r){var n=r(4),o=r(16),i=r(20),a=r(82),c=i("IE_PROTO"),u=Object.prototype;t.exports=a?Object.getPrototypeOf:function(t){return t=o(t),n(t,c)?t[c]:"function"==typeof t.constructor&&t instanceof t.constructor?t.constructor.prototype:t instanceof Object?u:null}},function(t,e,r){var n=r(7),o=r(83);t.exports=Object.setPrototypeOf||("__proto__"in{}?function(){var t,e=!1,r={};try{(t=Object.getOwnPropertyDescriptor(Object.prototype,"__proto__").set).call(r,[]),e=r instanceof Array}catch(t){}return function(r,i){return n(r),o(i),e?t.call(r,i):r.__proto__=i,r}}():void 0)},function(t,e,r){var n=r(24),o=r(14),i=function(t){return function(e,r){var i,a,c=String(o(e)),u=n(r),s=c.length;return u<0||u>=s?t?"":void 0:(i=c.charCodeAt(u))<55296||i>56319||u+1===s||(a=c.charCodeAt(u+1))<56320||a>57343?t?c.charAt(u):i:t?c.slice(u,u+2):a-56320+(i-55296<<10)+65536}};t.exports={codeAt:i(!1),charAt:i(!0)}},function(t,e,r){"use strict";var n=r(5),o=r(9),i=r(2),a=r(0),c=r(59),u=a("species"),s=!i((function(){var t=/./;return t.exec=function(){var t=[];return t.groups={a:"7"},t},"7"!=="".replace(t,"$<a>")})),f=!i((function(){var t=/(?:)/,e=t.exec;t.exec=function(){return e.apply(this,arguments)};var r="ab".split(t);return 2!==r.length||"a"!==r[0]||"b"!==r[1]}));t.exports=function(t,e,r,l){var p=a(t),h=!i((function(){var e={};return e[p]=function(){return 7},7!=""[t](e)})),v=h&&!i((function(){var e=!1,r=/a/;return r.exec=function(){return e=!0,null},"split"===t&&(r.constructor={},r.constructor[u]=function(){return r}),r[p](""),!e}));if(!h||!v||"replace"===t&&!s||"split"===t&&!f){var d=/./[p],g=r(p,""[t],(function(t,e,r,n,o){return e.exec===c?h&&!o?{done:!0,value:d.call(e,r,n)}:{done:!0,value:t.call(r,e,n)}:{done:!1}})),y=g[0],b=g[1];o(String.prototype,t,y),o(RegExp.prototype,p,2==e?function(t,e){return b.call(t,this,e)}:function(t){return b.call(t,this)}),l&&n(RegExp.prototype[p],"sham",!0)}}},function(t,e,r){"use strict";var n,o,i=r(35),a=RegExp.prototype.exec,c=String.prototype.replace,u=a,s=(n=/a/,o=/b*/g,a.call(n,"a"),a.call(o,"a"),0!==n.lastIndex||0!==o.lastIndex),f=void 0!==/()??/.exec("")[1];(s||f)&&(u=function(t){var e,r,n,o,u=this;return f&&(r=new RegExp("^"+u.source+"$(?!\\s)",i.call(u))),s&&(e=u.lastIndex),n=a.call(u,t),s&&n&&(u.lastIndex=u.global?n.index+n[0].length:e),f&&n&&n.length>1&&c.call(n[0],r,(function(){for(o=1;o<arguments.length-2;o++)void 0===arguments[o]&&(n[o]=void 0)})),n}),t.exports=u},function(t,e,r){var n=r(13),o=r(59);t.exports=function(t,e){var r=t.exec;if("function"==typeof r){var i=r.call(t,e);if("object"!=typeof i)throw TypeError("RegExp exec method returned something other than an Object or null");return i}if("RegExp"!==n(t))throw TypeError("RegExp#exec called on incompatible receiver");return o.call(t,e)}},function(t,e){t.exports={CSSRuleList:0,CSSStyleDeclaration:0,CSSValueList:0,ClientRectList:0,DOMRectList:0,DOMStringList:0,DOMTokenList:1,DataTransferItemList:0,FileList:0,HTMLAllCollection:0,HTMLCollection:0,HTMLFormElement:0,HTMLSelectElement:0,MediaList:0,MimeTypeArray:0,NamedNodeMap:0,NodeList:1,PaintRequestList:0,Plugin:0,PluginArray:0,SVGLengthList:0,SVGNumberList:0,SVGPathSegList:0,SVGPointList:0,SVGStringList:0,SVGTransformList:0,SourceBufferList:0,StyleSheetList:0,TextTrackCueList:0,TextTrackList:0,TouchList:0}},function(t,e,r){"use strict";r.r(e);var n;r(63),r(75),r(76),r(77),r(80),r(52),r(84),r(87),r(91),r(92),r(93),r(95),r(97),r(100);function o(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){if(!(Symbol.iterator in Object(t)||"[object Arguments]"===Object.prototype.toString.call(t)))return;var r=[],n=!0,o=!1,i=void 0;try{for(var a,c=t[Symbol.iterator]();!(n=(a=c.next()).done)&&(r.push(a.value),!e||r.length!==e);n=!0);}catch(t){o=!0,i=t}finally{try{n||null==c.return||c.return()}finally{if(o)throw i}}return r}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}jQuery.extend(BookReader.defaultOptions,{server:"ia600609.us.archive.org",bookId:"",subPrefix:"",bookPath:"",enableSearch:!0,searchInsideUrl:"/fulltext/inside.php",initialSearchTerm:null}),BookReader.prototype.setup=(n=BookReader.prototype.setup,function(t){n.call(this,t),this.searchTerm="",this.searchResults=null,this.searchInsideUrl=t.searchInsideUrl,this.enableSearch=t.enableSearch,this.bookId=t.bookId,this.server=t.server,this.subPrefix=t.subPrefix,this.bookPath=t.bookPath}),BookReader.prototype.init=function(t){return function(){var e=this;t.call(this),this.options.enableSearch&&this.options.initialSearchTerm&&(this.$(".BRsearchInput").val(this.options.initialSearchTerm),this.search(this.options.initialSearchTerm,{goToFirstResult:!0})),$(document).on("BookReader:navToggled",(function(){var t=e.navigationIsVisible()?"visible":"hidden";e.refs.$BRfooter.find(".BRsearch").css({visibility:t})}))}}(BookReader.prototype.init),BookReader.prototype.buildMobileDrawerElement=function(t){return function(){var e=t.call(this);return this.enableSearch&&e.find(".BRmobileMenu__moreInfoRow").after($('<li>\n          <span>\n            <span class="DrawerIconWrapper">\n              <img class="DrawerIcon" src="'.concat(this.imagesBaseURL,'icon_search_button_blue.svg" alt="info-speaker"/>\n            </span>\n            Search\n          </span>\n          <div>\n            <form class="BRbooksearch mobile">\n              <input type="search" class="BRsearchInput" placeholder="Search inside"/>\n              <button type="submit" class="BRsearchSubmit"></button>\n            </form>\n            <div class="BRmobileSearchResultWrapper">Enter your search above.</div>\n          </div>\n        </li>'))),e}}(BookReader.prototype.buildMobileDrawerElement),BookReader.prototype.buildToolbarElement=function(t){return function(){var e=t.call(this);this.enableSearch&&$('<span class="BRtoolbarSection BRtoolbarSectionSearch">\n          <form class="BRbooksearch desktop">\n            <input type="search" class="BRsearchInput" val="" placeholder="Search inside"/>\n            <button type="submit" class="BRsearchSubmit">\n              <img src="'.concat(this.imagesBaseURL,'icon_search_button.svg" />\n            </button>\n          </form>\n        </span>')).insertAfter(e.find(".BRtoolbarSectionInfo"));return e}}(BookReader.prototype.buildToolbarElement),BookReader.prototype.initToolbar=function(t){return function(e,r){var n=this;t.apply(this,arguments);var o=function(t){t.preventDefault();var e=$(t.target).find(".BRsearchInput").val();return!!e.length&&(n.search(e),!1)},i=function(t){t.preventDefault();var e=$(t.target).find(".BRsearchInput").val();return!!e.length&&(n.search(e,{disablePopup:!0}),n.$(".BRmobileSearchResultWrapper").append('<div>Your search results will appear below.</div>\n          <div class="loader tc mt20"></div>'),!1)};this.$(".BRbooksearch.desktop").submit(o),this.$(".BRbooksearch.mobile").submit(i),this.$(".BRsearchInput").bind("input propertychange",(function(){""===n.value&&n.removeSearchResults()}))}}(BookReader.prototype.initToolbar),BookReader.prototype.search=function(t,e){var r=this;e=void 0!==e?e:{};e=jQuery.extend({},{goToFirstResult:!1,disablePopup:!1,error:null,success:null},e),this.$(".BRsearchInput").blur(),this.removeSearchResults(),this.searchTerm=t,this.searchTerm=this.searchTerm.replace(/\//g," "),this.trigger(BookReader.eventNames.fragmentChange);var n=this.server.replace(/:.+/,""),o="https://".concat(n).concat(this.searchInsideUrl,"?"),i=this.bookPath,a="/".concat(this.subPrefix);this.bookPath.length-this.bookPath.lastIndexOf(a)==a.length&&(i=this.bookPath.substr(0,this.bookPath.length-a.length));var c={item_id:this.bookId,doc:this.subPrefix,path:i,q:t},u=$.param(c).replace(/%2F/g,"/"),s="".concat(o).concat(u);e.disablePopup||this.showProgressPopup('<img class="searchmarker" src="'.concat(this.imagesBaseURL,'marker_srch-on.svg" />\n      Search results will appear below...'));$.ajax({url:s,dataType:"jsonp"}).then((function(t){var n=t.error||!t.matches.length,o="function"==typeof e.error,i="function"==typeof e.success;n?o?e.error(t,e):r.BRSearchCallbackError(t,e):i?e.success(t,e):r.BRSearchCallback(t,e)}))},BookReader.prototype.BRSearchCallback=function(t,e){var r=this;this.searchResults=t,this.$(".BRnavpos .search").remove(),this.$(".BRmobileSearchResultWrapper").empty();var n=1==t.matches.length?"1 match":"".concat(t.matches.length," matches");this.$(".BRmobileSearchResultWrapper").append('<div class="BRmobileNumResults">\n    '.concat(n,' for "').concat(this.searchTerm,'"\n    </div>'));var i=null;t.matches.forEach((function(t,n){var a=t.text,c=o(t.par,1)[0];r.addSearchResult(a,r.leafNumToIndex(c.page)),0===n&&!0===e.goToFirstResult&&(i=r.leafNumToIndex(c.page))})),this.updateSearchHilites(),this.removeProgressPopup(),null!==i&&this.jumpToIndex(i)},BookReader.prototype.BRSearchCallbackErrorDesktop=function(t,e){var r=$(this.popup);this._BRSearchCallbackError(t,r,!0)},BookReader.prototype.BRSearchCallbackError=function(t){var e=$(this.popup);this._BRSearchCallbackError(t,e,!0),this.BRSearchCallbackErrorMobile(t)},BookReader.prototype.BRSearchCallbackErrorMobile=function(t){var e=this.$(".BRmobileSearchResultWrapper");this._BRSearchCallbackError(t,e)},BookReader.prototype._BRSearchCallbackError=function(t,e,r){var n=this;this.$(".BRnavpos .search").remove(),this.$(".BRmobileSearchResultWrapper").empty(),this.searchResults=t;var o=2e3;if(t.error)/debug/.test(window.location.href)?e.html(t.error):(o=4e3,e.html("Sorry, there was an error with your search.<br />The text may still be processing."));else if(0==t.matches.length){var i="No matches were found.";o=2e3,!1===t.indexed&&(i="<p>This book hasn't been indexed for searching yet. We've just started indexing it, so search should be available soon. Please try again later. Thanks!</p>",o=5e3),e.html(i)}if(r){var a=function(){n.removeProgressPopup()};setTimeout((function(){e.fadeOut("slow",a)}),o)}},BookReader.prototype.updateSearchHilites=function(){this.constMode2up==this.mode?this.updateSearchHilites2UP():this.updateSearchHilites1UP()},BookReader.prototype.updateSearchHilites1UP=function(){var t=this,e=this.searchResults;null!=e&&e.matches.forEach((function(e){e.par[0].boxes.forEach((function(e){var r=t.leafNumToIndex(e.page);if(jQuery.inArray(r,t.displayedIndices)>=0){e.div||(e.div=document.createElement("div"),$(e.div).prop("className","BookReaderSearchHilite").appendTo(t.$(".pagediv".concat(r))));var n={width:"".concat((e.r-e.l)/t.reduce,"px"),height:"".concat((e.b-e.t)/t.reduce,"px"),left:"".concat(e.l/t.reduce,"px"),top:"".concat(e.t/t.reduce,"px")};$(e.div).css(n)}else e.div&&($(e.div).remove(),e.div=null)}))}))},BookReader.prototype.updateSearchHilites2UP=function(){var t=this,e=this.searchResults;null!==e&&e.matches.forEach((function(e){e.par[0].boxes.forEach((function(r){var n=t.leafNumToIndex(e.par[0].page);jQuery.inArray(n,t.displayedIndices)>=0?(null===r.div&&(r.div=document.createElement("div"),$(r.div).addClass("BookReaderSearchHilite").appendTo(t.refs.$brTwoPageView)),t.setHilightCss2UP(r.div,n,r.l,r.r,r.t,r.b)):null!==r.div&&($(r.div).remove(),r.div=null)}))}))},BookReader.prototype.removeSearchHilites=function(){var t=this.searchResults;null!=t&&t.matches.forEach((function(t){t.par[0].boxes.forEach((function(t){null!=t.div&&($(t.div).remove(),t.div=null)}))}))},BookReader.prototype.addSearchResult=function(t,e){var r,n=this,o=this.getPageNum(e),i=BookReader.util.cssPercentage(e,this.getNumLeafs()-1),a="".concat("Page"," ").concat(this.getNavPageNumString(e,!0)),c=new RegExp("{{{(.+?)}}}","g"),u=t.replace(c,"<b>$1</b>");r=t.length>100?t.replace(/^(.{100}[^\s]*).*/,"$1").replace(c,"<b>$1</b>")+"...":t.replace(c,"<b>$1</b>");var s=-this.refs.$brContainer.height();$("<div>").addClass("BRsearch").css({top:"".concat(s,"px"),left:i}).attr("title","Search result").append($("<div>").addClass("BRquery").append($("<div>").html(u),$("<div>").html("".concat("Page"," ").concat(o)))).data({pageIndex:e}).appendTo(this.$(".BRnavline")).bt({contentSelector:'$(this).find(".BRquery")',trigger:"hover",closeWhenOthersOpen:!0,cssStyles:{padding:"12px 14px",backgroundColor:"#fff",border:"4px solid rgb(216,216,216)",color:"rgb(52,52,52)"},shrinkToFit:!1,width:"230px",padding:0,spikeGirth:0,spikeLength:0,overlap:"0px",overlay:!1,killTitle:!1,offsetParent:null,positions:["top"],fill:"white",windowMargin:10,strokeWidth:0,cornerRadius:0,centerPointX:0,centerPointY:0,shadow:!1}).hover((function(t){$(".BRsearch,.BRchapter").removeClass("front"),$(t.target).addClass("front")}),(function(t){return $(t.target).removeClass("front")})).click(function(t){this.jumpToIndex($(t.target).data("pageIndex"))}.bind(this)).animate({top:"-25px"},"slow");var f=this.getPageURI(e,16,0),l=this.$(".BRmobileSearchResultWrapper");if(l.length){$('<a class="BRmobileSearchResult">\n        <table>\n          <tr>\n            <span class="pageDisplay">'.concat(a,'</span>\n          </tr>\n          <tr>\n            <td>\n              <img class="searchImgPreview" src="').concat(f,'" />\n            </td>\n            <td>\n              <span>').concat(r,"</span>\n            </td>\n          </tr>\n        </table>\n      </a>")).attr("href","#search/"+this.searchTerm).click((function(t){t.preventDefault(),n.switchMode(n.constMode1up),n.jumpToIndex(e),n.refs.$mmenu.data("mmenu").close()})).appendTo(l)}},BookReader.prototype.removeSearchResults=function(){this.removeSearchHilites(),this.searchTerm=null,this.searchResults=null,this.trigger(BookReader.eventNames.fragmentChange),this.$(".BRnavpos .BRsearch").remove(),this.$(".BRmobileSearchResultWrapper").empty()},BookReader.prototype.searchHighlightVisible=function(){var t=this,e=this.searchResults,r=[];if(null==e)return!1;if(this.constMode2up==this.mode)r=[this.twoPage.currentIndexL,this.twoPage.currentIndex];else{if(this.constMode1up!=this.mode)return!1;r=[this.currentIndex()]}return e.matches.some((function(e){return e.par[0].boxes.some((function(e){var n=t.leafNumToIndex(e.page);if(jQuery.inArray(n,r)>=0)return!0}))})),!1}},function(t,e,r){"use strict";var n=r(11),o=r(1),i=r(18),a=r(8),c=r(46),u=r(2),s=r(4),f=r(30),l=r(3),p=r(7),h=r(16),v=r(10),d=r(17),g=r(12),y=r(31),b=r(47),m=r(22),x=r(72),S=r(44),R=r(25),w=r(6),k=r(36),O=r(5),B=r(9),P=r(15),T=r(20),j=r(21),E=r(27),I=r(0),$=r(48),A=r(49),_=r(32),M=r(19),C=r(33).forEach,L=T("hidden"),N=I("toPrimitive"),F=M.set,D=M.getterFor("Symbol"),H=Object.prototype,U=o.Symbol,W=o.JSON,G=W&&W.stringify,V=R.f,Q=w.f,q=x.f,z=k.f,Y=P("symbols"),J=P("op-symbols"),K=P("string-to-symbol-registry"),X=P("symbol-to-string-registry"),Z=P("wks"),tt=o.QObject,et=!tt||!tt.prototype||!tt.prototype.findChild,rt=a&&u((function(){return 7!=y(Q({},"a",{get:function(){return Q(this,"a",{value:7}).a}})).a}))?function(t,e,r){var n=V(H,e);n&&delete H[e],Q(t,e,r),n&&t!==H&&Q(H,e,n)}:Q,nt=function(t,e){var r=Y[t]=y(U.prototype);return F(r,{type:"Symbol",tag:t,description:e}),a||(r.description=e),r},ot=c&&"symbol"==typeof U.iterator?function(t){return"symbol"==typeof t}:function(t){return Object(t)instanceof U},it=function(t,e,r){t===H&&it(J,e,r),p(t);var n=d(e,!0);return p(r),s(Y,n)?(r.enumerable?(s(t,L)&&t[L][n]&&(t[L][n]=!1),r=y(r,{enumerable:g(0,!1)})):(s(t,L)||Q(t,L,g(1,{})),t[L][n]=!0),rt(t,n,r)):Q(t,n,r)},at=function(t,e){p(t);var r=v(e),n=b(r).concat(ft(r));return C(n,(function(e){a&&!ct.call(r,e)||it(t,e,r[e])})),t},ct=function(t){var e=d(t,!0),r=z.call(this,e);return!(this===H&&s(Y,e)&&!s(J,e))&&(!(r||!s(this,e)||!s(Y,e)||s(this,L)&&this[L][e])||r)},ut=function(t,e){var r=v(t),n=d(e,!0);if(r!==H||!s(Y,n)||s(J,n)){var o=V(r,n);return!o||!s(Y,n)||s(r,L)&&r[L][n]||(o.enumerable=!0),o}},st=function(t){var e=q(v(t)),r=[];return C(e,(function(t){s(Y,t)||s(j,t)||r.push(t)})),r},ft=function(t){var e=t===H,r=q(e?J:v(t)),n=[];return C(r,(function(t){!s(Y,t)||e&&!s(H,t)||n.push(Y[t])})),n};c||(B((U=function(){if(this instanceof U)throw TypeError("Symbol is not a constructor");var t=arguments.length&&void 0!==arguments[0]?String(arguments[0]):void 0,e=E(t),r=function(t){this===H&&r.call(J,t),s(this,L)&&s(this[L],e)&&(this[L][e]=!1),rt(this,e,g(1,t))};return a&&et&&rt(H,e,{configurable:!0,set:r}),nt(e,t)}).prototype,"toString",(function(){return D(this).tag})),k.f=ct,w.f=it,R.f=ut,m.f=x.f=st,S.f=ft,a&&(Q(U.prototype,"description",{configurable:!0,get:function(){return D(this).description}}),i||B(H,"propertyIsEnumerable",ct,{unsafe:!0})),$.f=function(t){return nt(I(t),t)}),n({global:!0,wrap:!0,forced:!c,sham:!c},{Symbol:U}),C(b(Z),(function(t){A(t)})),n({target:"Symbol",stat:!0,forced:!c},{for:function(t){var e=String(t);if(s(K,e))return K[e];var r=U(e);return K[e]=r,X[r]=e,r},keyFor:function(t){if(!ot(t))throw TypeError(t+" is not a symbol");if(s(X,t))return X[t]},useSetter:function(){et=!0},useSimple:function(){et=!1}}),n({target:"Object",stat:!0,forced:!c,sham:!a},{create:function(t,e){return void 0===e?y(t):at(y(t),e)},defineProperty:it,defineProperties:at,getOwnPropertyDescriptor:ut}),n({target:"Object",stat:!0,forced:!c},{getOwnPropertyNames:st,getOwnPropertySymbols:ft}),n({target:"Object",stat:!0,forced:u((function(){S.f(1)}))},{getOwnPropertySymbols:function(t){return S.f(h(t))}}),W&&n({target:"JSON",stat:!0,forced:!c||u((function(){var t=U();return"[null]"!=G([t])||"{}"!=G({a:t})||"{}"!=G(Object(t))}))},{stringify:function(t){for(var e,r,n=[t],o=1;arguments.length>o;)n.push(arguments[o++]);if(r=e=n[1],(l(e)||void 0!==t)&&!ot(t))return f(e)||(e=function(t,e){if("function"==typeof r&&(e=r.call(this,t,e)),!ot(e))return e}),n[1]=e,G.apply(W,n)}}),U.prototype[N]||O(U.prototype,N,U.prototype.valueOf),_(U,"Symbol"),j[L]=!0},function(t,e){var r;r=function(){return this}();try{r=r||new Function("return this")()}catch(t){"object"==typeof window&&(r=window)}t.exports=r},function(t,e,r){var n=r(1),o=r(26),i=n["__core-js_shared__"]||o("__core-js_shared__",{});t.exports=i},function(t,e,r){var n=r(1),o=r(40),i=n.WeakMap;t.exports="function"==typeof i&&/native code/.test(o.call(i))},function(t,e,r){var n=r(28),o=r(22),i=r(44),a=r(7);t.exports=n("Reflect","ownKeys")||function(t){var e=o.f(a(t)),r=i.f;return r?e.concat(r(t)):e}},function(t,e,r){var n=r(10),o=r(23),i=r(69),a=function(t){return function(e,r,a){var c,u=n(e),s=o(u.length),f=i(a,s);if(t&&r!=r){for(;s>f;)if((c=u[f++])!=c)return!0}else for(;s>f;f++)if((t||f in u)&&u[f]===r)return t||f||0;return!t&&-1}};t.exports={includes:a(!0),indexOf:a(!1)}},function(t,e,r){var n=r(24),o=Math.max,i=Math.min;t.exports=function(t,e){var r=n(t);return r<0?o(r+e,0):i(r,e)}},function(t,e,r){var n=r(8),o=r(6),i=r(7),a=r(47);t.exports=n?Object.defineProperties:function(t,e){i(t);for(var r,n=a(e),c=n.length,u=0;c>u;)o.f(t,r=n[u++],e[r]);return t}},function(t,e,r){var n=r(28);t.exports=n("document","documentElement")},function(t,e,r){var n=r(10),o=r(22).f,i={}.toString,a="object"==typeof window&&window&&Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[];t.exports.f=function(t){return a&&"[object Window]"==i.call(t)?function(t){try{return o(t)}catch(t){return a.slice()}}(t):o(n(t))}},function(t,e,r){var n=r(74);t.exports=function(t,e,r){if(n(t),void 0===e)return t;switch(r){case 0:return function(){return t.call(e)};case 1:return function(r){return t.call(e,r)};case 2:return function(r,n){return t.call(e,r,n)};case 3:return function(r,n,o){return t.call(e,r,n,o)}}return function(){return t.apply(e,arguments)}}},function(t,e){t.exports=function(t){if("function"!=typeof t)throw TypeError(String(t)+" is not a function");return t}},function(t,e,r){"use strict";var n=r(11),o=r(8),i=r(1),a=r(4),c=r(3),u=r(6).f,s=r(41),f=i.Symbol;if(o&&"function"==typeof f&&(!("description"in f.prototype)||void 0!==f().description)){var l={},p=function(){var t=arguments.length<1||void 0===arguments[0]?void 0:String(arguments[0]),e=this instanceof p?new f(t):void 0===t?f():f(t);return""===t&&(l[e]=!0),e};s(p,f);var h=p.prototype=f.prototype;h.constructor=p;var v=h.toString,d="Symbol(test)"==String(f("test")),g=/^Symbol\((.*)\)[^)]+$/;u(h,"description",{configurable:!0,get:function(){var t=c(this)?this.valueOf():this,e=v.call(t);if(a(l,t))return"";var r=d?e.slice(7,-1):e.replace(g,"$1");return""===r?void 0:r}}),n({global:!0,forced:!0},{Symbol:p})}},function(t,e,r){r(49)("iterator")},function(t,e,r){"use strict";var n=r(11),o=r(2),i=r(30),a=r(3),c=r(16),u=r(23),s=r(78),f=r(50),l=r(79),p=r(0)("isConcatSpreadable"),h=!o((function(){var t=[];return t[p]=!1,t.concat()[0]!==t})),v=l("concat"),d=function(t){if(!a(t))return!1;var e=t[p];return void 0!==e?!!e:i(t)};n({target:"Array",proto:!0,forced:!h||!v},{concat:function(t){var e,r,n,o,i,a=c(this),l=f(a,0),p=0;for(e=-1,n=arguments.length;e<n;e++)if(i=-1===e?a:arguments[e],d(i)){if(p+(o=u(i.length))>9007199254740991)throw TypeError("Maximum allowed index exceeded");for(r=0;r<o;r++,p++)r in i&&s(l,p,i[r])}else{if(p>=9007199254740991)throw TypeError("Maximum allowed index exceeded");s(l,p++,i)}return l.length=p,l}})},function(t,e,r){"use strict";var n=r(17),o=r(6),i=r(12);t.exports=function(t,e,r){var a=n(e);a in t?o.f(t,a,i(0,r)):t[a]=r}},function(t,e,r){var n=r(2),o=r(0)("species");t.exports=function(t){return!n((function(){var e=[];return(e.constructor={})[o]=function(){return{foo:1}},1!==e[t](Boolean).foo}))}},function(t,e,r){"use strict";var n=r(11),o=r(33).find,i=r(51),a=!0;"find"in[]&&Array(1).find((function(){a=!1})),n({target:"Array",proto:!0,forced:a},{find:function(t){return o(this,t,arguments.length>1?arguments[1]:void 0)}}),i("find")},function(t,e,r){"use strict";var n=r(54).IteratorPrototype,o=r(31),i=r(12),a=r(32),c=r(34),u=function(){return this};t.exports=function(t,e,r){var s=e+" Iterator";return t.prototype=o(n,{next:i(1,r)}),a(t,s,!1,!0),c[s]=u,t}},function(t,e,r){var n=r(2);t.exports=!n((function(){function t(){}return t.prototype.constructor=null,Object.getPrototypeOf(new t)!==t.prototype}))},function(t,e,r){var n=r(3);t.exports=function(t){if(!n(t)&&null!==t)throw TypeError("Can't set "+String(t)+" as a prototype");return t}},function(t,e,r){var n=r(9),o=r(85),i=Object.prototype;o!==i.toString&&n(i,"toString",o,{unsafe:!0})},function(t,e,r){"use strict";var n=r(86),o={};o[r(0)("toStringTag")]="z",t.exports="[object z]"!==String(o)?function(){return"[object "+n(this)+"]"}:o.toString},function(t,e,r){var n=r(13),o=r(0)("toStringTag"),i="Arguments"==n(function(){return arguments}());t.exports=function(t){var e,r,a;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(r=function(t,e){try{return t[e]}catch(t){}}(e=Object(t),o))?r:i?n(e):"Object"==(a=n(e))&&"function"==typeof e.callee?"Arguments":a}},function(t,e,r){var n=r(8),o=r(1),i=r(45),a=r(88),c=r(6).f,u=r(22).f,s=r(89),f=r(35),l=r(9),p=r(2),h=r(90),v=r(0)("match"),d=o.RegExp,g=d.prototype,y=/a/g,b=/a/g,m=new d(y)!==y;if(n&&i("RegExp",!m||p((function(){return b[v]=!1,d(y)!=y||d(b)==b||"/a/i"!=d(y,"i")})))){for(var x=function(t,e){var r=this instanceof x,n=s(t),o=void 0===e;return!r&&n&&t.constructor===x&&o?t:a(m?new d(n&&!o?t.source:t,e):d((n=t instanceof x)?t.source:t,n&&o?f.call(t):e),r?this:g,x)},S=function(t){t in x||c(x,t,{configurable:!0,get:function(){return d[t]},set:function(e){d[t]=e}})},R=u(d),w=0;R.length>w;)S(R[w++]);g.constructor=x,x.prototype=g,l(o,"RegExp",x)}h("RegExp")},function(t,e,r){var n=r(3),o=r(56);t.exports=function(t,e,r){var i,a;return o&&"function"==typeof(i=e.constructor)&&i!==r&&n(a=i.prototype)&&a!==r.prototype&&o(t,a),t}},function(t,e,r){var n=r(3),o=r(13),i=r(0)("match");t.exports=function(t){var e;return n(t)&&(void 0!==(e=t[i])?!!e:"RegExp"==o(t))}},function(t,e,r){"use strict";var n=r(28),o=r(6),i=r(0),a=r(8),c=i("species");t.exports=function(t){var e=n(t),r=o.f;a&&e&&!e[c]&&r(e,c,{configurable:!0,get:function(){return this}})}},function(t,e,r){"use strict";var n=r(9),o=r(7),i=r(2),a=r(35),c=RegExp.prototype,u=c.toString,s=i((function(){return"/a/b"!=u.call({source:"a",flags:"b"})})),f="toString"!=u.name;(s||f)&&n(RegExp.prototype,"toString",(function(){var t=o(this),e=String(t.source),r=t.flags;return"/"+e+"/"+String(void 0===r&&t instanceof RegExp&&!("flags"in c)?a.call(t):r)}),{unsafe:!0})},function(t,e,r){"use strict";var n=r(57).charAt,o=r(19),i=r(53),a=o.set,c=o.getterFor("String Iterator");i(String,"String",(function(t){a(this,{type:"String Iterator",string:String(t),index:0})}),(function(){var t,e=c(this),r=e.string,o=e.index;return o>=r.length?{value:void 0,done:!0}:(t=n(r,o),e.index+=t.length,{value:t,done:!1})}))},function(t,e,r){"use strict";var n=r(58),o=r(7),i=r(16),a=r(23),c=r(24),u=r(14),s=r(94),f=r(60),l=Math.max,p=Math.min,h=Math.floor,v=/\$([$&'`]|\d\d?|<[^>]*>)/g,d=/\$([$&'`]|\d\d?)/g;n("replace",2,(function(t,e,r){return[function(r,n){var o=u(this),i=null==r?void 0:r[t];return void 0!==i?i.call(r,o,n):e.call(String(o),r,n)},function(t,i){var u=r(e,t,this,i);if(u.done)return u.value;var h=o(t),v=String(this),d="function"==typeof i;d||(i=String(i));var g=h.global;if(g){var y=h.unicode;h.lastIndex=0}for(var b=[];;){var m=f(h,v);if(null===m)break;if(b.push(m),!g)break;""===String(m[0])&&(h.lastIndex=s(v,a(h.lastIndex),y))}for(var x,S="",R=0,w=0;w<b.length;w++){m=b[w];for(var k=String(m[0]),O=l(p(c(m.index),v.length),0),B=[],P=1;P<m.length;P++)B.push(void 0===(x=m[P])?x:String(x));var T=m.groups;if(d){var j=[k].concat(B,O,v);void 0!==T&&j.push(T);var E=String(i.apply(void 0,j))}else E=n(k,v,O,B,T,i);O>=R&&(S+=v.slice(R,O)+E,R=O+k.length)}return S+v.slice(R)}];function n(t,r,n,o,a,c){var u=n+t.length,s=o.length,f=d;return void 0!==a&&(a=i(a),f=v),e.call(c,f,(function(e,i){var c;switch(i.charAt(0)){case"$":return"$";case"&":return t;case"`":return r.slice(0,n);case"'":return r.slice(u);case"<":c=a[i.slice(1,-1)];break;default:var f=+i;if(0===f)return e;if(f>s){var l=h(f/10);return 0===l?e:l<=s?void 0===o[l-1]?i.charAt(1):o[l-1]+i.charAt(1):e}c=o[f-1]}return void 0===c?"":c}))}}))},function(t,e,r){"use strict";var n=r(57).charAt;t.exports=function(t,e,r){return e+(r?n(t,e).length:1)}},function(t,e,r){"use strict";var n=r(58),o=r(7),i=r(14),a=r(96),c=r(60);n("search",1,(function(t,e,r){return[function(e){var r=i(this),n=null==e?void 0:e[t];return void 0!==n?n.call(e,r):new RegExp(e)[t](String(r))},function(t){var n=r(e,t,this);if(n.done)return n.value;var i=o(t),u=String(this),s=i.lastIndex;a(s,0)||(i.lastIndex=0);var f=c(i,u);return a(i.lastIndex,s)||(i.lastIndex=s),null===f?-1:f.index}]}))},function(t,e){t.exports=Object.is||function(t,e){return t===e?0!==t||1/t==1/e:t!=t&&e!=e}},function(t,e,r){var n=r(1),o=r(61),i=r(98),a=r(5);for(var c in o){var u=n[c],s=u&&u.prototype;if(s&&s.forEach!==i)try{a(s,"forEach",i)}catch(t){s.forEach=i}}},function(t,e,r){"use strict";var n=r(33).forEach,o=r(99);t.exports=o("forEach")?function(t){return n(this,t,arguments.length>1?arguments[1]:void 0)}:[].forEach},function(t,e,r){"use strict";var n=r(2);t.exports=function(t,e){var r=[][t];return!r||!n((function(){r.call(null,e||function(){throw 1},1)}))}},function(t,e,r){var n=r(1),o=r(61),i=r(52),a=r(5),c=r(0),u=c("iterator"),s=c("toStringTag"),f=i.values;for(var l in o){var p=n[l],h=p&&p.prototype;if(h){if(h[u]!==f)try{a(h,u,f)}catch(t){h[u]=f}if(h[s]||a(h,s,l),o[l])for(var v in i)if(h[v]!==i[v])try{a(h,v,i[v])}catch(t){h[v]=i[v]}}}}]);
//# sourceMappingURL=plugin.search.js.map
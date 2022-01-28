/*! For license information please see ia-bookreader-bundle.js.LICENSE.txt */
(self.webpackChunk_internetarchive_bookreader=self.webpackChunk_internetarchive_bookreader||[]).push([[64],{2937:function(e,t,n){"use strict";n(2419),n(2526),n(1817),n(1539),n(2165),n(6992),n(8783),n(3948),n(1038),n(7042),n(8309),n(3371),n(489);var o=n(3282);function r(e,t,n,o){var r,i=arguments.length,s=i<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,n):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,n,o);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(s=(i<3?r(s):i>3?r(t,n,s):r(t,n))||s);return i>3&&s&&Object.defineProperty(t,n,s),s}var i,s,a=n(9890);class l{parseValue(e){return("string"!=typeof e||"false"!==e&&"0"!==e)&&Boolean(e)}}l.shared=new l;class c{parseValue(e){if("number"==typeof e)return e;if("boolean"==typeof e)return;const t=parseFloat(e);return Number.isNaN(t)?void 0:t}}c.shared=new c;class d{parseValue(e){return c.shared.parseValue(e)}}d.shared=new d;class u{parseValue(e){return this.parseJSDate(e)||this.parseBracketDate(e)}parseBracketDate(e){if("string"!=typeof e)return;const t=e.match(/\[([0-9]{4})\]/);return!t||t.length<2?void 0:this.parseJSDate(t[1])}parseJSDate(e){if("string"!=typeof e)return;let t=e;t.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}\s{1}[0-9]{2}:[0-9]{2}:[0-9]{2}$/)&&(t=t.replace(" ","T"));const n=Date.parse(t);if(Number.isNaN(n))return;let o=new Date(t);return(t.indexOf("Z")>-1||t.indexOf("+")>-1||t.match(/^[0-9]{4}$/)||t.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)||t.match(/^.*?-[0-9]{2}:[0-9]{2}$/)||t.match(/^.*?-[0-9]{4}$/))&&(o=new Date(o.getTime()+1e3*o.getTimezoneOffset()*60)),o}}u.shared=new u;class h{parseValue(e){if("number"==typeof e)return e;if("boolean"==typeof e)return;const t=e.split(":");let n;return n=1===t.length?this.parseNumberFormat(t[0]):this.parseColonSeparatedFormat(t),n}parseNumberFormat(e){let t=parseFloat(e);return Number.isNaN(t)&&(t=void 0),t}parseColonSeparatedFormat(e){let t=!1;const n=e.map(((n,o)=>{const r=parseFloat(n);if(Number.isNaN(r))return t=!0,0;const i=60**(e.length-1-o);return r*Math.floor(i)})).reduce(((e,t)=>e+t),0);return t?void 0:n}}h.shared=new h;class p{parseValue(e){if("string"==typeof e)return e}}p.shared=new p;class f{parseValue(e){if("string"==typeof e)return e}}f.shared=new f;class m{parseValue(e){return String(e)}}m.shared=new m;class v{constructor(e,t){this.values=[],this.parser=e,this.rawValue=t,this.processRawValue()}get value(){return this.values.length>0?this.values[0]:void 0}processRawValue(){void 0!==this.rawValue&&(Array.isArray(this.rawValue)?this.rawValue.forEach((e=>{this.parseAndPersistValue(e)})):this.parseAndPersistValue(this.rawValue))}parseAndPersistValue(e){const t=this.parser.parseValue(e);void 0!==t&&this.values.push(t)}}class b extends v{constructor(e){super(l.shared,e)}}class g extends v{constructor(e){super(u.shared,e)}}class y extends v{constructor(e){super(h.shared,e)}}class k extends v{constructor(e){super(c.shared,e)}}class w extends v{constructor(e){super(m.shared,e)}}class C extends v{constructor(e){super(d.shared,e)}}class S extends v{constructor(e){super(p.shared,e)}}class x{constructor(e){this.rawMetadata=e,this.identifier=e.identifier,this.addeddate=e.addeddate?new g(e.addeddate):void 0,this.publicdate=e.publicdate?new g(e.publicdate):void 0,this.indexdate=e.indexdate?new g(e.indexdate):void 0,this.audio_codec=e.audio_codec?new w(e.audio_codec):void 0,this.audio_sample_rate=e.audio_sample_rate?new k(e.audio_sample_rate):void 0,this.collection=e.collection?new w(e.collection):void 0,this.collections_raw=e.collections_raw?new w(e.collections_raw):void 0,this.collection_size=e.collection_size?new C(e.collection_size):void 0,this.contributor=e.contributor?new w(e.contributor):void 0,this.coverage=e.coverage?new w(e.coverage):void 0,this.creator=e.creator?new w(e.creator):void 0,this.date=e.date?new g(e.date):void 0,this.description=e.description?new w(e.description):void 0,this.downloads=e.downloads?new k(e.downloads):void 0,this.duration=e.duration?new y(e.duration):void 0,this.files_count=e.files_count?new k(e.files_count):void 0,this.item_count=e.item_count?new k(e.item_count):void 0,this.item_size=e.item_size?new C(e.item_size):void 0,this.language=e.language?new w(e.language):void 0,this.length=e.length?new y(e.length):void 0,this.lineage=e.lineage?new w(e.lineage):void 0,this.mediatype=e.mediatype?new S(e.mediatype):void 0,this.month=e.month?new k(e.month):void 0,this.noindex=e.noindex?new b(e.noindex):void 0,this.notes=e.notes?new w(e.notes):void 0,this.num_favorites=e.num_favorites?new k(e.num_favorites):void 0,this.num_reviews=e.num_reviews?new k(e.num_reviews):void 0,this.runtime=e.runtime?new y(e.runtime):void 0,this.scanner=e.scanner?new w(e.scanner):void 0,this.source=e.source?new w(e.source):void 0,this.start_localtime=e.start_localtime?new g(e.start_localtime):void 0,this.start_time=e.start_time?new g(e.start_time):void 0,this.stop_time=e.stop_time?new g(e.stop_time):void 0,this.subject=e.subject?new w(e.subject):void 0,this.taper=e.taper?new w(e.taper):void 0,this.title=e.title?new w(e.title):void 0,this.track=e.track?new k(e.track):void 0,this.transferer=e.transferer?new w(e.transferer):void 0,this.type=e.type?new w(e.type):void 0,this.uploader=e.uploader?new w(e.uploader):void 0,this.utc_offset=e.utc_offset?new k(e.utc_offset):void 0,this.venue=e.venue?new w(e.venue):void 0,this.week=e.week?new k(e.week):void 0,this.year=e.year?new g(e.year):void 0}}class O{constructor(e){this.name=e.name,this.source=e.source,this.btih=e.btih,this.md5=e.md5,this.format=e.format,this.mtime=e.mtime,this.crc32=e.crc32,this.sha1=e.sha1,this.original=e.original,this.title=e.title,this.length=e.length?h.shared.parseValue(e.length):void 0,this.size=e.size?d.shared.parseValue(e.size):void 0,this.height=e.height?c.shared.parseValue(e.height):void 0,this.width=e.width?c.shared.parseValue(e.width):void 0,this.track=e.track?c.shared.parseValue(e.track):void 0,this.external_identifier=e["external-identifier"],this.creator=e.creator,this.album=e.album}}class E{constructor(e){this.reviewbody=e.reviewbody,this.reviewtitle=e.reviewtitle,this.reviewer=e.reviewer,this.reviewdate=u.shared.parseValue(e.reviewdate),this.createdate=u.shared.parseValue(e.createdate),this.stars=e.stars?parseFloat(e.stars):void 0}}class B{constructor(e){var t,n;this.rawResponse=e,this.created=e.created,this.d1=e.d1,this.d2=e.d2,this.dir=e.dir,this.files=null===(t=e.files)||void 0===t?void 0:t.map((e=>new O(e))),this.files_count=e.files_count,this.item_last_updated=e.item_last_updated,this.item_size=e.item_size,this.metadata=new x(e.metadata),this.server=e.server,this.uniq=e.uniq,this.workable_servers=e.workable_servers,this.speech_vs_music_asr=e.speech_vs_music_asr,this.reviews=null===(n=e.reviews)||void 0===n?void 0:n.map((e=>new E(e)))}}class _{constructor(e){this.numFound=e.numFound,this.start=e.start,this.docs=e.docs.map((e=>new x(e))),this.aggregations=e.aggregations}}class ${constructor(e){this.rawResponse=e,this.responseHeader=e.responseHeader,this.response=new _(e.response)}}!function(e){e.networkError="SearchService.NetworkError",e.itemNotFound="SearchService.ItemNotFound",e.decodingError="SearchService.DecodingError",e.searchEngineError="SearchService.SearchEngineError"}(i||(i={}));class A extends Error{constructor(e,t,n){super(t),this.name=e,this.type=e,this.details=n}}class j{constructor(e){this.searchBackend=e}async search(e){const t=await this.searchBackend.performSearch(e);return t.error?t:{success:new $(t.success)}}async fetchMetadata(e){var t;const n=await this.searchBackend.fetchMetadata(e);return n.error?n:void 0===(null===(t=n.success)||void 0===t?void 0:t.metadata)?{error:new A(i.itemNotFound)}:{success:new B(n.success)}}}j.default=new j(new class{constructor(e="archive.org"){this.baseUrl=e}async performSearch(e){const t=e.asUrlSearchParams.toString(),n=`https://${this.baseUrl}/advancedsearch.php?${t}`;return this.fetchUrl(n)}async fetchMetadata(e){const t=`https://${this.baseUrl}/metadata/${e}`;return this.fetchUrl(t)}async fetchUrl(e){let t;try{t=await fetch(e)}catch(e){const t=e instanceof Error?e.message:e;return this.getErrorResult(i.networkError,t)}try{const e=await t.json(),n=e.error;if(n){const t=e.forensics;return this.getErrorResult(i.searchEngineError,n,t)}return{success:e}}catch(e){const t=e instanceof Error?e.message:e;return this.getErrorResult(i.decodingError,t)}}getErrorResult(e,t,n){return{error:new A(e,t,n)}}}),function(e){e.Asc="asc",e.Desc="desc"}(s||(s={}));const M=o.iv`42px`,I=o.iv`var(--menuWidth, 320px)`,z=o.iv`var(--animationTiming, 200ms)`;var L=o.iv`

  .main {
    overflow: hidden;
    width: 100%;
    height: 100%;
  }

  .animate {
    transition: transform ${z} ease-out;
  }

  .menu {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: ${I};
    padding: .5rem .5rem 0 0;
    box-sizing: border-box;
    font-size: 1.4rem;
    color: var(--primaryTextColor);
    background: var(--menuSliderBg);
    transform: translateX(calc(${I} * -1));
  }

  .menu > button.close {
    right: 0.7rem;
  }

  button {
    outline: none;
    cursor: pointer;
  }

  header {
    margin: 0 0 .5rem 0;
  }

  header * {
    margin: 0;
    display: inline-block;
  }
  header button {
    outline: none;
    cursor: pointer;
  }

  header.with-secondary-action .details {
    width: 80%;
  }

  header .details {
    font-weight: bold;
    width: 88%;
  }

  header .custom-action > *,
  button.close {
    padding: 0;
    background-color: transparent;
    border: 0;
    --iconWidth: var(--menuSliderHeaderIconWidth);
    --iconHeight: var(--menuSliderHeaderIconHeight);
  }

  header .custom-action,
  button.close {
    position: absolute;
  }
  button.close {
    right: .5rem;
  }

  button.close * {
    float: right;
  }

  .content {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: ${M};
    z-index: 1;
    transform: translateX(calc(${I} * -1));
    transition: transform ${z} ease-out;
    background: var(--activeButtonBg);
    border-right: .2rem solid;
    border-color: var(--subpanelRightBorderColor);
    padding: .5rem 0 0 .5rem;
  }

  .open {
    transform: translateX(0);
  }

  .menu-list {
    padding: 0;
    margin: 0;
    list-style: none;
    background: var(--menuSliderBg);
  }
  .menu-list li {
    margin-bottom: .2rem;
  }

  .content section {
    height: 100%;
    position: relative;
    width: 100%;
  }

  .content .selected-menu {
    overflow: auto;
    height: inherit;
    position: relative;
  }

  .content .selected-menu > * {
    display: block;
    padding-bottom: 3rem;
    position: relative;
  }
`;const P=window.ShadowRoot&&(void 0===window.ShadyCSS||window.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,T=Symbol(),D=new Map;class R{constructor(e,t){if(this._$cssResult$=!0,t!==T)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e}get styleSheet(){let e=D.get(this.cssText);return P&&void 0===e&&(D.set(this.cssText,e=new CSSStyleSheet),e.replaceSync(this.cssText)),e}toString(){return this.cssText}}const H=e=>new R("string"==typeof e?e:e+"",T),N=(e,...t)=>{const n=1===e.length?e[0]:t.reduce(((t,n,o)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(n)+e[o+1]),e[0]);return new R(n,T)},F=P?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const n of e.cssRules)t+=n.cssText;return H(t)})(e):e;var U;const V=window.trustedTypes,W=V?V.emptyScript:"",q=window.reactiveElementPolyfillSupport,Z={toAttribute(e,t){switch(t){case Boolean:e=e?W:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=null!==e;break;case Number:n=null===e?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch(e){n=null}}return n}},G=(e,t)=>t!==e&&(t==t||e==e),X={attribute:!0,type:String,converter:Z,reflect:!1,hasChanged:G};class Y extends HTMLElement{constructor(){super(),this._$Et=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Ei=null,this.o()}static addInitializer(e){var t;null!==(t=this.l)&&void 0!==t||(this.l=[]),this.l.push(e)}static get observedAttributes(){this.finalize();const e=[];return this.elementProperties.forEach(((t,n)=>{const o=this._$Eh(n,t);void 0!==o&&(this._$Eu.set(o,n),e.push(o))})),e}static createProperty(e,t=X){if(t.state&&(t.attribute=!1),this.finalize(),this.elementProperties.set(e,t),!t.noAccessor&&!this.prototype.hasOwnProperty(e)){const n="symbol"==typeof e?Symbol():"__"+e,o=this.getPropertyDescriptor(e,n,t);void 0!==o&&Object.defineProperty(this.prototype,e,o)}}static getPropertyDescriptor(e,t,n){return{get(){return this[t]},set(o){const r=this[e];this[t]=o,this.requestUpdate(e,r,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)||X}static finalize(){if(this.hasOwnProperty("finalized"))return!1;this.finalized=!0;const e=Object.getPrototypeOf(this);if(e.finalize(),this.elementProperties=new Map(e.elementProperties),this._$Eu=new Map,this.hasOwnProperty("properties")){const e=this.properties,t=[...Object.getOwnPropertyNames(e),...Object.getOwnPropertySymbols(e)];for(const n of t)this.createProperty(n,e[n])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const n=new Set(e.flat(1/0).reverse());for(const e of n)t.unshift(F(e))}else void 0!==e&&t.push(F(e));return t}static _$Eh(e,t){const n=t.attribute;return!1===n?void 0:"string"==typeof n?n:"string"==typeof e?e.toLowerCase():void 0}o(){var e;this._$Ep=new Promise((e=>this.enableUpdating=e)),this._$AL=new Map,this._$Em(),this.requestUpdate(),null===(e=this.constructor.l)||void 0===e||e.forEach((e=>e(this)))}addController(e){var t,n;(null!==(t=this._$Eg)&&void 0!==t?t:this._$Eg=[]).push(e),void 0!==this.renderRoot&&this.isConnected&&(null===(n=e.hostConnected)||void 0===n||n.call(e))}removeController(e){var t;null===(t=this._$Eg)||void 0===t||t.splice(this._$Eg.indexOf(e)>>>0,1)}_$Em(){this.constructor.elementProperties.forEach(((e,t)=>{this.hasOwnProperty(t)&&(this._$Et.set(t,this[t]),delete this[t])}))}createRenderRoot(){var e;const t=null!==(e=this.shadowRoot)&&void 0!==e?e:this.attachShadow(this.constructor.shadowRootOptions);return((e,t)=>{P?e.adoptedStyleSheets=t.map((e=>e instanceof CSSStyleSheet?e:e.styleSheet)):t.forEach((t=>{const n=document.createElement("style"),o=window.litNonce;void 0!==o&&n.setAttribute("nonce",o),n.textContent=t.cssText,e.appendChild(n)}))})(t,this.constructor.elementStyles),t}connectedCallback(){var e;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(e=this._$Eg)||void 0===e||e.forEach((e=>{var t;return null===(t=e.hostConnected)||void 0===t?void 0:t.call(e)}))}enableUpdating(e){}disconnectedCallback(){var e;null===(e=this._$Eg)||void 0===e||e.forEach((e=>{var t;return null===(t=e.hostDisconnected)||void 0===t?void 0:t.call(e)}))}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ES(e,t,n=X){var o,r;const i=this.constructor._$Eh(e,n);if(void 0!==i&&!0===n.reflect){const s=(null!==(r=null===(o=n.converter)||void 0===o?void 0:o.toAttribute)&&void 0!==r?r:Z.toAttribute)(t,n.type);this._$Ei=e,null==s?this.removeAttribute(i):this.setAttribute(i,s),this._$Ei=null}}_$AK(e,t){var n,o,r;const i=this.constructor,s=i._$Eu.get(e);if(void 0!==s&&this._$Ei!==s){const e=i.getPropertyOptions(s),a=e.converter,l=null!==(r=null!==(o=null===(n=a)||void 0===n?void 0:n.fromAttribute)&&void 0!==o?o:"function"==typeof a?a:null)&&void 0!==r?r:Z.fromAttribute;this._$Ei=s,this[s]=l(t,e.type),this._$Ei=null}}requestUpdate(e,t,n){let o=!0;void 0!==e&&(((n=n||this.constructor.getPropertyOptions(e)).hasChanged||G)(this[e],t)?(this._$AL.has(e)||this._$AL.set(e,t),!0===n.reflect&&this._$Ei!==e&&(void 0===this._$E_&&(this._$E_=new Map),this._$E_.set(e,n))):o=!1),!this.isUpdatePending&&o&&(this._$Ep=this._$EC())}async _$EC(){this.isUpdatePending=!0;try{await this._$Ep}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var e;if(!this.isUpdatePending)return;this.hasUpdated,this._$Et&&(this._$Et.forEach(((e,t)=>this[t]=e)),this._$Et=void 0);let t=!1;const n=this._$AL;try{t=this.shouldUpdate(n),t?(this.willUpdate(n),null===(e=this._$Eg)||void 0===e||e.forEach((e=>{var t;return null===(t=e.hostUpdate)||void 0===t?void 0:t.call(e)})),this.update(n)):this._$EU()}catch(e){throw t=!1,this._$EU(),e}t&&this._$AE(n)}willUpdate(e){}_$AE(e){var t;null===(t=this._$Eg)||void 0===t||t.forEach((e=>{var t;return null===(t=e.hostUpdated)||void 0===t?void 0:t.call(e)})),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EU(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$Ep}shouldUpdate(e){return!0}update(e){void 0!==this._$E_&&(this._$E_.forEach(((e,t)=>this._$ES(t,this[t],e))),this._$E_=void 0),this._$EU()}updated(e){}firstUpdated(e){}}var J;Y.finalized=!0,Y.elementProperties=new Map,Y.elementStyles=[],Y.shadowRootOptions={mode:"open"},null==q||q({ReactiveElement:Y}),(null!==(U=globalThis.reactiveElementVersions)&&void 0!==U?U:globalThis.reactiveElementVersions=[]).push("1.0.2");const Q=globalThis.trustedTypes,K=Q?Q.createPolicy("lit-html",{createHTML:e=>e}):void 0,ee=`lit$${(Math.random()+"").slice(9)}$`,te="?"+ee,ne=`<${te}>`,oe=document,re=(e="")=>oe.createComment(e),ie=e=>null===e||"object"!=typeof e&&"function"!=typeof e,se=Array.isArray,ae=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,le=/-->/g,ce=/>/g,de=/>|[ 	\n\r](?:([^\s"'>=/]+)([ 	\n\r]*=[ 	\n\r]*(?:[^ 	\n\r"'`<>=]|("|')|))|$)/g,ue=/'/g,he=/"/g,pe=/^(?:script|style|textarea)$/i,fe=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),me=fe(1),ve=(fe(2),Symbol.for("lit-noChange")),be=Symbol.for("lit-nothing"),ge=new WeakMap,ye=oe.createTreeWalker(oe,129,null,!1),ke=(e,t)=>{const n=e.length-1,o=[];let r,i=2===t?"<svg>":"",s=ae;for(let t=0;t<n;t++){const n=e[t];let a,l,c=-1,d=0;for(;d<n.length&&(s.lastIndex=d,l=s.exec(n),null!==l);)d=s.lastIndex,s===ae?"!--"===l[1]?s=le:void 0!==l[1]?s=ce:void 0!==l[2]?(pe.test(l[2])&&(r=RegExp("</"+l[2],"g")),s=de):void 0!==l[3]&&(s=de):s===de?">"===l[0]?(s=null!=r?r:ae,c=-1):void 0===l[1]?c=-2:(c=s.lastIndex-l[2].length,a=l[1],s=void 0===l[3]?de:'"'===l[3]?he:ue):s===he||s===ue?s=de:s===le||s===ce?s=ae:(s=de,r=void 0);const u=s===de&&e[t+1].startsWith("/>")?" ":"";i+=s===ae?n+ne:c>=0?(o.push(a),n.slice(0,c)+"$lit$"+n.slice(c)+ee+u):n+ee+(-2===c?(o.push(void 0),t):u)}const a=i+(e[n]||"<?>")+(2===t?"</svg>":"");return[void 0!==K?K.createHTML(a):a,o]};class we{constructor({strings:e,_$litType$:t},n){let o;this.parts=[];let r=0,i=0;const s=e.length-1,a=this.parts,[l,c]=ke(e,t);if(this.el=we.createElement(l,n),ye.currentNode=this.el.content,2===t){const e=this.el.content,t=e.firstChild;t.remove(),e.append(...t.childNodes)}for(;null!==(o=ye.nextNode())&&a.length<s;){if(1===o.nodeType){if(o.hasAttributes()){const e=[];for(const t of o.getAttributeNames())if(t.endsWith("$lit$")||t.startsWith(ee)){const n=c[i++];if(e.push(t),void 0!==n){const e=o.getAttribute(n.toLowerCase()+"$lit$").split(ee),t=/([.?@])?(.*)/.exec(n);a.push({type:1,index:r,name:t[2],strings:e,ctor:"."===t[1]?Ee:"?"===t[1]?_e:"@"===t[1]?$e:Oe})}else a.push({type:6,index:r})}for(const t of e)o.removeAttribute(t)}if(pe.test(o.tagName)){const e=o.textContent.split(ee),t=e.length-1;if(t>0){o.textContent=Q?Q.emptyScript:"";for(let n=0;n<t;n++)o.append(e[n],re()),ye.nextNode(),a.push({type:2,index:++r});o.append(e[t],re())}}}else if(8===o.nodeType)if(o.data===te)a.push({type:2,index:r});else{let e=-1;for(;-1!==(e=o.data.indexOf(ee,e+1));)a.push({type:7,index:r}),e+=ee.length-1}r++}}static createElement(e,t){const n=oe.createElement("template");return n.innerHTML=e,n}}function Ce(e,t,n=e,o){var r,i,s,a;if(t===ve)return t;let l=void 0!==o?null===(r=n._$Cl)||void 0===r?void 0:r[o]:n._$Cu;const c=ie(t)?void 0:t._$litDirective$;return(null==l?void 0:l.constructor)!==c&&(null===(i=null==l?void 0:l._$AO)||void 0===i||i.call(l,!1),void 0===c?l=void 0:(l=new c(e),l._$AT(e,n,o)),void 0!==o?(null!==(s=(a=n)._$Cl)&&void 0!==s?s:a._$Cl=[])[o]=l:n._$Cu=l),void 0!==l&&(t=Ce(e,l._$AS(e,t.values),l,o)),t}class Se{constructor(e,t){this.v=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}p(e){var t;const{el:{content:n},parts:o}=this._$AD,r=(null!==(t=null==e?void 0:e.creationScope)&&void 0!==t?t:oe).importNode(n,!0);ye.currentNode=r;let i=ye.nextNode(),s=0,a=0,l=o[0];for(;void 0!==l;){if(s===l.index){let t;2===l.type?t=new xe(i,i.nextSibling,this,e):1===l.type?t=new l.ctor(i,l.name,l.strings,this,e):6===l.type&&(t=new Ae(i,this,e)),this.v.push(t),l=o[++a]}s!==(null==l?void 0:l.index)&&(i=ye.nextNode(),s++)}return r}m(e){let t=0;for(const n of this.v)void 0!==n&&(void 0!==n.strings?(n._$AI(e,n,t),t+=n.strings.length-2):n._$AI(e[t])),t++}}class xe{constructor(e,t,n,o){var r;this.type=2,this._$AH=be,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=o,this._$Cg=null===(r=null==o?void 0:o.isConnected)||void 0===r||r}get _$AU(){var e,t;return null!==(t=null===(e=this._$AM)||void 0===e?void 0:e._$AU)&&void 0!==t?t:this._$Cg}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Ce(this,e,t),ie(e)?e===be||null==e||""===e?(this._$AH!==be&&this._$AR(),this._$AH=be):e!==this._$AH&&e!==ve&&this.$(e):void 0!==e._$litType$?this.T(e):void 0!==e.nodeType?this.S(e):(e=>{var t;return se(e)||"function"==typeof(null===(t=e)||void 0===t?void 0:t[Symbol.iterator])})(e)?this.M(e):this.$(e)}A(e,t=this._$AB){return this._$AA.parentNode.insertBefore(e,t)}S(e){this._$AH!==e&&(this._$AR(),this._$AH=this.A(e))}$(e){this._$AH!==be&&ie(this._$AH)?this._$AA.nextSibling.data=e:this.S(oe.createTextNode(e)),this._$AH=e}T(e){var t;const{values:n,_$litType$:o}=e,r="number"==typeof o?this._$AC(e):(void 0===o.el&&(o.el=we.createElement(o.h,this.options)),o);if((null===(t=this._$AH)||void 0===t?void 0:t._$AD)===r)this._$AH.m(n);else{const e=new Se(r,this),t=e.p(this.options);e.m(n),this.S(t),this._$AH=e}}_$AC(e){let t=ge.get(e.strings);return void 0===t&&ge.set(e.strings,t=new we(e)),t}M(e){se(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let n,o=0;for(const r of e)o===t.length?t.push(n=new xe(this.A(re()),this.A(re()),this,this.options)):n=t[o],n._$AI(r),o++;o<t.length&&(this._$AR(n&&n._$AB.nextSibling,o),t.length=o)}_$AR(e=this._$AA.nextSibling,t){var n;for(null===(n=this._$AP)||void 0===n||n.call(this,!1,!0,t);e&&e!==this._$AB;){const t=e.nextSibling;e.remove(),e=t}}setConnected(e){var t;void 0===this._$AM&&(this._$Cg=e,null===(t=this._$AP)||void 0===t||t.call(this,e))}}class Oe{constructor(e,t,n,o,r){this.type=1,this._$AH=be,this._$AN=void 0,this.element=e,this.name=t,this._$AM=o,this.options=r,n.length>2||""!==n[0]||""!==n[1]?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=be}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(e,t=this,n,o){const r=this.strings;let i=!1;if(void 0===r)e=Ce(this,e,t,0),i=!ie(e)||e!==this._$AH&&e!==ve,i&&(this._$AH=e);else{const o=e;let s,a;for(e=r[0],s=0;s<r.length-1;s++)a=Ce(this,o[n+s],t,s),a===ve&&(a=this._$AH[s]),i||(i=!ie(a)||a!==this._$AH[s]),a===be?e=be:e!==be&&(e+=(null!=a?a:"")+r[s+1]),this._$AH[s]=a}i&&!o&&this.k(e)}k(e){e===be?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=e?e:"")}}class Ee extends Oe{constructor(){super(...arguments),this.type=3}k(e){this.element[this.name]=e===be?void 0:e}}const Be=Q?Q.emptyScript:"";class _e extends Oe{constructor(){super(...arguments),this.type=4}k(e){e&&e!==be?this.element.setAttribute(this.name,Be):this.element.removeAttribute(this.name)}}class $e extends Oe{constructor(e,t,n,o,r){super(e,t,n,o,r),this.type=5}_$AI(e,t=this){var n;if((e=null!==(n=Ce(this,e,t,0))&&void 0!==n?n:be)===ve)return;const o=this._$AH,r=e===be&&o!==be||e.capture!==o.capture||e.once!==o.once||e.passive!==o.passive,i=e!==be&&(o===be||r);r&&this.element.removeEventListener(this.name,this,o),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var t,n;"function"==typeof this._$AH?this._$AH.call(null!==(n=null===(t=this.options)||void 0===t?void 0:t.host)&&void 0!==n?n:this.element,e):this._$AH.handleEvent(e)}}class Ae{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){Ce(this,e)}}const je=window.litHtmlPolyfillSupport;var Me,Ie;null==je||je(we,xe),(null!==(J=globalThis.litHtmlVersions)&&void 0!==J?J:globalThis.litHtmlVersions=[]).push("2.0.2");class ze extends Y{constructor(){super(...arguments),this.renderOptions={host:this},this._$Dt=void 0}createRenderRoot(){var e,t;const n=super.createRenderRoot();return null!==(e=(t=this.renderOptions).renderBefore)&&void 0!==e||(t.renderBefore=n.firstChild),n}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Dt=((e,t,n)=>{var o,r;const i=null!==(o=null==n?void 0:n.renderBefore)&&void 0!==o?o:t;let s=i._$litPart$;if(void 0===s){const e=null!==(r=null==n?void 0:n.renderBefore)&&void 0!==r?r:null;i._$litPart$=s=new xe(t.insertBefore(re(),e),e,void 0,null!=n?n:{})}return s._$AI(e),s})(t,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),null===(e=this._$Dt)||void 0===e||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),null===(e=this._$Dt)||void 0===e||e.setConnected(!1)}render(){return ve}}ze.finalized=!0,ze._$litElement$=!0,null===(Me=globalThis.litElementHydrateSupport)||void 0===Me||Me.call(globalThis,{LitElement:ze});const Le=globalThis.litElementPolyfillSupport;null==Le||Le({LitElement:ze}),(null!==(Ie=globalThis.litElementVersions)&&void 0!==Ie?Ie:globalThis.litElementVersions=[]).push("3.0.2");var Pe=me`
<svg
  viewBox="0 0 18 18"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="collapseSidebarTitleID collapseSidebarDescID"
>
  <title id="collapseSidebarTitleID">Collapse sidebar</title>
  <desc id="collapseSidebarDescID">A circle with a left pointing chevron</desc>
  <path d="m9 0c4.9705627 0 9 4.02943725 9 9 0 4.9705627-4.0294373 9-9 9-4.97056275 0-9-4.0294373-9-9 0-4.97056275 4.02943725-9 9-9zm1.6976167 5.28352881c-.365258-.3556459-.9328083-.37581056-1.32099801-.06558269l-.09308988.0844372-3 3.08108108-.08194436.09533317c-.27484337.36339327-.26799482.87009349.01656959 1.22592581l.084491.09308363 3 2.91891889.09533796.0818904c.3633964.2746544.8699472.2677153 1.2256839-.0167901l.093059-.0844712.0818904-.095338c.2746544-.3633964.2677153-.8699472-.0167901-1.2256839l-.0844712-.093059-2.283355-2.2222741 2.3024712-2.36338332.0819252-.09530804c.2997677-.39632298.2644782-.96313393-.1007797-1.31877983z" fill-rule="evenodd" class="fill-color" />
</svg>
`;customElements.define("ia-icon-collapse-sidebar",class extends ze{static get styles(){return N`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}render(){return Pe}});var Te=o.iv`
  a {
    display: inline-block;
    text-decoration: none;
  }

  .menu-item {
    display: inline-flex;
    width: 100%;
    padding: 0;
    font-size: 1.6rem;
    text-align: left;
    background: transparent;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    border: none;
    cursor: pointer;
  }

  button.menu-item {
    -webkit-appearance: none;
    appearance: none;
    border-radius: 0;
  }

  .menu-item:focus {
    outline: none;
  }

  .label {
    display: var(--menuButtonLabelDisplay, none);
    padding: 0;
    font-weight: 400;
    color: var(--primaryTextColor);
    text-align: left;
    vertical-align: middle;
    margin-left: 1rem;
  }

  .menu-details {
    color: var(--primaryTextColor);
    display: inline-block;
    margin-left: .5rem;
    font-style: italic;
    font-size: 1.5rem;
  }

  .menu-item > .icon {
    position: relative;
    display: inline-flex;
    z-index: 2;
    width: 4.2rem;
    height: 4.2rem;
    vertical-align: middle;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
  }

  .menu-item.selected .icon {
    background-color: var(--activeButtonBg);
    border-radius: 1rem 0 0 1rem;
  }

  .icon .fill-color {
    fill: #999;
  }

  .icon.active .fill-color {
    fill: #fff;
  }
`;class De extends o.oi{static get styles(){return Te}static get properties(){return{icon:{type:String},href:{type:String},label:{type:String},menuDetails:{type:String},id:{type:String},selected:{type:Boolean},followable:{type:Boolean}}}constructor(){super(),this.icon="",this.href="",this.label="",this.menuDetails="",this.id="",this.selected=!1,this.followable=!1}onClick(e){e.preventDefault(),this.dispatchMenuTypeSelectedEvent()}dispatchMenuTypeSelectedEvent(){this.dispatchEvent(new CustomEvent("menuTypeSelected",{bubbles:!0,composed:!0,detail:{id:this.id}}))}get buttonClass(){return this.selected?"selected":""}get iconClass(){return this.selected?"active":""}get menuItem(){return o.dy`
      <span class="icon ${this.iconClass}">
        ${this.icon}
      </span>
      <span class="label">${this.label}</span>
      <span class="menu-details">${this.menuDetails}</span>
    `}get linkButton(){return o.dy`
      <a
        href="${this.href}"
        class="menu-item ${this.buttonClass}"
        @click=${this.followable?void 0:this.onClick}
      >${this.menuItem}</a>
    `}get clickButton(){return o.dy`
      <button
        class="menu-item ${this.buttonClass}"
        @click=${this.onClick}
      >
        ${this.menuItem}
      </button>
  `}render(){return this.href?this.linkButton:this.clickButton}}customElements.define("menu-button",De);const Re={closeDrawer:"menuSliderClosed"};class He extends o.oi{static get styles(){return L}static get properties(){return{menus:{type:Array},open:{type:Boolean},manuallyHandleClose:{type:Boolean},selectedMenu:{type:String},selectedMenuAction:{type:Object},animateMenuOpen:{type:Boolean}}}constructor(){super(),this.menus=[],this.open=!1,this.selectedMenu="",this.selectedMenuAction=a.Ld,this.animateMenuOpen=!1,this.manuallyHandleClose=!1}updated(){const{actionButton:e}=this.selectedMenuDetails||{};e!==this.selectedMenuAction&&(this.selectedMenuAction=e||a.Ld)}setSelectedMenu({detail:e}){const{id:t}=e;this.selectedMenu=this.selectedMenu===t?"":t;const{actionButton:n}=this.selectedMenuDetails||{};this.selectedMenuAction=n||a.Ld}closeMenu(){this.manuallyHandleClose||(this.open=!1);const{closeDrawer:e}=Re,t=new CustomEvent(e,{detail:this.selectedMenuDetails});this.dispatchEvent(t)}get selectedMenuDetails(){return this.menus.find((e=>e.id===this.selectedMenu))}get selectedMenuComponent(){const e=this.selectedMenuDetails;return e&&e.component?e.component:o.dy``}get sliderDetailsClass(){return`${this.animateMenuOpen?"animate":""} ${this.open?"open":""}`}get selectedMenuClass(){return this.selectedMenu?"open":""}get menuItems(){return this.menus.map((e=>o.dy`
        <li>
          <menu-button
            @menuTypeSelected=${this.setSelectedMenu}
            .icon=${e.icon}
            .label=${e.label}
            .menuDetails=${e.menuDetails}
            .id=${e.id}
            .selected=${e.id===this.selectedMenu}
            .followable=${e.followable}
            .href=${e.href}
          ></menu-button>
        </li>
      `))}get renderMenuHeader(){const{label:e="",menuDetails:t=""}=this.selectedMenuDetails||{},n=this.selectedMenuAction?"with-secondary-action":"",r=this.selectedMenuAction?o.dy`<span class="custom-action">${this.selectedMenuAction}</span>`:a.Ld;return o.dy`
      <header class="${n}">
        <div class="details">
          <h3>${e}</h3>
          <span class="extra-details">${t}</span>
        </div>
        ${r}
        ${this.closeButton}
      </header>
    `}get closeButton(){return o.dy`
      <button class="close" aria-label="Close this menu" @click=${this.closeMenu}>
        <ia-icon-collapse-sidebar></ia-icon-collapse-sidebar>
      </button>
    `}render(){return o.dy`
      <div class="main">
      <div class="menu ${this.sliderDetailsClass}">
        ${this.closeButton}
        <ul class="menu-list">
          ${this.menuItems}
        </ul>
        <div class="content ${this.selectedMenuClass}" @menuTypeSelected=${this.setSelectedMenu}>
          ${this.renderMenuHeader}
          <section>
            <div class="selected-menu">
              ${this.selectedMenuComponent}
            </div>
          </section>
        </div>
      </div>
      </div>
    `}}window.customElements.define("ia-menu-slider",He);var Ne=me`
<svg
  viewBox="0 0 40 40"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="ellipsesTitleID ellipsesDescID"
>
  <title id="ellipsesTitleID">Ellipses icon</title>
  <desc id="ellipsesDescID">An illustration of text ellipses.</desc>
  <path class="fill-color" d="m10.5 17.5c1.3807119 0 2.5 1.1192881 2.5 2.5s-1.1192881 2.5-2.5 2.5c-1.38071187 0-2.5-1.1192881-2.5-2.5s1.11928813-2.5 2.5-2.5zm9.5 0c1.3807119 0 2.5 1.1192881 2.5 2.5s-1.1192881 2.5-2.5 2.5-2.5-1.1192881-2.5-2.5 1.1192881-2.5 2.5-2.5zm9.5 0c1.3807119 0 2.5 1.1192881 2.5 2.5s-1.1192881 2.5-2.5 2.5-2.5-1.1192881-2.5-2.5 1.1192881-2.5 2.5-2.5z" fill-rule="evenodd"/>
</svg>
`;customElements.define("ia-icon-ellipses",class extends ze{static get styles(){return N`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}render(){return Ne}});let Fe=class extends o.oi{static get properties(){return{title:{type:String}}}get bookIconSvg(){return a.YP`
      <g class="bookIcon" transform="matrix(1 0 0 -1 28 67.362264)">
        <path d="m44.71698 31.6981124v-29.99320678s-18.0956599.30735848-18.6322637-.7171698c-.0633962-.12226414-1.890566-.59207545-2.9745282-.59207545-1.3228302 0-3.5122641 0-4.1286791.74547168-.9707547 1.17452827-18.82811278.71660375-18.82811278.71660375v30.040754l1.83849052.7867924.29094339-28.48188608s15.94981097.15339622 17.09094297-1.10716978c.8145283-.90056602 4.997547-.91641507 5.3450942-.3526415.9611321 1.55716977 14.7101883 1.31716978 17.6077354 1.45981128l.3266038 28.22830118z"/>
        <path d="m40.1129424 33.5957539h-12.8337733c-1.8690565 0-3.1098112-.7545283-3.9299999-1.6279245v-26.70452764l1.2362264-.00792453c.4584906.72962262 3.0922641 1.39415091 3.0922641 1.39415091h10.1298111s1.0381131.01754717 1.5141509.47377357c.5643396.54056602.7913207 1.36981129.7913207 1.36981129z"/>
        <path d="m17.3354713 33.5957539h-12.8337733v-25.37660316s0-.75283017.49358489-1.14113205c.52867924-.41433961 1.3415094-.42849055 1.3415094-.42849055h10.59905631s2.2075471-.52698112 3.0928301-1.39415091l1.2.00792453v26.74245214c-.8201886.8581132-2.0530188 1.59-3.8932074 1.59"/>
      </g>
    `}get icon(){return this.bookIconSvg}get loader(){return a.YP`
    <svg
      height="100"
      viewBox="0 0 100 100"
      width="100"
      xmlns="http://www.w3.org/2000/svg"
      aria-labelledby="item-loading"
    >
      <title id="item-loading">Currently loading viewer.</title>
      <desc>Please wait while we load theater.</desc>
      <g fill="#333" fill-rule="evenodd" class="book-icon">
        ${this.icon}
        <path
          class="ring"
          d="m17.8618849 11.6970233c18.5864635-15.59603144 45.6875867-15.59603102 64.2740497.000001 1.9271446 1.6170806 2.1785128 4.4902567.5614466 6.4174186-1.6170661 1.9271618-4.4902166 2.1785323-6.4173612.5614517-15.1996922-12.75416882-37.3625282-12.75416916-52.5622206-.000001-15.19969387 12.7541707-19.04823077 34.5805019-9.1273354 51.7641499 9.9208955 17.183646 30.7471499 24.7638499 49.3923323 17.9774983 18.6451823-6.7863521 29.7266014-25.9801026 26.2811129-45.5206248-.436848-2.4775114 1.2174186-4.8400696 3.6949079-5.2769215 2.4774893-.4368518 4.8400264 1.2174296 5.2768744 3.694941 4.2132065 23.8945096-9.3373563 47.3649806-32.137028 55.6634567-22.799672 8.2984758-48.2663986-.9707372-60.39785211-21.9832155-12.1314534-21.012481-7.42539173-47.7021198 11.16107351-63.2981544z"
          fill-rule="nonzero"
        />
      </g>
    </svg>
    `}render(){const e=this.title?o.dy`<h2>${this.title}</h2>`:a.Ld;return o.dy`
      <div class="place-holder">
        ${e} ${this.loader}
        <h3>Loading viewer</h3>
      </div>
    `}static get styles(){return o.iv`
      .place-holder {
        width: 30%;
        margin: auto;
        text-align: center;
        color: var(--primaryTextColor);
      }

      .place-holder {
        position: relative;
      }

      .place-holder svg {
        display: block;
        width: 60%;
        max-width: 100px;
        height: auto;
        margin: auto;
      }

      svg * {
        fill: var(--primaryTextColor);
      }

      svg .ring {
        animation: rotate 1.3s infinite linear;
        transform-origin: 50px 50px;
        transform-box: fill-box;
        display: block; // transform won't work on inline style
      }

      @keyframes rotate {
        0% {
          -moz-transform: rotate(-360deg);
          -webkit-transform: rotate(-360deg);
          transform: rotate(-360deg);
        }
      }
    `}};Fe=r([(0,o.Mo)("ia-itemnav-loader")],Fe);let Ue=class extends o.oi{constructor(){super(...arguments),this.identifier=""}emitLoaded(){this.dispatchEvent(new CustomEvent("loadingStateUpdated",{detail:{loaded:!0}}))}updated(e){e.has("identifier")&&this.emitLoaded()}get downloadUrl(){return`/download/${this.identifier}`}render(){return o.dy`
      <section>
        <h2>THERE IS NO PREVIEW AVAILABLE FOR THIS ITEM</h2>
        <p>
          This item does not appear to have any files that can be experienced on
          Archive.org. <br />
          Please download files in this item to interact with them on your
          computer.
        </p>
        <a href=${this.downloadUrl}>Show all files</a>
      </section>
    `}static get styles(){return o.iv`
      :host {
        color: var(--primaryTextColor, #fff);
        text-align: center;
      }
      section {
        width: 100%;
        margin: 5%;
        padding: 0 5%;
      }
      p {
        font-size: 1.4rem;
      }
      a {
        color: var(--primaryTextColor, #fff);
        background-color: rgb(25, 72, 128);
        min-height: 35px;
        outline: none;
        cursor: pointer;
        line-height: normal;
        border-radius: 0.4rem;
        text-align: center;
        vertical-align: middle;
        font-size: 1.4rem;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        display: inline-block;
        padding: 0.85rem 1.2rem;
        border: 1px solid rgb(197, 209, 223);
        white-space: nowrap;
        appearance: auto;
        box-sizing: border-box;
        user-select: none;
        text-decoration: none;
      }
    `}};r([(0,o.Cb)({type:String})],Ue.prototype,"identifier",void 0),Ue=r([(0,o.Mo)("ia-no-theater-available")],Ue);let Ve=class extends o.oi{constructor(){super(...arguments),this.viewAvailable=!0,this.baseHost="archive.org",this.signedIn=!1,this.menuContents=[],this.menuShortcuts=[],this.viewportInFullscreen=null,this.menuOpened=!1,this.loaded=null,this.openMenuState="shift"}disconnectedCallback(){this.removeResizeObserver()}updated(e){if(e.has("sharedObserver")){const t=e.get("sharedObserver");null==t||t.removeObserver(this.resizeObserverConfig),this.setResizeObserver()}}handleResize(e){const{width:t}=e.contentRect;this.openMenuState=t<=600?"overlay":"shift"}setResizeObserver(){var e,t;null===(e=this.sharedObserver)||void 0===e||e.addObserver(this.resizeObserverConfig),null===(t=this.sharedObserver)||void 0===t||t.addObserver({target:this.headerSlot,handler:{handleResize:({contentRect:e})=>{e.height&&this.requestUpdate()}}})}removeResizeObserver(){var e;null===(e=this.sharedObserver)||void 0===e||e.removeObserver(this.resizeObserverConfig)}get resizeObserverConfig(){return{handler:this,target:this.frame}}get loaderTitle(){return this.viewportInFullscreen?"Internet Archive":""}get loadingArea(){return o.dy`
      <div class="loading-area">
        <div class="loading-view">
          <ia-itemnav-loader .title=${this.loaderTitle}></ia-itemnav-loader>
        </div>
      </div>
    `}slotChange(e,t){var n;const o=null===(n=e.target.assignedNodes())||void 0===n?void 0:n[0];this.dispatchEvent(new CustomEvent("slotChange",{detail:{slot:o,type:t}})),this.requestUpdate()}render(){var e,t;const n=this.loaded?"":"hidden",r=(null===(t=null===(e=this.headerSlot)||void 0===e?void 0:e.assignedNodes()[0])||void 0===t?void 0:t.offsetHeight)||0;return o.dy`
      <div id="frame" class=${this.menuClass}>
        <slot
          name="header"
          style=${`height: ${r}px`}
          @slotchange=${e=>this.slotChange(e,"header")}
        ></slot>
        <div class="menu-and-reader">
          ${this.shouldRenderMenu?this.renderSideMenu:a.Ld}
          <div id="reader" class=${n}>
            ${this.renderViewport}
          </div>
          ${this.loaded?a.Ld:this.loadingArea}
        </div>
      </div>
    `}get noTheaterView(){var e,t;return o.dy`<ia-no-theater-available
      .identifier=${null===(t=null===(e=this.item)||void 0===e?void 0:e.metadata)||void 0===t?void 0:t.identifier}
      @loadingStateUpdated=${this.loadingStateUpdated}
    ></ia-no-theater-available>`}get renderViewport(){if(!this.viewAvailable)return this.noTheaterView;const e=this.loaded?"opacity: 1;":"opacity: 0;";return o.dy`
      <div slot="main" style=${e}>
        <slot
          name="main"
          @slotchange=${e=>this.slotChange(e,"main")}
        ></slot>
      </div>
    `}loadingStateUpdated(e){const{loaded:t}=e.detail;this.loaded=t||null}manageViewportFullscreen(e){const t=!!e.detail.isFullScreen;this.viewportInFullscreen=t||null;const n=new CustomEvent("fullscreenToggled",{detail:e.detail});this.dispatchEvent(n)}get shouldRenderMenu(){var e;return!!(null===(e=this.menuContents)||void 0===e?void 0:e.length)}toggleMenu(){this.menuOpened=!this.menuOpened}closeMenu(){this.menuOpened=!1}setOpenMenu(e){const{id:t}=e.detail;this.openMenu=t!==this.openMenu?t:void 0}setMenuContents(e){const t=[...e.detail];this.menuContents=t}setMenuShortcuts(e){this.menuShortcuts=[...e.detail]}manageSideMenuEvents(e){const{menuId:t,action:n}=e.detail;t&&("open"===n?this.openShortcut(t):"toggle"===n&&(this.openMenu=t,this.toggleMenu()))}get menuToggleButton(){return o.dy`
      <button
        class="toggle-menu"
        @click=${this.toggleMenu}
        title="Toggle theater side panels"
      >
        <div>
          <ia-icon-ellipses
            style="width: var(--iconWidth); height: var(--iconHeight);"
          ></ia-icon-ellipses>
        </div>
      </button>
    `}get selectedMenuId(){return this.openMenu||""}get renderSideMenu(){const e=this.menuOpened?"":"hidden";return o.dy`
      <nav>
        <div class="minimized">${this.shortcuts} ${this.menuToggleButton}</div>
        <div id="menu" class=${e}>
          <ia-menu-slider
            .menus=${this.menuContents}
            .selectedMenu=${this.selectedMenuId}
            @menuTypeSelected=${this.setOpenMenu}
            @menuSliderClosed=${this.closeMenu}
            manuallyHandleClose
            open
          ></ia-menu-slider>
        </div>
      </nav>
    `}openShortcut(e=""){this.openMenu=e,this.menuOpened=!0}get shortcuts(){const e=this.menuShortcuts.map((({icon:e,id:t})=>"fullscreen"===t?o.dy`${e}`:o.dy`
        <button class="shortcut ${t}" @click="${()=>this.openShortcut(t)}">
          ${e}
        </button>
      `));return o.dy`<div class="shortcuts">${e}</div>`}get menuClass(){var e,t;const n=(null===(e=this.menuContents)||void 0===e?void 0:e.length)||(null===(t=this.menuShortcuts)||void 0===t?void 0:t.length);return`${this.menuOpened&&n?"open":""} ${this.viewportInFullscreen?"fullscreen":""} ${this.openMenuState}`}static get styles(){const e=o.iv`var(--menuWidth, 320px)`,t=o.iv`var(--animationTiming, 200ms)`,n=o.iv`transform ${t} ease-out`,r=o.iv`var(--theaterMenuMargin, 42px)`,i=o.iv`var(--theaterBgColor, #000)`;return o.iv`
      :host,
      #frame,
      .menu-and-reader {
        position: relative;
        overflow: hidden;
        display: block;
      }

      :host,
      #frame,
      .loading-area,
      .loading-view {
        min-height: inherit;
        height: inherit;
      }

      slot {
        display: block;
        width: 100%;
      }

      slot * {
        display: block;
        height: inherit;
      }

      #frame {
        background-color: ${i};
        color-scheme: dark;
        display: flex;
        flex-direction: column;
      }

      #frame.fullscreen {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 9;
      }

      .loading-view {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .loading-area {
        width: 100%;
      }

      ia-itemnav-loader {
        display: block;
        width: 100%;
      }

      .hidden {
        display: none !important;
      }

      button {
        cursor: pointer;
        padding: 0;
        border: 0;
      }

      button:focus,
      button:active {
        outline: none;
      }

      .menu-and-reader {
        position: relative;
        display: flex;
        flex: 1;
      }

      nav button {
        background: none;
      }

      nav .minimized {
        background: rgba(0, 0, 0, 0.7);
        padding-top: 6px;
        position: absolute;
        width: ${r};
        z-index: 2;
        left: 0;
        border-bottom-right-radius: 5%;
      }

      nav .minimized button {
        width: var(--iconWidth);
        height: var(--iconHeight);
        margin-bottom: 0.2rem;
        margin: auto;
        display: inline-flex;
        vertical-align: middle;
        -webkit-box-align: center;
        align-items: center;
        -webkit-box-pack: center;
        justify-content: center;
        width: ${r};
        height: ${r};
      }

      nav .minimized button.toggle-menu > * {
        border: 2px solid var(--iconStrokeColor);
        border-radius: var(--iconWidth);
        width: var(--iconWidth);
        height: var(--iconHeight);
        margin: auto;
      }

      ia-icon-ellipses {
        width: var(--iconWidth);
        height: var(--iconHeight);
      }

      #menu {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        z-index: 3;
        overflow: hidden;
        transform: translateX(-${e});
        width: ${e};
        transform: translateX(calc(${e} * -1));
        transition: ${n};
      }

      #reader {
        position: relative;
        z-index: 1;
        transform: translateX(0);
        width: 100%;
        display: flex;
      }

      #reader > * {
        width: 100%;
        display: flex;
        flex: 1;
      }

      .open.overlay #reader {
        transition: none;
      }

      .open #menu {
        width: ${e};
        transform: translateX(0);
        transition: ${n};
      }

      .open.shift #reader {
        width: calc(100% - ${e});
        margin-left: ${e};
        transition: ${n};
      }
    `}};r([(0,o.Cb)({type:Object,converter:e=>e&&"string"==typeof e?new B(JSON.parse(atob(e))):e})],Ve.prototype,"item",void 0),r([(0,o.Cb)({type:Boolean})],Ve.prototype,"viewAvailable",void 0),r([(0,o.Cb)({type:String})],Ve.prototype,"baseHost",void 0),r([(0,o.Cb)({converter:e=>"boolean"==typeof e?e:"true"===e})],Ve.prototype,"signedIn",void 0),r([(0,o.Cb)({type:Array})],Ve.prototype,"menuContents",void 0),r([(0,o.Cb)({type:Array})],Ve.prototype,"menuShortcuts",void 0),r([(0,o.Cb)({type:Boolean,reflect:!0,attribute:!0})],Ve.prototype,"viewportInFullscreen",void 0),r([(0,o.Cb)({type:Boolean})],Ve.prototype,"menuOpened",void 0),r([(0,o.Cb)({type:String})],Ve.prototype,"openMenu",void 0),r([(0,o.Cb)({attribute:!1})],Ve.prototype,"modal",void 0),r([(0,o.Cb)({attribute:!1})],Ve.prototype,"sharedObserver",void 0),r([(0,o.Cb)({type:Boolean,reflect:!0,attribute:!0})],Ve.prototype,"loaded",void 0),r([(0,o.SB)()],Ve.prototype,"openMenuState",void 0),r([(0,o.IO)("#frame")],Ve.prototype,"frame",void 0),r([(0,o.IO)('slot[name="header"]')],Ve.prototype,"headerSlot",void 0),r([(0,o.IO)('slot[name="main"]')],Ve.prototype,"mainSlot",void 0),Ve=r([(0,o.Mo)("ia-item-navigator")],Ve),n(5003),n(4747),n(9337),n(4916),n(4765),n(7941),n(7327),n(561),n(9826),n(5827),n(2222);var We,qe=[],Ze="ResizeObserver loop completed with undelivered notifications.";!function(e){e.BORDER_BOX="border-box",e.CONTENT_BOX="content-box",e.DEVICE_PIXEL_CONTENT_BOX="device-pixel-content-box"}(We||(We={}));var Ge,Xe=function(e){return Object.freeze(e)},Ye=function(e,t){this.inlineSize=e,this.blockSize=t,Xe(this)},Je=function(){function e(e,t,n,o){return this.x=e,this.y=t,this.width=n,this.height=o,this.top=this.y,this.left=this.x,this.bottom=this.top+this.height,this.right=this.left+this.width,Xe(this)}return e.prototype.toJSON=function(){var e=this;return{x:e.x,y:e.y,top:e.top,right:e.right,bottom:e.bottom,left:e.left,width:e.width,height:e.height}},e.fromRect=function(t){return new e(t.x,t.y,t.width,t.height)},e}(),Qe=function(e){return e instanceof SVGElement&&"getBBox"in e},Ke=function(e){if(Qe(e)){var t=e.getBBox(),n=t.width,o=t.height;return!n&&!o}var r=e,i=r.offsetWidth,s=r.offsetHeight;return!(i||s||e.getClientRects().length)},et=function(e){var t,n;if(e instanceof Element)return!0;var o=null===(n=null===(t=e)||void 0===t?void 0:t.ownerDocument)||void 0===n?void 0:n.defaultView;return!!(o&&e instanceof o.Element)},tt="undefined"!=typeof window?window:{},nt=new WeakMap,ot=/auto|scroll/,rt=/^tb|vertical/,it=/msie|trident/i.test(tt.navigator&&tt.navigator.userAgent),st=function(e){return parseFloat(e||"0")},at=function(e,t,n){return void 0===e&&(e=0),void 0===t&&(t=0),void 0===n&&(n=!1),new Ye((n?t:e)||0,(n?e:t)||0)},lt=Xe({devicePixelContentBoxSize:at(),borderBoxSize:at(),contentBoxSize:at(),contentRect:new Je(0,0,0,0)}),ct=function(e,t){if(void 0===t&&(t=!1),nt.has(e)&&!t)return nt.get(e);if(Ke(e))return nt.set(e,lt),lt;var n=getComputedStyle(e),o=Qe(e)&&e.ownerSVGElement&&e.getBBox(),r=!it&&"border-box"===n.boxSizing,i=rt.test(n.writingMode||""),s=!o&&ot.test(n.overflowY||""),a=!o&&ot.test(n.overflowX||""),l=o?0:st(n.paddingTop),c=o?0:st(n.paddingRight),d=o?0:st(n.paddingBottom),u=o?0:st(n.paddingLeft),h=o?0:st(n.borderTopWidth),p=o?0:st(n.borderRightWidth),f=o?0:st(n.borderBottomWidth),m=u+c,v=l+d,b=(o?0:st(n.borderLeftWidth))+p,g=h+f,y=a?e.offsetHeight-g-e.clientHeight:0,k=s?e.offsetWidth-b-e.clientWidth:0,w=r?m+b:0,C=r?v+g:0,S=o?o.width:st(n.width)-w-k,x=o?o.height:st(n.height)-C-y,O=S+m+k+b,E=x+v+y+g,B=Xe({devicePixelContentBoxSize:at(Math.round(S*devicePixelRatio),Math.round(x*devicePixelRatio),i),borderBoxSize:at(O,E,i),contentBoxSize:at(S,x,i),contentRect:new Je(u,l,S,x)});return nt.set(e,B),B},dt=function(e,t,n){var o=ct(e,n),r=o.borderBoxSize,i=o.contentBoxSize,s=o.devicePixelContentBoxSize;switch(t){case We.DEVICE_PIXEL_CONTENT_BOX:return s;case We.BORDER_BOX:return r;default:return i}},ut=function(e){var t=ct(e);this.target=e,this.contentRect=t.contentRect,this.borderBoxSize=Xe([t.borderBoxSize]),this.contentBoxSize=Xe([t.contentBoxSize]),this.devicePixelContentBoxSize=Xe([t.devicePixelContentBoxSize])},ht=function(e){if(Ke(e))return 1/0;for(var t=0,n=e.parentNode;n;)t+=1,n=n.parentNode;return t},pt=function(){var e=1/0,t=[];qe.forEach((function(n){if(0!==n.activeTargets.length){var o=[];n.activeTargets.forEach((function(t){var n=new ut(t.target),r=ht(t.target);o.push(n),t.lastReportedSize=dt(t.target,t.observedBox),r<e&&(e=r)})),t.push((function(){n.callback.call(n.observer,o,n.observer)})),n.activeTargets.splice(0,n.activeTargets.length)}}));for(var n=0,o=t;n<o.length;n++)(0,o[n])();return e},ft=function(e){qe.forEach((function(t){t.activeTargets.splice(0,t.activeTargets.length),t.skippedTargets.splice(0,t.skippedTargets.length),t.observationTargets.forEach((function(n){n.isActive()&&(ht(n.target)>e?t.activeTargets.push(n):t.skippedTargets.push(n))}))}))},mt=[],vt=0,bt={attributes:!0,characterData:!0,childList:!0,subtree:!0},gt=["resize","load","transitionend","animationend","animationstart","animationiteration","keyup","keydown","mouseup","mousedown","mouseover","mouseout","blur","focus"],yt=function(e){return void 0===e&&(e=0),Date.now()+e},kt=!1,wt=new(function(){function e(){var e=this;this.stopped=!0,this.listener=function(){return e.schedule()}}return e.prototype.run=function(e){var t=this;if(void 0===e&&(e=250),!kt){kt=!0;var n,o=yt(e);n=function(){var n=!1;try{n=function(){var e,t=0;for(ft(t);qe.some((function(e){return e.activeTargets.length>0}));)t=pt(),ft(t);return qe.some((function(e){return e.skippedTargets.length>0}))&&("function"==typeof ErrorEvent?e=new ErrorEvent("error",{message:Ze}):((e=document.createEvent("Event")).initEvent("error",!1,!1),e.message=Ze),window.dispatchEvent(e)),t>0}()}finally{if(kt=!1,e=o-yt(),!vt)return;n?t.run(1e3):e>0?t.run(e):t.start()}},function(e){if(!Ge){var t=0,n=document.createTextNode("");new MutationObserver((function(){return mt.splice(0).forEach((function(e){return e()}))})).observe(n,{characterData:!0}),Ge=function(){n.textContent=""+(t?t--:t++)}}mt.push(e),Ge()}((function(){requestAnimationFrame(n)}))}},e.prototype.schedule=function(){this.stop(),this.run()},e.prototype.observe=function(){var e=this,t=function(){return e.observer&&e.observer.observe(document.body,bt)};document.body?t():tt.addEventListener("DOMContentLoaded",t)},e.prototype.start=function(){var e=this;this.stopped&&(this.stopped=!1,this.observer=new MutationObserver(this.listener),this.observe(),gt.forEach((function(t){return tt.addEventListener(t,e.listener,!0)})))},e.prototype.stop=function(){var e=this;this.stopped||(this.observer&&this.observer.disconnect(),gt.forEach((function(t){return tt.removeEventListener(t,e.listener,!0)})),this.stopped=!0)},e}()),Ct=function(e){!vt&&e>0&&wt.start(),!(vt+=e)&&wt.stop()},St=function(){function e(e,t){this.target=e,this.observedBox=t||We.CONTENT_BOX,this.lastReportedSize={inlineSize:0,blockSize:0}}return e.prototype.isActive=function(){var e,t=dt(this.target,this.observedBox,!0);return e=this.target,Qe(e)||function(e){switch(e.tagName){case"INPUT":if("image"!==e.type)break;case"VIDEO":case"AUDIO":case"EMBED":case"OBJECT":case"CANVAS":case"IFRAME":case"IMG":return!0}return!1}(e)||"inline"!==getComputedStyle(e).display||(this.lastReportedSize=t),this.lastReportedSize.inlineSize!==t.inlineSize||this.lastReportedSize.blockSize!==t.blockSize},e}(),xt=function(e,t){this.activeTargets=[],this.skippedTargets=[],this.observationTargets=[],this.observer=e,this.callback=t},Ot=new WeakMap,Et=function(e,t){for(var n=0;n<e.length;n+=1)if(e[n].target===t)return n;return-1},Bt=function(){function e(){}return e.connect=function(e,t){var n=new xt(e,t);Ot.set(e,n)},e.observe=function(e,t,n){var o=Ot.get(e),r=0===o.observationTargets.length;Et(o.observationTargets,t)<0&&(r&&qe.push(o),o.observationTargets.push(new St(t,n&&n.box)),Ct(1),wt.schedule())},e.unobserve=function(e,t){var n=Ot.get(e),o=Et(n.observationTargets,t),r=1===n.observationTargets.length;o>=0&&(r&&qe.splice(qe.indexOf(n),1),n.observationTargets.splice(o,1),Ct(-1))},e.disconnect=function(e){var t=this,n=Ot.get(e);n.observationTargets.slice().forEach((function(n){return t.unobserve(e,n.target)})),n.activeTargets.splice(0,n.activeTargets.length)},e}(),_t=function(){function e(e){if(0===arguments.length)throw new TypeError("Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.");if("function"!=typeof e)throw new TypeError("Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.");Bt.connect(this,e)}return e.prototype.observe=function(e,t){if(0===arguments.length)throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': 1 argument required, but only 0 present.");if(!et(e))throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element");Bt.observe(this,e,t)},e.prototype.unobserve=function(e){if(0===arguments.length)throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': 1 argument required, but only 0 present.");if(!et(e))throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'Element");Bt.unobserve(this,e)},e.prototype.disconnect=function(){Bt.disconnect(this)},e.toString=function(){return"function ResizeObserver () { [polyfill code] }"},e}();const $t=window.ResizeObserver||_t;class At{constructor(){this.resizeObserver=new $t((e=>{window.requestAnimationFrame((()=>{for(const t of e){const e=this.resizeHandlers.get(t.target);null==e||e.forEach((e=>{e.handleResize(t)}))}}))})),this.resizeHandlers=new Map}addObserver(e){var t;const n=null!==(t=this.resizeHandlers.get(e.target))&&void 0!==t?t:new Set;n.add(e.handler),this.resizeHandlers.set(e.target,n),this.resizeObserver.observe(e.target,e.options)}removeObserver(e){const t=this.resizeHandlers.get(e.target);t&&(this.resizeObserver.unobserve(e.target),t.delete(e.handler),0===t.size&&this.resizeHandlers.delete(e.target))}}class jt{constructor(e){var t,n,o,r,i;this.title=null==e?void 0:e.title,this.subtitle=null==e?void 0:e.subtitle,this.headline=null==e?void 0:e.headline,this.message=null==e?void 0:e.message,this.headerColor=null!==(t=null==e?void 0:e.headerColor)&&void 0!==t?t:"#55A183",this.showProcessingIndicator=null!==(n=null==e?void 0:e.showProcessingIndicator)&&void 0!==n&&n,this.processingImageMode=null!==(o=null==e?void 0:e.processingImageMode)&&void 0!==o?o:"complete",this.showCloseButton=null===(r=null==e?void 0:e.showCloseButton)||void 0===r||r,this.closeOnBackdropClick=null===(i=null==e?void 0:e.closeOnBackdropClick)||void 0===i||i}}const Mt=Object.freeze({processing:"processing",complete:"complete"});class It extends o.oi{static get properties(){return{mode:{type:String}}}constructor(){super(),this.mode=Mt.processing}render(){return o.dy`
      <div class="${this.mode}">
        <svg
          viewBox="0 0 120 120"
          preserveAspectRatio="none"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          aria-labelledby="indicatorTitle indicatorDescription"
        >
          <title id="indicatorTitle">Activity Indicator</title>
          <desc id="indicatorDescription">
            A rotating activity indicator with three dots in the middle.
          </desc>
          <g
            id="icons/check-ring---squared"
            stroke="none"
            stroke-width="1"
            fill="none"
            fill-rule="evenodd"
          >
            <path
              id="completed-ring"
              class="loaded-indicator"
              d="M60,10 C70.5816709,10 80.3955961,13.2871104 88.4763646,18.8959201 L78.3502633,29.0214223 C72.9767592,25.8315427 66.7022695,24 60,24 C40.117749,24 24,40.117749 24,60 C24,79.882251 40.117749,96 60,96 C79.882251,96 96,79.882251 96,60 L95.995,59.46 L108.327675,47.128668 C109.350926,50.9806166 109.925886,55.015198 109.993301,59.1731586 L110,60 C110,87.6142375 87.6142375,110 60,110 C32.3857625,110 10,87.6142375 10,60 C10,32.3857625 32.3857625,10 60,10 Z"
            ></path>
            <polygon
              id="check"
              class="loaded-indicator"
              transform="translate(75.000000, 41.500000) rotate(44.000000) translate(-75.000000, -41.500000) "
              points="96 85 54 85 54 65 76 64.999 76 -2 96 -2"
            ></polygon>
            <path
              id="activity-ring"
              class="activity-indicator"
              d="M60,10 C69.8019971,10 78.9452178,12.8205573 86.6623125,17.6943223 L76.4086287,27.9484118 C71.4880919,25.4243078 65.9103784,24 60,24 C40.117749,24 24,40.117749 24,60 C24,79.882251 40.117749,96 60,96 C79.882251,96 96,79.882251 96,60 C96,53.3014663 94.1704984,47.0302355 90.9839104,41.6587228 L101.110332,31.5326452 C106.715332,39.6116982 110,49.4222615 110,60 C110,87.6142375 87.6142375,110 60,110 C32.3857625,110 10,87.6142375 10,60 C10,32.3857625 32.3857625,10 60,10 Z"
            ></path>
            <g
              id="activity-dots"
              class="activity-indicator"
              transform="translate(40.000000, 55.000000)"
            >
              <circle id="left-dot" cx="5" cy="5" r="5"></circle>
              <circle id="middle-dot" cx="20" cy="5" r="5"></circle>
              <circle id="right-dot" cx="35" cy="5" r="5"></circle>
            </g>
          </g>
        </svg>
      </div>
    `}static get styles(){const e=o.iv`var(--activityIndicatorCheckmarkColor, #31A481)`,t=o.iv`var(--activityIndicatorCompletedRingColor, #31A481)`,n=o.iv`var(--activityIndicatorLoadingRingColor, #333333)`,r=o.iv`var(--activityIndicatorLoadingDotColor, #333333)`;return o.iv`
      #completed-ring {
        fill: ${t};
      }

      #check {
        fill: ${e};
      }

      #activity-ring {
        fill: ${n};
      }

      #activity-dots {
        fill: ${r};
      }

      .activity-indicator {
        opacity: 0;
        transition: opacity 0.25s ease-out;
      }

      .processing .activity-indicator {
        opacity: 1;
      }

      .loaded-indicator {
        opacity: 1;
        transition: opacity 0.25s ease-out;
      }

      .processing .loaded-indicator {
        opacity: 0;
      }

      .image {
        border: 1px solid red;
        display: inline-block;
      }

      .processing #activity-ring {
        animation: rotate 1.3s infinite linear;
        transform-origin: 50px 50px;
        transform-box: fill-box;
      }

      .processing #left-dot {
        opacity: 0;
        animation: dot 1.3s infinite;
        animation-delay: 0.2s;
      }

      .processing #middle-dot {
        opacity: 0;
        animation: dot 1.3s infinite;
        animation-delay: 0.4s;
      }

      .processing #right-dot {
        opacity: 0;
        animation: dot 1.3s infinite;
        animation-delay: 0.6s;
      }

      @keyframes rotate {
        0% {
          transform: rotate(-360deg);
        }
      }

      @keyframes dot {
        0% {
          opacity: 0;
        }
        25% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }
    `}}window.customElements.define("ia-activity-indicator",It);var zt=a.dy`
  <svg
    viewBox="0 0 40 40"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    aria-labelledby="closeTitleID closeDescID"
  >
    <title id="closeTitleID">Close icon</title>
    <desc id="closeDescID">A line drawing of an X</desc>
    <path d="m29.1923882 10.8076118c.5857864.5857865.5857864 1.535534 0 2.1213204l-7.0711162 7.0703398 7.0711162 7.0717958c.5857864.5857864.5857864 1.5355339 0 2.1213204-.5857865.5857864-1.535534.5857864-2.1213204 0l-7.0717958-7.0711162-7.0703398 7.0711162c-.5857864.5857864-1.5355339.5857864-2.1213204 0-.5857864-.5857865-.5857864-1.535534 0-2.1213204l7.0706602-7.0717958-7.0706602-7.0703398c-.5857864-.5857864-.5857864-1.5355339 0-2.1213204.5857865-.5857864 1.535534-.5857864 2.1213204 0l7.0703398 7.0706602 7.0717958-7.0706602c.5857864-.5857864 1.5355339-.5857864 2.1213204 0z" class="fill-color" fill-rule="evenodd"/>
  </svg>
`,Lt=a.dy`
  <svg
    class="ia-logo"
    viewBox="0 0 27 30"
    xmlns="http://www.w3.org/2000/svg"
    aria-labelledby="logoTitleID logoDescID"
  >
    <title id="logoTitleID">Internet Archive logo</title>
    <desc id="logoDescID">A line drawing of the Internet Archive headquarters building façade.</desc>
    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
      <mask id="mask-2" class="fill-color">
        <path d="M26.6666667,28.6046512 L26.6666667,30 L0,30 L0.000283687943,28.6046512 L26.6666667,28.6046512 Z M25.6140351,26.5116279 L25.6140351,28.255814 L1.05263158,28.255814 L1.05263158,26.5116279 L25.6140351,26.5116279 Z M3.62469203,7.6744186 L3.91746909,7.82153285 L4.0639977,10.1739544 L4.21052632,13.9963932 L4.21052632,17.6725617 L4.0639977,22.255044 L4.03962296,25.3421929 L3.62469203,25.4651163 L2.16024641,25.4651163 L1.72094074,25.3421929 L1.55031755,22.255044 L1.40350877,17.6970339 L1.40350877,14.0211467 L1.55031755,10.1739544 L1.68423854,7.80887484 L1.98962322,7.6744186 L3.62469203,7.6744186 Z M24.6774869,7.6744186 L24.9706026,7.82153285 L25.1168803,10.1739544 L25.2631579,13.9963932 L25.2631579,17.6725617 L25.1168803,22.255044 L25.0927809,25.3421929 L24.6774869,25.4651163 L23.2130291,25.4651163 L22.7736357,25.3421929 L22.602418,22.255044 L22.4561404,17.6970339 L22.4561404,14.0211467 L22.602418,10.1739544 L22.7369262,7.80887484 L23.0420916,7.6744186 L24.6774869,7.6744186 Z M9.94042303,7.6744186 L10.2332293,7.82153285 L10.3797725,10.1739544 L10.5263158,13.9963932 L10.5263158,17.6725617 L10.3797725,22.255044 L10.3556756,25.3421929 L9.94042303,25.4651163 L8.47583122,25.4651163 L8.0362015,25.3421929 L7.86556129,22.255044 L7.71929825,17.6970339 L7.71929825,14.0211467 L7.86556129,10.1739544 L8.00005604,7.80887484 L8.30491081,7.6744186 L9.94042303,7.6744186 Z M18.0105985,7.6744186 L18.3034047,7.82153285 L18.449948,10.1739544 L18.5964912,13.9963932 L18.5964912,17.6725617 L18.449948,22.255044 L18.425851,25.3421929 L18.0105985,25.4651163 L16.5460067,25.4651163 L16.1066571,25.3421929 L15.9357367,22.255044 L15.7894737,17.6970339 L15.7894737,14.0211467 L15.9357367,10.1739544 L16.0702315,7.80887484 L16.3753664,7.6744186 L18.0105985,7.6744186 Z M25.6140351,4.53488372 L25.6140351,6.97674419 L1.05263158,6.97674419 L1.05263158,4.53488372 L25.6140351,4.53488372 Z M13.0806755,0 L25.9649123,2.93331338 L25.4484139,3.8372093 L0.771925248,3.8372093 L0,3.1041615 L13.0806755,0 Z" id="path-1"></path>
      </mask>
      <use class="fill-color" xlink:href="#path-1"></use>
      <g mask="url(#mask-2)" class="fill-color">
        <path d="M0,0 L26.6666667,0 L26.6666667,30 L0,30 L0,0 Z" id="swatch"></path>
      </g>
    </g>
  </svg>
`;let Pt=class extends o.oi{constructor(){super(...arguments),this.config=new jt}render(){return o.dy`
      <div class="modal-wrapper">
        <div class="modal-container">
          <header style="background-color: ${this.config.headerColor}">
            ${this.config.showCloseButton?this.closeButtonTemplate:""}
            <div class="logo-icon">
              ${Lt}
            </div>
            ${this.config.title?o.dy`<h1 class="title">${this.config.title}</h1>`:""}
            ${this.config.subtitle?o.dy`<h2 class="subtitle">${this.config.subtitle}</h2>`:""}
          </header>
          <section class="modal-body">
            <div class="content">
              <div
                class="processing-logo ${this.config.showProcessingIndicator?"":"hidden"}"
              >
                <ia-activity-indicator
                  .mode=${this.config.processingImageMode}
                ></ia-activity-indicator>
              </div>

              ${this.config.headline?o.dy` <h1 class="headline">${this.config.headline}</h1> `:""}
              ${this.config.message?o.dy` <p class="message">${this.config.message}</p> `:""}

              <div class="slot-container">
                <slot> </slot>
              </div>
            </div>
          </section>
        </div>
      </div>
    `}handleCloseButton(){const e=new Event("closeButtonPressed");this.dispatchEvent(e)}get closeButtonTemplate(){return o.dy`
      <button
        type="button"
        class="close-button"
        tabindex="0"
        @click=${this.handleCloseButton}
      >
        ${zt}
      </button>
    `}static get styles(){const e=o.iv`var(--modalLogoSize, 6.5rem)`,t=o.iv`var(--processingImageSize, 7.5rem)`,n=o.iv`var(--modalCornerRadius, 1rem)`,r=o.iv`var(--modalBorder, 2px solid black)`,i=o.iv`var(--modalBottomMargin, 2.5rem)`,s=o.iv`var(--modalTopMargin, 5rem)`,a=o.iv`var(--modalHeaderBottomPadding, 0.5em)`,l=o.iv`var(--modalBottomPadding, 2rem)`,c=o.iv`var(--modalScrollOffset, 5px)`,d=o.iv`var(--modalTitleFontSize, 1.8rem)`,u=o.iv`var(--modalSubtitleFontSize, 1.4rem)`,h=o.iv`var(--modalHeadlineFontSize, 1.6rem)`,p=o.iv`var(--modalMessageFontSize, 1.4rem)`,f=o.iv`var(--modalTitleLineHeight, normal)`,m=o.iv`var(--modalSubtitleLineHeight, normal)`,v=o.iv`var(--modalHeadlineLineHeight, normal)`,b=o.iv`var(--modalMessageLineHeight, normal)`;return o.iv`
      .processing-logo {
        margin: auto;
        width: ${t};
        height: ${t};
      }

      .processing-logo.hidden {
        height: 1rem;
      }

      .processing-logo.hidden ia-activity-indicator {
        display: none;
      }

      .modal-wrapper {
        outline: none;
      }

      .modal-container {
        border-radius: ${n};
        width: 100%;
        margin-top: ${s};
      }

      header {
        position: relative;
        background-color: #36a483;
        color: white;
        border-radius: calc(${n}) calc(${n}) 0 0;
        border: ${r};
        border-bottom: 0;
        text-align: center;
        padding-bottom: ${a};
      }

      .title {
        margin: 0;
        padding: 0;
        font-size: ${d};
        font-weight: bold;
        line-height: ${f};
      }

      .subtitle {
        margin: 0;
        padding: 0;
        font-weight: normal;
        padding-top: 0;
        font-size: ${u};
        line-height: ${m};
      }

      .modal-body {
        background-color: #f5f5f7;
        border-radius: 0 0 calc(${n}) calc(${n});
        border: ${r};
        border-top: 0;
        padding: 0 1rem calc(${l} - ${c}) 1rem;
        color: #333;
        margin-bottom: 2.5rem;
        min-height: 5rem;
      }

      .content {
        overflow-y: auto;
        max-height: calc(100vh - (16.5rem + ${i}));
        min-height: 5rem;
        padding: 0 0 calc(${c}) 0;
      }

      .headline {
        font-size: ${h};
        font-weight: bold;
        text-align: center;
        line-height: ${v};
        margin: 0;
        padding: 0;
      }

      .message {
        margin: 1rem 0 0 0;
        text-align: center;
        font-size: ${p};
        line-height: ${b};
      }

      .logo-icon {
        border-radius: 100%;
        border: 3px solid #fff;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.18),
          0 2px 2px 0 rgba(0, 0, 0, 0.08);
        width: ${e};
        height: ${e};
        margin: -2.9rem auto 0.5rem auto;
        background-color: black;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .logo-icon svg {
        width: calc(${e} * 0.65);
        height: calc(${e} * 0.65);
      }

      .logo-icon svg .fill-color {
        fill: white;
      }

      .logo-icon svg .stroke-color {
        stroke: red;
      }

      .close-button {
        position: absolute;
        right: 1.2rem;
        top: 1.2rem;
        width: 2rem;
        height: 2rem;
        border-radius: 100%;
        border: 0;
        padding: 0;
        cursor: pointer;
        background-color: white;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.18),
          0 4px 4px 0 rgba(0, 0, 0, 0.08);
      }
    `}};r([(0,o.Cb)({type:Object})],Pt.prototype,"config",void 0),Pt=r([(0,o.Mo)("modal-template")],Pt);var Tt,Dt=n(3774);!function(e){e.Open="open",e.Closed="closed"}(Tt||(Tt={}));class Rt{constructor(e){this.windowResizeThrottler=(0,Dt.throttle)(100,!1,this.updateModalContainerHeight).bind(this),this.modalManager=e}handleModeChange(e){switch(e){case Tt.Open:this.startResizeListener(),this.stopDocumentScroll();break;case Tt.Closed:this.stopResizeListener(),this.resumeDocumentScroll()}}updateModalContainerHeight(){this.modalManager.style.setProperty("--containerHeight",`${window.innerHeight}px`)}stopDocumentScroll(){document.body.classList.add("modal-manager-open")}resumeDocumentScroll(){document.body.classList.remove("modal-manager-open")}startResizeListener(){window.addEventListener("resize",this.windowResizeThrottler)}stopResizeListener(){window.removeEventListener("resize",this.windowResizeThrottler)}}let Ht=class extends o.oi{constructor(){super(...arguments),this.mode=Tt.Closed,this.hostBridge=new Rt(this),this.closeOnBackdropClick=!0}render(){return o.dy`
      <div class="container">
        <div class="backdrop" @click=${this.backdropClicked}></div>
        <modal-template
          @closeButtonPressed=${this.closeButtonPressed}
          tabindex="0"
        >
          ${this.customModalContent}
        </modal-template>
      </div>
    `}getMode(){return this.mode}closeModal(){this.mode=Tt.Closed}callUserClosedModalCallback(){const e=this.userClosedModalCallback;this.userClosedModalCallback=void 0,e&&e()}showModal(e){return function(e,t,n,o){return new(n||(n=Promise))((function(t,r){function i(e){try{a(o.next(e))}catch(e){r(e)}}function s(e){try{a(o.throw(e))}catch(e){r(e)}}function a(e){e.done?t(e.value):new n((function(t){t(e.value)})).then(i,s)}a((o=o.apply(e,[])).next())}))}(this,0,void 0,(function*(){this.closeOnBackdropClick=e.config.closeOnBackdropClick,this.userClosedModalCallback=e.userClosedModalCallback,this.modalTemplate.config=e.config,this.customModalContent=e.customModalContent,this.mode=Tt.Open,yield this.modalTemplate.updateComplete,this.modalTemplate.focus()}))}updated(e){e.has("mode")&&this.handleModeChange()}backdropClicked(){this.closeOnBackdropClick&&(this.closeModal(),this.callUserClosedModalCallback())}handleModeChange(){this.hostBridge.handleModeChange(this.mode),this.emitModeChangeEvent()}emitModeChangeEvent(){const e=new CustomEvent("modeChanged",{detail:{mode:this.mode}});this.dispatchEvent(e)}closeButtonPressed(){this.closeModal(),this.callUserClosedModalCallback()}static get styles(){const e=o.iv`var(--modalBackdropColor, rgba(10, 10, 10, 0.9))`,t=o.iv`var(--modalBackdropZindex, 1000)`,n=o.iv`var(--modalWidth, 32rem)`,r=o.iv`var(--modalMaxWidth, 95%)`,i=o.iv`var(--modalZindex, 2000)`;return o.iv`
      .container {
        width: 100%;
        height: 100%;
      }

      .backdrop {
        position: fixed;
        top: 0;
        left: 0;
        background-color: ${e};
        width: 100%;
        height: 100%;
        z-index: ${t};
      }

      modal-template {
        outline: 0;
        position: fixed;
        top: 0;
        left: 50%;
        transform: translate(-50%, 0);
        z-index: ${i};
        width: ${n};
        max-width: ${r};
      }
    `}};r([(0,o.Cb)({type:String,reflect:!0})],Ht.prototype,"mode",void 0),r([(0,o.Cb)({type:Object})],Ht.prototype,"customModalContent",void 0),r([(0,o.Cb)({type:Object})],Ht.prototype,"hostBridge",void 0),r([(0,o.IO)("modal-template")],Ht.prototype,"modalTemplate",void 0),Ht=r([(0,o.Mo)("modal-manager")],Ht),n(4723);var Nt=a.dy`
<svg
  viewBox="0 0 18 18"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="searchTitleID searchDescID"
>
  <title id="searchTitleID">Search icon</title>
  <desc id="searchDescID">Search for something.</desc>
  <path
    class="fill-color"
    fill="none"
    d="m7 0c3.854149 0 7 3.1458514 7 7 0 1.5717634-.529107 3.020558-1.410156 4.191406.0416324.03077.0808125.0647264.117187.101563l4.335938 4.335937c.3904239.3905071.3904239 1.0235559 0 1.414063-.3905071.3904239-1.0235559.3904239-1.414063 0l-4.335937-4.335938c-.0362414-.0370712-.0695452-.0769047-.09961-.11914-1.171224.882043-2.6206167 1.412109-4.193359 1.412109-3.8541486 0-7-3.145851-7-7 0-3.8541486 3.1458514-7 7-7zm0 2c-2.7732684 0-5 2.2267316-5 5s2.2267316 5 5 5 5-2.2267316 5-5-2.2267316-5-5-5z" />
</svg>
`;class Ft extends o.oi{static get styles(){return o.iv`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}render(){return Nt}}customElements.define("ia-icon-search",Ft),n(1249),n(4603),n(9714),n(5306),n(3161),n(9653),n(4129);var Ut,Vt,Wt,qt,Zt=n(7552),Gt=new WeakMap,Xt=(0,a.XM)((function(e){return function(t){if(!(t instanceof a.nt))throw new Error("unsafeHTML can only be used in text bindings");var n=Gt.get(t);if(void 0===n||!(0,Zt.pt)(e)||e!==n.value||t.value!==n.fragment){var o=document.createElement("template");o.innerHTML=e;var r=document.importNode(o.content,!0);t.setValue(r),Gt.set(t,{value:e,fragment:r})}}}));function Yt(e){return(Yt="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function Jt(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,o=new Array(t);n<t;n++)o[n]=e[n];return o}function Qt(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function Kt(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function en(e,t){return(en=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function tn(e,t){if(t&&("object"===Yt(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}function nn(e){return(nn=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var on,rn=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&en(e,t)}(c,e);var t,n,r,i,s,l=(i=c,s=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}(),function(){var e,t=nn(i);if(s){var n=nn(this).constructor;e=Reflect.construct(t,arguments,n)}else e=t.apply(this,arguments);return tn(this,e)});function c(){var e;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,c),(e=l.call(this)).matchRegex=new RegExp("{{{(.+?)}}}","g"),e}return t=c,r=[{key:"properties",get:function(){return{match:{type:Object}}}}],(n=[{key:"createRenderRoot",value:function(){return this}},{key:"highlightedHit",value:function(e){return(0,o.dy)(Ut||(Ut=Qt(["\n      <p>","</p>\n    "])),Xt(e.replace(this.matchRegex,"<mark>$1</mark>")))}},{key:"resultSelected",value:function(){this.dispatchEvent(new CustomEvent("resultSelected",{bubbles:!0,composed:!0,detail:{match:this.match}}))}},{key:"render",value:function(){var e,t,n=this.match,r=n.par,i=(e=void 0===r?[]:r,t=1,function(e){if(Array.isArray(e))return e}(e)||function(e,t){var n=null==e?null:"undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=n){var o,r,i=[],s=!0,a=!1;try{for(n=n.call(e);!(s=(o=n.next()).done)&&(i.push(o.value),!t||i.length!==t);s=!0);}catch(e){a=!0,r=e}finally{try{s||null==n.return||n.return()}finally{if(a)throw r}}return i}}(e,t)||function(e,t){if(e){if("string"==typeof e)return Jt(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?Jt(e,t):void 0}}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}())[0],s=void 0===i?{}:i,l=Number.isInteger(s.page)?(0,o.dy)(Vt||(Vt=Qt(['<p class="page-num">Page -',"-</p>"])),s.page):a.Ld,c=(0,o.dy)(Wt||(Wt=Qt(['<img src="','" />'])),n.cover);return(0,o.dy)(qt||(qt=Qt(["\n      <li @click=",">\n        ","\n        <h4>","</h4>\n        ","\n        ","\n      </li>\n    "])),this.resultSelected,n.cover?c:a.Ld,n.title||a.Ld,l,this.highlightedHit(n.text))}}])&&Kt(t.prototype,n),r&&Kt(t,r),c}(o.oi);customElements.define("book-search-result",rn);var sn,an,ln,cn,dn,un,hn,pn,fn,mn,vn,bn,gn,yn,kn,wn,Cn,Sn,xn,On=(0,o.iv)(on||(sn=["data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjEwIiB2aWV3Qm94PSIwIDAgMTMgMTAiIHdpZHRoPSIxMyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtNC4zMzMzMzMzMyAxMC00LjMzMzMzMzMzLTQuMTY2NjY2NjcgMS43MzMzMzMzMy0xLjY2NjY2NjY2IDIuNiAyLjUgNi45MzMzMzMzNy02LjY2NjY2NjY3IDEuNzMzMzMzMyAxLjY2NjY2NjY3eiIgZmlsbD0iI2ZmZiIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+"],an||(an=sn.slice(0)),on=Object.freeze(Object.defineProperties(sn,{raw:{value:Object.freeze(an)}})))),En=(0,o.iv)(ln||(ln=function(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}(["data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNDAgNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgYXJpYS1sYWJlbGxlZGJ5PSJjbG9zZVRpdGxlSUQgY2xvc2VEZXNjSUQiPjxwYXRoIGQ9Ik0yOS4xOTIgMTAuODA4YTEuNSAxLjUgMCAwMTAgMi4xMkwyMi4xMjIgMjBsNy4wNyA3LjA3MmExLjUgMS41IDAgMDEtMi4xMiAyLjEyMWwtNy4wNzMtNy4wNy03LjA3IDcuMDdhMS41IDEuNSAwIDAxLTIuMTIxLTIuMTJsNy4wNy03LjA3My03LjA3LTcuMDdhMS41IDEuNSAwIDAxMi4xMi0yLjEyMUwyMCAxNy44NzhsNy4wNzItNy4wN2ExLjUgMS41IDAgMDEyLjEyMSAweiIgY2xhc3M9ImZpbGwtY29sb3IiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg=="]))),Bn=(0,o.iv)(cn||(cn=function(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}(["\n  .ia-button {\n    min-height: 3rem;\n    border: none;\n    outline: none;\n    cursor: pointer;\n    color: var(--primaryTextColor);\n    line-height: normal;\n    border-radius: .4rem;\n    text-align: center;\n    vertical-align: middle;\n    font-size: 1.4rem;\n    display: inline-block;\n    padding: .6rem 1.2rem;\n    border: 1px solid transparent;\n\n    white-space: nowrap;\n    -webkit-user-select: none;\n    -moz-user-select: none;\n    -ms-user-select: none;\n    -o-user-select: none;\n    user-select: none;\n  }\n\n  .ia-button.link,\n  .ia-button.external {\n    min-height: unset;\n    text-decoration: none;\n  }\n\n  .ia-button:disabled,\n  .ia-button.disabled {\n    cursor: not-allowed;\n    opacity: 0.5;\n  }\n\n  .ia-button.transparent {\n    background-color: transparent;\n  }\n  \n  .ia-button.slim {\n    padding: 0;\n  }\n\n  .ia-button.primary {\n    background-color: var(--primaryCTAFill);\n    border-color: var(--primaryCTABorder);\n  }\n\n  .ia-button.cancel {\n    background-color: var(--primaryErrorCTAFill);\n    border-color: var(--primaryErrorCTABorder);\n  }\n\n  .ia-button.external {\n    background: var(--secondaryCTAFill);\n    border-color: var(--secondaryCTABorder);\n  }\n"])));function _n(e){return(_n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function $n(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function An(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function jn(e,t){return(jn=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function Mn(e,t){if(t&&("object"===_n(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}function In(e){return(In=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var zn,Ln,Pn,Tn,Dn=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&jn(e,t)}(c,e);var t,n,r,i,s,l=(i=c,s=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}(),function(){var e,t=In(i);if(s){var n=In(this).constructor;e=Reflect.construct(t,arguments,n)}else e=t.apply(this,arguments);return Mn(this,e)});function c(){var e;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,c),(e=l.call(this)).results=[],e.query="",e.queryInProgress=!1,e.renderHeader=!1,e.renderSearchAllFields=!1,e.displayResultImages=!1,e.errorMessage="",e.bindBookReaderListeners(),e}return t=c,r=[{key:"properties",get:function(){return{results:{type:Array},query:{type:String},queryInProgress:{type:Boolean},renderHeader:{type:Boolean},renderSearchAllFiles:{type:Boolean},displayResultImages:{type:Boolean},errorMessage:{type:String}}}},{key:"styles",get:function(){var e=(0,o.iv)(kn||(kn=$n(["var(--searchResultText, #adaedc)"]))),t=(0,o.iv)(wn||(wn=$n(["var(--searchResultBg, #272958)"]))),n=(0,o.iv)(Cn||(Cn=$n(["var(--searchResultBorder, #adaedc)"]))),r=(0,o.iv)(Sn||(Sn=$n(["(--tertiaryBGColor, #333)"]))),i=(0,o.iv)(xn||(xn=$n(["\n      :host {\n        display: block;\n        height: 100%;\n        padding: 1.5rem 1rem 2rem 0;\n        overflow-y: auto;\n        font-size: 1.4rem;\n        box-sizing: border-box;\n      }\n\n      mark {\n        padding: 0 .2rem;\n        color: ",";\n        background: ",";\n        border: 1px solid ",';\n        border-radius: 2px;\n      }\n\n      h3 {\n        padding: 0;\n        margin: 0 1rem 0 0;\n        font-size: 2rem;\n      }\n\n      header {\n        display: flex;\n        align-items: center;\n        padding: 0 2rem 0 0;\n      }\n      header p {\n        padding: 0;\n        margin: 0;\n        font-size: 1.2rem;\n        font-weight: bold;\n        font-style: italic;\n      }\n\n      fieldset {\n        padding: 0 0 1rem 0;\n        border: none;\n      }\n\n      [type="checkbox"] {\n        display: none;\n      }\n\n      label {\n        display: block;\n        text-align: center;\n      }\n\n      label.checkbox {\n        padding-bottom: .5rem;\n        font-size: 1.6rem;\n        line-height: 150%;\n        vertical-align: middle;\n      }\n\n      label.checkbox:after {\n        display: inline-block;\n        width: 14px;\n        height: 14px;\n        margin-left: .7rem;\n        content: "";\n        border-radius: 2px;\n      }\n      :checked + label.checkbox:after {\n        background-image: url(\'','\');\n      }\n\n      label.checkbox[for="all_files"]:after {\n        background: ',' 50% 50% no-repeat;\n        border: 1px solid var(--primaryTextColor);\n      }\n\n      [type="search"] {\n        color: var(--primaryTextColor);\n        border: 1px solid var(--primaryTextColor);\n        -webkit-appearance: textfield;\n        width: 100%;\n        height: 3rem;\n        padding: 0 1.5rem;\n        box-sizing: border-box;\n        font: normal 1.6rem "Helvetica qNeue", Helvetica, Arial, sans-serif;\n        border-radius: 1.5rem;\n        background: transparent;\n      }\n      [type="search"]:focus {\n        outline: none;\n      }\n      [type="search"]::-webkit-search-cancel-button {\n        width: 18px;\n        height: 18px;\n        -webkit-appearance: none;\n        appearance: none;\n        -webkit-mask: url(\'',"') 0 0 no-repeat;\n        mask: url('","') 0 0 no-repeat;\n        -webkit-mask-size: 100%;\n        mask-size: 100%;\n        background: #fff;\n      }\n\n      p.page-num {\n        font-weight: bold;\n        padding-bottom: 0;\n      }\n\n      p.search-cta {\n        text-align: center;\n      }\n\n      .results-container {\n        padding-bottom: 2rem;\n      }\n\n      ul {\n        padding: 0 0 2rem 0;\n        margin: 0;\n        list-style: none;\n      }\n\n      ul.show-image li {\n        display: grid;\n      }\n\n      li {\n        cursor: pointer;\n        grid-template-columns: 30px 1fr;\n        grid-gap: 0 .5rem;\n      }\n\n      li img {\n        display: block;\n        width: 100%;\n      }\n\n      li h4 {\n        grid-column: 2 / 3;\n        padding: 0 0 2rem 0;\n        margin: 0;\n        font-weight: normal;\n      }\n\n      li p {\n        grid-column: 2 / 3;\n        padding: 0 0 1.5rem 0;\n        margin: 0;\n        font-size: 1.2rem;\n      }\n\n      .loading {\n        text-align: center;\n      }\n\n      .loading p {\n        padding: 0 0 1rem 0;\n        margin: 0;\n        font-size: 1.2rem;\n      }\n\n      ia-activity-indicator {\n        display: block;\n        width: 40px;\n        height: 40px;\n        margin: 0 auto;\n      }\n    "])),e,t,n,On,r,En,En);return[Bn,i]}}],(n=[{key:"updated",value:function(){this.focusOnInputIfNecessary()}},{key:"bindBookReaderListeners",value:function(){document.addEventListener("BookReader:SearchCallback",this.setResults.bind(this))}},{key:"focusOnInputIfNecessary",value:function(){this.results.length||this.shadowRoot.querySelector("input[type='search']").focus()}},{key:"setResults",value:function(e){var t=e.detail;this.results=t.results}},{key:"setQuery",value:function(e){this.query=e.currentTarget.value}},{key:"performSearch",value:function(e){e.preventDefault();var t=e.currentTarget.querySelector('input[type="search"]');t&&t.value&&this.dispatchEvent(new CustomEvent("bookSearchInitiated",{bubbles:!0,composed:!0,detail:{query:this.query}}))}},{key:"selectResult",value:function(){this.dispatchEvent(new CustomEvent("closeMenu",{bubbles:!0,composed:!0}))}},{key:"cancelSearch",value:function(){this.queryInProgress=!1,this.dispatchSearchCanceled()}},{key:"dispatchSearchCanceled",value:function(){this.dispatchEvent(new Event("bookSearchCanceled"))}},{key:"resultsCount",get:function(){var e=this.results.length;return e?(0,o.dy)(dn||(dn=$n(["<p>("," result",")</p>"])),e,e>1?"s":""):a.Ld}},{key:"headerSection",get:function(){var e=(0,o.dy)(un||(un=$n(["<header>\n      <h3>Search inside</h3>\n      ","\n    </header>"])),this.resultsCount);return this.renderHeader?e:a.Ld}},{key:"searchMultipleControls",get:function(){var e=(0,o.dy)(hn||(hn=$n(['\n      <input name="all_files" id="all_files" type="checkbox" />\n      <label class="checkbox" for="all_files">Search all files</label>\n    '])));return this.renderSearchAllFiles?e:a.Ld}},{key:"loadingIndicator",get:function(){return(0,o.dy)(pn||(pn=$n(['\n      <div class="loading">\n        <ia-activity-indicator mode="processing"></ia-activity-indicator>\n        <p>Searching</p>\n        <button class="ia-button external cancel-search" @click=',">Cancel</button>\n      </div>\n    "])),this.cancelSearch)}},{key:"resultsSet",get:function(){var e=this,t=this.displayResultImages?"show-image":"";return(0,o.dy)(fn||(fn=$n(['\n      <ul class="results ','">\n        ',"\n      </ul>\n    "])),t,this.results.map((function(t){return(0,o.dy)(mn||(mn=$n(["\n            <book-search-result\n              .match=","\n              @resultSelected=","\n            ></book-search-result>\n          "])),t,e.selectResult)})))}},{key:"searchForm",get:function(){return(0,o.dy)(vn||(vn=$n(['\n      <form action="" method="get" @submit=',">\n        <fieldset>\n          ",'\n          <input\n            type="search"\n            name="query"\n            alt="Search inside this book."\n            @keyup=',"\n            .value=","\n          />\n        </fieldset>\n      </form>\n    "])),this.performSearch,this.searchMultipleControls,this.setQuery,this.query)}},{key:"setErrorMessage",get:function(){return(0,o.dy)(bn||(bn=$n(['\n      <p class="error-message">',"</p>\n    "])),this.errorMessage)}},{key:"searchCTA",get:function(){return(0,o.dy)(gn||(gn=$n(['<p class="search-cta"><em>Please enter text to search for</em></p>'])))}},{key:"render",value:function(){var e=!(this.queryInProgress||this.errorMessage||this.queryInProgress||this.results.length);return(0,o.dy)(yn||(yn=$n(["\n      ","\n      ",'\n      <div class="results-container">\n        ',"\n        ","\n        ","\n        ","\n      </div>\n    "])),this.headerSection,this.searchForm,this.queryInProgress?this.loadingIndicator:a.Ld,this.errorMessage?this.setErrorMessage:a.Ld,this.results.length?this.resultsSet:a.Ld,e?this.searchCTA:a.Ld)}}])&&An(t.prototype,n),r&&An(t,r),c}(o.oi);function Rn(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function Hn(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}customElements.define("ia-book-search-results",Dn);var Nn,Fn,Un,Vn,Wn,qn,Zn,Gn,Xn,Yn,Jn,Qn={query:"",results:[],resultsCount:0,queryInProgress:!1,errorMessage:""},Kn=function(){function e(t){var n=t.onProviderChange,r=t.bookreader;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.onBookSearchInitiated=this.onBookSearchInitiated.bind(this),this.onSearchStarted=this.onSearchStarted.bind(this),this.onSearchRequestError=this.onSearchRequestError.bind(this),this.onSearchResultsClicked=this.onSearchResultsClicked.bind(this),this.onSearchResultsChange=this.onSearchResultsChange.bind(this),this.onSearchResultsCleared=this.onSearchResultsCleared.bind(this),this.searchCanceledInMenu=this.searchCanceledInMenu.bind(this),this.bindEventListeners=this.bindEventListeners.bind(this),this.getMenuDetails=this.getMenuDetails.bind(this),this.getComponent=this.getComponent.bind(this),this.advanceToPage=this.advanceToPage.bind(this),this.updateMenu=this.updateMenu.bind(this),this.onProviderChange=n,this.bookreader=r,this.icon=(0,o.dy)(zn||(zn=Rn(['<ia-icon-search style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon-search>']))),this.label="Search inside",this.menuDetails=this.getMenuDetails(),this.id="search",this.component=this.getComponent(),this.bindEventListeners()}var t,n;return t=e,(n=[{key:"getMenuDetails",value:function(){var e=Qn,t=e.resultsCount,n=e.query;if(e.queryInProgress||!n)return a.Ld;var r=1===t?"result":"results";return(0,o.dy)(Ln||(Ln=Rn(["("," ",")"])),t,r)}},{key:"bindEventListeners",value:function(){var e=this;window.addEventListener("BookReader:SearchStarted",this.onSearchStarted),window.addEventListener("BookReader:SearchCallback",this.onSearchResultsChange),window.addEventListener("BookReader:SearchCallbackEmpty",(function(t){e.onSearchRequestError(t,"noResults")})),window.addEventListener("BookReader:SearchCallbackNotIndexed",(function(t){e.onSearchRequestError(t,"notIndexed")})),window.addEventListener("BookReader:SearchCallbackError",(function(t){e.onSearchRequestError(t)})),window.addEventListener("BookReader:SearchResultsCleared",(function(){e.onSearchResultsCleared()})),window.addEventListener("BookReader:SearchCanceled",(function(t){e.onSearchCanceled(t)}))}},{key:"onSearchCanceled",value:function(){Qn={query:"",results:[],resultsCount:0,queryInProgress:!1,errorMessage:""},this.updateMenu({searchCanceled:!0})}},{key:"onSearchStarted",value:function(e){var t=e.detail.props,n=t.term,o=void 0===n?"":n,r=t.instance;r&&(this.bookreader=r),Qn.query=o,Qn.results=[],Qn.resultsCount=0,Qn.queryInProgress=!0,Qn.errorMessage="",this.updateMenu()}},{key:"onBookSearchInitiated",value:function(e){var t=e.detail;Qn.query=t.query,this.bookreader.search(Qn.query)}},{key:"onSearchRequestError",value:function(e){var t,n,r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"default",i=e.detail.props,s=void 0===i?{}:i,a=s.instance,l=void 0===a?null:a;l&&(this.bookreader=l);var c={noResults:"0 results",notIndexed:"This book hasn't been indexed for searching yet.  We've just started indexing it,\n       so search should be available soon.  Please try again later.  Thanks!",default:"Sorry, there was an error with your search.  Please try again."},d=null!==(t=c[r])&&void 0!==t?t:c.default;Qn.query=(null==l||null===(n=l.searchResults)||void 0===n?void 0:n.q)||"",Qn.results=[],Qn.resultsCount=0,Qn.queryInProgress=!1,Qn.errorMessage=(0,o.dy)(Pn||(Pn=Rn(['<p class="error">',"</p>"])),d),this.updateMenu()}},{key:"onSearchResultsChange",value:function(e){var t=e.detail.props,n=void 0===t?{}:t,o=n.instance,r=void 0===o?null:o,i=n.results,s=void 0===i?[]:i;r&&(this.bookreader=r);var a=s.matches||[],l=a.length,c=s.q;Qn={results:a,resultsCount:l,query:c,queryInProgress:!1,errorMessage:""},this.updateMenu()}},{key:"searchCanceledInMenu",value:function(){var e;null===(e=this.bookreader)||void 0===e||e.cancelSearchRequest()}},{key:"onSearchResultsCleared",value:function(){var e,t;Qn={query:"",results:[],resultsCount:0,queryInProgress:!1,errorMessage:""},this.updateMenu(),null===(e=this.bookreader)||void 0===e||null===(t=e.searchView)||void 0===t||t.clearSearchFieldAndResults()}},{key:"updateMenu",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};this.menuDetails=this.getMenuDetails(),this.component=this.getComponent(),this.onProviderChange(this.bookreader,e)}},{key:"getComponent",value:function(){var e=Qn,t=e.query,n=e.results,r=e.queryInProgress,i=e.errorMessage;return(0,o.dy)(Tn||(Tn=Rn(["\n    <ia-book-search-results\n      .query=","\n      .results=","\n      .errorMessage=","\n      ?queryInProgress=","\n      ?renderSearchAllFiles=","\n      @resultSelected=","\n      @bookSearchInitiated=","\n      @bookSearchResultsCleared=","\n      @bookSearchCanceled=","\n    ></ia-book-search-results>\n  "])),t,n,i,r,!1,this.onSearchResultsClicked,this.onBookSearchInitiated,this.onSearchResultsCleared,this.searchCanceledInMenu)}},{key:"onSearchResultsClicked",value:function(e){var t=e.detail.match.par[0].page;this.advanceToPage(t)}},{key:"advanceToPage",value:function(e){var t=this.bookreader.leafNumToIndex(e);this.bookreader._searchPluginGoToResult(t)}}])&&Hn(t.prototype,n),e}(),eo=(n(9601),a.dy`
<svg
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="downloadTitleID downloadDescID"
>
  <title id="downloadTitleID">Download icon</title>
  <desc id="downloadDescID">An arrow pointing downward at an empty document tray</desc>
  <g class="fill-color" fill-rule="nonzero">
    <path d="m1.04347826 22c-.57629713 0-1.04347826.4477153-1.04347826 1s.46718113 1 1.04347826 1h21.91304344c.5762972 0 1.0434783-.4477153 1.0434783-1s-.4671811-1-1.0434783-1z"/>
    <path d="m12 0c-.8284271 0-1.5.67526574-1.5 1.50824823v8.0007855h-4.75l6.25 10.49096627 6.25-10.49096627h-4.75v-8.0007855c0-.83298249-.6715729-1.50824823-1.5-1.50824823z"/>
  </g>
</svg>
`);class to extends o.oi{static get styles(){return o.iv`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}render(){return eo}}function no(e){return(no="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function oo(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function ro(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function io(e,t){return(io=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function so(e,t){if(t&&("object"===no(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}function ao(e){return(ao=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}customElements.define("ia-icon-dl",to);var lo,co,uo=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&io(e,t)}(c,e);var t,n,r,i,s,l=(i=c,s=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}(),function(){var e,t=ao(i);if(s){var n=ao(this).constructor;e=Reflect.construct(t,arguments,n)}else e=t.apply(this,arguments);return so(this,e)});function c(){var e;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,c),(e=l.call(this)).downloads=[],e.expiration=0,e.renderHeader=!1,e.isBookProtected=!1,e}return t=c,r=[{key:"properties",get:function(){return{downloads:{type:Array},expiration:{type:Number},renderHeader:{type:Boolean},isBookProtected:{type:Boolean}}}},{key:"styles",get:function(){var e=(0,o.iv)(Jn||(Jn=oo(["\n      :host {\n        display: block;\n        height: 100%;\n        padding: 1.5rem 0;\n        overflow-y: auto;\n        font-size: 1.4rem;\n        box-sizing: border-box;\n      }\n\n      a.close ia-icon {\n        --iconWidth: 18px;\n        --iconHeight: 18px;\n      }\n      a.close {\n        justify-self: end;\n      }\n\n      header {\n        display: flex;\n        align-items: center;\n        padding: 0 2rem;\n      }\n      header p {\n        padding: 0;\n        margin: 0;\n        font-size: 1.2rem;\n        font-weight: bold;\n        font-style: italic;\n      }\n      header div {\n        display: flex;\n        align-items: baseline;\n      }      \n\n      h2 {\n        font-size: 1.6rem;\n      }\n\n      h3 {\n        padding: 0;\n        margin: 0 1rem 0 0;\n        font-size: 1.4rem;\n      }\n\n      ul {\n        padding: 0;\n        margin: 0;\n        list-style: none;\n      }\n\n      p {\n        margin: .3rem 0 0 0;\n      }\n\n      li,\n      ul + p {\n        padding-bottom: 1.2rem;\n        font-size: 1.2rem;\n        line-height: 140%;\n      }\n    "])));return[Bn,e]}}],(n=[{key:"formatsCount",get:function(){var e=this.downloads.length;return e?(0,o.dy)(Nn||(Nn=oo(["<p>"," format","</p>"])),e,e>1?"s":""):(0,o.dy)(Fn||(Fn=oo([""])))}},{key:"loanExpiryMessage",get:function(){return this.expiration?(0,o.dy)(Un||(Un=oo(["<h2>These files will expire in "," days.</h2>"])),this.expiration):(0,o.dy)(Vn||(Vn=oo([""])))}},{key:"renderDownloadOptions",value:function(){return this.downloads.map((function(e){return(0,o.dy)(Wn||(Wn=oo(['\n        <li>\n          <a class="ia-button link primary" href="','">Get ',"</a>\n          ","\n        </li>\n      "])),e.url,e.type,e.note?(0,o.dy)(qn||(qn=oo(["<p>","</p>"])),e.note):(0,o.dy)(Zn||(Zn=oo([""]))))}))}},{key:"header",get:function(){return this.renderHeader?(0,o.dy)(Gn||(Gn=oo(["\n      <header>\n        <h3>Downloadable files</h3>\n        ","\n      </header>\n    "])),this.formatsCount):a.Ld}},{key:"accessProtectedBook",get:function(){return(0,o.dy)(Xn||(Xn=oo(['\n      <p>To access downloaded books, you need Adobe-compliant software on your device. The Internet Archive will administer this loan, but Adobe may also collect some information.</p>\n      <a class="ia-button external primary" href="https://www.adobe.com/solutions/ebook/digital-editions/download.html" rel="noopener noreferrer" target="_blank">Install Adobe Digital Editions</a>\n    '])))}},{key:"render",value:function(){return(0,o.dy)(Yn||(Yn=oo(["\n      ","\n      ","\n      <ul>","</ul>\n      ","\n    "])),this.header,this.loanExpiryMessage,this.renderDownloadOptions(),this.isBookProtected?this.accessProtectedBook:a.Ld)}}])&&ro(t.prototype,n),r&&ro(t,r),c}(o.oi);function ho(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){var n=null==e?null:"undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=n){var o,r,i=[],s=!0,a=!1;try{for(n=n.call(e);!(s=(o=n.next()).done)&&(i.push(o.value),!t||i.length!==t);s=!0);}catch(e){a=!0,r=e}finally{try{s||null==n.return||n.return()}finally{if(a)throw r}}return i}}(e,t)||function(e,t){if(e){if("string"==typeof e)return po(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?po(e,t):void 0}}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function po(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,o=new Array(t);n<t;n++)o[n]=e[n];return o}function fo(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function mo(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}customElements.define("ia-book-downloads",uo);var vo={pdf:{type:"Encrypted Adobe PDF",url:"#",note:"PDF files contain high quality images of pages."},epub:{type:"Encrypted Adobe ePub",url:"#",note:"ePub files are smaller in size, but may contain errors."}},bo={pdf:"PDF",epub:"ePub"},go=function(){function e(t){var n,r=t.bookreader;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.icon=(0,o.dy)(lo||(lo=fo(['<ia-icon-dl style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon-dl>']))),this.label="Downloadable files",this.menuDetails="",this.downloads=[],this.id="downloads",this.component="",this.isBookProtected=(null==r||null===(n=r.options)||void 0===n?void 0:n.isProtected)||!1,this.computeAvailableTypes=this.computeAvailableTypes.bind(this),this.update=this.update.bind(this)}var t,n;return t=e,(n=[{key:"update",value:function(e){this.computeAvailableTypes(e),this.component=this.menu,this.component.isBookProtected=this.isBookProtected;var t=1===this.downloads.length?"":"s";this.menuDetails="(".concat(this.downloads.length," format").concat(t,")")}},{key:"computeAvailableTypes",value:function(){var e=this,t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[],n=t.reduce((function(t){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],o=ho(n,2),r=o[0],i=void 0===r?"":r,s=o[1],a=void 0===s?"":s,l=i.toLowerCase(),c=vo[l]||null;if(c){var d=e.isBookProtected?vo[l].type:bo[l],u=Object.assign({},c,{url:a,type:d});t.push(u)}return t}),[]);this.downloads=n}},{key:"menu",get:function(){return(0,o.dy)(co||(co=fo(["<ia-book-downloads .downloads=","></ia-book-downloads>"])),this.downloads)}}])&&mo(t.prototype,n),e}(),yo=(n(9600),a.dy`
<svg
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="visualAdjustmentTitleID visualAdjustmentDescID"
>
  <title id="visualAdjustmentTitleID">Visual adjustment</title>
  <desc id="visualAdjustmentDescID">A circle with its left hemisphere filled</desc>
  <path class="fill-color" d="m12 0c6.627417 0 12 5.372583 12 12s-5.372583 12-12 12-12-5.372583-12-12 5.372583-12 12-12zm0 2v20l.2664041-.0034797c5.399703-.1412166 9.7335959-4.562751 9.7335959-9.9965203 0-5.5228475-4.4771525-10-10-10z" fill-rule="evenodd" />
</svg>
`);class ko extends o.oi{static get styles(){return o.iv`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}render(){return yo}}function wo(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,o=new Array(t);n<t;n++)o[n]=e[n];return o}customElements.define("ia-icon-visual-adjustment",ko),n(1532);var Co=function(e,t){var n=e.startNode.parentNode,o=void 0===t?e.endNode:t.startNode,r=n.insertBefore((0,a.IW)(),o);n.insertBefore((0,a.IW)(),o);var i=new a.nt(e.options);return i.insertAfterNode(r),i},So=function(e,t){return e.setValue(t),e.commit(),e},xo=function(e,t,n){var o=e.startNode.parentNode,r=n?n.startNode:e.endNode,i=t.endNode.nextSibling;i!==r&&(0,a.V)(o,t.startNode,i,r)},Oo=function(e){(0,a.r4)(e.startNode.parentNode,e.startNode,e.endNode.nextSibling)},Eo=function(e,t,n){for(var o=new Map,r=t;r<=n;r++)o.set(e[r],r);return o},Bo=new WeakMap,_o=new WeakMap,$o=(0,a.XM)((function(e,t,n){var o;return void 0===n?n=t:void 0!==t&&(o=t),function(t){if(!(t instanceof a.nt))throw new Error("repeat can only be used in text bindings");var r,i,s,l=Bo.get(t)||[],c=_o.get(t)||[],d=[],u=[],h=[],p=0,f=function(e,t){var n="undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(!n){if(Array.isArray(e)||(n=function(e,t){if(e){if("string"==typeof e)return wo(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?wo(e,t):void 0}}(e))||t&&e&&"number"==typeof e.length){n&&(e=n);var o=0,r=function(){};return{s:r,n:function(){return o>=e.length?{done:!0}:{done:!1,value:e[o++]}},e:function(e){throw e},f:r}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,s=!0,a=!1;return{s:function(){n=n.call(e)},n:function(){var e=n.next();return s=e.done,e},e:function(e){a=!0,i=e},f:function(){try{s||null==n.return||n.return()}finally{if(a)throw i}}}}(e);try{for(f.s();!(r=f.n()).done;){var m=r.value;h[p]=o?o(m,p):p,u[p]=n(m,p),p++}}catch(e){f.e(e)}finally{f.f()}for(var v=0,b=l.length-1,g=0,y=u.length-1;v<=b&&g<=y;)if(null===l[v])v++;else if(null===l[b])b--;else if(c[v]===h[g])d[g]=So(l[v],u[g]),v++,g++;else if(c[b]===h[y])d[y]=So(l[b],u[y]),b--,y--;else if(c[v]===h[y])d[y]=So(l[v],u[y]),xo(t,l[v],d[y+1]),v++,y--;else if(c[b]===h[g])d[g]=So(l[b],u[g]),xo(t,l[b],l[v]),b--,g++;else if(void 0===i&&(i=Eo(h,g,y),s=Eo(c,v,b)),i.has(c[v]))if(i.has(c[b])){var k=s.get(h[g]),w=void 0!==k?l[k]:null;if(null===w){var C=Co(t,l[v]);So(C,u[g]),d[g]=C}else d[g]=So(w,u[g]),xo(t,w,l[v]),l[k]=null;g++}else Oo(l[b]),b--;else Oo(l[v]),v++;for(;g<=y;){var S=Co(t,d[y+1]);So(S,u[g]),d[g++]=S}for(;v<=b;){var x=l[v++];null!==x&&Oo(x)}Bo.set(t,d),_o.set(t,h)}})),Ao=a.dy`
<svg
  viewBox="0 0 18 18"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="magnify-minusTitleID magnify-minusDescID"
>
  <title id="magnify-minusTitleID">Zoom out</title>
  <desc id="magnify-minusDescID">Take a look further.</desc>
  <g
    class="fill-color"
    fill="none"
    fill-rule="nonzero"
  >
    <path d="m7 0c3.854149 0 7 3.1458514 7 7 0 1.5717634-.529107 3.020558-1.410156 4.191406.0416324.03077.0808125.0647264.117187.101563l4.335938 4.335937c.3904239.3905071.3904239 1.0235559 0 1.414063-.3905071.3904239-1.0235559.3904239-1.414063 0l-4.335937-4.335938c-.0362414-.0370712-.0695452-.0769047-.09961-.11914-1.171224.882043-2.6206167 1.412109-4.193359 1.412109-3.8541486 0-7-3.145851-7-7 0-3.8541486 3.1458514-7 7-7zm0 2c-2.7732684 0-5 2.2267316-5 5s2.2267316 5 5 5 5-2.2267316 5-5-2.2267316-5-5-5z"/>
    <path d="m10 7.75v-1.5h-6v1.5z"/>
  </g>
</svg>
`;class jo extends o.oi{static get styles(){return o.iv`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}render(){return Ao}}customElements.define("ia-icon-magnify-minus",jo);var Mo,Io,zo,Lo,Po,To,Do,Ro=a.dy`
<svg
  viewBox="0 0 18 18"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="magnify-plusTitleID magnify-plusDescID"
>
  <title id="magnify-plusTitleID">Zoom in</title>
  <desc id="magnify-plusDescID">Take a look closer.</desc>
  <g
    class="fill-color"
    fill="none"
    fill-rule="nonzero"
  >
    <path d="m7 0c3.854149 0 7 3.1458514 7 7 0 1.5717634-.529107 3.020558-1.410156 4.191406.0416324.03077.0808125.0647264.117187.101563l4.335938 4.335937c.3904239.3905071.3904239 1.0235559 0 1.414063-.3905071.3904239-1.0235559.3904239-1.414063 0l-4.335937-4.335938c-.0362414-.0370712-.0695452-.0769047-.09961-.11914-1.171224.882043-2.6206167 1.412109-4.193359 1.412109-3.8541486 0-7-3.145851-7-7 0-3.8541486 3.1458514-7 7-7zm0 2c-2.7732684 0-5 2.2267316-5 5s2.2267316 5 5 5 5-2.2267316 5-5-2.2267316-5-5-5z"/>
    <path d="m7.75 4v2.25h2.25v1.5h-2.25v2.25h-1.5v-2.25h-2.25v-1.5h2.25v-2.25z"/>
  </g>
</svg>
`;class Ho extends o.oi{static get styles(){return o.iv`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}render(){return Ro}}function No(e){return(No="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function Fo(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function Uo(e){return function(e){if(Array.isArray(e))return Vo(e)}(e)||function(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(e)||function(e,t){if(e){if("string"==typeof e)return Vo(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?Vo(e,t):void 0}}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function Vo(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,o=new Array(t);n<t;n++)o[n]=e[n];return o}function Wo(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function qo(e,t){return(qo=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function Zo(e,t){if(t&&("object"===No(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}function Go(e){return(Go=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}customElements.define("ia-icon-magnify-plus",Ho);var Xo,Yo,Jo=function(e){return"visualAdjustment".concat(e)},Qo={optionChange:Jo("OptionChanged"),zoomIn:Jo("ZoomIn"),zoomOut:Jo("ZoomOut")},Ko=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&qo(e,t)}(c,e);var t,n,r,i,s,l=(i=c,s=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}(),function(){var e,t=Go(i);if(s){var n=Go(this).constructor;e=Reflect.construct(t,arguments,n)}else e=t.apply(this,arguments);return Zo(this,e)});function c(){var e;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,c),(e=l.call(this)).activeCount=0,e.options=[],e.renderHeader=!1,e.showZoomControls=!0,e}return t=c,r=[{key:"properties",get:function(){return{activeCount:{type:Number},options:{type:Array},renderHeader:{type:Boolean},showZoomControls:{type:Boolean}}}},{key:"styles",get:function(){return(0,o.iv)(Do||(Do=Fo(['\n    :host {\n      display: block;\n      height: 100%;\n      overflow-y: auto;\n      font-size: 1.4rem;\n      box-sizing: border-box;\n    }\n\n    header {\n      display: flex;\n      align-items: baseline;\n    }\n\n    h3 {\n      padding: 0;\n      margin: 0 1rem 0 0;\n      font-size: 1.6rem;\n    }\n\n    header p {\n      padding: 0;\n      margin: 0;\n      font-size: 1.2rem;\n      font-weight: bold;\n      font-style: italic;\n    }\n\n    ul {\n      padding: 1rem 2rem 0 0;\n      list-style: none;\n      margin-top: 0;\n    }\n\n    [type="checkbox"] {\n      display: none;\n    }\n\n    label {\n      display: flex;\n      justify-content: space-between;\n      align-items: baseline;\n      font-size: 1.4rem;\n      font-weight: bold;\n      line-height: 150%;\n      vertical-align: middle;\n    }\n\n    .icon {\n      display: inline-block;\n      width: 14px;\n      height: 14px;\n      margin-left: .7rem;\n      border: 1px solid var(--primaryTextColor);\n      border-radius: 2px;\n      background: var(--activeButtonBg) 50% 50% no-repeat;\n    }\n    :checked + .icon {\n      background-image: url(\'',"');\n    }\n\n    .range {\n      display: none;\n      padding-top: .5rem;\n    }\n    .range.visible {\n      display: flex;\n    }\n\n    .range p {\n      margin-left: 1rem;\n    }\n\n    h4 {\n      padding: 1rem 0;\n      margin: 0;\n      font-size: 1.4rem;\n    }\n\n    button {\n      -webkit-appearance: none;\n      appearance: none;\n      border: none;\n      border-radius: 0;\n      background: transparent;\n      outline: none;\n      cursor: pointer;\n      --iconFillColor: var(--primaryTextColor);\n      --iconStrokeColor: var(--primaryTextColor);\n      height: 4rem;\n      width: 4rem;\n    }\n\n    button * {\n      display: inline-block;\n    }"])),On)}}],(n=[{key:"firstUpdated",value:function(){this.activeCount=this.activeOptions.length,this.emitOptionChangedEvent()}},{key:"activeOptions",get:function(){return this.options.reduce((function(e,t){return t.active?[].concat(Uo(e),[t.id]):e}),[])}},{key:"prepareEventDetails",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";return{options:this.options,activeCount:this.activeCount,changedOptionId:e}}},{key:"emitOptionChangedEvent",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",t=this.prepareEventDetails(e);this.dispatchEvent(new CustomEvent(Qo.optionChange,{bubbles:!0,composed:!0,detail:t}))}},{key:"emitZoomIn",value:function(){this.dispatchEvent(new CustomEvent(Qo.zoomIn))}},{key:"emitZoomOut",value:function(){this.dispatchEvent(new CustomEvent(Qo.zoomOut))}},{key:"changeActiveStateFor",value:function(e){var t=Uo(this.options),n=t.find((function(t){return t.id===e}));n.active=!n.active,this.options=t,this.activeCount=this.activeOptions.length,this.emitOptionChangedEvent(n.id)}},{key:"setRangeValue",value:function(e,t){var n=Uo(this.options);n.find((function(t){return t.id===e})).value=t,this.options=Uo(n)}},{key:"rangeSlider",value:function(e){var t=this;return(0,o.dy)(Mo||(Mo=Fo(["\n      <div class=",'>\n        <input\n          type="range"\n          name="','_range"\n          min=',"\n          max=","\n          step=","\n          .value=","\n          @input=","\n          @change=","\n        />\n        <p>","%</p>\n      </div>\n    "])),"range".concat(e.active?" visible":""),e.id,e.min||0,e.max||100,e.step||1,e.value,(function(n){return t.setRangeValue(e.id,n.target.value)}),(function(){return t.emitOptionChangedEvent()}),e.value)}},{key:"adjustmentCheckbox",value:function(e){var t=this,n="adjustment_".concat(e.id);return(0,o.dy)(Io||(Io=Fo(['<li>\n      <label for="','">\n        <span class="name">','</span>\n        <input\n          type="checkbox"\n          name="','"\n          id="','"\n          @change=',"\n          ?checked=",'\n        />\n        <span class="icon"></span>\n      </label>\n      ',"\n    </li>"])),n,e.name,n,n,(function(){return t.changeActiveStateFor(e.id)}),e.active,void 0!==e.value?this.rangeSlider(e):a.Ld)}},{key:"headerSection",get:function(){var e=this.activeCount?(0,o.dy)(zo||(zo=Fo(["<p>("," active)</p>"])),this.activeCount):a.Ld,t=(0,o.dy)(Lo||(Lo=Fo(["<header>\n      <h3>Visual adjustments</h3>\n      ","\n    </header>"])),e);return this.renderHeader?t:a.Ld}},{key:"zoomControls",get:function(){return(0,o.dy)(Po||(Po=Fo(['\n      <h4>Zoom</h4>\n      <button class="zoom_out" @click=',' title="zoom out">\n        <ia-icon-magnify-minus></ia-icon-magnify-minus>\n      </button>\n      <button class="zoom_in" @click=',' title="zoom in">\n        <ia-icon-magnify-plus></ia-icon-magnify-plus>\n      </button>\n    '])),this.emitZoomOut,this.emitZoomIn)}},{key:"render",value:function(){return(0,o.dy)(To||(To=Fo(["\n      ","\n      <ul>\n        ","\n      </ul>\n      ","\n    "])),this.headerSection,$o(this.options,(function(e){return e.id}),this.adjustmentCheckbox.bind(this)),this.showZoomControls?this.zoomControls:a.Ld)}}])&&Wo(t.prototype,n),r&&Wo(t,r),c}(o.oi);function er(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,o=new Array(t);n<t;n++)o[n]=e[n];return o}function tr(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function nr(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}customElements.define("ia-book-visual-adjustments",Ko);var or,rr,ir=[{id:"brightness",name:"Adjust brightness",active:!1,min:0,max:150,step:1,value:100},{id:"contrast",name:"Adjust contrast",active:!1,min:0,max:150,step:1,value:100},{id:"invert",name:"Inverted colors (dark mode)",active:!1},{id:"grayscale",name:"Grayscale",active:!1}],sr=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e);var n=t.onProviderChange,r=t.bookreader;this.onProviderChange=n,this.bookContainer=r.refs.$brContainer,this.bookreader=r,this.onAdjustmentChange=this.onAdjustmentChange.bind(this),this.optionUpdateComplete=this.optionUpdateComplete.bind(this),this.updateOptionsCount=this.updateOptionsCount.bind(this),this.onZoomIn=this.onZoomIn.bind(this),this.onZoomOut=this.onZoomOut.bind(this),this.activeCount=0,this.icon=(0,o.dy)(Xo||(Xo=tr(['<ia-icon-visual-adjustment style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon-visual-adjustment>']))),this.label="Visual Adjustments",this.menuDetails=this.updateOptionsCount(),this.id="adjustment",this.component=(0,o.dy)(Yo||(Yo=tr(["\n      <ia-book-visual-adjustments\n        .options=","\n        @visualAdjustmentOptionChanged=","\n        @visualAdjustmentZoomIn=","\n        @visualAdjustmentZoomOut=","\n      ></ia-book-visual-adjustments>\n    "])),ir,this.onAdjustmentChange,this.onZoomIn,this.onZoomOut)}var t,n;return t=e,(n=[{key:"onZoomIn",value:function(){this.bookreader.zoom(1)}},{key:"onZoomOut",value:function(){this.bookreader.zoom(-1)}},{key:"onAdjustmentChange",value:function(e){var t=e.detail,n={brightness:function(e){return"brightness(".concat(e,"%)")},contrast:function(e){return"contrast(".concat(e,"%)")},grayscale:function(){return"grayscale(100%)"},invert:function(){return"invert(100%)"}},o=t.options.reduce((function(e,t){var o,r="".concat(t.active?n[t.id](t.value):"");return r?[].concat(function(e){if(Array.isArray(e))return er(e)}(o=e)||function(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(o)||function(e,t){if(e){if("string"==typeof e)return er(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?er(e,t):void 0}}(o)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}(),[r]):e}),[]).join(" ");this.bookContainer.css("filter",o),this.optionUpdateComplete(e)}},{key:"optionUpdateComplete",value:function(e){this.activeCount=e.detail.activeCount,this.updateOptionsCount(e),this.onProviderChange()}},{key:"updateOptionsCount",value:function(){this.menuDetails="(".concat(this.activeCount," active)")}}])&&nr(t.prototype,n),e}();function ar(e){return(ar="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function lr(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function cr(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function dr(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function ur(e,t){return(ur=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function hr(e,t){if(t&&("object"===ar(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}function pr(e){return(pr=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var fr,mr,vr=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&ur(e,t)}(l,e);var t,n,r,i,s,a=(i=l,s=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}(),function(){var e,t=pr(i);if(s){var n=pr(this).constructor;e=Reflect.construct(t,arguments,n)}else e=t.apply(this,arguments);return hr(this,e)});function l(){return cr(this,l),a.apply(this,arguments)}return t=l,r=[{key:"styles",get:function(){return(0,o.iv)(rr||(rr=lr(['\n      div {\n        display: flex;\n        justify-content: center;\n        padding-top: 2rem;\n      }\n\n      button {\n        appearance: none;\n        padding: 0.5rem 1rem;\n        margin: 0 .5rem;\n        box-sizing: border-box;\n        font: 1.3rem "Helvetica Neue", Helvetica, Arial, sans-serif;\n        color: var(--primaryTextColor);\n        border: none;\n        border-radius: 4px;\n        cursor: pointer;\n        background: var(--primaryCTAFill);\n      }\n\n      .delete {\n        background: var(--primaryErrorCTAFill);\n      }\n    '])))}},{key:"properties",get:function(){return{cancelAction:{type:Function},deleteAction:{type:Function},pageID:{type:String}}}}],(n=[{key:"render",value:function(){var e=this;return(0,o.dy)(or||(or=lr(['\n      <div>\n        <button class="delete" @click=',">Delete</button>\n        <button @click=",">Cancel</button>\n      </div>\n    "])),(function(){return e.deleteAction({detail:{id:"".concat(e.pageID)}})}),(function(){return e.cancelAction()}))}}])&&dr(t.prototype,n),r&&dr(t,r),l}(o.oi);function br(e){return(br="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function gr(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function yr(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function kr(e,t){return(kr=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function wr(e,t){if(t&&("object"===br(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}function Cr(e){return(Cr=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}customElements.define("delete-modal-actions",vr);var Sr,xr=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&kr(e,t)}(l,e);var t,n,r,i,s,a=(i=l,s=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}(),function(){var e,t=Cr(i);if(s){var n=Cr(this).constructor;e=Reflect.construct(t,arguments,n)}else e=t.apply(this,arguments);return wr(this,e)});function l(){var e;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,l),(e=a.call(this)).state="hollow",e.side=void 0,e}return t=l,r=[{key:"styles",get:function(){return(0,o.iv)(mr||(mr=gr(["\n      button {\n        -webkit-appearance: none;\n        appearance: none;\n        outline: 0;\n        border: none;\n        padding: 0;\n        height: 4rem;\n        width: 4rem;\n        background: transparent;\n        cursor: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' viewBox='0 0 16 24' width='16'%3E%3Cg fill='%23333' fill-rule='evenodd'%3E%3Cpath d='m15 0c.5522847 0 1 .44771525 1 1v23l-8-5.4545455-8 5.4545455v-23c0-.55228475.44771525-1 1-1zm-2 2h-10c-.51283584 0-.93550716.38604019-.99327227.88337887l-.00672773.11662113v18l6-4.3181818 6 4.3181818v-18c0-.51283584-.3860402-.93550716-.8833789-.99327227z'/%3E%3Cpath d='m8.75 6v2.25h2.25v1.5h-2.25v2.25h-1.5v-2.25h-2.25v-1.5h2.25v-2.25z' fill-rule='nonzero'/%3E%3C/g%3E%3C/svg%3E\"), pointer;\n        position: relative;\n      }\n      button > * {\n        display: block;\n        position: absolute;\n        top: 0.2rem;\n      }\n      button.left > * {\n        left: 0.2rem;\n      }\n\n      button.right > * {\n        right: 0.2rem;\n      }\n    "])))}},{key:"properties",get:function(){return{side:{type:String},state:{type:String}}}}],(n=[{key:"handleClick",value:function(e){e.preventDefault(),this.dispatchEvent(new CustomEvent("bookmarkButtonClicked"))}},{key:"title",get:function(){return"".concat("hollow"===this.state?"Add":"Remove"," bookmark")}},{key:"render",value:function(){var e=this.side||"right";return(0,o.dy)(fr||(fr=gr(["\n      <button title="," @click="," class=",">\n        <icon-bookmark state=","></icon-bookmark>\n      </button>\n    "])),this.title,this.handleClick,e,this.state)}}])&&yr(t.prototype,n),r&&yr(t,r),l}(o.oi);function Or(e){return(Or="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function Er(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function Br(e,t){return(Br=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function _r(e,t){if(t&&("object"===Or(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}function $r(e){return($r=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}customElements.define("bookmark-button",xr),n(8674),n(6699),n(2023);var Ar,jr,Mr,Ir,zr,Lr,Pr,Tr,Dr,Rr=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&Br(e,t)}(l,e);var t,n,r,i,s,a=(i=l,s=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}(),function(){var e,t=$r(i);if(s){var n=$r(this).constructor;e=Reflect.construct(t,arguments,n)}else e=t.apply(this,arguments);return _r(this,e)});function l(){var e;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,l),(e=a.call(this)).url="https://archive.org/account/login",e}return t=l,r=[{key:"properties",get:function(){return{url:{type:String}}}},{key:"styles",get:function(){return Bn}}],(n=[{key:"render",value:function(){return(0,o.dy)(Sr||(Sr=function(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}(['\n      <p>A free account is required to save and access bookmarks.</p>\n      <a class="ia-button link primary" href="','">Log in</a>\n    '])),this.url)}}])&&Er(t.prototype,n),r&&Er(t,r),l}(o.oi);function Hr(e){return(Hr="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function Nr(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function Fr(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,o)}return n}function Ur(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?Fr(Object(n),!0).forEach((function(t){Vr(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):Fr(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function Vr(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function Wr(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function qr(e,t){return(qr=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function Zr(e,t){if(t&&("object"===Hr(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}function Gr(e){return(Gr=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}customElements.define("bookmarks-login",Rr);var Xr,Yr={endpoint:"/services/bookmarks.php",headers:{"Content-Type":"application/json"},delete:function(e){return fetch("".concat(this.endpoint,"?identifier=").concat(this.identifier,"&page_num=").concat(e),{credentials:"same-origin",method:"DELETE",headers:this.headers})},get:function(e){return fetch("".concat(this.endpoint,"?identifier=").concat(this.identifier,"&page_num=").concat(e),{credentials:"same-origin",method:"GET",headers:this.headers})},getAll:function(){return fetch("".concat(this.endpoint,"?identifier=").concat(this.identifier),{credentials:"same-origin",method:"GET",headers:this.headers})},post:function(e){return this.sendBookmarkData(e,"POST")},put:function(e){return this.sendBookmarkData(e,"POST")},sendBookmarkData:function(e,t){var n={note:e.note,color:e.color};return fetch("".concat(this.endpoint,"?identifier=").concat(this.identifier,"&page_num=").concat(e.id),{credentials:"same-origin",method:t,headers:this.headers,body:JSON.stringify({notes:n})})}},Jr=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&qr(e,t)}(c,e);var t,n,r,i,s,l=(i=c,s=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}(),function(){var e,t=Gr(i);if(s){var n=Gr(this).constructor;e=Reflect.construct(t,arguments,n)}else e=t.apply(this,arguments);return Zr(this,e)});function c(){var e;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,c),(e=l.call(this)).bookmarks=[],e.bookreader={},e.editedBookmark={},e.modal=void 0,e.loginOptions={loginClicked:function(){},loginUrl:""},e.displayMode="bookmarks",e.bookmarkColors=[{id:0,className:"red"},{id:1,className:"blue"},{id:2,className:"green"}],e.defaultColor=e.bookmarkColors[0],e.api=Yr,e.deleteModalConfig=new jt({title:"Delete Bookmark",headline:"This bookmark contains a note. Deleting it will permanently delete the note. Are you sure?",headerColor:"#194880"}),e}return t=c,r=[{key:"properties",get:function(){return{activeBookmarkID:{type:String},bookmarks:{type:Array},bookreader:{type:Object},displayMode:{type:String},editedBookmark:{type:Object},deleteModalConfig:{type:Object},modal:{attribute:!1},loginOptions:{type:Object,attribute:!1}}}},{key:"styles",get:function(){var e=(0,o.iv)(Dr||(Dr=Nr(["\n      .bookmarks {\n        height: 100%;\n        overflow: hidden;\n        padding-bottom: 20px;\n      }\n\n      .list ia-bookmark-edit {\n        display: none;\n      }\n\n      .edit ia-bookmarks-list {\n        display: none;\n      }\n    "])));return[Bn,e]}},{key:"formatPage",value:function(e){return isNaN(+e)?"(".concat(e.replace(/\D/g,""),")"):e}}],(n=[{key:"updated",value:function(e){e.has("displayMode")&&this.updateDisplay(),this.emitBookmarksChanged()}},{key:"setup",value:function(){this.api.identifier=this.bookreader.bookId,"login"!==this.displayMode&&(this.fetchUserBookmarks(),this.setBREventListeners())}},{key:"updateDisplay",value:function(){"bookmarks"===this.displayMode&&this.fetchUserBookmarks()}},{key:"fetchUserBookmarks",value:function(){var e=this;this.api.identifier&&this.fetchBookmarks().then((function(){e.initializeBookmarks()}))}},{key:"setBREventListeners",value:function(){var e=this;["3PageViewSelected"].forEach((function(t){window.addEventListener("BookReader:".concat(t),(function(t){setTimeout((function(){e.renderBookmarkButtons()}),100)}))})),["pageChanged","1PageViewSelected","2PageViewSelected"].forEach((function(t){window.addEventListener("BookReader:".concat(t),(function(t){setTimeout((function(){e.renderBookmarkButtons(),e.markActiveBookmark()}),100)}))})),["zoomOut","zoomIn","resize"].forEach((function(t){window.addEventListener("BookReader:".concat(t),(function(){e.renderBookmarkButtons()}))}))}},{key:"initializeBookmarks",value:function(){this.renderBookmarkButtons(),this.markActiveBookmark(!0),this.emitBookmarksChanged()}},{key:"formatBookmark",value:function(e){var t=e.leafNum,n=void 0===t?"":t,o=e.notes,r=void 0===o?{}:o,i=r.note,s=void 0===i?"":i,a=r.color,l={note:s,color:this.getBookmarkColor(a)?a:this.defaultColor.id},d=c.formatPage(this.bookreader.getPageNum(n)),u=this.bookreader.getPageURI("".concat(n).replace(/\D/g,""),32);return Ur(Ur({},l),{},{id:n,leafNum:n,page:d,thumbnail:u})}},{key:"fetchBookmarks",value:function(){var e=this;return this.api.getAll().then((function(e){return e.text()})).then((function(e){var t;try{t=JSON.parse(e)}catch(e){t={error:e.message}}return t})).then((function(t){var n,o=t.success,r=t.error,i=void 0===r?"Something happened while fetching bookmarks.":r,s=t.value,a=void 0===s?[]:s;o||null===(n=console)||void 0===n||n.warn("Error fetching bookmarks",i);var l={};return Object.keys(a).forEach((function(t){var n=a[t],o=parseInt(t,10),r=e.formatBookmark(Ur(Ur({},n),{},{leafNum:o}));l[t]=r})),e.bookmarks=l,l}))}},{key:"emitBookmarksChanged",value:function(){this.dispatchEvent(new CustomEvent("bookmarksChanged",{bubbles:!0,composed:!0,detail:{bookmarks:this.bookmarks}}))}},{key:"emitBookmarkButtonClicked",value:function(){this.dispatchEvent(new CustomEvent("bookmarkButtonClicked",{bubbles:!0,composed:!0,detail:{editedBookmark:this.editedBookmark}}))}},{key:"bookmarkButtonClicked",value:function(e){this.getBookmark(e)?this.confirmDeletion(e):this.createBookmark(e)}},{key:"renderBookmarkButtons",value:function(){var e=this;this.bookreader.$(".BRpagecontainer").not(".BRemptypage").get().forEach((function(t){var n=t.querySelector(".bookmark-button");n&&n.remove();var r=+t.classList.value.match(/pagediv\d+/)[0].replace(/\D/g,""),i=e.getBookmark(r),s=i?"filled":"hollow";if(e.bookreader._models.book.getPage(r).isViewable){var l=document.createElement("div");["mousedown","mouseup"].forEach((function(e){l.addEventListener(e,(function(e){return e.stopPropagation()}))})),l.classList.add("bookmark-button",s),i&&l.classList.add(e.getBookmarkColor(i.color));var c="L"===t.getAttribute("data-side")&&e.bookreader.mode===e.bookreader.constMode2up?"left":"right";(0,a.sY)((0,o.dy)(Ar||(Ar=Nr(["\n        <bookmark-button\n          @bookmarkButtonClicked=","\n          state=","\n          side=","\n        ></bookmark-button>"])),(function(){return e.bookmarkButtonClicked(r)}),s,c),l),t.appendChild(l)}}))}},{key:"markActiveBookmark",value:function(){var e=arguments.length>0&&void 0!==arguments[0]&&arguments[0],t=this.bookreader,n=t.mode,o=t.constMode2up,r=t.constModeThumb,i=this.bookreader.currentIndex();if(n!==r){if(n===o){var s=this.bookreader.displayedIndices,a=s.includes(+this.activeBookmarkID);if(a)return}this.bookmarks[i]?this.activeBookmarkID=i:this.activeBookmarkID=""}else{var l=this.bookmarks[i];e&&l&&(this.activeBookmarkID=i)}}},{key:"bookmarkEdited",value:function(e){var t=e.detail,n=t.bookmark.id===this.editedBookmark.id;this.editedBookmark=n?{}:t.bookmark}},{key:"getBookmark",value:function(e){return this.bookmarks[e]}},{key:"getBookmarkColor",value:function(e){var t;return null===(t=this.bookmarkColors.find((function(t){return t.id===e})))||void 0===t?void 0:t.className}},{key:"addBookmark",value:function(){var e=this.bookreader.currentIndex();if(this.bookreader.mode===this.bookreader.constMode2up){var t=this.bookreader.displayedIndices;e=t[t.length-1]}this.createBookmark(e)}},{key:"createBookmark",value:function(e){var t=this.getBookmark(e);if(t)return this.bookmarkEdited({detail:{bookmark:t}}),void this.emitBookmarkButtonClicked();this.editedBookmark=this.formatBookmark({leafNum:e}),this.api.post(this.editedBookmark),this.bookmarks[e]=this.editedBookmark,this.activeBookmarkID=e,this.disableAddBookmarkButton=!0,this.renderBookmarkButtons(),this.emitBookmarkButtonClicked()}},{key:"bookmarkSelected",value:function(e){var t=e.detail.bookmark.leafNum;this.bookreader.jumpToPage("".concat(this.bookreader.getPageNum("".concat(t).replace(/\D/g,"")))),this.activeBookmarkID=t}},{key:"saveBookmark",value:function(e){var t=e.detail,n=this.bookmarks[t.bookmark.id];Object.assign(n,t.bookmark),this.api.put(n),this.editedBookmark={},this.renderBookmarkButtons()}},{key:"confirmDeletion",value:function(e){this.getBookmark(e).note?this.displayDeletionModal(e):this.deleteBookmark({detail:{id:"".concat(e)}})}},{key:"displayDeletionModal",value:function(e){var t=this,n=(0,o.dy)(jr||(jr=Nr(["\n      <delete-modal-actions\n        .deleteAction=","\n        .cancelAction=","\n        .pageID=","\n      ></delete-modal-actions>\n    "])),(function(){return t.deleteBookmark({detail:{id:"".concat(e)}})}),(function(){return t.modal.closeModal()}),e);this.modal.showModal({config:this.deleteModalConfig,customModalContent:n})}},{key:"deleteBookmark",value:function(e){var t=e.detail,n=t.id,o=this.bookmarks;delete o[n],this.bookmarks=Ur({},o),this.api.delete(t.id),this.editedBookmark={},this.modal.closeModal(),this.renderBookmarkButtons()}},{key:"shouldEnableAddBookmarkButton",get:function(){var e=this.bookreader.mode===this.bookreader.constMode2up?this.bookreader.displayedIndices[this.bookreader.displayedIndices.length-1]:this.bookreader.currentIndex();return!!this.getBookmark(e)}},{key:"allowAddingBookmark",get:function(){return this.bookreader.mode!==this.bookreader.constModeThumb}},{key:"addBookmarkButton",get:function(){return(0,o.dy)(Mr||(Mr=Nr(['\n      <button\n        class="ia-button primary"\n        tabindex="-1"\n        ?disabled=',"\n        @click=",">\n        Add bookmark\n      </button>\n    "])),this.shouldEnableAddBookmarkButton,this.addBookmark)}},{key:"bookmarksList",get:function(){return(0,o.dy)(Ir||(Ir=Nr(["\n      <ia-bookmarks-list\n        @bookmarkEdited=","\n        @bookmarkSelected=","\n        @saveBookmark=","\n        @deleteBookmark=","\n        .editedBookmark=","\n        .bookmarks=","\n        .activeBookmarkID=","\n        .bookmarkColors=","\n        .defaultBookmarkColor=",">\n      </ia-bookmarks-list>\n    "])),this.bookmarkEdited,this.bookmarkSelected,this.saveBookmark,this.deleteBookmark,this.editedBookmark,Ur({},this.bookmarks),this.activeBookmarkID,this.bookmarkColors,this.defaultColor)}},{key:"bookmarkHelperMessage",get:function(){return(0,o.dy)(zr||(zr=Nr(["<p>Please use 1up or 2up view modes to add bookmark.</p>"])))}},{key:"render",value:function(){var e=this,t=(0,o.dy)(Lr||(Lr=Nr(["\n      ","\n      ","\n    "])),this.bookmarksList,this.allowAddingBookmark?this.addBookmarkButton:this.bookmarkHelperMessage);return(0,o.dy)(Pr||(Pr=Nr(['\n      <section class="bookmarks">\n      ',"\n      </section>\n    "])),"login"===this.displayMode?(0,o.dy)(Tr||(Tr=Nr(["<bookmarks-login\n        @click=","\n        .url=","></bookmarks-login>"])),(function(){return e.loginOptions.loginClicked()}),this.loginOptions.loginUrl):t)}}])&&Wr(t.prototype,n),r&&Wr(t,r),c}(o.oi);customElements.define("ia-bookmarks",Jr);var Qr,Kr,ei,ti,ni,oi=(0,o.iv)(Xr||(Xr=function(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}(["\n  .blue {\n    --iconFillColor: var(--blueBookmarkColor, #0023f5);\n  }\n\n  .red {\n    --iconFillColor: var(--redBookmarkColor, #eb3223);\n  }\n\n  .green {\n    --iconFillColor: var(--greenBookmarkColor, #75ef4c);\n  }\n"])));function ri(e){return(ri="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function ii(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function si(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function ai(e,t){return(ai=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function li(e,t){if(t&&("object"===ri(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}function ci(e){return(ci=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var di=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&ai(e,t)}(c,e);var t,n,r,i,s,l=(i=c,s=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}(),function(){var e,t=ci(i);if(s){var n=ci(this).constructor;e=Reflect.construct(t,arguments,n)}else e=t.apply(this,arguments);return li(this,e)});function c(){var e;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,c),(e=l.call(this)).bookmark={},e.bookmarkColors=[],e.renderHeader=!1,e.showBookmark=!0,e}return t=c,r=[{key:"properties",get:function(){return{bookmark:{type:Object},bookmarkColors:{type:Array},renderHeader:{type:Boolean},showBookmark:{type:Boolean}}}},{key:"headerSection",get:function(){return(0,o.dy)(ti||(ti=ii(["<header>\n      <h3>Edit Bookmark</h3>\n    </header>"])))}},{key:"styles",get:function(){var e=(0,o.iv)(ni||(ni=ii(['\n    :host {\n      display: block;\n      padding: 0 1rem 2rem 1rem;\n      color: var(--primaryTextColor);\n    }\n\n    small {\n      font-style: italic;\n    }\n\n    .bookmark {\n      display: grid;\n      grid-template-columns: 37px 1fr;\n      grid-gap: 0 1rem;\n      align-items: center;\n    }\n\n    h4 {\n      margin: 0;\n      font-size: 1.4rem;\n    }\n\n    fieldset {\n      padding: 2rem 0 0 0;\n      border: none;\n    }\n\n    label {\n      display: block;\n      font-weight: bold;\n    }\n\n    p {\n      padding: 0;\n      margin: .5rem 0;\n      font-size: 1.2rem;\n      line-height: 120%;\n    }\n\n    textarea {\n      width: 100%;\n      margin-bottom: 2rem;\n      box-sizing: border-box;\n      font: normal 1.4rem "Helvetica Neue", Helvetica, Arial, sans-serif;\n      resize: vertical;\n    }\n\n    ul {\n      display: grid;\n      grid-template-columns: repeat(3, auto);\n      grid-gap: 0 2rem;\n      justify-content: start;\n      padding: 1rem 0 0 0;\n      margin: 0 0 2rem 0;\n      list-style: none;\n    }\n\n    li input {\n      display: none;\n    }\n\n    li label {\n      display: block;\n      min-width: 50px;\n      padding-top: .4rem;\n      text-align: center;\n      border: 1px solid transparent;\n      border-radius: 4px;\n      cursor: pointer;\n    }\n\n    li input:checked + label {\n      border-color: var(--primaryTextColor);\n    }\n\n    input[type="submit"] {\n      background: var(--primaryCTAFill);\n      border-color: var(--primaryCTABorder);\n    }\n\n    button {\n      background: var(--primaryErrorCTAFill);\n      border-color: var(--primaryErrorCTABorder);\n    }\n\n    .button {\n      -webkit-appearance: none;\n      appearance: none;\n      padding: .5rem 1rem;\n      box-sizing: border-box;\n      color: var(--primaryTextColor);\n      border: none;\n      border-radius: 4px;\n      cursor: pointer;\n    }\n\n    .actions {\n      display: grid;\n      grid-template-columns: auto auto;\n      grid-gap: 0 1rem;\n      justify-items: stretch;\n    }\n    '])));return[Bn,oi,e]}}],(n=[{key:"emitSaveEvent",value:function(e){e.preventDefault(),this.dispatchEvent(new CustomEvent("saveBookmark",{detail:{bookmark:this.bookmark}}))}},{key:"emitDeleteEvent",value:function(){this.dispatchEvent(new CustomEvent("deleteBookmark",{detail:{id:this.bookmark.id}}))}},{key:"emitColorChangedEvent",value:function(e){this.dispatchEvent(new CustomEvent("bookmarkColorChanged",{detail:{bookmarkId:this.bookmark.id,colorId:e}}))}},{key:"changeColorTo",value:function(e){this.bookmark.color=e,this.emitColorChangedEvent(e)}},{key:"updateNote",value:function(e){this.bookmark.note=e.currentTarget.value}},{key:"bookmarkColor",value:function(e){var t=this;return(0,o.dy)(Qr||(Qr=ii(['\n      <li>\n        <input type="radio" name="color" id="color_','" .value='," @change="," ?checked=",'>\n        <label for="color_','">\n          <icon-bookmark class=',"></icon-bookmark>\n        </label>\n      </li>\n    "])),e.id,e.id,(function(){return t.changeColorTo(e.id)}),this.bookmark.color===e.id,e.id,e.className)}},{key:"bookmarkTemplate",get:function(){return(0,o.dy)(Kr||(Kr=ii(['\n      <div class="bookmark">\n        <img src='," />\n        <h4>Page ","</h4>\n      </div>\n    "])),this.bookmark.thumbnail,this.bookmark.page)}},{key:"render",value:function(){return(0,o.dy)(ei||(ei=ii(["\n      ","\n      ",'\n      <form action="" method="put" @submit=','>\n        <fieldset>\n          <label for="note">Note <small>(optional)</small></label>\n          <textarea rows="4" cols="80" name="note" id="note" @change=',">",'</textarea>\n          <label for="color">Bookmark color</label>\n          <ul>\n            ','\n          </ul>\n          <div class="actions">\n            <button type="button" class="ia-button cancel" @click=','>Delete</button>\n            <input class="ia-button" type="submit" value="Save">\n          </div>\n        </fieldset>\n      </form>\n    '])),this.renderHeader?c.headerSection:a.Ld,this.showBookmark?this.bookmarkTemplate:a.Ld,this.emitSaveEvent,this.updateNote,this.bookmark.note,$o(this.bookmarkColors,(function(e){return e.id}),this.bookmarkColor.bind(this)),this.emitDeleteEvent)}}])&&si(t.prototype,n),r&&si(t,r),c}(o.oi);customElements.define("ia-bookmark-edit",di),n(2707);var ui,hi,pi,fi,mi,vi,bi,gi,yi=a.dy`
<svg height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg" aria-labelledby="editPencilTitleID editPencilDescID"><title id="editPencilTitleID">Pencil icon</title><desc id="editPencilDescID">An illustration of a pencil, used to represent an edit action</desc><path class="fill-color" d="m15.6111048 9.3708338-9.52237183 9.5222966-5.14363353 1.0897111c-.42296707.0896082-.83849202-.1806298-.92810097-.6035935-.02266463-.1069795-.02266463-.2175207 0-.3245001l1.08971974-5.1435929 9.52237189-9.52229656zm-10.89310224 5.9110366-2.78094924-.5403869-.67567462 3.166657.83033407.8303275 3.16668096-.6756703zm14.82724244-12.05935921c.6114418.61143705.6055516 1.6086709-.0131615 2.22737904l-2.2405581 2.24054036-4.9820147-4.98197536 2.2405581-2.24054036c.618713-.61870814 1.6159506-.62460252 2.2273925-.01316547z" fill-rule="evenodd"/></svg>
`;class ki extends o.oi{static get styles(){return o.iv`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}render(){return yi}}function wi(e){return(wi="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function Ci(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function Si(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function xi(e,t){return(xi=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function Oi(e,t){if(t&&("object"===wi(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}function Ei(e){return(Ei=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}customElements.define("ia-icon-edit-pencil",ki);var Bi,_i=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&xi(e,t)}(c,e);var t,n,r,i,s,l=(i=c,s=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}(),function(){var e,t=Ei(i);if(s){var n=Ei(this).constructor;e=Reflect.construct(t,arguments,n)}else e=t.apply(this,arguments);return Oi(this,e)});function c(){var e;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,c),(e=l.call(this)).activeBookmarkID=void 0,e.bookmarkColors=[],e.defaultBookmarkColor={},e.bookmarks={},e.editedBookmark={},e.renderHeader=!1,e}return t=c,r=[{key:"properties",get:function(){return{activeBookmarkID:{type:Number},bookmarkColors:{type:Array},defaultBookmarkColor:{type:Object},bookmarks:{type:Object},editedBookmark:{type:Object},renderHeader:{type:Boolean}}}},{key:"styles",get:function(){return[(0,o.iv)(gi||(gi=Ci(["\n      :host {\n        display: block;\n        overflow-y: auto;\n        box-sizing: border-box;\n        color: var(--primaryTextColor);\n        margin-bottom: 2rem;\n        --activeBorderWidth: 2px;\n      }\n\n      icon-bookmark {\n        width: 16px;\n        height: 24px;\n      }\n\n      .separator {\n        background-color: var(--secondaryBGColor);\n        width: 98%;\n        margin: 1px auto;\n        height: 1px;\n      }\n\n      small {\n        font-style: italic;\n      }\n\n      h4 {\n        margin: 0;\n        font-size: 1.4rem;\n      }\n      h4 * {\n        display: inline-block;\n      }\n      h4 icon-bookmark {\n        vertical-align: bottom;\n      }\n      h4 span {\n        vertical-align: top;\n        padding-top: 1%;\n      }\n\n      p {\n        padding: 0;\n        margin: 5px 0 0 0;\n        width: 98%;\n        overflow-wrap: break-word;\n      }\n\n      ia-bookmark-edit {\n        margin: 5px 5px 3px 6px;\n      }\n\n      ul {\n        padding: 0;\n        list-style: none;\n        margin: var(--activeBorderWidth) 0.5rem 1rem 0;\n      }\n      ul > li:first-child .separator {\n        display: none;\n      }\n      li {\n        cursor: pointer;\n        outline: none;\n        position: relative;\n      }\n      li .content {\n        padding: 2px 0 4px 2px;\n        border: var(--activeBorderWidth) solid transparent;\n        padding: .2rem 0 .4rem .2rem;\n      }\n      li .content.active {\n        border: var(--activeBorderWidth) solid #538bc5;\n      }\n      li button.edit {\n        padding: 5px 2px 0 0;\n        background: transparent;\n        cursor: pointer;\n        height: 40px;\n        width: 40px;\n        position: absolute;\n        right: 2px;\n        top: 2px;\n        text-align: right;\n        -webkit-appearance: none;\n        appearance: none;\n        outline: none;\n        box-sizing: border-box;\n        border: none;\n      }\n      li button.edit > * {\n        display: block;\n        height: 100%;\n        width: 100%;\n      }\n    "]))),oi]}}],(n=[{key:"emitEditEvent",value:function(e,t){this.dispatchEvent(new CustomEvent("bookmarkEdited",{detail:{bookmark:t}}))}},{key:"emitSelectedEvent",value:function(e){this.activeBookmarkID=e.id,this.dispatchEvent(new CustomEvent("bookmarkSelected",{detail:{bookmark:e}}))}},{key:"emitSaveBookmark",value:function(e){this.dispatchEvent(new CustomEvent("saveBookmark",{detail:{bookmark:e}}))}},{key:"emitDeleteBookmark",value:function(e){this.dispatchEvent(new CustomEvent("deleteBookmark",{detail:{id:e}}))}},{key:"emitBookmarkColorChanged",value:function(e){var t=e.detail,n=t.bookmarkId,o=t.colorId;this.dispatchEvent(new CustomEvent("bookmarkColorChanged",{detail:{bookmarkId:n,colorId:o}}))}},{key:"emitAddBookmark",value:function(){this.dispatchEvent(new CustomEvent("addBookmark"))}},{key:"editBookmark",value:function(e,t){this.emitEditEvent(e,t),this.editedBookmark=this.editedBookmark===t?{}:t}},{key:"saveBookmark",value:function(e){var t=e.detail.bookmark;this.editedBookmark={},this.emitSaveBookmark(t)}},{key:"deleteBookmark",value:function(e){var t=e.detail.id;this.editedBookmark={},this.emitDeleteBookmark(t)}},{key:"bookmarkColorInfo",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0;return this.bookmarkColors.find((function(t){return(null==t?void 0:t.id)===e}))}},{key:"bookmarkItem",value:function(e){var t=this,n=this.editedBookmark.id===e.id,r=this.bookmarkColorInfo(e.color).className,i=e.id===this.activeBookmarkID?"active":"";return(0,o.dy)(ui||(ui=Ci(["\n      <li\n        @click=",'\n        tabindex="0"\n        data-pageIndex=','\n      >\n        <div class="separator"></div>\n        <div class="content ','">\n          <button\n            class="edit"\n            @click=','\n            title="Edit this bookmark"\n          >\n            <ia-icon-edit-pencil></ia-icon-edit-pencil>\n          </button>\n          <h4>\n            <icon-bookmark class=',"></icon-bookmark>\n            <span> Page ","</span>\n          </h4>\n          ","\n          ","\n        </div>\n      </li>\n    "])),(function(){return t.emitSelectedEvent(e)}),e.id,i,(function(n){return t.editBookmark(n,e)}),r,e.page,!n&&e.note?(0,o.dy)(hi||(hi=Ci(["<p>","</p>"])),e.note):a.Ld,n?this.editBookmarkComponent:a.Ld)}},{key:"editBookmarkComponent",get:function(){return(0,o.dy)(pi||(pi=Ci(["\n      <ia-bookmark-edit\n        .bookmark=","\n        .bookmarkColors=","\n        .defaultBookmarkColor=","\n        .showBookmark=","\n        @saveBookmark=","\n        @deleteBookmark=","\n        @bookmarkColorChanged=","\n      ></ia-bookmark-edit>\n    "])),this.editedBookmark,this.bookmarkColors,this.defaultBookmarkColor,!1,this.saveBookmark,this.deleteBookmark,this.emitBookmarkColorChanged)}},{key:"sortBookmarks",value:function(){var e=this;return Object.keys(this.bookmarks).sort((function(e,t){return+e>+t?1:+e<+t?-1:0})).map((function(t){return e.bookmarks[t]}))}},{key:"bookmarksCount",get:function(){var e=this.bookmarks.length;return(0,o.dy)(fi||(fi=Ci(["<small>(",")</small>"])),e)}},{key:"headerSection",get:function(){return(0,o.dy)(mi||(mi=Ci(["<header>\n      <h3>\n        Bookmarks\n        ","\n      </h3>\n    </header>"])),this.bookmarks.length?this.bookmarksCount:a.Ld)}},{key:"bookmarkslist",get:function(){var e=this.sortBookmarks(),t=$o(e,(function(e){return null==e?void 0:e.id}),this.bookmarkItem.bind(this));return(0,o.dy)(vi||(vi=Ci(["\n      <ul>\n        ",'\n        <div class="separator"></div>\n      </ul>\n    '])),t)}},{key:"render",value:function(){return(0,o.dy)(bi||(bi=Ci(["\n      ","\n      ","\n    "])),this.renderHeader?this.headerSection:a.Ld,Object.keys(this.bookmarks).length?this.bookmarkslist:a.Ld)}}])&&Si(t.prototype,n),r&&Si(t,r),c}(o.oi);customElements.define("ia-bookmarks-list",_i);class $i extends o.oi{static get styles(){return o.iv`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      #hollow,
      #plus,
      #minus {
        display: none;
      }

      .hollow #filled,
      .plus #filled,
      .minus #filled {
        display: none;
      }

      .hollow #hollow,
      .plus #hollow,
      .minus #hollow {
        display: block;
      }

      .plus #plus {
        display: block;
      }

      .minus #minus {
        display: block;
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}static get properties(){return{state:{type:String}}}render(){return o.dy`
      <div class=${this.state}>
        <svg height="24" viewBox="0 0 16 24" width="16" xmlns="http://www.w3.org/2000/svg" aria-labelledby="bookmarkTitleID bookmarDescID"><title id="bookmarkTitleID">Bookmark icon</title><desc id="bookmarkDescID">An outline of the shape of a bookmark</desc><path id="filled" d="m1 0h14c.5522847 0 1 .44771525 1 1v23l-8-5.4545455-8 5.4545455v-23c0-.55228475.44771525-1 1-1z" class="fill-color" fill-rule="evenodd"/><g class="fill-color" fill-rule="evenodd"><path id="hollow" d="m15 0c.5522847 0 1 .44771525 1 1v23l-8-5.4545455-8 5.4545455v-23c0-.55228475.44771525-1 1-1zm-2 2h-10c-.51283584 0-.93550716.38604019-.99327227.88337887l-.00672773.11662113v18l6-4.3181818 6 4.3181818v-18c0-.51283584-.3860402-.93550716-.8833789-.99327227z"/><path id="plus" d="m8.75 6v2.25h2.25v1.5h-2.25v2.25h-1.5v-2.25h-2.25v-1.5h2.25v-2.25z" fill-rule="nonzero"/><path id="minus" d="m11 8.25v1.5h-6v-1.5z" fill-rule="nonzero"/></g></svg>
      </div>
    `}}function Ai(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}customElements.define("icon-bookmark",$i);var ji=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e);var n=t.baseHost,r=t.signedIn,i=t.bookreader,s=t.modal,a=t.onProviderChange,l="referer=".concat(encodeURIComponent(location.href)),c="https://".concat(n,"/account/login?").concat(l);this.component=document.createElement("ia-bookmarks"),this.component.bookreader=i,this.component.displayMode=r?"bookmarks":"login",this.component.modal=s,this.component.loginOptions={loginClicked:this.bookmarksLoginClicked,loginUrl:c},this.bindEvents(),this.icon=(0,o.dy)(Bi||(Bi=function(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}(['<icon-bookmark state="hollow" style="--iconWidth: 16px; --iconHeight: 24px;"></icon-bookmark>']))),this.label="Bookmarks",this.id="bookmarks",this.onProviderChange=a,this.component.setup(),this.updateMenu(this.component.bookmarks.length)}var t,n;return t=e,(n=[{key:"updateMenu",value:function(e){this.menuDetails="(".concat(e,")")}},{key:"bindEvents",value:function(){this.component.addEventListener("bookmarksChanged",this.bookmarksChanged.bind(this))}},{key:"bookmarksChanged",value:function(e){var t=e.detail,n=Object.keys(t.bookmarks).length;this.updateMenu(n),this.onProviderChange(t.bookmarks,t.showSidePanel)}},{key:"bookmarksLoginClicked",value:function(){var e;window.archive_analytics&&(null===(e=window.archive_analytics)||void 0===e||e.send_event_no_sampling("BookReader","BookmarksLogin",window.location.path))}}])&&Ai(t.prototype,n),e}(),Mi=a.dy`
<svg
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="shareTitleID shareDescID"
>
  <title id="shareTitleID">Share icon</title>
  <desc id="shareDescID">A square with an arrow arcing out from the center of the square</desc>
  <g class="fill-color">
    <path d="m0 6.765625v17.143466h23.996455v-12.820312c0-.6024929-.564349-1.0909095-1.26051-1.0909095-.696159 0-1.260509.4884166-1.260509 1.0909095v10.638494h-18.9544172v-12.7798301h4.7793938c.6961602 0 1.2605092-.4884166 1.2605092-1.0909091 0-.6024924-.564349-1.0909088-1.2605092-1.0909088z"/>
    <path d="m23.97066.18118436-10.372158.62642052 1.587358 2.76562492c-.632399.5111771-1.204137 1.0741171-1.700285 1.6981534-1.40286 1.7644678-2.279987 4.0202049-2.712357 6.6775568-.144711.891238.459803 1.731264 1.350853 1.87713.428345.07012.866999-.03282 1.21944-.286164.35244-.253341.589789-.636328.659821-1.064688.366789-2.2542958 1.073357-3.946915 2.043324-5.1669026.237573-.298812.501471-.5831095.792613-.8522728l1.40625 2.4502844z"/>
  </g>
</svg>
`;class Ii extends o.oi{static get styles(){return o.iv`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}render(){return Mi}}function zi(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,o=new Array(t);n<t;n++)o[n]=e[n];return o}function Li(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}customElements.define("ia-icon-share",Ii),n(189),n(3123);var Pi=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.classes=new Set,this.changed=!1,this.element=t;var n,o=function(e,t){var n="undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(!n){if(Array.isArray(e)||(n=function(e,t){if(e){if("string"==typeof e)return zi(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?zi(e,t):void 0}}(e))||t&&e&&"number"==typeof e.length){n&&(e=n);var o=0,r=function(){};return{s:r,n:function(){return o>=e.length?{done:!0}:{done:!1,value:e[o++]}},e:function(e){throw e},f:r}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,s=!0,a=!1;return{s:function(){n=n.call(e)},n:function(){var e=n.next();return s=e.done,e},e:function(e){a=!0,i=e},f:function(){try{s||null==n.return||n.return()}finally{if(a)throw i}}}}((t.getAttribute("class")||"").split(/\s+/));try{for(o.s();!(n=o.n()).done;){var r=n.value;this.classes.add(r)}}catch(e){o.e(e)}finally{o.f()}}var t,n;return t=e,(n=[{key:"add",value:function(e){this.classes.add(e),this.changed=!0}},{key:"remove",value:function(e){this.classes.delete(e),this.changed=!0}},{key:"commit",value:function(){if(this.changed){var e="";this.classes.forEach((function(t){return e+=t+" "})),this.element.setAttribute("class",e)}}}])&&Li(t.prototype,n),e}(),Ti=new WeakMap,Di=(0,a.XM)((function(e){return function(t){if(!(t instanceof a._l)||t instanceof a.sL||"class"!==t.committer.name||t.committer.parts.length>1)throw new Error("The `classMap` directive must be used in the `class` attribute and must be the only part in the attribute.");var n=t.committer,o=n.element,r=Ti.get(t);void 0===r&&(o.setAttribute("class",n.strings.join(" ")),Ti.set(t,r=new Set));var i=o.classList||new Pi(o);for(var s in r.forEach((function(t){t in e||(i.remove(t),r.delete(t))})),e){var l=e[s];l!=r.has(s)&&(l?(i.add(s),r.add(s)):(i.remove(s),r.delete(s)))}"function"==typeof i.commit&&i.commit()}})),Ri=me`
<svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" aria-labelledby="linkTitleID linkDescID">
  <title id="linkTitleID">Link icon</title>
  <desc id="linkDescID">Two chain links linked together</desc>
  <path d="m7.80511706 12.3659763c1.2669254-2.2579539 4.09819784-2.9949938 6.41200864-1.7733458l.2295791.12871 1.6067188.9559859 3.5467013-6.31849361c1.2682451-2.26030597 4.104098-2.99652769 6.4192376-1.76952182l.2223501.12488594 3.2168204 1.91103915c2.2770002 1.3527136 3.1866331 4.21502324 2.0564431 6.51290984l-.1198433.2278304-5.2002499 9.2680474c-1.2669254 2.2579539-4.0981978 2.9949938-6.4120086 1.7733458l-.2295791-.12871-1.6096554-.9558482-3.5437647 6.3183559c-1.2682451 2.260306-4.104098 2.9965277-6.41923761 1.7695218l-.22235013-.1248859-3.21682032-1.9110392c-2.27700024-1.3527136-3.18663314-4.2150232-2.05644312-6.5129098l.11984332-.2278304zm13.93955474-5.73311741-3.563271 6.35055051c1.889633 1.4530595 2.5776248 4.0429866 1.5410255 6.156875l-.1223014.2328355-.4183304.7430134 1.6096554.9558483c1.1431442.6791157 2.5155496.3977368 3.1667361-.5628389l.0921501-.1491451 5.2002498-9.2680474c.5752467-1.0252226.2110342-2.4011579-.8559335-3.14755806l-.1742742-.11247814-3.2168203-1.91103915c-1.1402863-.67741793-2.5086889-.39913772-3.1618387.55564729zm-11.79500786 7.00714351-5.20024982 9.2680474c-.57524673 1.0252226-.21103426 2.4011579.85593348 3.1475581l.17427416.1124781 3.21682032 1.9110392c1.14028632.6774179 2.50868892.3991377 3.16183872-.5556473l.0970474-.1563368 3.5622708-6.3513198c-1.8888875-1.4532134-2.5764504-4.042623-1.5400057-6.1561456l.1222818-.2327956.4153938-.7428758-1.6067188-.9559859c-1.1431442-.6791157-2.5155496-.3977368-3.1667361.5628389zm6.97653866 1.5796652-.3817806.6812386c-.5117123.9119895-.2800268 2.1014993.528439 2.8785267l.382717-.6803391c.5119098-.9123415.2798478-2.1024176-.5293754-2.8794262z" class="fill-color" />
</svg>
`;customElements.define("ia-icon-link",class extends ze{static get styles(){return N`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}render(){return Ri}});var Hi=o.iv`
:host {
  display: block;
  height: 100%;
  overflow-y: auto;
  font-size: 1.4rem;
  box-sizing: border-box;
}

header {
  display: flex;
  align-items: baseline;
}

h3 {
  padding: 0;
  margin: 0 1rem 0 0;
  font-size: 1.6rem;
}

h4 {
  font-size: 1.4rem;
}

ul {
  padding: 0 0 2rem 0;
  list-style: none;
}

li {
  padding: 0 0 1rem 0;
}

li a {
  font-size: 1.6rem;
  text-decoration: none;
  color: var(--shareLinkColor);
}

li a * {
  display: inline-block;
  padding: .2rem;
  margin-right: 1rem;
  vertical-align: middle;
  border: 1px solid var(--shareIconBorder);
  border-radius: 7px;
  background: var(--shareIconBg);
}

.embed {
  display: none;
}
.embed.visible {
  display: block;
  width: 95%;
}

.embed a {
  color: var(--shareLinkColor);
}

.code {
  position: relative;
}

textarea {
  display: block;
  width: 100%;
  height: 120px;
  padding: .8rem 1rem;
  box-sizing: border-box;
  resize: none;
  cursor: pointer;
  font: normal 1.4rem "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: var(--textareaColor, #fff);
  background: var(--textareaBg, #151515);
}

small {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3rem;
  padding: .5rem 1rem;
  box-sizing: border-box;
  font: normal 1.2rem/2rem "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: var(--textareaBg, #151515);
  background: var(--textareaColor, #fff);
  opacity: 0;
  transition: opacity 300ms linear;
}
small.visible {
  opacity: 1;
}
`,Ni=me`
<svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" aria-labelledby="emailTitleID emailDescID">
  <title id="emailTitleID">Email icon</title>
  <desc id="emailDescID">An illustration of an envelope</desc>
  <path d="m32 7.04156803v19.91686397c0 .5752421-.4763773 1.041568-1.0640184 1.041568h-27.87196316c-.58764116 0-1.06401844-.4663259-1.06401844-1.041568v-19.91686397c0-.57524214.47637728-1.04156803 1.06401844-1.04156803h27.87196316c.5876411 0 1.0640184.46632589 1.0640184 1.04156803zm-26.25039901 1.19676167 10.04327011 10.1323738c.5135662.4194048.8817166.6291071 1.1044511.6291071.1198794 0 .2695514-.0503424.4490158-.1510273.1794644-.100685.3291364-.2013699.4490158-.3020548l.1798191-.1510273 10.1198794-10.15841306zm16.77212271 9.7303286 6.8831353 6.7889404v-13.5778809zm-17.92871075-6.6379131v13.350819l6.78098955-6.6629107zm22.09008685 14.2059464-5.9074304-5.8588202-.9757049.9551179-.3594018.3295984c-.0342324.0304241-.0665646.0587822-.0969964.0850743l-.1597867.1329606c-.0684912.0540844-.1198794.0895749-.1541644.1064714-.6674943.3687151-1.3523675.5530727-2.0546196.5530727-.65047 0-1.3782586-.218035-2.1833659-.6541048l-.6682036-.4520405-1.0278418-1.0311524-5.95850326 5.832781z" class="fill-color" />
</svg>
`;customElements.define("ia-icon-email",class extends ze{static get styles(){return N`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}render(){return Ni}});var Fi=class{constructor(e){this.promoCopy=" : Free Download, Borrow, and Streaming : Internet Archive",Object.assign(this,e)}get encodedDescription(){return this.encodeString(this.description)}get encodedCreator(){return this.encodeString(this.creator)}get encodedPromoCopy(){return this.encodeString(this.promoCopy)}get itemPath(){const e=this.fileSubPrefix?encodeURIComponent(this.fileSubPrefix):"";return e?`${this.identifier}/${e}`:this.identifier}encodeString(e){return encodeURIComponent(e.replace(/\s/g,"+")).replace(/%2B/g,"+")}},Ui=class extends Fi{constructor(e){super(e),this.name="Email",this.icon=o.dy`<ia-icon-email></ia-icon-email>`,this.class="email"}get url(){return`mailto:?body=https://${this.baseHost}/details/${this.itemPath}&subject=${this.description} : ${this.creator}${this.promoCopy}`}},Vi=me`
<svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" aria-labelledby="facebookTitleID facebookDescID">
  <title id="facebookTitleID">Facebook icon</title>
  <desc id="facebookDescID">A lowercase f</desc>
  <path d="m30.91057 19.2442068.2670004-5.3339402h-5.7329237c-.0890001-3.4962895.25183-5.42243459 1.0224903-5.77843514.3560005-.17800028.8004955-.28925046 1.333485-.33375053s1.0442346-.0520853 1.5337353-.02275571c.4895008.02932959 1.045246.01466479 1.6672356-.04399439.0890001-1.59997977.1335002-3.24445961.1335002-4.93343953-2.1633102-.20732987-3.6742898-.28115953-4.5329389-.22148898-2.8146294.17800028-4.7847688 1.25965538-5.9104183 3.2449653-.1780003.3256596-.3261653.68873971-.444495 1.08924034-.1183298.40050062-.2144095.76358074-.2882391 1.08924034-.0738297.32565959-.125915.7848194-.1562559 1.37747942-.030341.59266002-.052591 1.04474028-.0667501 1.35624078-.0141592.3115005-.0217444.8449956-.0227558 1.6004854v1.5777298h-3.8229605v5.3339401h3.8669549v14.622824h5.8224296c0-.3560006-.0146648-1.6819003-.0439944-3.9776994-.0293296-2.295799-.0515796-4.2957737-.0667501-5.9999241s-.0075853-3.2525506.0227557-4.6452005h5.4219289z" class="fill-color" />
</svg>
`;customElements.define("ia-icon-facebook",class extends ze{static get styles(){return N`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}render(){return Vi}});var Wi=class extends Fi{constructor(e){super(e),this.name="Facebook",this.icon=o.dy`<ia-icon-facebook></ia-icon-facebook>`,this.class="facebook"}get url(){return`https://www.facebook.com/sharer/sharer.php?u=https://${this.baseHost}/details/${this.itemPath}`}},qi=me`
<svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" aria-labelledby="pinterestTitleID pinterestDescID">
  <title id="pinterestTitleID">Pinterest icon</title>
  <desc id="pinterestDescID">A stylized letter p</desc>
  <path d="m11.9051049 30.5873434.653491-1.0742755.4207845-.839975c.2805229-.591861.5371377-1.2533214.7698443-1.9843813.2327065-.7310599.4659444-1.6029125.6997135-2.6155579.2337692-1.0126455.4128151-1.752206.5371377-2.2186817.0308151.030815.0775689.0855382.1402615.1641697.0626927.0786314.1094465.1333547.1402615.1641697.1243227.1870153.2178304.311338.280523.372968 1.1210293.964829 2.3817888 1.4631823 3.7822785 1.4950599 1.4939973 0 2.8790795-.3426843 4.1552465-1.0280529 2.1166733-1.1826593 3.6733633-3.1128487 4.6700699-5.7905679.4048457-1.1518444.6848374-2.5996192.8399751-4.3433245.1243226-1.587505-.0781002-3.0974411-.6072685-4.5298084-.903199-2.36638128-2.5528653-4.20306294-4.948999-5.51004497-1.276167-.65349101-2.5990879-1.05833667-3.9687625-1.21453696-1.525875-.21783034-3.1293188-.17107651-4.8103315.14026149-2.7701643.52916833-5.02709913 1.743174-6.77080442 3.64201699-1.99235065 2.14748836-2.98852598 4.62225355-2.98852598 7.42429545 0 2.9571797.9494215 5.0584455 2.84826449 6.3037975l.83997504.4207845c.12432268 0 .22526845.0154075.3028373.0462225s.1551377.0074381.23270656-.0701308c.07756885-.0775688.13229208-.1243226.16416969-.1402614s.07066204-.0860696.11635328-.2103923c.04569124-.1243226.07703756-.2098609.09403895-.2566147.01700139-.0467539.04834771-.1476996.09403895-.3028373s.06906816-.2486454.07013074-.280523l.14026149-.5132295c.06269263-.311338.09403895-.5291684.09403895-.653491-.03081502-.1243227-.12432268-.2799917-.28052297-.467007-.15620029-.1870154-.23376915-.2959305-.23270656-.3267455-.62267599-.8096914-.9494215-1.7904592-.98023652-2.9423035-.03081502-1.55669.28052297-2.9731185.93401399-4.24928547 1.18265932-2.45882635 3.17501002-3.93741618 5.97705192-4.43576949 1.6183201-.311338 3.1356943-.25661476 4.5521228.16416969 1.4164285.42078446 2.5135496 1.09765239 3.2913633 2.03060379.8405063 1.02752164 1.3229208 2.28828114 1.4472435 3.78227848.1243227 1.4004897-.0313463 2.9725872-.467007 4.7162925-.3740306 1.3696746-.9186065 2.5528653-1.6337275 3.5495719-.9967066 1.245352-2.0863896 1.8834355-3.269049 1.9142505-1.7118277.0626926-2.7547568-.6375522-3.1287874-2.1007345-.0935077-.4664757 0-1.2134744.2805229-2.240996.7469987-2.5842117 1.1359055-3.9384788 1.1667206-4.0628015.1870153-1.0275216.2024228-1.7904591.0462225-2.2888124-.1870153-.65349104-.5759222-1.15928246-1.1667205-1.51737429-.5907984-.35809182-1.2756357-.39687625-2.054512-.11635327-1.1826594.43566067-1.9610044 1.40048968-2.335035 2.89448706-.311338 1.306982-.2491767 2.6299028.186484 3.9687625 0 .0626926.0313463.1402615.094039.2327065.0626926.0924451.0940389.1700139.0940389.2327066 0 .0935076-.0313463.2491766-.0940389.467007-.0626927.2178303-.094039.3580918-.094039.4207844-.0935076.4356607-.3038999 1.3308903-.6311767 2.6856887-.3272768 1.3547985-.5838915 2.3897582-.7698443 3.1048793-.7778136 3.2068876-1.12049796 5.5881451-1.02805289 7.1437725l.37296809 2.7558194c.653491-.591861 1.2294131-1.2299445 1.7277664-1.9142505z" class="fill-color" />
</svg>
`;customElements.define("ia-icon-pinterest",class extends ze{static get styles(){return N`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}render(){return qi}});var Zi=class extends Fi{constructor(e){super(e),this.name="Pinterest",this.icon=o.dy`<ia-icon-pinterest></ia-icon-pinterest>`,this.class="pinterest"}get url(){return`http://www.pinterest.com/pin/create/button/?url=https://${this.baseHost}/details/${this.itemPath}&description=${this.encodedDescription}+%3A+${this.encodedCreator}${this.encodedPromoCopy}`}},Gi=me`
<svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" aria-labelledby="tumblrTitleID tumblrDescID">
  <title id="tumblrTitleID">Tumblr icon</title>
  <desc id="tumblrDescID">A lowercase letter t</desc>
  <path d="m8.50321407 8.54544475v5.32088575c.15641786.0310693.6819176.0310693 1.57649923 0 .8945816-.0310693 1.3574071.0160703 1.3884764.1414189.0942792 1.5695354.1333837 3.2253149.1173133 4.9673385-.0160703 1.7420236-.0316049 3.3426283-.0466039 4.8018141s.2046288 2.824628.6588835 4.0963267c.4542546 1.2716986 1.1999178 2.2209194 2.2369897 2.8476622 1.2556283.784232 2.9896167 1.207953 5.2019653 1.271163 2.2123485.0632099 4.1659648-.2506972 5.8608487-.9417213-.0310693-.3449764-.0230341-1.4045467.0241055-3.1787109.0471397-1.7741643-.0080351-2.75499-.1655244-2.9424772-3.5472571 1.0360005-5.697467.6904885-6.4506298-1.0365361-.7220934-1.6638147-.8635123-4.9909084-.4242566-9.981281v-.046604h6.7318605v-5.32088568h-6.7318605v-6.54383772h-4.0497228c-.2828378 1.28669763-.6122795 2.35376743-.9883252 3.20120941-.3760457.84744199-.98029 1.60060471-1.812733 2.25948817-.832443.65888347-1.87594303 1.01993018-3.1305 1.08314014z" class="fill-color" />
</svg>
`;customElements.define("ia-icon-tumblr",class extends ze{static get styles(){return N`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}render(){return Gi}});var Xi=class extends Fi{constructor(e){super(e),this.name="Tumblr",this.icon=o.dy`<ia-icon-tumblr></ia-icon-tumblr>`,this.class="tumblr"}get url(){return`https://www.tumblr.com/share/video?embed=%3Ciframe+width%3D%22640%22+height%3D%22480%22+frameborder%3D%220%22+allowfullscreen+src%3D%22https%3A%2F%2F${this.baseHost}%2Fembed%2F%22+webkitallowfullscreen%3D%22true%22+mozallowfullscreen%3D%22true%22%26gt%3B%26lt%3B%2Fiframe%3E&name=${this.encodedDescription}+%3A+${this.encodedCreator}${this.encodedPromoCopy}`}},Yi=me`
<svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" aria-labelledby="twitterTitleID twitterDescID">
  <title id="twitterTitleID">Twitter icon</title>
  <desc id="twitterDescID">The Twitter logo, a cartoon bird</desc>
  <path d="m31.5297453 8.76273313c-.3135031.40766104-.7447036.83083673-1.2936015 1.26952707-.5488979.4386904-.9169698.7837578-1.1042157 1.0352022.1562166 2.319709-.1417719 4.5297454-.8939653 6.6301092-.7521935 2.1003638-1.8023754 3.9182538-3.1505457 5.45367-1.3481704 1.5354162-2.9627648 2.8284828-4.8437835 3.8791996-1.8810186 1.0507169-3.8321207 1.7483416-5.8533062 2.092874s-4.1215493.2894286-6.30109136-.1653114c-2.17954205-.45474-4.2092874-1.3401455-6.08923604-2.6562165 2.72737.4697196 5.67408517-.2514445 8.8401455-2.1634924-3.0719024-.7521935-4.88979241-2.2881447-5.45367-4.6078537 1.12882516.0631287 1.86550396.0631287 2.21003638 0-2.91568586-1.2850417-4.38904344-3.3693558-4.42007276-6.2529424.21934517.0310293.53284828.1487267.94050931.3530922s.78375775.3060133 1.12829017.3049433c-.81532206-.7211641-1.41076396-1.9045581-1.7863257-3.5501819-.37556173-1.64562376-.17173122-3.17355015.61149155-4.58377912 1.81789001 1.88101862 3.6908838 3.36989086 5.61898138 4.46661672 1.92809757 1.0967259 4.22426707 1.7547614 6.88850847 1.9741066-.2503745-1.1908838-.1722662-2.32719882.2343248-3.40894502.4065911-1.0817462 1.0416221-1.93612241 1.9050931-2.56312861.863471-.62700621 1.8114702-1.0817462 2.8439975-1.36421999 1.0325272-.28247378 2.0827091-.27444896 3.1505456.02407447s1.9767815.87042585 2.726835 1.71570726c1.3791997-.37663172 2.6802911-.87845068 3.9032742-1.50545688-.0310293.37663171-.1407019.74470361-.3290178 1.1042157-.1883158.35951209-.3530922.62593623-.4943291.79927242s-.3841216.4317355-.728654.77519795c-.3445324.34346244-.5638776.57832227-.6580355.70457949.2193452-.09415792.6895998-.23539482 1.410764-.42371067.7211641-.18831586 1.2069334-.39214638 1.4573079-.61149155 0 .44350524-.1567516.86668093-.4702547 1.27434196z" class="fill-color" />
</svg>
`;customElements.define("ia-icon-twitter",class extends ze{static get styles(){return N`
      :host {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}render(){return Yi}});var Ji=class extends Fi{constructor(e){super(e),this.name="Twitter",this.icon=o.dy`<ia-icon-twitter></ia-icon-twitter>`,this.class="twitter"}get url(){return`https://twitter.com/intent/tweet?url=https://${this.baseHost}/details/${this.itemPath}&via=internetarchive&text=${this.encodedDescription}+%3A+${this.encodedCreator}${this.encodedPromoCopy}`}};const Qi=({currentTarget:e})=>{const t=e.querySelector("textarea"),n=e.querySelector("small");t.select(),document.execCommand("copy"),t.blur(),n.classList.add("visible"),clearTimeout(n.timeout),n.timeout=setTimeout((()=>n.classList.remove("visible")),4e3)};class Ki extends o.oi{static get styles(){return Hi}static get properties(){return{baseHost:{type:String},creator:{type:String},description:{type:String},embedOptionsVisible:{type:Boolean},identifier:{type:String},sharingOptions:{type:Array},type:{type:String},renderHeader:{type:Boolean},fileSubPrefix:{type:String}}}constructor(){super(),this.baseHost="",this.sharingOptions=[],this.fileSubPrefix=""}firstUpdated(){const{baseHost:e,creator:t,description:n,identifier:o,type:r,fileSubPrefix:i}=this,s={baseHost:e,creator:t,description:n,identifier:o,type:r,fileSubPrefix:i};this.sharingOptions=[new Ji(s),new Wi(s),new Xi(s),new Zi(s),new Ui(s)]}get sharingItems(){return this.sharingOptions.map((e=>o.dy`<li>
        <a class="${e.class}" href="${e.url}" target="_blank">
          ${e.icon}
          ${e.name}
        </a>
      </li>`))}get embedOption(){return o.dy`<li>
      <a href="#" @click=${this.toggleEmbedOptions}>
        <ia-icon-link></ia-icon-link>
        Get an embeddable link
      </a>
    </li>`}get iframeEmbed(){return o.dy`&lt;iframe src="https://${this.baseHost}/embed/${this.identifier}" width="560" height="384" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen&gt;&lt;/iframe&gt;`}get bbcodeEmbed(){return`[archiveorg ${this.identifier} width=560 height=384 frameborder=0 webkitallowfullscreen=true mozallowfullscreen=true]`}get helpURL(){return`https://${this.baseHost}/help/audio.php?identifier=${this.identifier}`}toggleEmbedOptions(e){e.preventDefault(),this.embedOptionsVisible=!this.embedOptionsVisible}get header(){const e=o.dy`<header><h3>Share this ${this.type}</h3></header>`;return this.renderHeader?e:a.Ld}render(){return o.dy`
      ${this.header}
      <ul>
        ${this.sharingItems}
        ${this.embedOption}
        <div class=${Di({visible:this.embedOptionsVisible,embed:!0})}>
          <h4>Embed</h4>
          <div class="code" @click=${Qi}>
            <textarea readonly="readonly">${this.iframeEmbed}</textarea>
            <small>Copied to clipboard</small>
          </div>
          <h4>Embed for wordpress.com hosted blogs and archive.org item &lt;description&gt; tags</h4>
          <div class="code" @click=${Qi}>
            <textarea readonly="readonly">${this.bbcodeEmbed}</textarea>
            <small>Copied to clipboard</small>
          </div>
          <p>Want more? <a href=${this.helpURL}>Advanced embedding details, examples, and help</a>!</p>
        </div>
      </ul>
    `}}var es,ts;function ns(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}customElements.define("ia-sharing-options",Ki);var os,rs,is,ss,as,ls,cs,ds,us,hs=function e(t){var n=t.item,r=t.baseHost,i=t.bookreader;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e);var s=null==n?void 0:n.metadata,a=s.identifier,l=s.creator,c=s.title,d=Array.isArray(l)?l[0]:l,u=i.options.subPrefix||"";this.icon=(0,o.dy)(es||(es=ns(['<ia-icon-share style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon-share>']))),this.label="Share this book",this.id="share",this.component=(0,o.dy)(ts||(ts=ns(["<ia-sharing-options\n      .identifier=","\n      .type=","\n      .creator=","\n      .description=","\n      .baseHost=","\n      .fileSubPrefix=","\n    ></ia-sharing-options>"])),a,"book",d,c,r,u)},ps=(0,a.dy)(os||(os=function(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}(['\n<svg name="sort-desc" height="18" viewBox="0 0 18 18" width="18" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path d="m2.32514544 8.30769231.7756949-2.08468003h2.92824822l.75630252 2.08468003h1.01809955l-2.70523594-6.92307693h-1.01809955l-2.69553976 6.92307693zm3.41305753-2.86037492h-2.34647705l1.17323853-3.22883h.01939237z" fill="#fff" fill-rule="nonzero"/><path d="m7.1689722 16.6153846v-.7756949h-4.4117647l4.29541047-5.3716871v-.77569491h-5.06140918v.77569491h3.97543633l-4.30510666 5.3716871v.7756949z" fill="#fff" fill-rule="nonzero"/><path d="m10.3846154 11.0769231 2.7692308 5.5384615 2.7692307-5.5384615m-2.7692307 4.1538461v-13.15384612" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.661538"/></g></svg>\n']))),fs=(0,a.dy)(rs||(rs=function(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}(['\n<svg name="sort-asc" height="18" viewBox="0 0 18 18" width="18" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path d="m2.32514544 8.30769231.7756949-2.08468003h2.92824822l.75630252 2.08468003h1.01809955l-2.70523594-6.92307693h-1.01809955l-2.69553976 6.92307693zm3.41305753-2.86037492h-2.34647705l1.17323853-3.22883h.01939237z" fill="#fff" fill-rule="nonzero"/><path d="m7.1689722 16.6153846v-.7756949h-4.4117647l4.29541047-5.3716871v-.77569491h-5.06140918v.77569491h3.97543633l-4.30510666 5.3716871v.7756949z" fill="#fff" fill-rule="nonzero"/><path d="m10.3846154 11.0769231 2.7692308 5.5384615 2.7692307-5.5384615m-2.7692307 4.1538461v-13.15384612" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.661538" transform="matrix(1 0 0 -1 0 18.692308)"/></g></svg>\n']))),ms=(0,a.dy)(is||(is=function(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}(['\n<svg name="sort-neutral" height="18" viewBox="0 0 18 18" width="18" xmlns="http://www.w3.org/2000/svg"><g fill="#fff" fill-rule="evenodd"><path d="m2.32514544 8.30769231.7756949-2.08468003h2.92824822l.75630252 2.08468003h1.01809955l-2.70523594-6.92307693h-1.01809955l-2.69553976 6.92307693zm3.41305753-2.86037492h-2.34647705l1.17323853-3.22883h.01939237z" fill-rule="nonzero"/><path d="m7.1689722 16.6153846v-.7756949h-4.4117647l4.29541047-5.3716871v-.77569491h-5.06140918v.77569491h3.97543633l-4.30510666 5.3716871v.7756949z" fill-rule="nonzero"/><circle cx="13" cy="9" r="2"/></g></svg>\n']))),vs=(0,a.dy)(ss||(ss=function(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}(['\n  <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" aria-labelledby="volumesTitleID volumesDescID">\n    <title id="volumesTitleID">Volumes icon</title>\n    <desc id="volumesDescID">Three books stacked on each other</desc>\n    <g fill="#ffffff">\n      <path fill="#ffffff" d="m9.83536396 0h10.07241114c.1725502.47117517.3378411.76385809.4958725.87804878.1295523.11419069.3199719.1998337.5712586.25692905.2512868.05709534.4704647.08564301.6575337.08564301h.2806036v15.24362526h-4.3355343v3.8106985h-4.44275v3.7250554h-12.01318261c-.27306495 0-.50313194-.085643-.69020098-.256929-.18706903-.1712861-.30936193-.3425721-.36687867-.5138581l-.06449694-.2785477v-14.2159091c0-.32815965.08627512-.5922949.25882537-.79240577.17255024-.20011086.34510049-.32150776.51765073-.36419068l.25882537-.0640244h3.36472977v-2.54767184c0-.31374722.08627513-.57067627.25882537-.77078714.17255025-.20011086.34510049-.32150776.51765074-.36419068l.25882536-.06402439h3.36472978v-2.56929047c0-.32815964.08627512-.5922949.25882537-.79240576.17255024-.20011087.34510049-.31430156.51765073-.34257207zm10.78355264 15.6294346v-13.53076498c-.2730649-.08536585-.4456152-.16380266-.5176507-.23531042-.1725502-.1424612-.2730649-.27078714-.3015441-.38497783v13.36031043h-9.87808272c0 .0144124-.02149898.0144124-.06449694 0-.04299795-.0144124-.08962561.006929-.13988296.0640244-.05025735.0570953-.07538603.1427383-.07538603.256929s.02149898.210643.06449694.289357c.04299795.078714.08599591.1322062.12899387.1604767l.06449693.0216187h10.71905571zm-10.2449613-2.4412417h7.98003v-11.60421286h-7.98003zm1.6827837-9.41990022h4.6153002c.1725502 0 .3199718.05349224.4422647.16047672s.1834393.23891353.1834393.39578714c0 .15687362-.0611464.28519956-.1834393.38497783s-.2697145.1496674-.4422647.1496674h-4.6153002c-.1725503 0-.3199719-.04988913-.4422647-.1496674-.1222929-.09977827-.1834394-.22810421-.1834394-.38497783 0-.15687361.0611465-.28880266.1834394-.39578714.1222928-.10698448.2697144-.16047672.4422647-.16047672zm-6.08197737 13.50997782h7.72120467v-.8131929h-3.79610541c-.27306495 0-.49950224-.085643-.67931188-.256929-.17980964-.1712861-.29847284-.3425721-.35598958-.5138581l-.06449694-.2785477v-10.02023282h-2.82530086zm6.77217827-11.36890243h3.2139578c.1295522 0 .240956.05709534.3342113.17128603.0932554.11419069.139883.24972284.139883.40659645 0 .15687362-.0466276.28880267-.139883.39578714-.0932553.10698448-.2046591.16047672-.3342113.16047672h-3.2139578c-.1295523 0-.2373264-.05349224-.3233223-.16047672-.0859959-.10698447-.1289938-.23891352-.1289938-.39578714 0-.15687361.0429979-.29240576.1289938-.40659645s.19377-.17128603.3233223-.17128603zm-11.15043132 15.11557653h7.69942646v-.7491685h-3.79610539c-.25854616 0-.48135376-.0892462-.66842279-.2677384-.18706904-.1784922-.30936193-.3605876-.36687868-.546286l-.06449694-.2569291v-10.04101994h-2.80352266zm14.62237682-4.5606985h-.8191949v2.1410754h-9.89986085s-.04299796.0285477-.12899387.085643c-.08599592.0570954-.12201369.1427384-.10805331.2569291 0 .1141907.01786928.210643.05360784.289357.03573856.0787139.07538603.125.1189424.138858l.06449694.0432373h10.71905575v-2.9542683zm-4.3991936 3.8106985h-.8191949v2.077051h-9.8563045c0 .0144124-.02149898.0144124-.06449694 0-.04299795-.0144125-.08962561.0105321-.13988296.0748337-.05025735.0643015-.07538603.1607538-.07538603.289357 0 .1141906.02149898.2070399.06449694.2785476.04299795.0715078.08599591.1141907.12899387.1280488l.06449693.0216186h10.69811519v-2.8686252z" />\n    </g>\n  </svg>\n'])));function bs(e){return(bs="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function gs(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function ys(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function ks(e,t){return(ks=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function ws(e,t){if(t&&("object"===bs(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}function Cs(e){return(Cs=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var Ss,xs,Os,Es,Bs=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&ks(e,t)}(c,e);var t,n,r,i,s,l=(i=c,s=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}(),function(){var e,t=Cs(i);if(s){var n=Cs(this).constructor;e=Reflect.construct(t,arguments,n)}else e=t.apply(this,arguments);return ws(this,e)});function c(){var e;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,c),(e=l.call(this)).hostUrl="",e.sortOrderBy="",e.subPrefix="",e.viewableFiles=[],e}return t=c,r=[{key:"properties",get:function(){return{subPrefix:{type:String},hostUrl:{type:String},viewableFiles:{type:Array},sortOrderBy:{type:String}}}},{key:"styles",get:function(){return(0,o.iv)(us||(us=gs(["\n      :host {\n        display: block;\n        overflow-y: auto;\n        box-sizing: border-box;\n        color: var(--primaryTextColor);\n        margin-top: 14px;\n        margin-bottom: 2rem;\n        --activeBorderWidth: 2px;\n      }\n\n      a {\n        color: #ffffff;\n        text-decoration: none\n      }\n\n      img {\n        width: 35px;\n        height: 45px;\n      }\n\n      ul {\n        padding: 0;\n        list-style: none;\n        margin: var(--activeBorderWidth) 0.5rem 1rem 0;\n      }\n\n      ul > li:first-child .separator {\n        display: none;\n      }\n\n      li {\n        cursor: pointer;\n        outline: none;\n        position: relative;\n      }\n\n      li .content {\n        padding: 2px 0 4px 2px;\n        border: var(--activeBorderWidth) solid transparent;\n        padding: .2rem 0 .4rem .2rem;\n      }\n      \n      li .content.active {\n        border: var(--activeBorderWidth) solid #538bc5;\n      }\n\n      small {\n        font-style: italic;\n        white-space: initial;\n      }\n\n      .container {\n        display: flex;\n        align-items: center;\n        justify-content: center\n      }\n\n      .item-title {\n        margin-block-start: 0em;\n        margin-block-end: 0em;\n        font-size: 14px;\n        font-weight: bold;\n        word-wrap: break-word;\n        padding-left: 5px;\n      }\n\n      .separator {\n        background-color: var(--secondaryBGColor);\n        width: 98%;\n        margin: 1px auto;\n        height: 1px;\n      }\n\n      .text {\n        padding-left: 10px;\n      }\n\n      .icon {\n        display: inline-block;\n        width: 14px;\n        height: 14px;\n        margin-left: .7rem;\n        border: 1px solid var(--primaryTextColor);\n        border-radius: 2px;\n        background: var(--activeButtonBg) 50% 50% no-repeat;\n      }\n\n    "])))}}],(n=[{key:"firstUpdated",value:function(){var e=this.shadowRoot.querySelector(".content.active");setTimeout((function(){null!=e&&e.scrollIntoViewIfNeeded&&(null==e||e.scrollIntoViewIfNeeded(!0))}),350)}},{key:"volumeItemWithImageTitle",value:function(e){var t="default"===this.sortOrderBy?"".concat(this.hostUrl).concat(e.url_path):"".concat(this.hostUrl).concat(e.url_path,"?sort=").concat(this.sortOrderBy);return(0,o.dy)(as||(as=gs(['\n      <li class="content active">\n        <div class="separator"></div>\n        <a class="container" href="','">\n          <div class="image">\n            <img src="','">\n          </div>\n          <div class="text">\n            <p class="item-title">',"</p>\n            <small>by: ","</small>\n          </div>\n        </a>\n      </li>\n    "])),t,e.image,e.title,e.author)}},{key:"volumeItem",value:function(e){var t=this.subPrefix===e.file_subprefix?" active":"",n="default"===this.sortOrderBy?"".concat(this.hostUrl).concat(e.url_path):"".concat(this.hostUrl).concat(e.url_path,"?sort=").concat(this.sortOrderBy);return(0,o.dy)(ls||(ls=gs(['\n      <li>\n        <div class="separator"></div>\n        <div class="content','">\n          <a href="https://','">\n            <p class="item-title">',"</p>\n          </a>\n        </div>\n      </li>\n    "])),t,n,e.title)}},{key:"volumesList",get:function(){var e=$o(this.viewableFiles,(function(e){return null==e?void 0:e.file_prefix}),this.volumeItem.bind(this));return(0,o.dy)(cs||(cs=gs(["\n      <ul>\n        ",'\n        <div class="separator"></div> \n      </ul>\n    '])),e)}},{key:"render",value:function(){return(0,o.dy)(ds||(ds=gs(["\n      ","\n    "])),this.viewableFiles.length?this.volumesList:a.Ld)}}])&&ys(t.prototype,n),r&&ys(t,r),c}(o.oi);function _s(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,o=new Array(t);n<t;n++)o[n]=e[n];return o}function $s(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function As(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}customElements.define("viewable-files",Bs);var js,Ms,Is,zs,Ls,Ps,Ts,Ds="title_asc",Rs="title_desc",Hs="default",Ns=function(){function e(t){var n=t.baseHost,r=t.bookreader,i=t.onProviderChange;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.onProviderChange=i,this.component=document.createElement("viewable-files");var s=r.options.multipleBooksList.by_subprefix;if(this.viewableFiles=Object.keys(s).map((function(e){return s[e]})),this.volumeCount=Object.keys(s).length,this.bookreader=r,this.component.subPrefix=r.options.subPrefix||"",this.component.hostUrl=n,this.component.viewableFiles=this.viewableFiles,this.id="volumes",this.label="Viewable files (".concat(this.volumeCount,")"),this.icon=(0,o.dy)(Ss||(Ss=$s(["",""])),vs),this.sortOrderBy=Hs,this.bookreader.urlPlugin){this.bookreader.urlPlugin.pullFromAddressBar();var a=this.bookreader.urlPlugin.getUrlParam("sort");a!==Ds&&a!==Rs||(this.sortOrderBy=a)}this.sortVolumes(this.sortOrderBy)}var t,n;return t=e,(n=[{key:"sortButton",get:function(){var e=this;return{default:(0,o.dy)(xs||(xs=$s(['\n        <button class="sort-by neutral-icon" aria-label="Sort volumes in initial order" @click=',">","</button>\n      "])),(function(){return e.sortVolumes("title_asc")}),ms),title_asc:(0,o.dy)(Os||(Os=$s(['\n        <button class="sort-by asc-icon" aria-label="Sort volumes in ascending order" @click=',">","</button>\n      "])),(function(){return e.sortVolumes("title_desc")}),fs),title_desc:(0,o.dy)(Es||(Es=$s(['\n        <button class="sort-by desc-icon" aria-label="Sort volumes in descending order" @click=',">","</button>\n      "])),(function(){return e.sortVolumes("default")}),ps)}[this.sortOrderBy]}},{key:"sortVolumes",value:function(e){var t,n;t=this.viewableFiles.sort((function(t,n){return e===Ds?t.title.localeCompare(n.title):e===Rs?n.title.localeCompare(t.title):t.orig_sort-n.orig_sort})),this.sortOrderBy=e,this.component.sortOrderBy=e,this.component.viewableFiles=function(e){if(Array.isArray(e))return _s(e)}(n=t)||function(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(n)||function(e,t){if(e){if("string"==typeof e)return _s(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?_s(e,t):void 0}}(n)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}(),this.actionButton=this.sortButton,this.bookreader.urlPlugin&&(this.bookreader.urlPlugin.pullFromAddressBar(),this.sortOrderBy!==Hs?this.bookreader.urlPlugin.setUrlParam("sort",e):this.bookreader.urlPlugin.removeUrlParam("sort")),this.onProviderChange(this.bookreader),this.multipleFilesClicked(e)}},{key:"multipleFilesClicked",value:function(e){var t;window.archive_analytics&&(null===(t=window.archive_analytics)||void 0===t||t.send_event_no_sampling("BookReader","VolumesSort|".concat(e),window.location.path))}}])&&As(t.prototype,n),e}(),Fs=(0,o.YP)(js||(js=function(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}(['\n  <svg class="ia-logo" width="27" height="30" viewBox="0 0 27 30" xmlns="http://www.w3.org/2000/svg" aria-labelledby="logoTitleID logoDescID">\n    <title id="logoTitleID">Internet Archive logo</title>\n    <desc id="logoDescID">A line drawing of the Internet Archive headquarters building façade.</desc>\n    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n      <mask id="mask-2" fill="white">\n        <path d="M26.6666667,28.6046512 L26.6666667,30 L0,30 L0.000283687943,28.6046512 L26.6666667,28.6046512 Z M25.6140351,26.5116279 L25.6140351,28.255814 L1.05263158,28.255814 L1.05263158,26.5116279 L25.6140351,26.5116279 Z M3.62469203,7.6744186 L3.91746909,7.82153285 L4.0639977,10.1739544 L4.21052632,13.9963932 L4.21052632,17.6725617 L4.0639977,22.255044 L4.03962296,25.3421929 L3.62469203,25.4651163 L2.16024641,25.4651163 L1.72094074,25.3421929 L1.55031755,22.255044 L1.40350877,17.6970339 L1.40350877,14.0211467 L1.55031755,10.1739544 L1.68423854,7.80887484 L1.98962322,7.6744186 L3.62469203,7.6744186 Z M24.6774869,7.6744186 L24.9706026,7.82153285 L25.1168803,10.1739544 L25.2631579,13.9963932 L25.2631579,17.6725617 L25.1168803,22.255044 L25.0927809,25.3421929 L24.6774869,25.4651163 L23.2130291,25.4651163 L22.7736357,25.3421929 L22.602418,22.255044 L22.4561404,17.6970339 L22.4561404,14.0211467 L22.602418,10.1739544 L22.7369262,7.80887484 L23.0420916,7.6744186 L24.6774869,7.6744186 Z M9.94042303,7.6744186 L10.2332293,7.82153285 L10.3797725,10.1739544 L10.5263158,13.9963932 L10.5263158,17.6725617 L10.3797725,22.255044 L10.3556756,25.3421929 L9.94042303,25.4651163 L8.47583122,25.4651163 L8.0362015,25.3421929 L7.86556129,22.255044 L7.71929825,17.6970339 L7.71929825,14.0211467 L7.86556129,10.1739544 L8.00005604,7.80887484 L8.30491081,7.6744186 L9.94042303,7.6744186 Z M18.0105985,7.6744186 L18.3034047,7.82153285 L18.449948,10.1739544 L18.5964912,13.9963932 L18.5964912,17.6725617 L18.449948,22.255044 L18.425851,25.3421929 L18.0105985,25.4651163 L16.5460067,25.4651163 L16.1066571,25.3421929 L15.9357367,22.255044 L15.7894737,17.6970339 L15.7894737,14.0211467 L15.9357367,10.1739544 L16.0702315,7.80887484 L16.3753664,7.6744186 L18.0105985,7.6744186 Z M25.6140351,4.53488372 L25.6140351,6.97674419 L1.05263158,6.97674419 L1.05263158,4.53488372 L25.6140351,4.53488372 Z M13.0806755,0 L25.9649123,2.93331338 L25.4484139,3.8372093 L0.771925248,3.8372093 L0,3.1041615 L13.0806755,0 Z" id="path-1"></path>\n      </mask>\n      <use fill="#FFFFFF" xlink:href="#path-1"></use>\n      <g mask="url(#mask-2)" fill="#FFFFFF">\n        <path d="M0,0 L26.6666667,0 L26.6666667,30 L0,30 L0,0 Z" id="swatch"></path>\n      </g>\n    </g>\n  </svg>\n'])));function Us(e){return(Us="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function Vs(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function Ws(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,o)}return n}function qs(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?Ws(Object(n),!0).forEach((function(t){Zs(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):Ws(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function Zs(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function Gs(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function Xs(e,t){return(Xs=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function Ys(e,t){if(t&&("object"===Us(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}function Js(e){return(Js=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}var Qs,Ks,ea="updateSideMenu",ta=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&Xs(e,t)}(c,e);var t,n,r,i,s,l=(i=c,s=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}(),function(){var e,t=Js(i);if(s){var n=Js(this).constructor;e=Reflect.construct(t,arguments,n)}else e=t.apply(this,arguments);return Ys(this,e)});function c(){var e;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,c),(e=l.call(this)).itemMD=void 0,e.loaded=!1,e.bookReaderCannotLoad=!1,e.bookReaderLoaded=!1,e.bookreader=null,e.bookIsRestricted=!1,e.downloadableTypes=[],e.isAdmin=!1,e.lendingInitialized=!1,e.lendingStatus={},e.menuProviders={},e.menuShortcuts=[],e.signedIn=!1,e.modal=void 0,e.sharedObserver=void 0,e.fullscreenBranding=Fs,e.sharedObserverHandler=void 0,e.brWidth=0,e.brHeight=0,e.shortcutOrder=["fullscreen","volumes","search","bookmarks"],e}return t=c,r=[{key:"properties",get:function(){return{itemMD:{type:Object},bookReaderLoaded:{type:Boolean},bookreader:{type:Object},bookIsRestricted:{type:Boolean},downloadableTypes:{type:Array},isAdmin:{type:Boolean},lendingInitialized:{type:Boolean},lendingStatus:{type:Object},menuProviders:{type:Object},menuShortcuts:{type:Array},signedIn:{type:Boolean},loaded:{type:Boolean},sharedObserver:{type:Object,attribute:!1},modal:{type:Object,attribute:!1},fullscreenBranding:{type:Object}}}},{key:"styles",get:function(){return(0,o.iv)(Ts||(Ts=Vs(["\n    :host,\n    #book-navigator__root,\n    slot,\n    slot > * {\n      display: block;\n      height: inherit;\n      width: inherit;\n    }\n    .placeholder {\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      flex-direction: column;\n      margin: 5%;\n    }\n    .cover-img {\n      max-height: 300px;\n    }\n  "])))}}],(n=[{key:"disconnectedCallback",value:function(){this.sharedObserver.removeObserver({target:this.mainBRContainer,handler:this.sharedObserverHandler})}},{key:"firstUpdated",value:function(){this.bindEventListeners(),this.emitPostInit(),this.loaded=!0}},{key:"updated",value:function(e){this.bookreader&&this.itemMD&&this.bookReaderLoaded&&((e.has("loaded")&&this.loaded||e.has("itemMD")||e.has("bookreader")||e.has("signedIn")||e.has("isAdmin")||e.has("modal"))&&this.initializeBookSubmenus(),e.has("sharedObserver")&&this.bookreader&&this.loadSharedObserver())}},{key:"emitPostInit",value:function(){var e;this.dispatchEvent(new CustomEvent("BrBookNav:".concat("PostInit"),{detail:{brSelector:null===(e=this.bookreader)||void 0===e?void 0:e.el},bubbles:!0,composed:!0}))}},{key:"baseProviderConfig",get:function(){return{baseHost:this.baseHost,modal:this.modal,sharedObserver:this.sharedObserver,bookreader:this.bookreader,item:this.itemMD,signedIn:this.signedIn,isAdmin:this.isAdmin,onProviderChange:function(){}}}},{key:"initializeBookSubmenus",value:function(){var e=this,t={downloads:new go(this.baseProviderConfig),share:new hs(this.baseProviderConfig),visualAdjustments:new sr(qs(qs({},this.baseProviderConfig),{},{onProviderChange:function(){e.updateMenuContents()}}))};this.bookreader.options.enableSearch&&(t.search=new Kn(qs(qs({},this.baseProviderConfig),{},{onProviderChange:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};t&&(e.bookreader=t);var o=e.brWidth>=640;!o||null!=n&&n.searchCanceled||setTimeout((function(){e.updateSideMenu("search","open")}),0),e.updateMenuContents()}}))),this.bookreader.options.enableBookmarks&&(t.bookmarks=new ji(qs(qs({},this.baseProviderConfig),{},{onProviderChange:function(t){var n=Object.keys(t).length?"add":"remove";e["".concat(n,"MenuShortcut")]("bookmarks"),e.updateMenuContents()}}))),this.bookreader.options.enableMultipleBooks&&(t.volumes=new Ns(qs(qs({},this.baseProviderConfig),{},{onProviderChange:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null;t&&(e.bookreader=t),e.updateMenuContents(),e.updateSideMenu("volumes","open")}}))),this.menuProviders=t,this.addMenuShortcut("search"),this.addMenuShortcut("volumes"),this.updateMenuContents()}},{key:"mainBRContainer",get:function(){var e;return document.querySelector(null===(e=this.bookreader)||void 0===e?void 0:e.el)}},{key:"addFullscreenShortcut",value:function(){var e={icon:this.fullscreenShortcut,id:"fullscreen"};this.menuShortcuts.push(e),this.sortMenuShortcuts(),this.emitMenuShortcutsUpdated()}},{key:"deleteFullscreenShortcut",value:function(){var e=this.menuShortcuts.filter((function(e){return"fullscreen"!==e.id}));this.menuShortcuts=e,this.sortMenuShortcuts(),this.emitMenuShortcutsUpdated()}},{key:"closeFullscreen",value:function(){this.bookreader.exitFullScreen()}},{key:"fullscreenShortcut",get:function(){var e=this;return(0,o.dy)(Ms||(Ms=Vs(["\n      <button\n        @click=",'\n        title="Exit fullscreen view"\n      >',"</button>\n    "])),(function(){return e.closeFullscreen()}),this.fullscreenBranding)}},{key:"updateSideMenu",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"open";if(e){var n=new CustomEvent(ea,{detail:{menuId:e,action:t}});this.dispatchEvent(n)}}},{key:"updateMenuContents",value:function(){var e=this.menuProviders,t=e.search,n=e.downloads,o=e.visualAdjustments,r=e.share,i=e.bookmarks,s=[e.volumes,t,i,o,r].filter((function(e){return!!e}));this.shouldShowDownloadsMenu()&&(null==n||n.update(this.downloadableTypes),s.splice(1,0,n));var a=new CustomEvent("menuUpdated",{detail:s});this.dispatchEvent(a)}},{key:"shouldShowDownloadsMenu",value:function(){if(!1===this.bookIsRestricted)return!0;if(this.isAdmin)return!0;var e=this.lendingStatus.user_loan_record,t=void 0===e?{}:e;return!Array.isArray(t)&&t.type&&"SESSION_LOAN"!==t.type}},{key:"addMenuShortcut",value:function(e){this.menuShortcuts.find((function(t){return t.id===e}))||this.menuProviders[e]&&(this.menuShortcuts.push(this.menuProviders[e]),this.sortMenuShortcuts(),this.emitMenuShortcutsUpdated())}},{key:"removeMenuShortcut",value:function(e){this.menuShortcuts=this.menuShortcuts.filter((function(t){return t.id!==e})),this.emitMenuShortcutsUpdated()}},{key:"sortMenuShortcuts",value:function(){var e=this;this.menuShortcuts=this.shortcutOrder.reduce((function(t,n){var o=e.menuShortcuts.find((function(e){return e.id===n}));return o&&t.push(o),t}),[])}},{key:"emitMenuShortcutsUpdated",value:function(){var e=new CustomEvent("menuShortcutsUpdated",{detail:this.menuShortcuts});this.dispatchEvent(e)}},{key:"emitLoadingStatusUpdate",value:function(e){var t=new CustomEvent("loadingStateUpdated",{detail:{loaded:e}});this.dispatchEvent(t)}},{key:"bindEventListeners",value:function(){var e=this;window.addEventListener("BookReader:PostInit",(function(t){e.bookreader=t.detail.props,e.bookReaderLoaded=!0,e.bookReaderCannotLoad=!1,e.emitLoadingStatusUpdate(!0),e.loadSharedObserver(),setTimeout((function(){e.bookreader.resize()}),0)})),window.addEventListener("BookReader:fullscreenToggled",(function(t){var n=t.detail.props,o=void 0===n?null:n;o&&(e.bookreader=o),e.manageFullScreenBehavior()}),{passive:!0}),window.addEventListener("BookReader:ToggleSearchMenu",(function(t){e.dispatchEvent(new CustomEvent(ea,{detail:{menuId:"search",action:"toggle"}}))})),window.addEventListener("LendingFlow:PostInit",(function(t){var n=t.detail,o=n.downloadTypesAvailable,r=n.lendingStatus,i=n.isAdmin,s=n.previewType;e.lendingInitialized=!0,e.downloadableTypes=o,e.lendingStatus=r,e.isAdmin=i,e.bookReaderCannotLoad="singlePagePreview"===s,e.emitLoadingStatusUpdate(!0)})),window.addEventListener("BRJSIA:PostInit",(function(t){var n=t.detail,o=n.isRestricted,r=n.downloadURLs;e.bookReaderLoaded=!0,e.downloadableTypes=r,e.bookIsRestricted=o}))}},{key:"loadSharedObserver",value:function(){var e;this.sharedObserverHandler={handleResize:this.handleResize.bind(this)},null===(e=this.sharedObserver)||void 0===e||e.addObserver({target:this.mainBRContainer,handler:this.sharedObserverHandler})}},{key:"handleResize",value:function(e){var t=e.contentRect,n=e.target,o=this.brWidth,r=this.brHeight,i=this.bookreader.animating;n===this.mainBRContainer&&(this.brWidth=t.width,this.brHeight=t.height);var s=o!==this.brWidth,a=r!==this.brHeight;i||!s&&!a||this.bookreader.resize()}},{key:"manageFullScreenBehavior",value:function(){this.emitFullScreenState(),this.bookreader.options.enableFSLogoShortcut&&(this.bookreader.isFullscreen()?this.addFullscreenShortcut():this.deleteFullscreenShortcut())}},{key:"emitFullScreenState",value:function(){var e=this.bookreader.isFullscreen(),t=new CustomEvent("ViewportInFullScreen",{detail:{isFullScreen:e}});this.dispatchEvent(t)}},{key:"itemImage",get:function(){var e,t=null===(e=this.itemMD)||void 0===e?void 0:e.metadata.identifier,n="https://".concat(this.baseHost,"/services/img/").concat(t);return(0,o.dy)(Is||(Is=Vs(['<img class="cover-img" src=',' alt="cover image for ','">'])),n,t)}},{key:"placeholder",get:function(){return(0,o.dy)(zs||(zs=Vs(['<div class="placeholder">',"</div>"])),this.itemImage)}},{key:"render",value:function(){return(0,o.dy)(Ls||(Ls=Vs(['<div id="book-navigator__root">\n      ',"\n      ","\n    </div>\n  "])),this.bookReaderCannotLoad?this.placeholder:a.Ld,this.bookReaderCannotLoad?a.Ld:(0,o.dy)(Ps||(Ps=Vs(['<slot name="main"></slot>']))))}}])&&Gs(t.prototype,n),r&&Gs(t,r),c}(o.oi);function na(e){return(na="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function oa(e,t){return t||(t=e.slice(0)),Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}function ra(e){return function(e){if(Array.isArray(e))return ia(e)}(e)||function(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(e)||function(e,t){if(e){if("string"==typeof e)return ia(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?ia(e,t):void 0}}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function ia(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,o=new Array(t);n<t;n++)o[n]=e[n];return o}function sa(e,t){for(var n=0;n<t.length;n++){var o=t[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o)}}function aa(e,t){return(aa=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function la(e,t){if(t&&("object"===na(t)||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e)}function ca(e){return(ca=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}customElements.define("book-navigator",ta);var da=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&aa(e,t)}(l,e);var t,n,r,i,s,a=(i=l,s=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}(),function(){var e,t=ca(i);if(s){var n=ca(this).constructor;e=Reflect.construct(t,arguments,n)}else e=t.apply(this,arguments);return la(this,e)});function l(){var e;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,l),(e=a.call(this)).item=void 0,e.bookreader=void 0,e.baseHost="https://archive.org",e.fullscreen=!1,e.signedIn=!1,e.modal=void 0,e.sharedObserver=void 0,e.loaded=!1,e.menuShortcuts=[],e.menuContents=[],e}return t=l,r=[{key:"properties",get:function(){return{item:{type:Object},baseHost:{type:String},signedIn:{type:Boolean},fullscreen:{type:Boolean,reflect:!0,attribute:!0},sharedObserver:{type:Object,attribute:!1},modal:{type:Object,attribute:!1},loaded:{type:Boolean},menuShortcuts:{type:Array},menuContents:{type:Array}}}},{key:"styles",get:function(){return(0,o.iv)(Ks||(Ks=oa(['\n      :host {\n        display: block;\n        --primaryBGColor: var(--black, #000);\n        --secondaryBGColor: #222;\n        --tertiaryBGColor: #333;\n        --primaryTextColor: var(--white, #fff);\n        --primaryCTAFill: #194880;\n        --primaryCTABorder: #c5d1df;\n        --secondaryCTAFill: #333;\n        --secondaryCTABorder: #999;\n        --primaryErrorCTAFill: #e51c26;\n        --primaryErrorCTABorder: #f8c6c8;\n        background-color: var(--primaryBGColor);\n        position: relative;\n      }\n\n      :host([fullscreen]),\n      ia-item-navigator[viewportinfullscreen] {\n        position: fixed;\n        inset: 0;\n        height: 100%;\n        min-height: unset;\n      }\n\n      .main-component {\n        height: 100%;\n        width: 100%;\n        min-height: inherit;\n      }\n\n      div[slot="header"],\n      div[slot="main"] {\n        display: flex;\n        width: 100%;\n      }\n\n      slot {\n        display: block;\n        flex: 1;\n      }\n\n      ia-item-navigator {\n        min-height: var(--br-height, inherit);\n        height: var(--br-height, inherit);\n        display: block;\n        width: 100%;\n        color: var(--primaryTextColor);\n        --menuButtonLabelDisplay: block;\n        --menuWidth: 320px;\n        --menuSliderBg: var(--secondaryBGColor);\n        --activeButtonBg: var(--tertiaryBGColor);\n        --subpanelRightBorderColor: var(--secondaryCTABorder);\n        --animationTiming: 100ms;\n        --iconFillColor: var(--primaryTextColor);\n        --iconStrokeColor: var(--primaryTextColor);\n        --menuSliderHeaderIconHeight: 2rem;\n        --menuSliderHeaderIconWidth: 2rem;\n        --iconWidth: 2.4rem;\n        --iconHeight: 2.4rem;\n        --shareLinkColor: var(--primaryTextColor);\n        --shareIconBorder: var(--primaryTextColor);\n        --shareIconBg: var(--secondaryBGColor);\n        --activityIndicatorLoadingDotColor: var(--primaryTextColor);\n        --activityIndicatorLoadingRingColor: var(--primaryTextColor);\n      }\n    '])))}}],(n=[{key:"updated",value:function(){this.modal||this.setModalManager(),this.sharedObserver||(this.sharedObserver=new At)}},{key:"setModalManager",value:function(){var e=document.querySelector("modal-manager");e||(e=document.createElement("modal-manager"),document.body.appendChild(e)),this.modal=e}},{key:"manageFullscreen",value:function(e){var t=!!e.detail.isFullScreen;this.fullscreen=t,this.dispatchEvent(new CustomEvent("fullscreenStateUpdated",{detail:{fullscreen:t}}))}},{key:"loadingStateUpdated",value:function(e){var t=e.detail.loaded;this.loaded=t||null,this.dispatchEvent(new CustomEvent("loadingStateUpdated",{detail:{loaded:t}}))}},{key:"setMenuShortcuts",value:function(e){this.menuShortcuts=ra(e.detail)}},{key:"setMenuContents",value:function(e){var t=ra(e.detail);this.menuContents=t}},{key:"manageSideMenuEvents",value:function(e){var t=e.detail,n=t.menuId,o=t.action;n&&("open"===o?(this.itemNav.openShortcut(n),this.openShortcut(n)):"toggle"===o&&(this.itemNav.openMenu(n),this.itemNav.toggleMenu()))}},{key:"render",value:function(){return(0,o.dy)(Qs||(Qs=oa(['\n      <div class="main-component">\n        <ia-item-navigator\n          ?viewportInFullscreen=',"\n          .basehost=","\n          .item=","\n          .modal=","\n          .loaded=","\n          .sharedObserver=","\n          ?signedIn=","\n          .menuShortcuts=","\n          .menuContents=",'\n        >\n          <div slot="header">\n            <slot name="header"></slot>\n          </div>\n          <div slot="main">\n            <book-navigator\n              .modal=',"\n              .baseHost=","\n              .itemMD=","\n              ?signedIn=","\n              ?sideMenuOpen=","\n              .sharedObserver=","\n              @ViewportInFullScreen=","\n              @loadingStateUpdated=","\n              @updateSideMenu=","\n              @menuUpdated=","\n              @menuShortcutsUpdated=",'\n            >\n              <div slot="main">\n                <slot name="main"></slot>\n              </div>\n            </book-navigator>\n          </div>\n        </ia-item-navigator>\n      </div>\n    '])),this.fullscreen,this.baseHost,this.item,this.modal,this.loaded,this.sharedObserver,this.signedIn,this.menuShortcuts,this.menuContents,this.modal,this.baseHost,this.item,this.signedIn,this.menuOpened,this.sharedObserver,this.manageFullscreen,this.loadingStateUpdated,this.manageSideMenuEvents,this.setMenuContents,this.setMenuShortcuts)}}])&&sa(t.prototype,n),r&&sa(t,r),l}(o.oi);window.customElements.define("ia-bookreader",da)},8730:function(e,t,n){var o=n(111),r=Math.floor;e.exports=function(e){return!o(e)&&isFinite(e)&&r(e)===e}},3161:function(e,t,n){n(2109)({target:"Number",stat:!0},{isInteger:n(8730)})},4723:function(e,t,n){"use strict";var o=n(7007),r=n(9670),i=n(7466),s=n(1340),a=n(4488),l=n(1530),c=n(7651);o("match",(function(e,t,n){return[function(t){var n=a(this),o=null==t?void 0:t[e];return void 0!==o?o.call(t,n):new RegExp(t)[e](s(n))},function(e){var o=r(this),a=s(e),d=n(t,o,a);if(d.done)return d.value;if(!o.global)return c(o,a);var u=o.unicode;o.lastIndex=0;for(var h,p=[],f=0;null!==(h=c(o,a));){var m=s(h[0]);p[f]=m,""===m&&(o.lastIndex=l(a,i(o.lastIndex),u)),f++}return 0===f?null:p}]}))},3774:function(e,t){!function(e){"use strict";function t(e,t,n,o){var r,i=!1,s=0;function a(){r&&clearTimeout(r)}function l(){for(var l=arguments.length,c=new Array(l),d=0;d<l;d++)c[d]=arguments[d];var u=this,h=Date.now()-s;function p(){s=Date.now(),n.apply(u,c)}function f(){r=void 0}i||(o&&!r&&p(),a(),void 0===o&&h>e?p():!0!==t&&(r=setTimeout(o?f:p,void 0===o?e-h:e)))}return"boolean"!=typeof t&&(o=n,n=t,t=void 0),l.cancel=function(){a(),i=!0},l}e.debounce=function(e,n,o){return void 0===o?t(e,n,!1):t(e,o,!1!==n)},e.throttle=t,Object.defineProperty(e,"__esModule",{value:!0})}(t)}},function(e){e(e.s=2937)}]);
//# sourceMappingURL=ia-bookreader-bundle.js.map
(()=>{var vi=Object.create,Te=Object.defineProperty,bi=Object.getPrototypeOf,ki=Object.prototype.hasOwnProperty,yi=Object.getOwnPropertyNames,wi=Object.getOwnPropertyDescriptor;var xi=o=>Te(o,"__esModule",{value:!0});var Ci=(o,e)=>()=>(e||(e={exports:{}},o(e.exports,e)),e.exports);var Si=(o,e,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of yi(e))!ki.call(o,i)&&i!=="default"&&Te(o,i,{get:()=>e[i],enumerable:!(t=wi(e,i))||t.enumerable});return o},Bi=o=>Si(xi(Te(o!=null?vi(bi(o)):{},"default",o&&o.__esModule&&"default"in o?{get:()=>o.default,enumerable:!0}:{value:o,enumerable:!0})),o);var vo=Ci((we,go)=>{(function(o,e){typeof we=="object"&&typeof go!="undefined"?e(we):typeof define=="function"&&define.amd?define(["exports"],e):(o=o||self,e(o.throttleDebounce={}))})(we,function(o){"use strict";function e(i,r,n,a){var d,c=!1,m=0;function g(){d&&clearTimeout(d)}function u(){g(),c=!0}typeof r!="boolean"&&(a=n,n=r,r=void 0);function w(){for(var v=arguments.length,b=new Array(v),f=0;f<v;f++)b[f]=arguments[f];var k=this,y=Date.now()-m;if(c)return;function x(){m=Date.now(),n.apply(k,b)}function S(){d=void 0}a&&!d&&x(),g(),a===void 0&&y>i?x():r!==!0&&(d=setTimeout(a?S:x,a===void 0?i-y:i))}return w.cancel=u,w}function t(i,r,n){return n===void 0?e(i,r,!1):e(i,n,r!==!1)}o.debounce=t,o.throttle=e,Object.defineProperty(o,"__esModule",{value:!0})})});var Ee=typeof window!="undefined"&&window.customElements!=null&&window.customElements.polyfillWrapFlushCallback!==void 0,ee=(o,e,t=null,i=null)=>{for(;e!==t;){let r=e.nextSibling;o.insertBefore(e,i),e=r}},$=(o,e,t=null)=>{for(;e!==t;){let i=e.nextSibling;o.removeChild(e),e=i}};var L=`{{lit-${String(Math.random()).slice(2)}}}`,ze=`<!--${L}-->`,ct=new RegExp(`${L}|${ze}`),H="$lit$",F=class{constructor(e,t){this.parts=[],this.element=t;let i=[],r=[],n=document.createTreeWalker(t.content,133,null,!1),a=0,d=-1,c=0,{strings:m,values:{length:g}}=e;for(;c<g;){let u=n.nextNode();if(u===null){n.currentNode=r.pop();continue}if(d++,u.nodeType===1){if(u.hasAttributes()){let w=u.attributes,{length:v}=w,b=0;for(let f=0;f<v;f++)ht(w[f].name,H)&&b++;for(;b-- >0;){let f=m[c],k=te.exec(f)[2],y=k.toLowerCase()+H,x=u.getAttribute(y);u.removeAttribute(y);let S=x.split(ct);this.parts.push({type:"attribute",index:d,name:k,strings:S}),c+=S.length-1}}u.tagName==="TEMPLATE"&&(r.push(u),n.currentNode=u.content)}else if(u.nodeType===3){let w=u.data;if(w.indexOf(L)>=0){let v=u.parentNode,b=w.split(ct),f=b.length-1;for(let k=0;k<f;k++){let y,x=b[k];if(x==="")y=B();else{let S=te.exec(x);S!==null&&ht(S[2],H)&&(x=x.slice(0,S.index)+S[1]+S[2].slice(0,-H.length)+S[3]),y=document.createTextNode(x)}v.insertBefore(y,u),this.parts.push({type:"node",index:++d})}b[f]===""?(v.insertBefore(B(),u),i.push(u)):u.data=b[f],c+=f}}else if(u.nodeType===8)if(u.data===L){let w=u.parentNode;(u.previousSibling===null||d===a)&&(d++,w.insertBefore(B(),u)),a=d,this.parts.push({type:"node",index:d}),u.nextSibling===null?u.data="":(i.push(u),d--),c++}else{let w=-1;for(;(w=u.data.indexOf(L,w+1))!==-1;)this.parts.push({type:"node",index:-1}),c++}}for(let u of i)u.parentNode.removeChild(u)}},ht=(o,e)=>{let t=o.length-e.length;return t>=0&&o.slice(t)===e},Y=o=>o.index!==-1,B=()=>document.createComment(""),te=/([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;var _e=133;function Ae(o,e){let{element:{content:t},parts:i}=o,r=document.createTreeWalker(t,_e,null,!1),n=G(i),a=i[n],d=-1,c=0,m=[],g=null;for(;r.nextNode();){d++;let u=r.currentNode;for(u.previousSibling===g&&(g=null),e.has(u)&&(m.push(u),g===null&&(g=u)),g!==null&&c++;a!==void 0&&a.index===d;)a.index=g!==null?-1:a.index-c,n=G(i,n),a=i[n]}m.forEach(u=>u.parentNode.removeChild(u))}var Ii=o=>{let e=o.nodeType===11?0:1,t=document.createTreeWalker(o,_e,null,!1);for(;t.nextNode();)e++;return e},G=(o,e=-1)=>{for(let t=e+1;t<o.length;t++){let i=o[t];if(Y(i))return t}return-1};function mt(o,e,t=null){let{element:{content:i},parts:r}=o;if(t==null){i.appendChild(e);return}let n=document.createTreeWalker(i,_e,null,!1),a=G(r),d=0,c=-1;for(;n.nextNode();)for(c++,n.currentNode===t&&(d=Ii(e),t.parentNode.insertBefore(e,t));a!==-1&&r[a].index===c;){if(d>0){for(;a!==-1;)r[a].index+=d,a=G(r,a);return}a=G(r,a)}}var ut=new WeakMap,A=o=>(...e)=>{let t=o(...e);return ut.set(t,!0),t},P=o=>typeof o=="function"&&ut.has(o);var I={},p={};var j=class{constructor(e,t,i){this.__parts=[],this.template=e,this.processor=t,this.options=i}update(e){let t=0;for(let i of this.__parts)i!==void 0&&i.setValue(e[t]),t++;for(let i of this.__parts)i!==void 0&&i.commit()}_clone(){let e=Ee?this.template.element.content.cloneNode(!0):document.importNode(this.template.element.content,!0),t=[],i=this.template.parts,r=document.createTreeWalker(e,133,null,!1),n=0,a=0,d,c=r.nextNode();for(;n<i.length;){if(d=i[n],!Y(d)){this.__parts.push(void 0),n++;continue}for(;a<d.index;)a++,c.nodeName==="TEMPLATE"&&(t.push(c),r.currentNode=c.content),(c=r.nextNode())===null&&(r.currentNode=t.pop(),c=r.nextNode());if(d.type==="node"){let m=this.processor.handleTextExpression(this.options);m.insertAfterNode(c.previousSibling),this.__parts.push(m)}else this.__parts.push(...this.processor.handleAttributeExpressions(c,d.name,d.strings,this.options));n++}return Ee&&(document.adoptNode(e),customElements.upgrade(e)),e}};var pt=window.trustedTypes&&trustedTypes.createPolicy("lit-html",{createHTML:o=>o}),Mi=` ${L} `,E=class{constructor(e,t,i,r){this.strings=e,this.values=t,this.type=i,this.processor=r}getHTML(){let e=this.strings.length-1,t="",i=!1;for(let r=0;r<e;r++){let n=this.strings[r],a=n.lastIndexOf("<!--");i=(a>-1||i)&&n.indexOf("-->",a+1)===-1;let d=te.exec(n);d===null?t+=n+(i?Mi:ze):t+=n.substr(0,d.index)+d[1]+d[2]+H+d[3]+L}return t+=this.strings[e],t}getTemplateElement(){let e=document.createElement("template"),t=this.getHTML();return pt!==void 0&&(t=pt.createHTML(t)),e.innerHTML=t,e}};var V=o=>o===null||!(typeof o=="object"||typeof o=="function"),oe=o=>Array.isArray(o)||!!(o&&o[Symbol.iterator]),J=class{constructor(e,t,i){this.dirty=!0,this.element=e,this.name=t,this.strings=i,this.parts=[];for(let r=0;r<i.length-1;r++)this.parts[r]=this._createPart()}_createPart(){return new q(this)}_getValue(){let e=this.strings,t=e.length-1,i=this.parts;if(t===1&&e[0]===""&&e[1]===""){let n=i[0].value;if(typeof n=="symbol")return String(n);if(typeof n=="string"||!oe(n))return n}let r="";for(let n=0;n<t;n++){r+=e[n];let a=i[n];if(a!==void 0){let d=a.value;if(V(d)||!oe(d))r+=typeof d=="string"?d:String(d);else for(let c of d)r+=typeof c=="string"?c:String(c)}}return r+=e[t],r}commit(){this.dirty&&(this.dirty=!1,this.element.setAttribute(this.name,this._getValue()))}},q=class{constructor(e){this.value=void 0,this.committer=e}setValue(e){e!==I&&(!V(e)||e!==this.value)&&(this.value=e,P(e)||(this.committer.dirty=!0))}commit(){for(;P(this.value);){let e=this.value;this.value=I,e(this)}this.value!==I&&this.committer.commit()}},M=class{constructor(e){this.value=void 0,this.__pendingValue=void 0,this.options=e}appendInto(e){this.startNode=e.appendChild(B()),this.endNode=e.appendChild(B())}insertAfterNode(e){this.startNode=e,this.endNode=e.nextSibling}appendIntoPart(e){e.__insert(this.startNode=B()),e.__insert(this.endNode=B())}insertAfterPart(e){e.__insert(this.startNode=B()),this.endNode=e.endNode,e.endNode=this.startNode}setValue(e){this.__pendingValue=e}commit(){if(this.startNode.parentNode===null)return;for(;P(this.__pendingValue);){let t=this.__pendingValue;this.__pendingValue=I,t(this)}let e=this.__pendingValue;e!==I&&(V(e)?e!==this.value&&this.__commitText(e):e instanceof E?this.__commitTemplateResult(e):e instanceof Node?this.__commitNode(e):oe(e)?this.__commitIterable(e):e===p?(this.value=p,this.clear()):this.__commitText(e))}__insert(e){this.endNode.parentNode.insertBefore(e,this.endNode)}__commitNode(e){this.value!==e&&(this.clear(),this.__insert(e),this.value=e)}__commitText(e){let t=this.startNode.nextSibling;e=e??"";let i=typeof e=="string"?e:String(e);t===this.endNode.previousSibling&&t.nodeType===3?t.data=i:this.__commitNode(document.createTextNode(i)),this.value=e}__commitTemplateResult(e){let t=this.options.templateFactory(e);if(this.value instanceof j&&this.value.template===t)this.value.update(e.values);else{let i=new j(t,e.processor,this.options),r=i._clone();i.update(e.values),this.__commitNode(r),this.value=i}}__commitIterable(e){Array.isArray(this.value)||(this.value=[],this.clear());let t=this.value,i=0,r;for(let n of e)r=t[i],r===void 0&&(r=new M(this.options),t.push(r),i===0?r.appendIntoPart(this):r.insertAfterPart(t[i-1])),r.setValue(n),r.commit(),i++;i<t.length&&(t.length=i,this.clear(r&&r.endNode))}clear(e=this.startNode){$(this.startNode.parentNode,e.nextSibling,this.endNode)}},ie=class{constructor(e,t,i){if(this.value=void 0,this.__pendingValue=void 0,i.length!==2||i[0]!==""||i[1]!=="")throw new Error("Boolean attributes can only contain a single expression");this.element=e,this.name=t,this.strings=i}setValue(e){this.__pendingValue=e}commit(){for(;P(this.__pendingValue);){let t=this.__pendingValue;this.__pendingValue=I,t(this)}if(this.__pendingValue===I)return;let e=!!this.__pendingValue;this.value!==e&&(e?this.element.setAttribute(this.name,""):this.element.removeAttribute(this.name),this.value=e),this.__pendingValue=I}},re=class extends J{constructor(e,t,i){super(e,t,i);this.single=i.length===2&&i[0]===""&&i[1]===""}_createPart(){return new Q(this)}_getValue(){return this.single?this.parts[0].value:super._getValue()}commit(){this.dirty&&(this.dirty=!1,this.element[this.name]=this._getValue())}},Q=class extends q{},ft=!1;(()=>{try{let o={get capture(){return ft=!0,!1}};window.addEventListener("test",o,o),window.removeEventListener("test",o,o)}catch(o){}})();var se=class{constructor(e,t,i){this.value=void 0,this.__pendingValue=void 0,this.element=e,this.eventName=t,this.eventContext=i,this.__boundHandleEvent=r=>this.handleEvent(r)}setValue(e){this.__pendingValue=e}commit(){for(;P(this.__pendingValue);){let n=this.__pendingValue;this.__pendingValue=I,n(this)}if(this.__pendingValue===I)return;let e=this.__pendingValue,t=this.value,i=e==null||t!=null&&(e.capture!==t.capture||e.once!==t.once||e.passive!==t.passive),r=e!=null&&(t==null||i);i&&this.element.removeEventListener(this.eventName,this.__boundHandleEvent,this.__options),r&&(this.__options=Li(e),this.element.addEventListener(this.eventName,this.__boundHandleEvent,this.__options)),this.value=e,this.__pendingValue=I}handleEvent(e){typeof this.value=="function"?this.value.call(this.eventContext||this.element,e):this.value.handleEvent(e)}},Li=o=>o&&(ft?{capture:o.capture,passive:o.passive,once:o.once}:o.capture);function Pe(o){let e=N.get(o.type);e===void 0&&(e={stringsArray:new WeakMap,keyString:new Map},N.set(o.type,e));let t=e.stringsArray.get(o.strings);if(t!==void 0)return t;let i=o.strings.join(L);return t=e.keyString.get(i),t===void 0&&(t=new F(o,o.getTemplateElement()),e.keyString.set(i,t)),e.stringsArray.set(o.strings,t),t}var N=new Map;var z=new WeakMap,X=(o,e,t)=>{let i=z.get(e);i===void 0&&($(e,e.firstChild),z.set(e,i=new M(Object.assign({templateFactory:Pe},t))),i.appendInto(e)),i.setValue(o),i.commit()};var je=class{handleAttributeExpressions(e,t,i,r){let n=t[0];return n==="."?new re(e,t.slice(1),i).parts:n==="@"?[new se(e,t.slice(1),r.eventContext)]:n==="?"?[new ie(e,t.slice(1),i)]:new J(e,t,i).parts}handleTextExpression(e){return new M(e)}},Ne=new je;typeof window!="undefined"&&(window.litHtmlVersions||(window.litHtmlVersions=[])).push("1.3.0");var s=(o,...e)=>new E(o,e,"html",Ne);var vt=(o,e)=>`${o}--${e}`,ne=!0;typeof window.ShadyCSS=="undefined"?ne=!1:typeof window.ShadyCSS.prepareTemplateDom=="undefined"&&(console.warn("Incompatible ShadyCSS version detected. Please update to at least @webcomponents/webcomponentsjs@2.0.2 and @webcomponents/shadycss@1.3.1."),ne=!1);var $i=o=>e=>{let t=vt(e.type,o),i=N.get(t);i===void 0&&(i={stringsArray:new WeakMap,keyString:new Map},N.set(t,i));let r=i.stringsArray.get(e.strings);if(r!==void 0)return r;let n=e.strings.join(L);if(r=i.keyString.get(n),r===void 0){let a=e.getTemplateElement();ne&&window.ShadyCSS.prepareTemplateDom(a,o),r=new F(e,a),i.keyString.set(n,r)}return i.stringsArray.set(e.strings,r),r},Ti=["html","svg"],Ei=o=>{Ti.forEach(e=>{let t=N.get(vt(e,o));t!==void 0&&t.keyString.forEach(i=>{let{element:{content:r}}=i,n=new Set;Array.from(r.querySelectorAll("style")).forEach(a=>{n.add(a)}),Ae(i,n)})})},bt=new Set,zi=(o,e,t)=>{bt.add(o);let i=t?t.element:document.createElement("template"),r=e.querySelectorAll("style"),{length:n}=r;if(n===0){window.ShadyCSS.prepareTemplateStyles(i,o);return}let a=document.createElement("style");for(let m=0;m<n;m++){let g=r[m];g.parentNode.removeChild(g),a.textContent+=g.textContent}Ei(o);let d=i.content;t?mt(t,a,d.firstChild):d.insertBefore(a,d.firstChild),window.ShadyCSS.prepareTemplateStyles(i,o);let c=d.querySelector("style");if(window.ShadyCSS.nativeShadow&&c!==null)e.insertBefore(c.cloneNode(!0),e.firstChild);else if(t){d.insertBefore(a,d.firstChild);let m=new Set;m.add(a),Ae(t,m)}},kt=(o,e,t)=>{if(!t||typeof t!="object"||!t.scopeName)throw new Error("The `scopeName` option is required.");let i=t.scopeName,r=z.has(e),n=ne&&e.nodeType===11&&!!e.host,a=n&&!bt.has(i),d=a?document.createDocumentFragment():e;if(X(o,d,Object.assign({templateFactory:$i(i)},t)),a){let c=z.get(d);z.delete(d);let m=c.value instanceof j?c.value.template:void 0;zi(i,d,m),$(e,e.firstChild),e.appendChild(d),z.set(e,c)}!r&&n&&window.ShadyCSS.styleElement(e.host)};var yt;window.JSCompiler_renameProperty=(o,e)=>o;var Re={toAttribute(o,e){switch(e){case Boolean:return o?"":null;case Object:case Array:return o==null?o:JSON.stringify(o)}return o},fromAttribute(o,e){switch(e){case Boolean:return o!==null;case Number:return o===null?null:Number(o);case Object:case Array:return JSON.parse(o)}return o}},wt=(o,e)=>e!==o&&(e===e||o===o),Oe={attribute:!0,type:String,converter:Re,reflect:!1,hasChanged:wt},He=1,Fe=1<<2,Ve=1<<3,qe=1<<4,We="finalized",ae=class extends HTMLElement{constructor(){super();this.initialize()}static get observedAttributes(){this.finalize();let e=[];return this._classProperties.forEach((t,i)=>{let r=this._attributeNameForProperty(i,t);r!==void 0&&(this._attributeToPropertyMap.set(r,i),e.push(r))}),e}static _ensureClassProperties(){if(!this.hasOwnProperty(JSCompiler_renameProperty("_classProperties",this))){this._classProperties=new Map;let e=Object.getPrototypeOf(this)._classProperties;e!==void 0&&e.forEach((t,i)=>this._classProperties.set(i,t))}}static createProperty(e,t=Oe){if(this._ensureClassProperties(),this._classProperties.set(e,t),t.noAccessor||this.prototype.hasOwnProperty(e))return;let i=typeof e=="symbol"?Symbol():`__${e}`,r=this.getPropertyDescriptor(e,i,t);r!==void 0&&Object.defineProperty(this.prototype,e,r)}static getPropertyDescriptor(e,t,i){return{get(){return this[t]},set(r){let n=this[e];this[t]=r,this.requestUpdateInternal(e,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this._classProperties&&this._classProperties.get(e)||Oe}static finalize(){let e=Object.getPrototypeOf(this);if(e.hasOwnProperty(We)||e.finalize(),this[We]=!0,this._ensureClassProperties(),this._attributeToPropertyMap=new Map,this.hasOwnProperty(JSCompiler_renameProperty("properties",this))){let t=this.properties,i=[...Object.getOwnPropertyNames(t),...typeof Object.getOwnPropertySymbols=="function"?Object.getOwnPropertySymbols(t):[]];for(let r of i)this.createProperty(r,t[r])}}static _attributeNameForProperty(e,t){let i=t.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}static _valueHasChanged(e,t,i=wt){return i(e,t)}static _propertyValueFromAttribute(e,t){let i=t.type,r=t.converter||Re,n=typeof r=="function"?r:r.fromAttribute;return n?n(e,i):e}static _propertyValueToAttribute(e,t){if(t.reflect===void 0)return;let i=t.type,r=t.converter;return(r&&r.toAttribute||Re.toAttribute)(e,i)}initialize(){this._updateState=0,this._updatePromise=new Promise(e=>this._enableUpdatingResolver=e),this._changedProperties=new Map,this._saveInstanceProperties(),this.requestUpdateInternal()}_saveInstanceProperties(){this.constructor._classProperties.forEach((e,t)=>{if(this.hasOwnProperty(t)){let i=this[t];delete this[t],this._instanceProperties||(this._instanceProperties=new Map),this._instanceProperties.set(t,i)}})}_applyInstanceProperties(){this._instanceProperties.forEach((e,t)=>this[t]=e),this._instanceProperties=void 0}connectedCallback(){this.enableUpdating()}enableUpdating(){this._enableUpdatingResolver!==void 0&&(this._enableUpdatingResolver(),this._enableUpdatingResolver=void 0)}disconnectedCallback(){}attributeChangedCallback(e,t,i){t!==i&&this._attributeToProperty(e,i)}_propertyToAttribute(e,t,i=Oe){let r=this.constructor,n=r._attributeNameForProperty(e,i);if(n!==void 0){let a=r._propertyValueToAttribute(t,i);if(a===void 0)return;this._updateState=this._updateState|Ve,a==null?this.removeAttribute(n):this.setAttribute(n,a),this._updateState=this._updateState&~Ve}}_attributeToProperty(e,t){if(this._updateState&Ve)return;let i=this.constructor,r=i._attributeToPropertyMap.get(e);if(r!==void 0){let n=i.getPropertyOptions(r);this._updateState=this._updateState|qe,this[r]=i._propertyValueFromAttribute(t,n),this._updateState=this._updateState&~qe}}requestUpdateInternal(e,t,i){let r=!0;if(e!==void 0){let n=this.constructor;i=i||n.getPropertyOptions(e),n._valueHasChanged(this[e],t,i.hasChanged)?(this._changedProperties.has(e)||this._changedProperties.set(e,t),i.reflect===!0&&!(this._updateState&qe)&&(this._reflectingProperties===void 0&&(this._reflectingProperties=new Map),this._reflectingProperties.set(e,i))):r=!1}!this._hasRequestedUpdate&&r&&(this._updatePromise=this._enqueueUpdate())}requestUpdate(e,t){return this.requestUpdateInternal(e,t),this.updateComplete}async _enqueueUpdate(){this._updateState=this._updateState|Fe;try{await this._updatePromise}catch(t){}let e=this.performUpdate();return e!=null&&await e,!this._hasRequestedUpdate}get _hasRequestedUpdate(){return this._updateState&Fe}get hasUpdated(){return this._updateState&He}performUpdate(){if(!this._hasRequestedUpdate)return;this._instanceProperties&&this._applyInstanceProperties();let e=!1,t=this._changedProperties;try{e=this.shouldUpdate(t),e?this.update(t):this._markUpdated()}catch(i){throw e=!1,this._markUpdated(),i}e&&(this._updateState&He||(this._updateState=this._updateState|He,this.firstUpdated(t)),this.updated(t))}_markUpdated(){this._changedProperties=new Map,this._updateState=this._updateState&~Fe}get updateComplete(){return this._getUpdateComplete()}_getUpdateComplete(){return this._updatePromise}shouldUpdate(e){return!0}update(e){this._reflectingProperties!==void 0&&this._reflectingProperties.size>0&&(this._reflectingProperties.forEach((t,i)=>this._propertyToAttribute(i,this[i],t)),this._reflectingProperties=void 0),this._markUpdated()}updated(e){}firstUpdated(e){}};yt=We;ae[yt]=!0;var _i=(o,e)=>(window.customElements.define(o,e),e),Ai=(o,e)=>{let{kind:t,elements:i}=e;return{kind:t,elements:i,finisher(r){window.customElements.define(o,r)}}},le=o=>e=>typeof e=="function"?_i(o,e):Ai(o,e),Pi=(o,e)=>e.kind==="method"&&e.descriptor&&!("value"in e.descriptor)?Object.assign(Object.assign({},e),{finisher(t){t.createProperty(e.key,o)}}):{kind:"field",key:Symbol(),placement:"own",descriptor:{},initializer(){typeof e.initializer=="function"&&(this[e.key]=e.initializer.call(this))},finisher(t){t.createProperty(e.key,o)}},ji=(o,e,t)=>{e.constructor.createProperty(t,o)};function W(o){return(e,t)=>t!==void 0?ji(o,e,t):Pi(o,e)}function xt(o,e){return(t,i)=>{let r={get(){return this.renderRoot.querySelector(o)},enumerable:!0,configurable:!0};if(e){let n=typeof i=="symbol"?Symbol():`__${i}`;r.get=function(){return this[n]===void 0&&(this[n]=this.renderRoot.querySelector(o)),this[n]}}return i!==void 0?Ni(r,t,i):Ri(r,t)}}var Ni=(o,e,t)=>{Object.defineProperty(e,t,o)},Ri=(o,e)=>({kind:"method",placement:"prototype",key:e.key,descriptor:o});var Ct=Element.prototype,Ur=Ct.msMatchesSelector||Ct.webkitMatchesSelector;var de=window.ShadowRoot&&(window.ShadyCSS===void 0||window.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Ze=Symbol(),ce=class{constructor(e,t){if(t!==Ze)throw new Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e}get styleSheet(){return this._styleSheet===void 0&&(de?(this._styleSheet=new CSSStyleSheet,this._styleSheet.replaceSync(this.cssText)):this._styleSheet=null),this._styleSheet}toString(){return this.cssText}},St=o=>new ce(String(o),Ze),Oi=o=>{if(o instanceof ce)return o.cssText;if(typeof o=="number")return o;throw new Error(`Value passed to 'css' function must be a 'css' function result: ${o}. Use 'unsafeCSS' to pass non-literal values, but
            take care to ensure page security.`)},l=(o,...e)=>{let t=e.reduce((i,r,n)=>i+Oi(r)+o[n+1],o[0]);return new ce(t,Ze)};(window.litElementVersions||(window.litElementVersions=[])).push("2.4.0");var Bt={},h=class extends ae{static getStyles(){return this.styles}static _getUniqueStyles(){if(this.hasOwnProperty(JSCompiler_renameProperty("_styles",this)))return;let e=this.getStyles();if(Array.isArray(e)){let t=(n,a)=>n.reduceRight((d,c)=>Array.isArray(c)?t(c,d):(d.add(c),d),a),i=t(e,new Set),r=[];i.forEach(n=>r.unshift(n)),this._styles=r}else this._styles=e===void 0?[]:[e];this._styles=this._styles.map(t=>{if(t instanceof CSSStyleSheet&&!de){let i=Array.prototype.slice.call(t.cssRules).reduce((r,n)=>r+n.cssText,"");return St(i)}return t})}initialize(){super.initialize(),this.constructor._getUniqueStyles(),this.renderRoot=this.createRenderRoot(),window.ShadowRoot&&this.renderRoot instanceof window.ShadowRoot&&this.adoptStyles()}createRenderRoot(){return this.attachShadow({mode:"open"})}adoptStyles(){let e=this.constructor._styles;e.length!==0&&(window.ShadyCSS!==void 0&&!window.ShadyCSS.nativeShadow?window.ShadyCSS.ScopingShim.prepareAdoptedCssText(e.map(t=>t.cssText),this.localName):de?this.renderRoot.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet):this._needsShimAdoptedStyleSheets=!0)}connectedCallback(){super.connectedCallback(),this.hasUpdated&&window.ShadyCSS!==void 0&&window.ShadyCSS.styleElement(this)}update(e){let t=this.render();super.update(e),t!==Bt&&this.constructor.render(t,this.renderRoot,{scopeName:this.localName,eventContext:this}),this._needsShimAdoptedStyleSheets&&(this._needsShimAdoptedStyleSheets=!1,this.constructor._styles.forEach(i=>{let r=document.createElement("style");r.textContent=i.cssText,this.renderRoot.appendChild(r)}))}render(){return Bt}};h.finalized=!0;h.render=kt;var It=l`42px`,Ue=l`var(--menuWidth, 320px)`,Mt=l`var(--animationTiming, 200ms)`,Lt=l`

  .main {
    overflow: hidden;
    position: relative;
    width: 100%;
    height: 100%;
  }

  .animate {
    transition: transform ${Mt} ease-out;
  }

  .menu {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: ${Ue};
    padding: .5rem .5rem 0 0;
    box-sizing: border-box;
    font-size: 1.4rem;
    color: var(--primaryTextColor);
    background: var(--menuSliderBg);
    transform: translateX(calc(${Ue} * -1));
  }

  .menu:before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    width: ${It};
    content: "";
    background: var(--menuSliderBg);
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
    left: ${It};
    z-index: 1;
    transform: translateX(calc(${Ue} * -1));
    transition: transform ${Mt} ease-out;
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
    position: absolute;
    top: 0;
    width: 100%;
    padding-bottom: 2rem;
    height: inherit;
  }

  .content .selected-menu > * {
    display: block;
    padding-bottom: 3rem;
  }
`;var Dt=s`
<svg
  viewBox="0 0 18 18"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="collapseSidebarTitleID collapseSidebarDescID"
>
  <title id="collapseSidebarTitleID">Collapse sidebar</title>
  <desc id="collapseSidebarDescID">A circle with a left pointing chevron</desc>
  <path d="m9 0c4.9705627 0 9 4.02943725 9 9 0 4.9705627-4.0294373 9-9 9-4.97056275 0-9-4.0294373-9-9 0-4.97056275 4.02943725-9 9-9zm1.6976167 5.28352881c-.365258-.3556459-.9328083-.37581056-1.32099801-.06558269l-.09308988.0844372-3 3.08108108-.08194436.09533317c-.27484337.36339327-.26799482.87009349.01656959 1.22592581l.084491.09308363 3 2.91891889.09533796.0818904c.3633964.2746544.8699472.2677153 1.2256839-.0167901l.093059-.0844712.0818904-.095338c.2746544-.3633964.2677153-.8699472-.0167901-1.2256839l-.0844712-.093059-2.283355-2.2222741 2.3024712-2.36338332.0819252-.09530804c.2997677-.39632298.2644782-.96313393-.1007797-1.31877983z" fill-rule="evenodd" class="fill-color" />
</svg>
`;var $t=class extends h{static get styles(){return l`
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
    `}render(){return Dt}};customElements.define("ia-icon-collapse-sidebar",$t);var Tt=l`
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
`;var Et=class extends h{static get styles(){return Tt}static get properties(){return{icon:{type:String},href:{type:String},label:{type:String},menuDetails:{type:String},id:{type:String},selected:{type:Boolean},followable:{type:Boolean}}}constructor(){super();this.icon="",this.href="",this.label="",this.menuDetails="",this.id="",this.selected=!1,this.followable=!1}onClick(e){e.preventDefault(),this.dispatchMenuTypeSelectedEvent()}dispatchMenuTypeSelectedEvent(){this.dispatchEvent(new CustomEvent("menuTypeSelected",{bubbles:!0,composed:!0,detail:{id:this.id}}))}get buttonClass(){return this.selected?"selected":""}get iconClass(){return this.selected?"active":""}get menuItem(){return s`
      <span class="icon ${this.iconClass}">
        ${this.icon}
      </span>
      <span class="label">${this.label}</span>
      <span class="menu-details">${this.menuDetails}</span>
    `}get linkButton(){return s`
      <a
        href="${this.href}"
        class="menu-item ${this.buttonClass}"
        @click=${this.followable?void 0:this.onClick}
      >${this.menuItem}</a>
    `}get clickButton(){return s`
      <button
        class="menu-item ${this.buttonClass}"
        @click=${this.onClick}
      >
        ${this.menuItem}
      </button>
  `}render(){return this.href?this.linkButton:this.clickButton}};customElements.define("menu-button",Et);var Hi={closeDrawer:"menuSliderClosed"},he=class extends h{static get styles(){return Lt}static get properties(){return{menus:{type:Array},open:{type:Boolean},selectedMenu:{type:String},animateMenuOpen:{type:Boolean},manuallyHandleClose:{type:Boolean}}}constructor(){super();this.menus=[],this.open=!1,this.selectedMenu="",this.animateMenuOpen=!1,this.manuallyHandleClose=!1}setSelectedMenu({detail:e}){let{id:t}=e;this.selectedMenu=this.selectedMenu===t?"":t}closeMenu(){this.manuallyHandleClose||(this.open=!1);let{closeDrawer:e}=Hi,t=new CustomEvent(e,{detail:this.selectedMenuDetails});this.dispatchEvent(t)}get selectedMenuDetails(){return this.menus.find(e=>e.id===this.selectedMenu)}get selectedMenuComponent(){let e=this.selectedMenuDetails;return e&&e.component?e.component:s``}get sliderDetailsClass(){let e=this.animateMenuOpen?"animate":"",t=this.open?"open":"";return`${e} ${t}`}get selectedMenuClass(){return this.selectedMenu?"open":""}get menuItems(){return this.menus.map(e=>s`
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
      `)}get renderMenuHeader(){let{label:e="",menuDetails:t="",actionButton:i}=this.selectedMenuDetails||{},r=i?s`<div class="custom-action">${i}</div>`:p;return s`
      <header class="${i?"with-secondary-action":""}">
        <div class="details">
          <h3>${e}</h3>
          <span class="extra-details">${t}</span>
        </div>
        ${r}
        ${this.closeButton}
      </header>
    `}get closeButton(){return s`
      <button class="close" aria-label="Close this menu" @click=${this.closeMenu}>
        <ia-icon-collapse-sidebar></ia-icon-collapse-sidebar>
      </button>
    `}render(){return s`
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
    `}};var zt=s`
<svg
  viewBox="0 0 21 19"
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="advanceTitleID advanceDescID"
>
  <title id="advanceTitleID">Advance icon</title>
  <desc id="advanceDescID">An arrow pointing in a forward direction</desc>
  <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <g transform="translate(-200.000000, -15.000000)">
      <g transform="translate(56.922243, 5.000000)">
        <g transform="translate(144.000000, 10.000000)">
          <g transform="translate(11.000000, 10.000000) scale(-1, 1) translate(-11.000000, -10.000000) translate(1.000000, 0.000000)">
            <polyline class="stroke-color" stroke-width="2" stroke-linejoin="round" points="14.4444444 16.6666667 20 16.6666667 20 3.33333333 5.55555556 3.33333333"></polyline>
            <polygon class="fill-color" points="5.55555556 0 5.55555556 6.66666667 1.11111111 3.33333333"></polygon>
            <text transform="translate(6.666667, 13.333333) scale(-1, 1) translate(-6.666667, -13.333333) " font-family="HelveticaNeue, Helvetica Neue" font-size="10" font-weight="normal" class="fill-color">
              <tspan x="0" y="17.3333333">10</tspan>
            </text>
          </g>
        </g>
      </g>
    </g>
  </g>
</svg>
`;var _t=s`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 468 300" aria-labelledby="applePayTitleID applePayDescID">
  <title id="donateTitleID">ApplePay icon</title>
  <desc id="donateDescID">An illustration of the Apple Pay logo</desc>
  <g fill="none">
    <path
      fill="#000"
      d="M425.540484,0 L41.8576242,0 C40.2596386,0 38.6588291,0 37.0636954,0.0093185241 C35.715305,0.0189194277 34.3700489,0.0338855422 33.0247929,0.0705948795 C30.0908697,0.149943524 27.1318148,0.323042169 24.2346009,0.84375 C21.2910768,1.37349398 18.5519955,2.2375753 15.8798381,3.59807982 C13.2528614,4.93401732 10.8478351,6.68138178 8.76362011,8.76647214 C6.67850151,10.8515625 4.93113705,13.2526355 3.59548193,15.882436 C2.23469503,18.5545934 1.37004895,21.2945218 0.843975904,24.240305 C0.320472515,27.138366 0.146216114,30.0968562 0.0671498494,33.0276732 C0.0310052711,34.3729292 0.0155026355,35.7181852 0.00672063253,37.0631589 C1.12951807e-05,38.6617093 1.12951807e-05,40.2591303 1.12951807e-05,41.8605045 L1.12951807e-05,257.36634 C1.12951807e-05,258.967715 1.12951807e-05,260.56234 0.00672063253,262.163997 C0.0155026355,263.50897 0.0310052711,264.854226 0.0671498494,266.199482 C0.146216114,269.12773 0.320472515,272.08622 0.843975904,274.983434 C1.37004895,277.930346 2.23469503,280.669145 3.59548193,283.341585 C4.93113705,285.971386 6.67850151,288.375565 8.76362011,290.457549 C10.8478351,292.546028 13.2528614,294.29311 15.8798381,295.625659 C18.5519955,296.989834 21.2910768,297.854198 24.2346009,298.38366 C27.1318148,298.900979 30.0908697,299.077184 33.0247929,299.156532 C34.3700489,299.187029 35.715305,299.205102 37.0636954,299.211314 C38.6588291,299.223739 40.2596386,299.223739 41.8576242,299.223739 L425.540484,299.223739 C427.135646,299.223739 428.736483,299.223739 430.331306,299.211314 C431.676591,299.205102 433.021875,299.187029 434.373287,299.156532 C437.300998,299.077184 440.259488,298.900979 443.16379,298.38366 C446.10336,297.854198 448.843006,296.989834 451.515446,295.625659 C454.145247,294.29311 456.543213,292.546028 458.631721,290.457549 C460.713422,288.375565 462.460759,285.971386 463.799831,283.341585 C465.163695,280.669145 466.027494,277.930346 466.551026,274.983434 C467.07484,272.08622 467.244832,269.12773 467.324181,266.199482 C467.36089,264.854226 467.378991,263.50897 467.385203,262.163997 C467.3976,260.56234 467.3976,258.967743 467.3976,257.36634 L467.3976,41.8605045 C467.3976,40.2591303 467.3976,38.6617093 467.385203,37.0631589 C467.378991,35.7181852 467.36089,34.3729292 467.324181,33.0276732 C467.244804,30.0968562 467.07484,27.138366 466.551026,24.240305 C466.027523,21.2945218 465.163695,18.5545934 463.799831,15.882436 C462.460759,13.2526355 460.713422,10.8515625 458.631721,8.76647214 C456.543213,6.68138178 454.145247,4.93401732 451.515446,3.59807982 C448.843006,2.2375753 446.10336,1.37349398 443.16379,0.84375 C440.259516,0.323042169 437.301026,0.149943524 434.373287,0.0705948795 C433.021875,0.0338855422 431.676591,0.0189194277 430.331306,0.0093185241 C428.736483,0 427.135646,0 425.540484,0 L425.540484,0 Z"
    />
    <path
      fill="#FFF"
      d="M425.540484,9.97364458 L430.260429,9.98268072 C431.539044,9.99171687 432.817686,10.0055535 434.103389,10.0405685 C436.339863,10.1009977 438.956052,10.2221386 441.394682,10.659262 C443.514505,11.0410392 445.292338,11.6216114 446.998503,12.4902108 C448.682897,13.3461032 450.22613,14.4677146 451.573588,15.813253 C452.926186,17.1678276 454.049238,18.713573 454.916425,20.4166039 C455.780196,22.1094691 456.357097,23.8788592 456.736615,26.0142131 C457.172609,28.4262989 457.293185,31.0496047 457.35449,33.299887 C457.388912,34.5700301 457.405855,35.8401732 457.412095,37.1405309 C457.423956,38.7131024 457.423956,40.2848268 457.423956,41.8605045 L457.423956,257.36634 C457.423956,258.942018 457.423956,260.510919 457.411813,262.117093 C457.405855,263.386954 457.38894,264.657097 457.354207,265.929499 C457.293185,268.176393 457.172637,270.798287 456.731278,273.238893 C456.357097,275.34488 455.780506,277.114552 454.911935,278.815889 C454.047261,280.514684 452.925932,282.058735 451.579236,283.404838 C450.224125,284.76026 448.685975,285.878483 446.981561,286.742282 C445.288131,287.606645 443.513347,288.186681 441.41442,288.564477 C438.926402,289.007812 436.200593,289.1298 434.147694,289.185429 C432.85609,289.214514 431.570698,289.231994 430.253991,289.238234 C428.68478,289.250095 427.109977,289.250095 425.540512,289.250095 L41.8576242,289.250095 C41.8367282,289.250095 41.8163968,289.250095 41.7952184,289.250095 C40.2438253,289.250095 38.6893261,289.250095 37.109695,289.237952 C35.821762,289.231994 34.5366529,289.214797 33.294183,289.186559 C31.1944089,289.1298 28.4669051,289.008095 25.9991905,288.5673 C23.8822195,288.186653 22.107436,287.606645 20.391698,286.730986 C18.7033791,285.874812 17.1663592,284.757718 15.8106551,283.399755 C14.4653991,282.056758 13.3474586,280.517508 12.4830949,278.816171 C11.617884,277.116529 11.039006,275.341491 10.6583867,273.210373 C10.2184111,270.774567 10.0975527,268.163121 10.0371517,265.931476 C10.0026732,264.653709 9.98827184,263.376224 9.98008283,262.106081 L9.97387048,258.356363 L9.97387048,257.36634 L9.97387048,41.8605045 L9.97387048,40.8704819 L9.97980045,37.1286709 C9.98827184,35.8509036 10.0026732,34.5734187 10.0371517,33.2967809 C10.0975527,31.0628765 10.2184111,28.4503012 10.6620294,25.9941642 C11.0392884,23.8822477 11.617884,22.1072101 12.487613,20.3990964 C13.3451995,18.7107492 14.4651167,17.1695218 15.8174605,15.8174887 C17.1644108,14.4699736 18.7064571,13.3497741 20.4055346,12.4856928 C22.1029179,11.6213291 23.8810617,11.0410392 25.998061,10.6601092 C28.4372553,10.2218562 31.0551958,10.1009977 33.2972892,10.0402861 C34.5753389,10.0055535 35.8533886,9.99171687 37.1218373,9.9829631 L41.8576242,9.97364458 L425.540484,9.97364458"
    />
    <g fill="#000">
      <path
        d="M64.3701386 18.7514966C68.3721341 13.7458678 71.0878627 7.02478351 70.371607.156635919 64.5132486.44793863 57.3642463 4.02159262 53.225325 9.03114646 49.5090129 13.3210561 46.2197715 20.3235599 47.0772734 26.9037933 53.6535818 27.4742282 60.223819 23.6166698 64.3701386 18.7514966M70.2968894 28.1885919C60.7465035 27.6197101 52.6263416 33.608895 48.0655453 33.608895 43.5022358 33.608895 36.5181714 28.4752636 28.9643216 28.6136295 19.1325163 28.7580384 10.0097377 34.3170181 5.02051515 43.1584055-5.24146716 60.845529 2.31238262 87.0817206 12.2916183 101.486888 17.1377591 108.613582 22.9781865 116.460599 30.6738472 116.178727 37.9449504 115.893411 40.7949222 111.470557 49.6332599 111.470557 58.4651029 111.470557 61.032328 116.178727 68.7292313 116.036098 76.7111119 115.893383 81.7012098 108.905845 86.5472941 101.772204 92.1067256 93.6481457 94.3825633 85.8036992 94.5257015 85.3730704 94.3825351 85.2304405 79.13438 79.3808641 78.9929926 61.8407474 78.8490355 47.1541604 90.9645005 40.1684017 91.5347094 39.7351751 84.6929926 29.6162462 74.0029511 28.4752636 70.2968894 28.1885919"
        transform="translate(63.226 81.89)"
      />
      <path
        d="M40.5024334.459215539C61.2600389.459215539 75.7143122 14.7676399 75.7143122 35.5995958 75.7143122 56.5059305 60.9626085 70.8886771 39.9819233 70.8886771L16.9992802 70.8886771 16.9992802 107.437566.394319742 107.437566.394319742.459215539 40.5024334.459215539 40.5024334.459215539zM16.999252 56.95065L36.0523017 56.95065C50.509427 56.95065 58.7375426 49.1672539 58.7375426 35.6739463 58.7375426 22.1820789 50.509427 14.4716214 36.1266522 14.4716214L16.999252 14.4716214 16.999252 56.95065 16.999252 56.95065zM80.0528476 85.271452C80.0528476 71.6294151 90.5060291 63.2525984 109.041449 62.2144301L130.391063 60.9546222 130.391063 54.9501323C130.391063 46.2758571 124.533862 41.0864557 114.74992 41.0864557 105.480784 41.0864557 99.6979342 45.5337073 98.2908371 52.5034268L83.1673243 52.5034268C84.0567915 38.4166704 96.0657712 28.0378676 115.341929 28.0378676 134.246278 28.0378676 146.329608 38.0463014 146.329608 53.6888842L146.329608 107.437595 130.983072 107.437595 130.983072 94.6120864 130.614143 94.6120864C126.092541 103.286362 116.231396 108.771753 106.001295 108.771753 90.7290807 108.771753 80.0528476 99.2823895 80.0528476 85.271452zM130.391063 78.2287939L130.391063 72.075603 111.189256 73.2610604C101.625542 73.9288597 96.2145005 78.1544433 96.2145005 84.8267325 96.2145005 91.6463108 101.848621 96.0949742 110.448546 96.0949742 121.642437 96.0949742 130.391063 88.3845167 130.391063 78.2287939zM160.81819 136.128737L160.81819 123.154528C162.002208 123.450546 164.670553 123.450546 166.006151 123.450546 173.419179 123.450546 177.423122 120.337453 179.868388 112.331006 179.868388 112.182277 181.278337 107.586324 181.278337 107.511973L153.107705 29.4464049 170.453375 29.4464049 190.175664 92.9075589 190.470242 92.9075589 210.19256 29.4464049 227.09495 29.4464049 197.883269 111.514477C191.21386 130.420266 183.503375 136.499106 167.34175 136.499106 166.00618 136.499106 162.002236 136.350377 160.81819 136.128737z"
        transform="translate(63.226 81.89) translate(112.952 7.853)"
      />
    </g>
  </g>
</svg>
`;var At=s`
<svg
  viewBox="0 0 40 40"
  version="1.1"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="audioTitleID audioDescID"
>
  <title id="audioTitleID">Audio icon</title>
  <desc id="audioDescID">An illustration of an audio speaker.</desc>
  <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <g transform="translate(10, 8)" class="fill-color">
      <path
        d="M19.4264564,11.8585048 L19.4264564,20.7200433 C19.4264564,22.3657576 18.8838179,23.2519114 16.8489237,23.2519114 C12.2364969,23.125318 7.75972977,23.125318 3.14730298,23.2519114 C1.24806842,23.2519114 0.569770368,22.492351 0.569770368,20.7200433 L0.569770368,2.74377955 C0.569770368,1.09806526 1.11240881,0.211911416 3.14730298,0.211911416 C7.75972977,0.338504822 12.2364969,0.338504822 16.8489237,0.211911416 C18.7481583,0.211911416 19.4264564,0.971471855 19.4264564,2.74377955 C19.2907967,5.78202131 19.4264564,8.82026306 19.4264564,11.8585048 L19.4264564,11.8585048 Z M10.0659432,2.74377955 C8.16670861,2.74377955 6.67445288,4.13630702 6.67445288,5.90861471 C6.67445288,7.6809224 8.16670861,9.07344988 10.0659432,9.07344988 C11.9651777,9.07344988 13.4574335,7.6809224 13.4574335,5.90861471 C13.4574335,4.13630702 11.8295181,2.74377955 10.0659432,2.74377955 L10.0659432,2.74377955 Z M10.0659432,11.4787246 C7.21709133,11.4787246 5.04653754,13.6308125 5.04653754,16.1626806 C5.04653754,18.8211422 7.35275094,20.8466367 10.0659432,20.8466367 C12.914795,20.8466367 15.0853488,18.6945488 15.0853488,16.1626806 C15.0853488,13.6308125 12.7791354,11.4787246 10.0659432,11.4787246 L10.0659432,11.4787246 Z"
      ></path>
      <ellipse cx="10.2016028" cy="16.5690777" rx="1.35659611" ry="1.34075134"></ellipse>
    </g>
  </g>
</svg>
`;var Pt=s`
<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" aria-labelledby="calendarTitleID calendarDescID">
  <title id="calendarTitleID">Calendar icon</title>
  <desc id="calendarDescID">An illustration of a calendar</desc>

  <g class="fill-color" fill-rule="evenodd">
    <path d="m11.998.857v11h-11.998v-11z" fill-rule="nonzero" />
    <path d="m11.143 3h-10.286v8h10.286z" fill="#fff" fill-rule="nonzero" />
    <path d="m9 0h1v1h-1z" />
    <path d="m2.143 0h1v1h-1z" />
    <path d="m2.143.857h1v1h-1z" fill="#fff" />
    <path d="m9 .857h1v1h-1z" fill="#fff" />
    <path
      d="m4.92342857 9.14285714v-4.2h-.678c-.02400012.1600008-.07399962.29399946-.15.402s-.16899945.19499967-.279.261-.23399931.11199987-.372.138-.28099926.03700002-.429.033v.642h1.056v2.724zm3.336 0h-.852v-2.724h-1.056v-.642c.14800074.00400002.29099931-.00699987.429-.033s.26199945-.07199967.372-.138.20299962-.15299946.279-.261.12599988-.2419992.15-.402h.678z"
      fill-rule="nonzero"
    />
  </g>
</svg>
`;var jt=s`
<svg
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="calendarBlankTitleID calendarBlankDescID"
>
  <title id="calendarBlankTitleID">Blank calendar page icon</title>
  <desc id="calendarBlankDescID">A page-a-day calendar page without a date</desc>
  <path d="m6 0v1.71428571h12v-1.71428571h1.7142857v1.71428571h4.2814286v21.99999999h-23.9957143v-21.99999999h4.28571429v-1.71428571zm16.2857143 6h-20.57142859v16h20.57142859z" class="fill-color" />
</svg>
`;var Nt=s`
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
`;var Rt=s`
<svg
  viewBox="0 0 18 18"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="collapseSidebarTitleID collapseSidebarDescID"
>
  <title id="collapseSidebarTitleID">Collapse sidebar</title>
  <desc id="collapseSidebarDescID">A circle with a left pointing chevron</desc>
  <path d="m9 0c4.9705627 0 9 4.02943725 9 9 0 4.9705627-4.0294373 9-9 9-4.97056275 0-9-4.0294373-9-9 0-4.97056275 4.02943725-9 9-9zm1.6976167 5.28352881c-.365258-.3556459-.9328083-.37581056-1.32099801-.06558269l-.09308988.0844372-3 3.08108108-.08194436.09533317c-.27484337.36339327-.26799482.87009349.01656959 1.22592581l.084491.09308363 3 2.91891889.09533796.0818904c.3633964.2746544.8699472.2677153 1.2256839-.0167901l.093059-.0844712.0818904-.095338c.2746544-.3633964.2677153-.8699472-.0167901-1.2256839l-.0844712-.093059-2.283355-2.2222741 2.3024712-2.36338332.0819252-.09530804c.2997677-.39632298.2644782-.96313393-.1007797-1.31877983z" fill-rule="evenodd" class="fill-color" />
</svg>
`;var Ot=s`
<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" aria-labelledby="creditCardTitleID creditCardDescID">
  <title id="creditCardTitleID">Credit card icon</title>
  <desc id="creditCardDescID">An illustration of a credit card</desc>
  <g class="fill-color" fill-rule="evenodd" transform="translate(0 2)">
    <g fill-rule="nonzero">
      <path d="m11.998 0v9h-11.998v-9z" />
      <g fill="#fff">
        <path d="m11.143 3.429h-10.286v4.714h10.286z" />
        <path d="m11.143.857h-10.286v1.286h10.286z" />
      </g>
    </g>
    <g>
      <path d="m8.143 6.429h1v1h-1z" />
      <path d="m9.429 6.429h1v1h-1z" />
    </g>
  </g>
</svg>
`;var Ht=s`
<svg
  viewBox="0 0 40 40"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="donateTitleID donateDescID"
>
  <title id="donateTitleID">Donate icon</title>
  <desc id="donateDescID">An illustration of a heart shape</desc>
  <path class="fill-color" d="m30.0120362 11.0857287c-1.2990268-1.12627221-2.8599641-1.65258786-4.682812-1.57894699-.8253588.02475323-1.7674318.3849128-2.8262192 1.08047869-1.0587873.6955659-1.89622 1.5724492-2.512298 2.63065-.591311-1.0588196-1.4194561-1.9357029-2.4844351-2.63065-1.0649791-.69494706-2.0039563-1.05510663-2.8169316-1.08047869-1.2067699-.04950647-2.318187.17203498-3.3342513.66462439-1.0160643.4925893-1.82594378 1.2002224-2.42963831 2.1228992-.60369453.9226769-.91173353 1.9629315-.92411701 3.1207641-.03715043 1.9202322.70183359 3.7665141 2.21695202 5.5388457 1.2067699 1.4035084 2.912594 3.1606786 5.1174721 5.2715107 2.2048782 2.1108321 3.7565279 3.5356901 4.6549492 4.2745742.8253588-.6646243 2.355647-2.0647292 4.5908647-4.2003145s3.9747867-3.9171994 5.218707-5.3448422c1.502735-1.7723316 2.2355273-3.6186135 2.1983769-5.5388457-.0256957-1.7608832-.6875926-3.2039968-1.9866194-4.3302689z"/>
</svg>
`;var Ft=s`
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
`;var Vt=s`
<svg height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg" aria-labelledby="editPencilTitleID editPencilDescID"><title id="editPencilTitleID">Pencil icon</title><desc id="editPencilDescID">An illustration of a pencil, used to represent an edit action</desc><path class="fill-color" d="m15.6111048 9.3708338-9.52237183 9.5222966-5.14363353 1.0897111c-.42296707.0896082-.83849202-.1806298-.92810097-.6035935-.02266463-.1069795-.02266463-.2175207 0-.3245001l1.08971974-5.1435929 9.52237189-9.52229656zm-10.89310224 5.9110366-2.78094924-.5403869-.67567462 3.166657.83033407.8303275 3.16668096-.6756703zm14.82724244-12.05935921c.6114418.61143705.6055516 1.6086709-.0131615 2.22737904l-2.2405581 2.24054036-4.9820147-4.98197536 2.2405581-2.24054036c.618713-.61870814 1.6159506-.62460252 2.2273925-.01316547z" fill-rule="evenodd"/></svg>
`;var qt=s`
<svg
  viewBox="0 0 40 40"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="ellipsesTitleID ellipsesDescID"
>
  <title id="ellipsesTitleID">Ellipses icon</title>
  <desc id="ellipsesDescID">An illustration of text ellipses.</desc>
  <path class="fill-color" d="m10.5 17.5c1.3807119 0 2.5 1.1192881 2.5 2.5s-1.1192881 2.5-2.5 2.5c-1.38071187 0-2.5-1.1192881-2.5-2.5s1.11928813-2.5 2.5-2.5zm9.5 0c1.3807119 0 2.5 1.1192881 2.5 2.5s-1.1192881 2.5-2.5 2.5-2.5-1.1192881-2.5-2.5 1.1192881-2.5 2.5-2.5zm9.5 0c1.3807119 0 2.5 1.1192881 2.5 2.5s-1.1192881 2.5-2.5 2.5-2.5-1.1192881-2.5-2.5 1.1192881-2.5 2.5-2.5z" fill-rule="evenodd"/>
</svg>
`;var me=s`
<svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" aria-labelledby="emailTitleID emailDescID">
  <title id="emailTitleID">Email icon</title>
  <desc id="emailDescID">An illustration of an envelope</desc>
  <path d="m32 7.04156803v19.91686397c0 .5752421-.4763773 1.041568-1.0640184 1.041568h-27.87196316c-.58764116 0-1.06401844-.4663259-1.06401844-1.041568v-19.91686397c0-.57524214.47637728-1.04156803 1.06401844-1.04156803h27.87196316c.5876411 0 1.0640184.46632589 1.0640184 1.04156803zm-26.25039901 1.19676167 10.04327011 10.1323738c.5135662.4194048.8817166.6291071 1.1044511.6291071.1198794 0 .2695514-.0503424.4490158-.1510273.1794644-.100685.3291364-.2013699.4490158-.3020548l.1798191-.1510273 10.1198794-10.15841306zm16.77212271 9.7303286 6.8831353 6.7889404v-13.5778809zm-17.92871075-6.6379131v13.350819l6.78098955-6.6629107zm22.09008685 14.2059464-5.9074304-5.8588202-.9757049.9551179-.3594018.3295984c-.0342324.0304241-.0665646.0587822-.0969964.0850743l-.1597867.1329606c-.0684912.0540844-.1198794.0895749-.1541644.1064714-.6674943.3687151-1.3523675.5530727-2.0546196.5530727-.65047 0-1.3782586-.218035-2.1833659-.6541048l-.6682036-.4520405-1.0278418-1.0311524-5.95850326 5.832781z" class="fill-color" />
</svg>
`;var ue=s`
<svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" aria-labelledby="facebookTitleID facebookDescID">
  <title id="facebookTitleID">Facebook icon</title>
  <desc id="facebookDescID">A lowercase f</desc>
  <path d="m30.91057 19.2442068.2670004-5.3339402h-5.7329237c-.0890001-3.4962895.25183-5.42243459 1.0224903-5.77843514.3560005-.17800028.8004955-.28925046 1.333485-.33375053s1.0442346-.0520853 1.5337353-.02275571c.4895008.02932959 1.045246.01466479 1.6672356-.04399439.0890001-1.59997977.1335002-3.24445961.1335002-4.93343953-2.1633102-.20732987-3.6742898-.28115953-4.5329389-.22148898-2.8146294.17800028-4.7847688 1.25965538-5.9104183 3.2449653-.1780003.3256596-.3261653.68873971-.444495 1.08924034-.1183298.40050062-.2144095.76358074-.2882391 1.08924034-.0738297.32565959-.125915.7848194-.1562559 1.37747942-.030341.59266002-.052591 1.04474028-.0667501 1.35624078-.0141592.3115005-.0217444.8449956-.0227558 1.6004854v1.5777298h-3.8229605v5.3339401h3.8669549v14.622824h5.8224296c0-.3560006-.0146648-1.6819003-.0439944-3.9776994-.0293296-2.295799-.0515796-4.2957737-.0667501-5.9999241s-.0075853-3.2525506.0227557-4.6452005h5.4219289z" class="fill-color" />
</svg>
`;var Wt=s`
<svg viewBox="0 0 469 300" xmlns="http://www.w3.org/2000/svg" aria-labelledby="googlePayTitleID googlePayDescID">
  <title id="googlePayTitleID">GooglePay icon</title>
  <desc id="googlePayDescID">The GooglePay logo</desc>
  <g fill="none">
    <path
      d="m426.541557.09900471h-384.5859537c-1.6020287 0-3.2068878 0-4.8060861.00848612-1.3501196.01131483-2.6974088.02545836-4.0475283.06223154-2.9408266.07920377-5.9071271.25175484-8.811158.77506548-2.9493177.52896804-5.6948441 1.39455212-8.3724397 2.75798848-2.6351391 1.33797799-5.043843 3.08894709-7.13553773 5.1765322-2.08886428 2.09041387-3.84090626 4.49481397-5.17970411 7.13116817-1.36427179 2.6759559-2.23038625 5.4198009-2.75684798 8.3701415-.52646173 2.9050811-.69911853 5.8667364-.77837083 8.8029334-.03679572 1.3492928-.05377835 2.695757-.06226967 4.042221-.00611375 1.6010478-.00611375 3.2020954-.00611375 4.8059718v215.8811936c0 1.603877 0 3.202097.00611375 4.805973.00849132 1.346464.02547395 2.695757.06226967 4.042221.0792523 2.933368.2519091 5.897852.77837083 8.800105.52646173 2.95034 1.39257619 5.694185 2.75684798 8.372969 1.33879785 2.633526 3.09083983 5.040754 5.17970411 7.12834 2.09169473 2.090414 4.50039863 3.841383 7.13553773 5.176532 2.6775956 1.366265 5.423122 2.23185 8.3724397 2.763646 2.9040309.517653 5.8703314.693033 8.811158.772236 1.3501195.031116 2.6974087.050918 4.0475283.056575 1.5991983.011315 3.2040574.011315 4.8060861.011315h384.5859537c1.599199 0 3.204058 0 4.803256-.011315 1.347289-.005657 2.694578-.025459 4.050359-.056575 2.935166-.079203 5.901466-.254583 8.811157-.772236 2.946488-.531796 5.692014-1.397381 8.37244-2.763646 2.635139-1.335149 5.038182-3.086118 7.132707-5.176532 2.086035-2.087586 3.838077-4.494814 5.179705-7.12834 1.367102-2.678784 2.233216-5.422629 2.756848-8.372969.526462-2.902253.696288-5.866737.77554-8.800105.036796-1.346464.053778-2.695757.06227-4.042221.011322-1.603876.011322-3.202096.011322-4.805973v-215.8811936c0-1.6038764 0-3.204924-.011322-4.8059718-.008492-1.346464-.025474-2.6929282-.06227-4.042221-.079252-2.936197-.249078-5.8978523-.77554-8.8029334-.523632-2.9503406-1.389746-5.6941856-2.756848-8.3701415-1.341628-2.6363542-3.09367-5.0407543-5.179705-7.13116817-2.094525-2.08758511-4.497568-3.83855421-7.132707-5.1765322-2.680426-1.36343636-5.425952-2.22902044-8.37244-2.75798848-2.909691-.52331064-5.875991-.69586171-8.811157-.77506548-1.355781-.03677318-2.70307-.05091671-4.050359-.06223154-1.599198-.00848612-3.204057-.00848612-4.803256-.00848612"
      fill="#3c4043"
    />
    <path
      d="m426.541557 10.0899948 4.732495.0084861c1.279359.0084861 2.561548.0226296 3.849398.0594028 2.241708.0594028 4.865525.1810372 7.311024.6194866 2.12283.3818754 3.906007.9645889 5.615592 1.8330016 1.689772.857098 3.235192 1.9829231 4.585313 3.3293871 1.35578 1.357779 2.482295 2.9050813 3.351239 4.610791.866115 1.6972237 1.443525 3.4679938 1.825633 5.6064956.435888 2.4185437.557598 5.0464117.617037 7.3008905.036796 1.270089.053778 2.5430068.059439 3.8470403.011322 1.5755893.011322 3.14835.011322 4.726768v215.8811936c0 1.578418 0 3.151179-.011322 4.757884-.005661 1.272918-.022643 2.545836-.059439 3.821582-.059439 2.248821-.181149 4.87669-.622697 7.320692-.376448 2.110214-.953858 3.880984-1.825633 5.586695-.866115 1.70288-1.989799 3.247354-3.339919 4.596647-1.358611 1.357779-2.89837 2.477946-4.607955 3.343531-1.698263.865584-3.47578 1.448298-5.578796 1.824515-2.496448.444107-5.227821.56857-7.285551.622315-1.293511.031116-2.581361.048088-3.903177.053746-1.570893.011314-3.150279.011314-4.724003.011314h-384.5859537c-.0198131 0-.0396261 0-.0622696 0-1.5539113 0-3.1134834 0-4.6956991-.011314-1.2906803-.005658-2.5785302-.02263-3.8239236-.050917-2.1058469-.056574-4.8400513-.181037-7.3138554-.622315-2.1228296-.379046-3.9003455-.96176-5.6212527-1.838659-1.6926027-.857098-3.2323618-1.977266-4.5909726-3.337874-1.3472892-1.343635-2.4681433-2.88528-3.3342577-4.590989-.8689448-1.702882-1.449185-3.479309-1.8312943-5.614982-.4387181-2.441174-.560427-5.054898-.6226967-7.292405-.0339652-1.278574-.0481174-2.559979-.0566087-3.830068l-.00566093-3.756521v-217.8641178l.00566093-3.7480355c.0084913-1.2814039.0226435-2.5599791.0566087-3.8385543.0622697-2.2403353.1839786-4.8568884.6283576-7.3178627.3764484-2.1130435.9566886-3.8922997 1.8284639-5.6036669.8604536-1.6915663 1.984138-3.2360398 3.337088-4.5881613 1.3501196-1.3521215 2.8983699-2.4722892 4.599464-3.3378733 1.7010941-.8684127 3.4842709-1.4482975 5.6071005-1.8301729 2.4454996-.4384494 5.0693169-.5600838 7.3166859-.6194866 1.2793586-.0367732 2.5615477-.0509167 3.8324149-.0594028l4.7466469-.0084861z"
      fill="#fffffe"
    />
    <g transform="translate(53.778 84.906)">
      <g fill="#3c4043" transform="translate(158.35 8.41)">
        <path
          d="m13.4306616 63.5773585v42.7212935h-13.34775628v-105.45768165h35.40057118c8.5392479-.16819407 16.8297798 3.1115903 22.8818681 9.16657685 12.1041765 11.4371967 12.8503244 30.6954178 1.4922957 43.0576819-.4974319.5045823-.9948639 1.0091644-1.4922957 1.5137466-6.217899 5.9708896-13.8451883 8.9983828-22.8818681 8.9983828zm0-49.7854447v36.8345013h22.3844362c4.9743191.1681941 9.7828276-1.8501348 13.1819457-5.4663073 6.9640468-7.316442 6.7982361-19.090027-.4145266-26.1541779-3.3991181-3.3638814-7.9589106-5.2140161-12.7674191-5.2140161zm85.3095733 17.9967654c9.8657331 0 17.6588331 2.6911052 23.3793001 7.9892184 5.720466 5.2981131 8.539248 12.6986522 8.539248 22.0334232v44.4873312h-12.767419v-10.0075469h-.580338c-5.554657 8.2415099-12.850324 12.3622639-22.0528145 12.3622639-7.7931 0-14.4255256-2.354717-19.6485607-7.064151-5.1401297-4.3730455-8.0418158-10.8485172-7.8760052-17.660377 0-7.4846361 2.8187808-13.3714286 8.3734372-17.8285714 5.5546563-4.4571429 13.0161351-6.6436658 22.3015308-6.6436658 7.9589104 0 14.4255254 1.5137466 19.5656554 4.3730458v-3.1115903c0-4.6253369-1.989728-8.9983828-5.471751-12.025876-3.564929-3.1956874-8.124721-4.9617251-12.8503246-4.9617251-7.4614787 0-13.3477564 3.1956874-17.658833 9.587062l-11.7725553-7.4846362c6.3008043-9.3347708 15.834916-14.0442048 28.5194298-14.0442048zm-17.2443063 52.3924529c0 3.5320754 1.6581063 6.8118598 4.3939818 8.8301887 2.9845915 2.3547169 6.6324255 3.6161724 10.3631649 3.5320754 5.6375617 0 11.0264077-2.2706199 15.0058627-6.3072776 4.393981-4.2048518 6.632426-9.1665768 6.632426-14.8851752-4.145267-3.3638815-9.948639-5.0458221-17.410117-4.961725-5.3888462 0-9.9486387 1.3455525-13.5964727 3.9525605-3.5649288 2.6070082-5.3888457 5.8867925-5.3888457 9.8393532z"
        />
        <path
          d="m203.947 34.143-44.603 103.86h-13.762l16.581-36.33-29.266-67.53h14.509l21.141 51.804h.248l20.644-51.804z"
        />
      </g>
      <path
        d="m117.808458 62.7363881c0-4.1207546-.331621-8.2415094-.994864-12.278167h-56.2927112v23.2948786h32.2501691c-1.3264851 7.4846362-5.6375617 14.2123989-11.938366 18.4172507v15.1374666h19.2340341c11.275123-10.5121296 17.741738-26.0700811 17.741738-44.5714289z"
        fill="#4285f4"
      />
      <path
        d="m60.5208828 121.940701c16.0836319 0 29.6801042-5.382211 39.5458372-14.632884l-19.2340341-15.1374666c-5.3888456 3.7002695-12.2699871 5.8026954-20.3118031 5.8026954-15.5862 0-28.7681456-10.6803234-33.4937488-24.9768194h-19.81437125v15.6420486c10.11444885 20.435579 30.75787325 33.302426 53.30812005 33.302426z"
        fill="#34a853"
      />
      <path
        d="m27.027134 72.9962264c-2.4871596-7.4846361-2.4871596-15.6420485 0-23.2107817v-15.5579515h-19.81437125c-8.53924786 17.0716981-8.53924786 37.2549866 0 54.3266847z"
        fill="#fbbc04"
      />
      <path
        d="m60.5208828 24.8086253c8.5392479-.168194 16.7468744 3.1115903 22.881868 9.0824798l17.0784962-17.3239891c-10.8605972-10.25983837-25.120312-15.89433972-39.9603642-15.72614565-22.5502468 0-43.1936712 12.95094345-53.30812005 33.38652285l19.81437125 15.6420486c4.7256032-14.380593 17.9075488-25.0609165 33.4937488-25.0609165z"
        fill="#ea4335"
      />
    </g>
  </g>
</svg>
`;var Zt=s`
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
`;var Ut=s`
<svg
  viewBox="0 0 40 40"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="imagesTitleID imagesDescID"
>
  <title id="imagesTitleID">Images icon</title>
  <desc id="imagesDescID">An illustration of two photographs.</desc>
  <path class="fill-color" d="m20.8219178 15.3769871c0 1.1136708-.8767123 1.8932404-1.8630137 1.8932404s-1.9726027-.8909367-1.9726027-1.8932404c0-1.0023038.8767123-1.8932404 1.9726027-1.8932404.9863014 0 1.8630137.8909366 1.8630137 1.8932404zm-5.9178082-3.7864808h15.4520548v6.0138225l-1.9726028-3.3410125-2.6301369 6.3479237-2.1917809-2.67281-6.1369863 5.1228859h-2.5205479zm-1.7534247-1.6705063v14.9231892h18.8493151v-14.9231892zm-2.9589041 7.2388604c.2191781 0 1.9726028-.3341012 1.9726028-.3341012v-2.0046075l-4.1643836.5568354c.43835616 4.7887846.87671233 9.9116704 1.31506849 14.700455 6.02739731-.5568354 13.26027401-1.5591391 19.39726031-2.1159746-.1095891-.5568354-.1095891-2.0046075-.2191781-2.67281-.4383562.1113671-1.4246575 0-1.8630137.1113671v.8909367c-5.1506849.4454683-10.3013699 1.1136708-15.4520548 1.6705062.109589-.111367-.5479452-7.0161262-.9863014-10.8026071z" fill-rule="evenodd"/>
</svg>
`;var pe=s`
<svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" aria-labelledby="linkTitleID linkDescID">
  <title id="linkTitleID">Link icon</title>
  <desc id="linkDescID">Two chain links linked together</desc>
  <path d="m7.80511706 12.3659763c1.2669254-2.2579539 4.09819784-2.9949938 6.41200864-1.7733458l.2295791.12871 1.6067188.9559859 3.5467013-6.31849361c1.2682451-2.26030597 4.104098-2.99652769 6.4192376-1.76952182l.2223501.12488594 3.2168204 1.91103915c2.2770002 1.3527136 3.1866331 4.21502324 2.0564431 6.51290984l-.1198433.2278304-5.2002499 9.2680474c-1.2669254 2.2579539-4.0981978 2.9949938-6.4120086 1.7733458l-.2295791-.12871-1.6096554-.9558482-3.5437647 6.3183559c-1.2682451 2.260306-4.104098 2.9965277-6.41923761 1.7695218l-.22235013-.1248859-3.21682032-1.9110392c-2.27700024-1.3527136-3.18663314-4.2150232-2.05644312-6.5129098l.11984332-.2278304zm13.93955474-5.73311741-3.563271 6.35055051c1.889633 1.4530595 2.5776248 4.0429866 1.5410255 6.156875l-.1223014.2328355-.4183304.7430134 1.6096554.9558483c1.1431442.6791157 2.5155496.3977368 3.1667361-.5628389l.0921501-.1491451 5.2002498-9.2680474c.5752467-1.0252226.2110342-2.4011579-.8559335-3.14755806l-.1742742-.11247814-3.2168203-1.91103915c-1.1402863-.67741793-2.5086889-.39913772-3.1618387.55564729zm-11.79500786 7.00714351-5.20024982 9.2680474c-.57524673 1.0252226-.21103426 2.4011579.85593348 3.1475581l.17427416.1124781 3.21682032 1.9110392c1.14028632.6774179 2.50868892.3991377 3.16183872-.5556473l.0970474-.1563368 3.5622708-6.3513198c-1.8888875-1.4532134-2.5764504-4.042623-1.5400057-6.1561456l.1222818-.2327956.4153938-.7428758-1.6067188-.9559859c-1.1431442-.6791157-2.5155496-.3977368-3.1667361.5628389zm6.97653866 1.5796652-.3817806.6812386c-.5117123.9119895-.2800268 2.1014993.528439 2.8785267l.382717-.6803391c.5119098-.9123415.2798478-2.1024176-.5293754-2.8794262z" class="fill-color" />
</svg>
`;var Yt=s`
<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" aria-labelledby="localPinTitleID localePinDescID">
  <title id="localePinTitleID">Locale pin icon</title>
  <desc id="localePinDescID">An illustration of a map pin</desc>
  <path
    d="m6.30188679 0c2.37586647 0 4.30188681 1.92602032 4.30188681 4.30188679 0 1.58391098-1.43396228 4.14994872-4.30188681 7.69811321l-.3127572-.3901988c-2.65941973-3.34669534-3.98912959-5.7826668-3.98912959-7.30791441 0-2.37586647 1.92602032-4.30188679 4.30188679-4.30188679zm0 2.26415094c-1.12541043 0-2.03773585.91232542-2.03773585 2.03773585 0 1.12541044.91232542 2.03773585 2.03773585 2.03773585 1.12541044 0 2.03773585-.91232541 2.03773585-2.03773585 0-1.12541043-.91232541-2.03773585-2.03773585-2.03773585z"
    class="fill-color"
    fill-rule="evenodd"
  />
</svg>
`;var Gt=s`
<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" aria-labelledby="lockTitleID lockDescID">
  <title id="lockTitleID">Lock icon</title>
  <desc id="lockDescID">An illustration of a lock</desc>
  <path
    d="m9.8480234 5.66075891v-2.17912633c-.00688261-.97492716-.37725298-1.79574705-1.11111111-2.46245966s-1.63734389-1.00632179-2.71045726-1.01882754c-1.04529617-.01250574-1.94175593.31459769-2.68937928.9813103-.74762335.66671262-1.13190232 1.4842758-1.15283692 2.45268954v2.22641369c-.04846504.00625288-.10037138.01250575-.15571902.01875862-.05534764.00625288-.09348877.00937931-.11442337.00937931-.35302046.00625288-.59362498.06917241-.72181356.18875862-.12818859.1195862-.19228288.33022987-.19228288.631931v4.73576994c0 .5030957.269999.7546436.80999699.7546436h8.36968211c.2839076 0 .491533-.0597931.6228761-.1793793s.197158-.3082145.1974448-.565885v-4.82057452c0-.25793103-.0640943-.44499615-.1922829-.56119538s-.3340933-.17755555-.6177141-.18406896c-.0415824 0-.102092-.00468965-.1815288-.01406896-.07943676-.00937931-.13306375-.01406897-.16088096-.01406897zm-1.85873446.00937931h-3.92523766c-.01376522-.12583907-.02064783-.21077393-.02064783-.25480458l-.01032391-.97154019c0-.65420686.0034413-.9813103.01032391-.9813103.00688261-.49684289.1919961-.91513405.55534047-1.2548735.36334438-.33973945.81845687-.51273561 1.36533747-.51898848.52623277-.01875862.98492995.13691187 1.37609154.46701147.39116158.3300996.60050759.74044441.62803802 1.23103443.01376522.2076475.02064783.83032946.02064783 1.86804589v.41503446z"
    class="fill-color"
  />
</svg>
`;var fe=s`
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
`;var ge=s`
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
`;var Jt=s`
<svg viewBox="0 0 468 300" xmlns="http://www.w3.org/2000/svg" aria-labelledby="payPalTitleID payPalDescID">
  <title id="payPalTitleID">PayPal icon</title>
  <desc id="payPalDescID">The PayPal logo</desc>
  <g fill="none" fill-rule="nonzero">
    <g>
      <path
        d="m426.088936 0h-384.1773743c-1.6000453 0-3.202918 0-4.8001076.0093427-1.3501283.00962581-2.6971182.02463075-4.044108.06143532-2.9377047.0795545-5.9005735.2531022-8.8015214.77516088-2.9473179.53111826-5.6899295 1.39744123-8.365531 2.76147524-2.6303624 1.33940326-5.0384885 3.09130081-7.1253898 5.18180042-2.08780603 2.09049964-3.8374226 4.49780164-5.1747992 7.13442444-1.36254076 2.6790896-2.22830126 5.4261262-2.75505234 8.3795514-.52417811 2.9055793-.6986591 5.8717446-.77782727 8.8101648-.03619117 1.348746-.05171378 2.697492-.06050711 4.0459548-.00671798 1.6026975-.00671798 3.2042625-.00671798 4.8097911v216.0649119c0 1.605529 0 3.204291.00671798 4.810103.00879333 1.348462.02431594 2.697208.06050711 4.045954.07916817 2.935844.25364916 5.90201.77782727 8.80674.52675108 2.954557 1.39251158 5.700461 2.75505234 8.379834 1.3373766 2.636623 3.08699317 5.047039 5.1747992 7.134425 2.0869013 2.093897 4.4950274 3.845511 7.1253898 5.181517 2.6756015 1.367714 5.4182131 2.23432 8.365531 2.765156 2.9009479.518661 5.8638167.695323 8.8015214.774877 1.3469898.030576 2.6939797.048696 4.044108.054924 1.5971896.012457 3.2000623.012457 4.8001076.012457h384.1773743c1.597218 0 3.200119 0 4.796997-.012457 1.347018-.006228 2.694037-.024348 4.04719-.054924 2.931485-.079554 5.893788-.256216 8.801833-.774877 2.943359-.530836 5.686536-1.397442 8.36242-2.765156 2.63319-1.336006 5.034248-3.08762 7.125447-5.181517 2.084385-2.087386 3.833973-4.497802 5.174771-7.134425 1.365622-2.679373 2.230535-5.425277 2.754741-8.379834.524489-2.90473.694701-5.870896.774152-8.80674.036756-1.348746.05488-2.697492.061101-4.045954.012412-1.605812.012412-3.204546.012412-4.810103v-216.0649119c0-1.6055286 0-3.2070936-.012412-4.8097911-.006221-1.3484628-.024345-2.6972088-.061101-4.0459548-.079479-2.9384202-.249663-5.9045855-.774152-8.8101648-.524178-2.9534252-1.389119-5.7004618-2.754741-8.3795514-1.340798-2.6366228-3.090386-5.0439248-5.174771-7.13442444-2.091199-2.09049961-4.492257-3.84239716-7.125447-5.18180042-2.675884-1.36403401-5.419061-2.23035698-8.36242-2.76147524-2.908017-.52205868-5.87032-.69560638-8.801833-.77516088-1.353153-.03680457-2.700172-.05180951-4.04719-.06143532-1.596878-.0093427-3.199779-.0093427-4.796997-.0093427z"
        fill="#333"
      />
      <path
        d="m426.077344 10 4.725746.0090596c1.280186.0090595 2.5604.022932 3.847682.0580377 2.239223.0605858 4.858628.1820405 7.300254.6202965 2.122429.3827662 3.902447.9648426 5.610709 1.8356924 1.686464.8581098 3.231593 1.9826271 4.580707 3.3316515 1.354261 1.358084 2.478692 2.9078342 3.346946 4.6152773.864832 1.6972511 1.442442 3.4712253 1.822427 5.6121115.43653 2.418335.557254 5.0484372.618634 7.3045496.034464 1.2734338.051428 2.5468676.057676 3.8505942.011875 1.5766458.011875 3.1524422.011875 4.7322022v216.0641685c0 1.57976 0 3.152725-.012158 4.763061-.005965 1.273151-.022901 2.546585-.057676 3.822284-.061097 2.252715-.181793 4.881401-.623695 7.328331-.374641 2.111442-.95194 3.885699-1.821579 5.591444-.865737 1.703196-1.988444 3.251248-3.336795 4.600839-1.356777 1.358933-2.896816 2.480053-4.603326 3.34609-1.695511.866603-3.472476 1.448141-5.573982 1.826916-2.491076.444484-5.220235.566788-7.275657.622561-1.293191.02916-2.580163.046685-3.898488.052942-1.57114.011891-3.147878.011891-4.719272.011891h-384.1544332c-.0209218 0-.0412781 0-.0624826 0-1.5532997 0-3.1097094 0-4.6912818-.012174-1.2895158-.005974-2.5762044-.023215-3.8202013-.051527-2.1023547-.056905-4.8332106-.178926-7.303958-.620862-2.1195728-.381634-3.8965375-.963144-5.6143841-1.841072-1.6903938-.858393-3.2293027-1.97838-4.586673-3.339861-1.3469093-1.346477-2.4662238-2.889716-3.3316498-4.59546-.8662742-1.704046-1.4458636-3.483682-1.8269507-5.620322-.4405163-2.442116-.5615233-5.060328-.6219985-7.297755-.0345209-1.281077-.0489399-2.561872-.057139-3.835306l-.00622-3.759432v-.992588-216.0641685-.9925876l.0059373-3.7515053c.0084818-1.2810777.0229008-2.5618724.0574217-3.8418177.0604752-2.239692.1814822-4.8590359.6256456-7.3215363.3777227-2.117388.9570294-3.8970244 1.8278273-5.6095635.8586405-1.6927213 1.9799341-3.2379418 3.3339398-4.5934777 1.3486057-1.3510062 2.8925472-2.474108 4.5937129-3.340428 1.6994694-.8666031 3.4797986-1.4483964 5.5993996-1.8303133 2.442192-.4393884 5.06335-.56056 7.3081989-.6214289 1.2796204-.0348226 2.5592408-.0486951 3.8292485-.0574715l4.7416072-.0093427z"
        fill="#fff"
      />
    </g>
    <g transform="translate(23 94)">
      <g fill="#238ec2">
        <path
          d="m400.83873 2.69525159-13.453417 85.59022681c-.260388 1.6582649 1.02176 3.1566421 2.69982 3.1566421h13.529554c2.241475 0 4.149469-1.6308556 4.498177-3.8449211l13.26612-84.05073558c.261911-1.65978771-1.020237-3.1596876-2.69982-3.1596876h-15.140614c-1.346103 0-2.491204.97912247-2.69982 2.30847537"
        />
        <path
          d="m360.463252 61.2598709c-1.515127 8.9689446-8.635464 14.9898625-17.715569 14.9898625-4.552995 0-8.196915-1.4648768-10.540413-4.2377882-2.32218-2.7485476-3.196233-6.6635147-2.459227-11.0246449 1.413104-8.8882393 8.647647-15.1025454 17.590704-15.1025454 4.457063 0 8.075096 1.4770588 10.464277 4.2758568 2.404408 2.8185936 3.348507 6.7609701 2.660228 11.0992592zm21.875698-30.5507529h-15.696415c-1.34458 0-2.489681.9775997-2.698297 2.3069526l-.691324 4.3885396-1.096374-1.5897416c-3.40028-4.9352036-10.975917-6.5828094-18.540894-6.5828094-17.340975 0-32.1542 13.1412549-35.038271 31.5709894-1.4999 9.195833.630415 17.9820486 5.84428 24.1156494 4.789021 5.6341417 11.624605 7.9806856 19.768224 7.9806856 13.97724 0 21.731037-8.9796037 21.731037-8.9796037l-.701984 4.362653c-.261911 1.6582649 1.020237 3.1596876 2.69982 3.1596876h14.135605c2.239952 0 4.147946-1.6293329 4.498177-3.8433983l8.484713-53.7329621c.261911-1.658265-1.020237-3.1566421-2.698297-3.1566421z"
        />
        <path
          d="m288.146759 31.085235c-1.792266 11.7662198-10.777961 11.7662198-19.469767 11.7662198h-4.945863l3.468805-21.9685846c.210138-1.3278301 1.355239-2.3054299 2.699819-2.3054299h2.265839c5.917372 0 11.505831 0 14.386857 3.3698259 1.723743 2.0176318 2.246043 5.0067724 1.59431 9.1379688zm-3.782489-30.69845878h-32.780046c-2.241474 0-4.149469 1.63085562-4.498177 3.84492105l-13.25546 84.05225833c-.261911 1.658265 1.020236 3.1581649 2.698297 3.1581649h16.818675c1.568423 0 2.905389-1.1420558 3.149028-2.6906834l3.759647-23.8293741c.348708-2.2140654 2.256703-3.844921 4.498177-3.844921h10.372912c21.590945 0 34.051535-10.4490488 37.308678-31.1598493 1.466399-9.0572636.059387-16.1745551-4.181447-21.15696366-4.662633-5.47729942-12.925026-8.37355282-23.890284-8.37355282z"
        />
      </g>
      <path
        d="m232.141867 30.709118h-15.777119c-1.509037 0-2.920618.7491886-3.767262 1.9963134l-21.763014 32.0521756-9.223243-30.8004824c-.577118-1.9262674-2.351112-3.2480066-4.362653-3.2480066h-15.509117c-1.872971 0-3.190142 1.8425166-2.587137 3.6149871l17.372952 50.9905056-16.340533 23.0558213c-1.282148 1.809017.012182 4.312403 2.229293 4.312403h15.761892c1.493809 0 2.893208-.732439 3.742897-1.959768l52.469087-75.7243876c1.254739-1.8120618-.041114-4.2895614-2.246043-4.2895614"
        fill="#253667"
      />
      <path
        d="m126.667688 61.2598709c-1.51665 8.9689446-8.635464 14.9898625-17.717091 14.9898625-4.551473 0-8.195392-1.4648768-10.5388909-4.2377882-2.3221801-2.7485476-3.1962334-6.6635147-2.4592267-11.0246449 1.4131036-8.8882393 8.6461236-15.1025454 17.5891816-15.1025454 4.457063 0 8.076618 1.4770588 10.465799 4.2758568 2.404408 2.8185936 3.348507 6.7609701 2.660228 11.0992592zm21.874175-30.5507529h-15.694892c-1.346103 0-2.491204.9775997-2.699819 2.3069526l-.689802 4.3885396-1.097896-1.5897416c-3.398758-4.9352036-10.974395-6.5828094-18.539372-6.5828094-17.3409749 0-32.1541994 13.1412549-35.0382709 31.5709894-1.4998999 9.195833.6304148 17.9820486 5.8427572 24.1156494 4.7905433 5.6341417 11.6261277 7.9806856 19.7697467 7.9806856 13.97724 0 21.729514-8.9796037 21.729514-8.9796037l-.700461 4.362653c-.261911 1.6582649 1.020237 3.1596876 2.69982 3.1596876h14.134082c2.241475 0 4.149469-1.6293329 4.498177-3.8433983l8.486236-53.7329621c.261911-1.658265-1.020237-3.1566421-2.69982-3.1566421z"
        fill="#253667"
      />
      <path
        d="m54.3511949 31.085235c-1.7922661 11.7662198-10.7794836 11.7662198-19.4697665 11.7662198h-4.9458629l3.4688041-21.9685846c.2101382-1.3278301 1.3537167-2.3054299 2.698297-2.3054299h2.2673614c5.9158488 0 11.5058311 0 14.3868571 3.3698259 1.7237428 2.0176318 2.246043 5.0067724 1.5943098 9.1379688zm-3.7840114-30.69845878h-32.7800457c-2.2399521 0-4.1494693 1.63085562-4.498177 3.84492105l-13.2554605 84.05225833c-.26038871 1.658265 1.02023648 3.1581649 2.69981982 3.1581649h15.65073208c2.2414748 0 4.1494693-1.6308556 4.498177-3.8449211l3.5769186-22.6751364c.3502304-2.2140654 2.2582249-3.844921 4.4996997-3.844921h10.371389c21.5924676 0 34.0530573-10.4490488 37.3102003-31.1598493 1.4648769-9.0572636.0593869-16.1745551-4.1829696-21.15696366-4.6611102-5.47729942-12.9235029-8.37355282-23.8902837-8.37355282z"
        fill="#253667"
      />
    </g>
  </g>
</svg>
`;var ve=s`
<svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" aria-labelledby="pinterestTitleID pinterestDescID">
  <title id="pinterestTitleID">Pinterest icon</title>
  <desc id="pinterestDescID">A stylized letter p</desc>
  <path d="m11.9051049 30.5873434.653491-1.0742755.4207845-.839975c.2805229-.591861.5371377-1.2533214.7698443-1.9843813.2327065-.7310599.4659444-1.6029125.6997135-2.6155579.2337692-1.0126455.4128151-1.752206.5371377-2.2186817.0308151.030815.0775689.0855382.1402615.1641697.0626927.0786314.1094465.1333547.1402615.1641697.1243227.1870153.2178304.311338.280523.372968 1.1210293.964829 2.3817888 1.4631823 3.7822785 1.4950599 1.4939973 0 2.8790795-.3426843 4.1552465-1.0280529 2.1166733-1.1826593 3.6733633-3.1128487 4.6700699-5.7905679.4048457-1.1518444.6848374-2.5996192.8399751-4.3433245.1243226-1.587505-.0781002-3.0974411-.6072685-4.5298084-.903199-2.36638128-2.5528653-4.20306294-4.948999-5.51004497-1.276167-.65349101-2.5990879-1.05833667-3.9687625-1.21453696-1.525875-.21783034-3.1293188-.17107651-4.8103315.14026149-2.7701643.52916833-5.02709913 1.743174-6.77080442 3.64201699-1.99235065 2.14748836-2.98852598 4.62225355-2.98852598 7.42429545 0 2.9571797.9494215 5.0584455 2.84826449 6.3037975l.83997504.4207845c.12432268 0 .22526845.0154075.3028373.0462225s.1551377.0074381.23270656-.0701308c.07756885-.0775688.13229208-.1243226.16416969-.1402614s.07066204-.0860696.11635328-.2103923c.04569124-.1243226.07703756-.2098609.09403895-.2566147.01700139-.0467539.04834771-.1476996.09403895-.3028373s.06906816-.2486454.07013074-.280523l.14026149-.5132295c.06269263-.311338.09403895-.5291684.09403895-.653491-.03081502-.1243227-.12432268-.2799917-.28052297-.467007-.15620029-.1870154-.23376915-.2959305-.23270656-.3267455-.62267599-.8096914-.9494215-1.7904592-.98023652-2.9423035-.03081502-1.55669.28052297-2.9731185.93401399-4.24928547 1.18265932-2.45882635 3.17501002-3.93741618 5.97705192-4.43576949 1.6183201-.311338 3.1356943-.25661476 4.5521228.16416969 1.4164285.42078446 2.5135496 1.09765239 3.2913633 2.03060379.8405063 1.02752164 1.3229208 2.28828114 1.4472435 3.78227848.1243227 1.4004897-.0313463 2.9725872-.467007 4.7162925-.3740306 1.3696746-.9186065 2.5528653-1.6337275 3.5495719-.9967066 1.245352-2.0863896 1.8834355-3.269049 1.9142505-1.7118277.0626926-2.7547568-.6375522-3.1287874-2.1007345-.0935077-.4664757 0-1.2134744.2805229-2.240996.7469987-2.5842117 1.1359055-3.9384788 1.1667206-4.0628015.1870153-1.0275216.2024228-1.7904591.0462225-2.2888124-.1870153-.65349104-.5759222-1.15928246-1.1667205-1.51737429-.5907984-.35809182-1.2756357-.39687625-2.054512-.11635327-1.1826594.43566067-1.9610044 1.40048968-2.335035 2.89448706-.311338 1.306982-.2491767 2.6299028.186484 3.9687625 0 .0626926.0313463.1402615.094039.2327065.0626926.0924451.0940389.1700139.0940389.2327066 0 .0935076-.0313463.2491766-.0940389.467007-.0626927.2178303-.094039.3580918-.094039.4207844-.0935076.4356607-.3038999 1.3308903-.6311767 2.6856887-.3272768 1.3547985-.5838915 2.3897582-.7698443 3.1048793-.7778136 3.2068876-1.12049796 5.5881451-1.02805289 7.1437725l.37296809 2.7558194c.653491-.591861 1.2294131-1.2299445 1.7277664-1.9142505z" class="fill-color" />
</svg>
`;var Qt=s`
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
`;var Xt=s`
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
`;var Kt=s`
<svg
  viewBox="0 0 40 40"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="softwareTitleID softwareDescID"
>
  <title id="softwareTitleID">Software icon</title>
  <desc id="softwareDescID">An illustration of a 3.5" floppy disk.</desc>
  <path class="fill-color" d="m32 30.6900373v-21.44521088c0-.82988428-.4156786-1.24482642-1.2470357-1.24482642h-21.50592858c-.83135715 0-1.24703572.4221795-1.24703572 1.26653851v21.44521089c0 .8588337.41567857 1.2882506 1.24703572 1.2882506h21.48327168c.8458575 0 1.2687863-.4366542 1.2687863-1.3099627zm-5.9950155-20.4410268v6.114667c0 .6694561-.3428744 1.0041841-1.0286232 1.0041841h-10.1294464c-.2622159 0-.4773054-.0802141-.6452685-.2406423s-.2519447-.3642806-.2519447-.6115572v-6.1363791l.0217506-.1311772h12.0326259zm-4.9437353.8295827v5.0010178h3.0405558v-5.0010178zm-9.7134658 18.8035735v-7.753025c0-.5241057.1604108-.9025595.4812325-1.1353613.1897138-.1453504.4011782-.2180256.6343932-.2180256h14.7451099c.3208217 0 .5905898.1091636.8093044.3274907s.3280719.5023936.3280719.8521995v7.8181612l-.0217506.1094652h-16.9772676z"/>
</svg>
`;var eo=s`
<svg
  viewBox="0 0 40 40"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="textsTitleID textsDescID"
>
  <title id="textsTitleID">Texts icon</title>
  <desc id="textsDescID">An illustration of an open book.</desc>
  <path class="fill-color" d="m10.3323235 11.0007023h6.9060825c.8851083 0 1.5847122.3064258 2.0988114.9192774v14.4324451h-.6460032c-.1435563-.120323-.3528315-.2434552-.6278257-.3693964-.2749942-.1259413-.5201585-.2191097-.7354929-.2795053l-.3048241-.1081503h-5.7042647c-.3108832 0-.5621067-.0601615-.7536705-.1804846-.0717781-.0599274-.1256117-.1439663-.1615008-.2521166-.0358891-.1081502-.0598928-.2043619-.0720112-.2886348v-13.8741368zm19.1752505 0v13.603761c-.0717781.3361555-.2211606.5943584-.4481473.7746089-.0717781.0599274-.1733862.1079162-.304824.1439663-.1314379.0360501-.2451643.0601615-.3411793.0723343h-5.5965975c-.9568865.2640552-1.5068748.5164059-1.649965.757052h-.6634817v-14.4324451c.5140992-.6128516 1.2076439-.9192774 2.0806339-.9192774h6.92426zm1.3814961.6489017-.1796783 15.2976474c-.0955489 0-1.0342578.0119386-2.8161268.035816-1.7818691.0238773-3.3006293.0898911-4.5562806.1980414-1.2556514.1081503-1.9613144.2884008-2.1169891.5407514-.0955488.1924233-.5439291.273419-1.345141.2429871-.8012118-.0304319-1.3155441-.1776755-1.5429969-.4417308-.334654-.3843783-3.4558378-.5765674-9.36355164-.5765674v-15.3875385l-.96830576.3960828v16.2702977c6.4096947-.2041278 9.7760429-.0840388 10.0990445.3602669.2391051.276228.9864833.414342 2.2421347.414342.1915638 0 .4187835-.0210682.6816593-.0632047s.4810068-.0870821.6543929-.1348367c.1733862-.0477547.2719646-.0838048.2957353-.1081503.0838965-.1563732.9599161-.2675666 2.6280587-.3335805 1.6681426-.0660138 3.3213703-.0931684 4.9596831-.0814638l2.4392915.0182591v-16.2344816z"/>
</svg>
`;var to=s`
<svg
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="tocTitleID tocDescID"
>
  <title id="tocTitleID">Table of contents icon</title>
  <desc id="tocDescID">An illustration of three text list items</desc>
  <g class="fill-color" fill-rule="evenodd"><rect height="3" rx="1.5" width="18" x="6"/><rect height="3" rx="1.5" width="18" x="6" y="21"/><rect height="3" rx="1.5" width="18" x="6" y="14"/><rect height="3" rx="1.5" width="18" x="6" y="7"/><rect height="3" rx="1.5" width="4"/><rect height="3" rx="1.5" width="4" y="21"/><rect height="3" rx="1.5" width="4" y="14"/><rect height="3" rx="1.5" width="4" y="7"/></g>
</svg>
`;var be=s`
<svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" aria-labelledby="tumblrTitleID tumblrDescID">
  <title id="tumblrTitleID">Tumblr icon</title>
  <desc id="tumblrDescID">A lowercase letter t</desc>
  <path d="m8.50321407 8.54544475v5.32088575c.15641786.0310693.6819176.0310693 1.57649923 0 .8945816-.0310693 1.3574071.0160703 1.3884764.1414189.0942792 1.5695354.1333837 3.2253149.1173133 4.9673385-.0160703 1.7420236-.0316049 3.3426283-.0466039 4.8018141s.2046288 2.824628.6588835 4.0963267c.4542546 1.2716986 1.1999178 2.2209194 2.2369897 2.8476622 1.2556283.784232 2.9896167 1.207953 5.2019653 1.271163 2.2123485.0632099 4.1659648-.2506972 5.8608487-.9417213-.0310693-.3449764-.0230341-1.4045467.0241055-3.1787109.0471397-1.7741643-.0080351-2.75499-.1655244-2.9424772-3.5472571 1.0360005-5.697467.6904885-6.4506298-1.0365361-.7220934-1.6638147-.8635123-4.9909084-.4242566-9.981281v-.046604h6.7318605v-5.32088568h-6.7318605v-6.54383772h-4.0497228c-.2828378 1.28669763-.6122795 2.35376743-.9883252 3.20120941-.3760457.84744199-.98029 1.60060471-1.812733 2.25948817-.832443.65888347-1.87594303 1.01993018-3.1305 1.08314014z" class="fill-color" />
</svg>
`;var ke=s`
<svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" aria-labelledby="twitterTitleID twitterDescID">
  <title id="twitterTitleID">Twitter icon</title>
  <desc id="twitterDescID">The Twitter logo, a cartoon bird</desc>
  <path d="m31.5297453 8.76273313c-.3135031.40766104-.7447036.83083673-1.2936015 1.26952707-.5488979.4386904-.9169698.7837578-1.1042157 1.0352022.1562166 2.319709-.1417719 4.5297454-.8939653 6.6301092-.7521935 2.1003638-1.8023754 3.9182538-3.1505457 5.45367-1.3481704 1.5354162-2.9627648 2.8284828-4.8437835 3.8791996-1.8810186 1.0507169-3.8321207 1.7483416-5.8533062 2.092874s-4.1215493.2894286-6.30109136-.1653114c-2.17954205-.45474-4.2092874-1.3401455-6.08923604-2.6562165 2.72737.4697196 5.67408517-.2514445 8.8401455-2.1634924-3.0719024-.7521935-4.88979241-2.2881447-5.45367-4.6078537 1.12882516.0631287 1.86550396.0631287 2.21003638 0-2.91568586-1.2850417-4.38904344-3.3693558-4.42007276-6.2529424.21934517.0310293.53284828.1487267.94050931.3530922s.78375775.3060133 1.12829017.3049433c-.81532206-.7211641-1.41076396-1.9045581-1.7863257-3.5501819-.37556173-1.64562376-.17173122-3.17355015.61149155-4.58377912 1.81789001 1.88101862 3.6908838 3.36989086 5.61898138 4.46661672 1.92809757 1.0967259 4.22426707 1.7547614 6.88850847 1.9741066-.2503745-1.1908838-.1722662-2.32719882.2343248-3.40894502.4065911-1.0817462 1.0416221-1.93612241 1.9050931-2.56312861.863471-.62700621 1.8114702-1.0817462 2.8439975-1.36421999 1.0325272-.28247378 2.0827091-.27444896 3.1505456.02407447s1.9767815.87042585 2.726835 1.71570726c1.3791997-.37663172 2.6802911-.87845068 3.9032742-1.50545688-.0310293.37663171-.1407019.74470361-.3290178 1.1042157-.1883158.35951209-.3530922.62593623-.4943291.79927242s-.3841216.4317355-.728654.77519795c-.3445324.34346244-.5638776.57832227-.6580355.70457949.2193452-.09415792.6895998-.23539482 1.410764-.42371067.7211641-.18831586 1.2069334-.39214638 1.4573079-.61149155 0 .44350524-.1567516.86668093-.4702547 1.27434196z" class="fill-color" />
</svg>
`;var oo=s`
<svg
  viewBox="0 0 40 41"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="uploadTitleID uploadDescID"
>
  <title id="uploadTitleID">Upload icon</title>
  <desc id="uploadDescID">An illustration of a horizontal line over an up pointing arrow.</desc>
  <path class="fill-color" d="m20 12.8 8 10.4h-4.8v8.8h-6.4v-8.8h-4.8zm12-4.8v3.2h-24v-3.2z" fill-rule="evenodd"/>
</svg>
`;var io=s`
<svg
  viewBox="0 0 40 40"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="userTitleID userDescID"
>
  <title id="userTitleID">User icon</title>
  <desc id="userDescID">An illustration of a person's head and chest.</desc>
  <path class="fill-color" d="m20.7130435 18.0434783c-3.5658385 0-6.4565218-2.9198821-6.4565218-6.5217392 0-3.60185703 2.8906833-6.5217391 6.4565218-6.5217391s6.4565217 2.91988207 6.4565217 6.5217391c0 3.6018571-2.8906832 6.5217392-6.4565217 6.5217392zm-12.9130435 16.9565217c0-7.9240855 5.7813665-14.3478261 12.9130435-14.3478261s12.9130435 6.4237406 12.9130435 14.3478261z" fill-rule="evenodd"/>
</svg>
`;var ro=s`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 449 300" aria-labelledby="venmoTitleID venmoDescID">
  <title id="venmoTitleID">Venmo icon</title>
  <desc id="venmoDescID">The Venmo logo</desc>
  <g fill="none">
    <rect width="448.934" height="299.289" fill="#3D95CE" rx="29.929" />
    <path
      fill="#FFF"
      d="M314.253648,95.768518 C314.253648,140.505629 276.917862,198.622312 246.615405,239.43135 L177.402732,239.43135 L149.644594,69.6528784 L210.247869,63.767475 L224.923984,184.575771 C238.636763,161.724586 255.559021,125.813905 255.559021,101.330492 C255.559021,87.9291341 253.314515,78.8010611 249.806862,71.285106 L304.995473,59.8578376 C311.376749,70.6382477 314.253648,81.742087 314.253648,95.768518 Z"
    />
  </g>
</svg>
`;var so=s`
<svg
  viewBox="0 0 40 40"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="videoTitleID videoDescID"
>
  <title id="videoTitleID">Video icon</title>
  <desc id="videoDescID">An illustration of two cells of a film strip.</desc>
  <path class="fill-color" d="m31.0117647 12.0677966c0 .4067797-.2823529.6779661-.7058823.6779661h-1.2705883c-.4235294 0-.7058823-.2711864-.7058823-.6779661v-.6779661c0-.4067797.2823529-.6779661.7058823-.6779661h1.2705883c.4235294 0 .7058823.2711864.7058823.6779661zm0 3.2542373c0 .4067797-.2823529.6779661-.7058823.6779661h-1.2705883c-.4235294 0-.7058823-.2711864-.7058823-.6779661v-.6779661c0-.4067797.2823529-.6779661.7058823-.6779661h1.2705883c.4235294 0 .7058823.2711864.7058823.6779661zm0 3.2542373c0 .4067796-.2823529.6779661-.7058823.6779661h-1.2705883c-.4235294 0-.7058823-.2711865-.7058823-.6779661v-.6779661c0-.4067797.2823529-.6779661.7058823-.6779661h1.2705883c.4235294 0 .7058823.2711864.7058823.6779661zm0 3.3898305c0 .4067797-.2823529.6779661-.7058823.6779661h-1.2705883c-.4235294 0-.7058823-.2711864-.7058823-.6779661v-.6779661c0-.4067797.2823529-.6779661.7058823-.6779661h1.2705883c.4235294 0 .7058823.2711864.7058823.6779661zm0 3.2542373c0 .4067796-.2823529.6779661-.7058823.6779661h-1.2705883c-.4235294 0-.7058823-.2711865-.7058823-.6779661v-.6779661c0-.4067797.2823529-.6779661.7058823-.6779661h1.2705883c.4235294 0 .7058823.2711864.7058823.6779661zm0 3.2542373c0 .4067796-.2823529.6779661-.7058823.6779661h-1.2705883c-.4235294 0-.7058823-.2711865-.7058823-.6779661v-.6779661c0-.4067797.2823529-.6779661.7058823-.6779661h1.2705883c.4235294 0 .7058823.2711864.7058823.6779661zm-4.0941176-10.440678c0 .5423729-.4235295.9491525-.9882353.9491525h-11.5764706c-.5647059 0-.9882353-.4067796-.9882353-.9491525v-6.9152542c0-.5423729.4235294-.9491526.9882353-.9491526h11.5764706c.5647058 0 .9882353.4067797.9882353.9491526zm-.1411765 11.2542373c0 .5423729-.4235294.9491525-.9882353.9491525h-11.5764706c-.5647059 0-.9882353-.4067796-.9882353-.9491525v-6.9152542c0-.5423729.4235294-.9491526.9882353-.9491526h11.5764706c.5647059 0 .9882353.4067797.9882353.9491526zm-14.9647059-17.220339c0 .4067797-.2823529.6779661-.7058823.6779661h-1.27058828c-.42352941 0-.70588236-.2711864-.70588236-.6779661v-.6779661c0-.4067797.28235295-.6779661.70588236-.6779661h1.27058828c.4235294 0 .7058823.2711864.7058823.6779661zm0 3.2542373c0 .4067797-.2823529.6779661-.7058823.6779661h-1.27058828c-.42352941 0-.70588236-.2711864-.70588236-.6779661v-.6779661c0-.4067797.28235295-.6779661.70588236-.6779661h1.27058828c.4235294 0 .7058823.2711864.7058823.6779661zm0 3.2542373c0 .4067796-.2823529.6779661-.7058823.6779661h-1.27058828c-.42352941 0-.70588236-.2711865-.70588236-.6779661v-.6779661c0-.4067797.28235295-.6779661.70588236-.6779661h1.27058828c.4235294 0 .7058823.2711864.7058823.6779661zm0 3.3898305c0 .4067797-.2823529.6779661-.7058823.6779661h-1.27058828c-.42352941 0-.70588236-.2711864-.70588236-.6779661v-.6779661c0-.4067797.28235295-.6779661.70588236-.6779661h1.27058828c.4235294 0 .7058823.2711864.7058823.6779661zm0 3.2542373c0 .4067796-.2823529.6779661-.7058823.6779661h-1.27058828c-.42352941 0-.70588236-.2711865-.70588236-.6779661v-.6779661c0-.4067797.28235295-.6779661.70588236-.6779661h1.27058828c.4235294 0 .7058823.2711864.7058823.6779661zm0 3.2542373c0 .4067796-.2823529.6779661-.7058823.6779661h-1.27058828c-.42352941 0-.70588236-.2711865-.70588236-.6779661v-.6779661c0-.4067797.28235295-.6779661.70588236-.6779661h1.27058828c.4235294 0 .7058823.2711864.7058823.6779661zm20.0470588-20.4745763h-.8470588v.27118644.6779661c0 .40677966-.2823529.6779661-.7058823.6779661h-1.2705883c-.4235294 0-.7058823-.27118644-.7058823-.6779661v-.6779661-.27118644h-16.5176471v.27118644.6779661c0 .40677966-.2823529.6779661-.7058823.6779661h-1.27058828c-.42352941 0-.70588236-.27118644-.70588236-.6779661v-.6779661-.27118644h-1.12941176v24h1.12941176v-.2711864-.6779661c0-.4067797.28235295-.6779661.70588236-.6779661h1.27058828c.4235294 0 .7058823.2711864.7058823.6779661v.6779661.2711864h16.6588235v-.2711864-.6779661c0-.4067797.282353-.6779661.7058824-.6779661h1.2705882c.4235294 0 .7058824.2711864.7058824.6779661v.6779661.2711864h.8470588v-24z" fill-rule="evenodd"/>
</svg>
`;var no=s`
<svg
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="visualAdjustmentTitleID visualAdjustmentDescID"
>
  <title id="visualAdjustmentTitleID">Visual adjustment</title>
  <desc id="visualAdjustmentDescID">A circle with its left hemisphere filled</desc>
  <path class="fill-color" d="m12 0c6.627417 0 12 5.372583 12 12s-5.372583 12-12 12-12-5.372583-12-12 5.372583-12 12-12zm0 2v20l.2664041-.0034797c5.399703-.1412166 9.7335959-4.562751 9.7335959-9.9965203 0-5.5228475-4.4771525-10-10-10z" fill-rule="evenodd" />
</svg>
`;var ao=s`
<svg
  viewBox="0 0 22 24"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="volumesTitleID volumesDescID"
>
  <title id="volumesTitleID">Volumes icon</title>
  <desc id="volumesDescID">Three books stacked on each other</desc>
  <path class="fill-color" d="m9.83536396 0h10.07241114c.1725502.47117517.3378411.76385809.4958725.87804878.1295523.11419069.3199719.1998337.5712586.25692905.2512868.05709534.4704647.08564301.6575337.08564301h.2806036v15.24362526h-4.3355343v3.8106985h-4.44275v3.7250554h-12.01318261c-.27306495 0-.50313194-.085643-.69020098-.256929-.18706903-.1712861-.30936193-.3425721-.36687867-.5138581l-.06449694-.2785477v-14.2159091c0-.32815965.08627512-.5922949.25882537-.79240577.17255024-.20011086.34510049-.32150776.51765073-.36419068l.25882537-.0640244h3.36472977v-2.54767184c0-.31374722.08627513-.57067627.25882537-.77078714.17255025-.20011086.34510049-.32150776.51765074-.36419068l.25882536-.06402439h3.36472978v-2.56929047c0-.32815964.08627512-.5922949.25882537-.79240576.17255024-.20011087.34510049-.31430156.51765073-.34257207zm10.78355264 15.6294346v-13.53076498c-.2730649-.08536585-.4456152-.16380266-.5176507-.23531042-.1725502-.1424612-.2730649-.27078714-.3015441-.38497783v13.36031043h-9.87808272c0 .0144124-.02149898.0144124-.06449694 0-.04299795-.0144124-.08962561.006929-.13988296.0640244-.05025735.0570953-.07538603.1427383-.07538603.256929s.02149898.210643.06449694.289357c.04299795.078714.08599591.1322062.12899387.1604767l.06449693.0216187h10.71905571zm-10.2449613-2.4412417h7.98003v-11.60421286h-7.98003zm1.6827837-9.41990022h4.6153002c.1725502 0 .3199718.05349224.4422647.16047672s.1834393.23891353.1834393.39578714c0 .15687362-.0611464.28519956-.1834393.38497783s-.2697145.1496674-.4422647.1496674h-4.6153002c-.1725503 0-.3199719-.04988913-.4422647-.1496674-.1222929-.09977827-.1834394-.22810421-.1834394-.38497783 0-.15687361.0611465-.28880266.1834394-.39578714.1222928-.10698448.2697144-.16047672.4422647-.16047672zm-6.08197737 13.50997782h7.72120467v-.8131929h-3.79610541c-.27306495 0-.49950224-.085643-.67931188-.256929-.17980964-.1712861-.29847284-.3425721-.35598958-.5138581l-.06449694-.2785477v-10.02023282h-2.82530086zm6.77217827-11.36890243h3.2139578c.1295522 0 .240956.05709534.3342113.17128603.0932554.11419069.139883.24972284.139883.40659645 0 .15687362-.0466276.28880267-.139883.39578714-.0932553.10698448-.2046591.16047672-.3342113.16047672h-3.2139578c-.1295523 0-.2373264-.05349224-.3233223-.16047672-.0859959-.10698447-.1289938-.23891352-.1289938-.39578714 0-.15687361.0429979-.29240576.1289938-.40659645s.19377-.17128603.3233223-.17128603zm-11.15043132 15.11557653h7.69942646v-.7491685h-3.79610539c-.25854616 0-.48135376-.0892462-.66842279-.2677384-.18706904-.1784922-.30936193-.3605876-.36687868-.546286l-.06449694-.2569291v-10.04101994h-2.80352266zm14.62237682-4.5606985h-.8191949v2.1410754h-9.89986085s-.04299796.0285477-.12899387.085643c-.08599592.0570954-.12201369.1427384-.10805331.2569291 0 .1141907.01786928.210643.05360784.289357.03573856.0787139.07538603.125.1189424.138858l.06449694.0432373h10.71905575v-2.9542683zm-4.3991936 3.8106985h-.8191949v2.077051h-9.8563045c0 .0144124-.02149898.0144124-.06449694 0-.04299795-.0144125-.08962561.0105321-.13988296.0748337-.05025735.0643015-.07538603.1607538-.07538603.289357 0 .1141906.02149898.2070399.06449694.2785476.04299795.0715078.08599591.1141907.12899387.1280488l.06449693.0216186h10.69811519v-2.8686252z" />
</svg>
`;var lo=s`
<svg
  viewBox="0 0 40 40"
  xmlns="http://www.w3.org/2000/svg"
  aria-labelledby="webTitleID webDescID"
>
  <title id="webTitleID">Web icon</title>
  <desc id="webDescID">An illustration of a computer application window</desc>
  <path class="fill-color" d="m8 28.7585405v-8.1608108-9.3577297h24v9.3577297 8.1608108zm14.2702703-15.8863783h-12.43243246v2.6114594h12.43243246zm7.7837838 14.0365946v-7.0727027-1.8497838h-20.21621626v1.8497838 7.0727027zm-3.7837838-14.0365946h-2.7027027v2.6114594h2.7027027zm4 0h-2.7027027v2.6114594h2.7027027z" fill-rule="evenodd"/>
</svg>
`;var Fi={applePay:_t,advance:zt,audio:At,calendar:Pt,calendarBlank:jt,close:Nt,collapseSidebar:Rt,creditCard:Ot,donate:Ht,download:Ft,editPencil:Vt,ellipses:qt,email:me,facebook:ue,googlePay:Wt,iaLogo:Zt,images:Ut,link:pe,localePin:Yt,lock:Gt,magnifyMinus:fe,magnifyPlus:ge,paypal:Jt,pinterest:ve,search:Qt,share:Xt,software:Kt,texts:eo,toc:to,tumblr:be,twitter:ke,upload:oo,user:io,venmo:ro,video:so,visualAdjustment:no,volumes:ao,web:lo},co=class extends h{static get properties(){return{icon:{type:String}}}static get styles(){return l`
      svg {
        width: var(--iconWidth, 'auto');
        height: var(--iconHeight, 'auto');
      }

      .fill-color {
        fill: var(--iconFillColor);
      }

      .stroke-color {
        stroke: var(--iconStrokeColor);
      }
    `}constructor(){super();this.icon=""}render(){return Fi[this.icon]||s``}},ho=co;var mo=ho;var Z=class{constructor(e){var t,i,r,n,a;this.title=e==null?void 0:e.title,this.subtitle=e==null?void 0:e.subtitle,this.headline=e==null?void 0:e.headline,this.message=e==null?void 0:e.message,this.headerColor=(t=e==null?void 0:e.headerColor)!==null&&t!==void 0?t:"#55A183",this.showProcessingIndicator=(i=e==null?void 0:e.showProcessingIndicator)!==null&&i!==void 0?i:!1,this.processingImageMode=(r=e==null?void 0:e.processingImageMode)!==null&&r!==void 0?r:"complete",this.showCloseButton=(n=e==null?void 0:e.showCloseButton)!==null&&n!==void 0?n:!0,this.closeOnBackdropClick=(a=e==null?void 0:e.closeOnBackdropClick)!==null&&a!==void 0?a:!0}};function T(o,e,t,i){var r=arguments.length,n=r<3?e:i===null?i=Object.getOwnPropertyDescriptor(e,t):i,a;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")n=Reflect.decorate(o,e,t,i);else for(var d=o.length-1;d>=0;d--)(a=o[d])&&(n=(r<3?a(n):r>3?a(e,t,n):a(e,t))||n);return r>3&&n&&Object.defineProperty(e,t,n),n}function uo(o,e,t,i){return new(t||(t=Promise))(function(r,n){function a(m){try{c(i.next(m))}catch(g){n(g)}}function d(m){try{c(i.throw(m))}catch(g){n(g)}}function c(m){m.done?r(m.value):new t(function(g){g(m.value)}).then(a,d)}c((i=i.apply(o,e||[])).next())})}var Vi=Object.freeze({processing:"processing",complete:"complete"}),Ye=class extends h{static get properties(){return{mode:{type:String}}}constructor(){super();this.mode=Vi.processing}render(){return s`
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
    `}static get styles(){let e=l`var(--activityIndicatorCheckmarkColor, #31A481)`,t=l`var(--activityIndicatorCompletedRingColor, #31A481)`,i=l`var(--activityIndicatorLoadingRingColor, #333333)`,r=l`var(--activityIndicatorLoadingDotColor, #333333)`;return l`
      #completed-ring {
        fill: ${t};
      }

      #check {
        fill: ${e};
      }

      #activity-ring {
        fill: ${i};
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
    `}};window.customElements.define("ia-activity-indicator",Ye);var po=s`
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
`;var fo=s`
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
`;var ye=class extends h{constructor(){super(...arguments);this.config=new Z}render(){return s`
      <div class="modal-wrapper">
        <div class="modal-container">
          <header style="background-color: ${this.config.headerColor}">
            ${this.config.showCloseButton?this.closeButtonTemplate:""}
            <div class="logo-icon">
              ${fo}
            </div>
            ${this.config.title?s`<h1 class="title">${this.config.title}</h1>`:""}
            ${this.config.subtitle?s`<h2 class="subtitle">${this.config.subtitle}</h2>`:""}
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

              ${this.config.headline?s` <h1 class="headline">${this.config.headline}</h1> `:""}
              ${this.config.message?s` <p class="message">${this.config.message}</p> `:""}

              <div class="slot-container">
                <slot> </slot>
              </div>
            </div>
          </section>
        </div>
      </div>
    `}handleCloseButton(){let e=new Event("closeButtonPressed");this.dispatchEvent(e)}get closeButtonTemplate(){return s`
      <button
        type="button"
        class="close-button"
        tabindex="0"
        @click=${this.handleCloseButton}
      >
        ${po}
      </button>
    `}static get styles(){let e=l`var(--modalLogoSize, 6.5rem)`,t=l`var(--processingImageSize, 7.5rem)`,i=l`var(--modalCornerRadius, 1rem)`,r=l`var(--modalBorder, 2px solid black)`,n=l`var(--modalBottomMargin, 2.5rem)`,a=l`var(--modalTopMargin, 5rem)`,d=l`var(--modalHeaderBottomPadding, 0.5em)`,c=l`var(--modalBottomPadding, 2rem)`,m=l`var(--modalScrollOffset, 5px)`,g=l`var(--modalTitleFontSize, 1.8rem)`,u=l`var(--modalSubtitleFontSize, 1.4rem)`,w=l`var(--modalHeadlineFontSize, 1.6rem)`,v=l`var(--modalMessageFontSize, 1.4rem)`,b=l`var(--modalTitleLineHeight, normal)`,f=l`var(--modalSubtitleLineHeight, normal)`,k=l`var(--modalHeadlineLineHeight, normal)`,y=l`var(--modalMessageLineHeight, normal)`;return l`
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
        border-radius: ${i};
        width: 100%;
        margin-top: ${a};
      }

      header {
        position: relative;
        background-color: #36a483;
        color: white;
        border-radius: calc(${i}) calc(${i}) 0 0;
        border: ${r};
        border-bottom: 0;
        text-align: center;
        padding-bottom: ${d};
      }

      .title {
        margin: 0;
        padding: 0;
        font-size: ${g};
        font-weight: bold;
        line-height: ${b};
      }

      .subtitle {
        margin: 0;
        padding: 0;
        font-weight: normal;
        padding-top: 0;
        font-size: ${u};
        line-height: ${f};
      }

      .modal-body {
        background-color: #f5f5f7;
        border-radius: 0 0 calc(${i}) calc(${i});
        border: ${r};
        border-top: 0;
        padding: 0 1rem calc(${c} - ${m}) 1rem;
        color: #333;
        margin-bottom: 2.5rem;
        min-height: 5rem;
      }

      .content {
        overflow-y: auto;
        max-height: calc(100vh - (16.5rem + ${n}));
        min-height: 5rem;
        padding: 0 0 calc(${m}) 0;
      }

      .headline {
        font-size: ${w};
        font-weight: bold;
        text-align: center;
        line-height: ${k};
        margin: 0;
        padding: 0;
      }

      .message {
        margin: 1rem 0 0 0;
        text-align: center;
        font-size: ${v};
        line-height: ${y};
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
    `}};T([W({type:Object})],ye.prototype,"config",void 0);ye=T([le("modal-template")],ye);var bo=Bi(vo());var D;(function(o){o.Open="open",o.Closed="closed"})(D||(D={}));var xe=class{constructor(e){this.windowResizeThrottler=(0,bo.throttle)(100,!1,this.updateModalContainerHeight).bind(this),this.modalManager=e}handleModeChange(e){switch(e){case D.Open:this.startResizeListener(),this.stopDocumentScroll();break;case D.Closed:this.stopResizeListener(),this.resumeDocumentScroll();break}}updateModalContainerHeight(){this.modalManager.style.setProperty("--containerHeight",`${window.innerHeight}px`)}stopDocumentScroll(){document.body.classList.add("modal-manager-open")}resumeDocumentScroll(){document.body.classList.remove("modal-manager-open")}startResizeListener(){window.addEventListener("resize",this.windowResizeThrottler)}stopResizeListener(){window.removeEventListener("resize",this.windowResizeThrottler)}};var R=class extends h{constructor(){super(...arguments);this.mode=D.Closed,this.hostBridge=new xe(this),this.closeOnBackdropClick=!0}render(){return s`
      <div class="container">
        <div class="backdrop" @click=${this.backdropClicked}></div>
        <modal-template
          @closeButtonPressed=${this.closeButtonPressed}
          tabindex="0"
        >
          ${this.customModalContent}
        </modal-template>
      </div>
    `}getMode(){return this.mode}closeModal(){this.mode=D.Closed}callUserClosedModalCallback(){let e=this.userClosedModalCallback;this.userClosedModalCallback=void 0,e&&e()}showModal(e){return uo(this,void 0,void 0,function*(){this.closeOnBackdropClick=e.config.closeOnBackdropClick,this.userClosedModalCallback=e.userClosedModalCallback,this.modalTemplate.config=e.config,this.customModalContent=e.customModalContent,this.mode=D.Open,yield this.modalTemplate.updateComplete,this.modalTemplate.focus()})}updated(e){e.has("mode")&&this.handleModeChange()}backdropClicked(){this.closeOnBackdropClick&&(this.closeModal(),this.callUserClosedModalCallback())}handleModeChange(){this.hostBridge.handleModeChange(this.mode),this.emitModeChangeEvent()}emitModeChangeEvent(){let e=new CustomEvent("modeChanged",{detail:{mode:this.mode}});this.dispatchEvent(e)}closeButtonPressed(){this.closeModal(),this.callUserClosedModalCallback()}static get styles(){let e=l`var(--modalBackdropColor, rgba(10, 10, 10, 0.9))`,t=l`var(--modalBackdropZindex, 1000)`,i=l`var(--modalWidth, 32rem)`,r=l`var(--modalMaxWidth, 95%)`,n=l`var(--modalZindex, 2000)`;return l`
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
        z-index: ${n};
        width: ${i};
        max-width: ${r};
      }
    `}};T([W({type:String,reflect:!0})],R.prototype,"mode",void 0);T([W({type:Object})],R.prototype,"customModalContent",void 0);T([W({type:Object})],R.prototype,"hostBridge",void 0);T([xt("modal-template")],R.prototype,"modalTemplate",void 0);R=T([le("modal-manager")],R);var U=l`var(--menuWidth, 320px)`,qi=l`@media (min-width: 640px)`,Wi=l`var(--animationTiming, 200ms)`,Ce=l`transform ${Wi} ease-out`,ko=l`
#frame {
  position: relative;
  overflow: hidden;
}

#frame.fullscreen,
#frame.fullscreen #reader {
  height: 100vh;
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

nav button {
  background: none;
}

nav .minimized {
  background: rgba(0, 0, 0, .7);
  border-bottom-right-radius: 5%;
  position: absolute;
  padding-top: .6rem;
  top: 0;
  left: 0;
  width: 4rem;
  z-index: 2;
}

nav .minimized button {
  width: var(--iconWidth);
  height: var(--iconHeight);
  margin: auto;
  display: inline-flex;
  vertical-align: middle;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
}

nav .minimized button.toggle-menu > * {
  border: 2px solid var(--iconStrokeColor);
  border-radius: var(--iconWidth);
  width: var(--iconWidth);
  height: var(--iconHeight);
  margin: auto;
}

#menu {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 3;
  overflow: hidden;
  transform: translateX(-${U});
  width: ${U};
  transform: translateX(calc(${U} * -1));
  transition: ${Ce};
}

#reader {
  position: relative;
  z-index: 1;
  transition: ${Ce};
  transform: translateX(0);
  width: 100%;
}

.open #menu {
  width: ${U};
  transform: translateX(0);
  transition: ${Ce};
}

${qi} {
  .open #reader {
    transition: ${Ce};
    transform: translateX(${U});
    width: calc(100% - ${U});
  }
}

#loading-indicator {
  display: none;
}

#loading-indicator.visible {
  display: block;
}
`;var Se=class extends h{static get styles(){return ko}static get properties(){return{baseHost:{type:String},item:{type:Object,converter(e){return e?JSON.parse(atob(e)):{}}},itemType:{type:String},menuShortcuts:{type:Array,hasChanged(e,t){return e!==t}},menuOpened:{type:Boolean},menuContents:{type:Array},openMenu:{type:String},signedIn:{type:Boolean},viewportInFullscreen:{type:Boolean}}}constructor(){super();this.baseHost="archive.org",this.item={},this.itemType="",this.menuOpened=!1,this.menuShortcuts=[],this.menuContents=[],this.viewportInFullscreen=!1,this.openMenu="",this.renderModalManager()}showItemNavigatorModal({detail:e}){this.modal.showModal({config:this.modalConfig,customModalContent:e.customModalContent})}closeItemNavigatorModal(){this.modal.closeModal()}manageViewportFullscreen({detail:e}){let{isFullScreen:t}=e;this.viewportInFullscreen=t}manageSideMenuEvents({detail:e}){let{action:t="",menuId:i=""}=e;i&&(t==="open"?this.openShortcut(i):t==="toggle"&&(this.openMenu=i,this.toggleMenu()))}toggleMenu(){this.menuOpened=!this.menuOpened}closeMenu(){this.menuOpened=!1}openShortcut(e=""){this.openMenu=e,this.menuOpened=!0}setOpenMenu({detail:e}){let{id:t}=e;this.openMenu=t===this.openMenu?"":t}setMenuContents({detail:e}){this.menuContents=[...e]}setMenuShortcuts({detail:e}){this.menuShortcuts=[...e]}get menuClass(){let e=this.menuOpened?"open":"",t=this.viewportInFullscreen?"fullscreen":"";return`${e} ${t}`}get menuToggleButton(){return s`
      <button class="toggle-menu" @click=${this.toggleMenu.bind(this)}>
        <div>
          <ia-icon
            icon="ellipses"
            style="width: var(--iconWidth); height: var(--iconHeight);"
          ></ia-icon>
        </div>
      </button>
    `}get menuSlider(){return s`
      <div id="menu">
        <ia-menu-slider
          .menus=${this.menuContents}
          .open=${!0}
          .selectedMenu=${this.openMenu}
          @menuTypeSelected=${this.setOpenMenu}
          @menuSliderClosed=${this.closeMenu}
          ?manuallyHandleClose=${!0}
          ?animateMenuOpen=${!1}
        ></ia-menu-slider>
      </div>
    `}get shortcuts(){let e=this.menuShortcuts.map(({icon:t,id:i})=>s`
        <button
          class="shortcut ${i}"
          @click="${r=>{this.openShortcut(i)}}"
        >
          ${t}
        </button>
      `);return s`<div class="shortcuts">${e}</div>`}get renderSideMenu(){return s`
      <nav>
        <div class="minimized">${this.shortcuts} ${this.menuToggleButton}</div>
        ${this.menuSlider}
      </nav>
    `}get renderViewport(){return this.itemType==="bookreader"?s`
        <book-navigator
          .baseHost=${this.baseHost}
          .book=${this.item}
          ?signedIn=${this.signedIn}
          ?sideMenuOpen=${this.menuOpened}
          @ViewportInFullScreen=${this.manageViewportFullscreen}
          @updateSideMenu=${this.manageSideMenuEvents}
          @menuUpdated=${this.setMenuContents}
          @menuShortcutsUpdated=${this.setMenuShortcuts}
          @showItemNavigatorModal=${this.showItemNavigatorModal}
          @closeItemNavigatorModal=${this.closeItemNavigatorModal}
        >
          <div slot="bookreader">
            <slot name="bookreader"></slot>
          </div>
        </book-navigator>
      `:s`<div class="viewport"></div>`}renderModalManager(){this.modal=document.createElement("modal-manager"),this.modal.setAttribute("id","item-navigator-modal"),this.modalConfig=new Z,this.modalConfig.title="Delete Bookmark",this.modalConfig.headline="This bookmark contains a note. Deleting it will permanently delete the note. Are you sure?",this.modalConfig.headerColor="#194880",document.body.appendChild(this.modal)}render(){return s`
      <div id="frame" class=${this.menuClass}>
        ${this.renderSideMenu}
        <div id="reader">${this.renderViewport}</div>
      </div>
    `}},y2=Se;customElements.define("ia-icon",mo);customElements.define("ia-menu-slider",he);customElements.define("item-navigator",Se);var yo=l`data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjEwIiB2aWV3Qm94PSIwIDAgMTMgMTAiIHdpZHRoPSIxMyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtNC4zMzMzMzMzMyAxMC00LjMzMzMzMzMzLTQuMTY2NjY2NjcgMS43MzMzMzMzMy0xLjY2NjY2NjY2IDIuNiAyLjUgNi45MzMzMzMzNy02LjY2NjY2NjY3IDEuNzMzMzMzMyAxLjY2NjY2NjY3eiIgZmlsbD0iI2ZmZiIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+`;var Ge=l`data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNDAgNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgYXJpYS1sYWJlbGxlZGJ5PSJjbG9zZVRpdGxlSUQgY2xvc2VEZXNjSUQiPjxwYXRoIGQ9Ik0yOS4xOTIgMTAuODA4YTEuNSAxLjUgMCAwMTAgMi4xMkwyMi4xMjIgMjBsNy4wNyA3LjA3MmExLjUgMS41IDAgMDEtMi4xMiAyLjEyMWwtNy4wNzMtNy4wNy03LjA3IDcuMDdhMS41IDEuNSAwIDAxLTIuMTIxLTIuMTJsNy4wNy03LjA3My03LjA3LTcuMDdhMS41IDEuNSAwIDAxMi4xMi0yLjEyMUwyMCAxNy44NzhsNy4wNzItNy4wN2ExLjUgMS41IDAgMDEyLjEyMSAweiIgY2xhc3M9ImZpbGwtY29sb3IiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==`;var wo=l`
:host {
  display: block;
  height: 100%;
  padding: 1.5rem 1rem 2rem 0;
  overflow-y: auto;
  font-size: 1.4rem;
  box-sizing: border-box;
}

header {
  display: flex;
  align-items: center;
  padding: 0 2rem 0 0;
}

h3 {
  padding: 0;
  margin: 0 1rem 0 0;
  font-size: 2rem;
}

header p {
  padding: 0;
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
  font-style: italic;
}

fieldset {
  padding: 0 0 1rem 0;
  border: none;
}

[type="checkbox"] {
  display: none;
}

label {
  display: block;
  text-align: center;
}

label.checkbox {
  padding-bottom: .5rem;
  font-size: 1.6rem;
  line-height: 150%;
  vertical-align: middle;
}

label.checkbox:after {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-left: .7rem;
  content: "";
  border: 1px solid var(--primaryTextColor);
  border-radius: 2px;
  background: var(--activeButtonBg) 50% 50% no-repeat;
}
:checked + label.checkbox:after {
  background-image: url('${yo}');
}

[type="search"] {
  -webkit-appearance: textfield;
  width: 100%;
  height: 3rem;
  padding: 0 1.5rem;
  box-sizing: border-box;
  font: normal 1.6rem "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: var(--primaryTextColor);
  border: 1px solid var(--primaryTextColor);
  border-radius: 1.5rem;
  background: transparent;
}
[type="search"]:focus {
  outline: none;
}
[type="search"]::-webkit-search-cancel-button {
  width: 18px;
  height: 18px;
  -webkit-appearance: none;
  appearance: none;
  -webkit-mask: url('${Ge}') 0 0 no-repeat;
  mask: url('${Ge}') 0 0 no-repeat;
  -webkit-mask-size: 100%;
  mask-size: 100%;
  background: #fff;
}

p.page-num {
  font-weight: bold;
  padding-bottom: 0;
}

p.search-cta {
  text-align: center;
}

.results-container {
  padding-bottom: 2rem;
}

ul {
  padding: 0 0 2rem 0;
  margin: 0;
  list-style: none;
}

ul.show-image li {
  display: grid;
}

li {
  cursor: pointer;
  grid-template-columns: 30px 1fr;
  grid-gap: 0 .5rem;
}

li img {
  display: block;
  width: 100%;
}

li h4 {
  grid-column: 2 / 3;
  padding: 0 0 2rem 0;
  margin: 0;
  font-weight: normal;
}

li p {
  grid-column: 2 / 3;
  padding: 0 0 1.5rem 0;
  margin: 0;
  font-size: 1.2rem;
}

mark {
  padding: 0 .2rem;
  color: var(--searchResultText);
  background: var(--searchResultBg);
  border: 1px solid var(--searchResultBorder);
  border-radius: 2px;
}

.loading {
  text-align: center;
}

.loading p {
  padding: 0 0 1rem 0;
  margin: 0;
  font-size: 1.2rem;
}

.loading button {
  -webkit-appearance: none;
  appearance: none;
  padding: .5rem .7rem;
  font: normal 1.4rem "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: var(--primaryTextColor);
  border: 1px solid #656565;
  border-radius: 3px;
  cursor: pointer;
  background: transparent;
}

ia-activity-indicator {
  display: block;
  width: 40px;
  height: 40px;
  margin: 0 auto;
}
`;var xo=new WeakMap,Co=A(o=>e=>{if(!(e instanceof M))throw new Error("unsafeHTML can only be used in text bindings");let t=xo.get(e);if(t!==void 0&&V(o)&&o===t.value&&e.value===t.fragment)return;let i=document.createElement("template");i.innerHTML=o;let r=document.importNode(i.content,!0);e.setValue(r),xo.set(e,{value:o,fragment:r})});var Je=class extends h{static get properties(){return{match:{type:Object}}}constructor(){super();this.matchRegex=new RegExp("{{{(.+?)}}}","g")}createRenderRoot(){return this}highlightedHit(e){return s`
      <p>${Co(e.replace(this.matchRegex,"<mark>$1</mark>"))}</p>
    `}resultSelected(){this.dispatchEvent(new CustomEvent("resultSelected",{bubbles:!0,composed:!0,detail:{match:this.match}}))}render(){let{match:e}=this,{par:t=[]}=e,[i={}]=t,r=Number.isInteger(i.page)?s`<p class="page-num">Page -${i.page}-</p>`:p,n=s`<img src="${e.cover}" />`;return s`
      <li @click=${this.resultSelected}>
        ${e.cover?n:p}
        <h4>${e.title||p}</h4>
        ${r}
        ${this.highlightedHit(e.text)}
      </li>
    `}};customElements.define("book-search-result",Je);var Qe=class extends h{static get styles(){return wo}static get properties(){return{results:{type:Array},query:{type:String},queryInProgress:{type:Boolean},renderHeader:{type:Boolean},renderSearchAllFiles:{type:Boolean},displayResultImages:{type:Boolean},errorMessage:{type:String}}}constructor(){super();this.results=[],this.query="",this.queryInProgress=!1,this.renderHeader=!1,this.renderSearchAllFields=!1,this.displayResultImages=!1,this.errorMessage="",this.bindBookReaderListeners()}updated(){this.focusOnInputIfNecessary()}bindBookReaderListeners(){document.addEventListener("BookReader:SearchCallback",this.setResults.bind(this))}focusOnInputIfNecessary(){if(this.results.length)return;this.shadowRoot.querySelector("input[type='search']").focus()}setResults({detail:e}){this.results=e.results}setQuery(e){this.query=e.currentTarget.value}performSearch(e){e.preventDefault();let t=e.currentTarget.querySelector('input[type="search"]');!t||!t.value||this.dispatchEvent(new CustomEvent("bookSearchInitiated",{bubbles:!0,composed:!0,detail:{query:this.query}}))}selectResult(){this.dispatchEvent(new CustomEvent("closeMenu",{bubbles:!0,composed:!0}))}cancelSearch(){this.queryInProgress=!1,this.dispatchSearchCanceled()}dispatchSearchCanceled(){this.dispatchEvent(new CustomEvent("bookSearchCanceled",{bubbles:!0,composed:!0}))}get resultsCount(){let e=this.results.length;return e?s`<p>(${e} result${e>1?"s":""})</p>`:p}get headerSection(){let e=s`<header>
      <h3>Search inside</h3>
      ${this.resultsCount}
    </header>`;return this.renderHeader?e:p}get searchMultipleControls(){let e=s`
      <input name="all_files" id="all_files" type="checkbox" />
      <label class="checkbox" for="all_files">Search all files</label>
    `;return this.renderSearchAllFiles?e:p}get loadingIndicator(){return s`
      <div class="loading">
        <ia-activity-indicator mode="processing"></ia-activity-indicator>
        <p>Searching</p>
      </div>
    `}get resultsSet(){let e=this.displayResultImages?"show-image":"";return s`
      <ul class="results ${e}">
        ${this.results.map(t=>s`
            <book-search-result
              .match=${t}
              @resultSelected=${this.selectResult}
            ></book-search-result>
          `)}
      </ul>
    `}get searchForm(){return s`
      <form action="" method="get" @submit=${this.performSearch}>
        <fieldset>
          ${this.searchMultipleControls}
          <input
            type="search"
            name="query"
            alt="Search inside this book."
            @keyup=${this.setQuery}
            .value=${this.query}
          />
        </fieldset>
      </form>
    `}get setErrorMessage(){return s`
      <p class="error-message">${this.errorMessage}</p>
    `}get searchCTA(){return s`<p class="search-cta"><em>Please enter text to search for</em></p>`}render(){let e=!this.queryInProgress&&!this.errorMessage&&!this.queryInProgress&&!this.results.length;return s`
      ${this.headerSection}
      ${this.searchForm}
      <div class="results-container">
        ${this.queryInProgress?this.loadingIndicator:p}
        ${this.errorMessage?this.setErrorMessage:p}
        ${this.results.length?this.resultsSet:p}
        ${e?this.searchCTA:p}
      </div>
    `}};customElements.define("ia-book-search-results",Qe);var C={query:"",results:[],resultsCount:0,queryInProgress:!1,errorMessage:""},So=class{constructor(o=()=>{},e){this.onBookSearchInitiated=this.onBookSearchInitiated.bind(this),this.onSearchStarted=this.onSearchStarted.bind(this),this.onSearchRequestError=this.onSearchRequestError.bind(this),this.onSearchResultsClicked=this.onSearchResultsClicked.bind(this),this.onSearchResultsChange=this.onSearchResultsChange.bind(this),this.onSearchResultsCleared=this.onSearchResultsCleared.bind(this),this.bindEventListeners=this.bindEventListeners.bind(this),this.getMenuDetails=this.getMenuDetails.bind(this),this.getComponent=this.getComponent.bind(this),this.advanceToPage=this.advanceToPage.bind(this),this.updateMenu=this.updateMenu.bind(this),this.onSearchChange=o,this.bookreader=e,this.icon=s`<ia-icon icon="search" style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon>`,this.label="Search inside",this.menuDetails=this.getMenuDetails(),this.id="search",this.component=this.getComponent(),this.bindEventListeners()}getMenuDetails(){let{resultsCount:o,query:e,queryInProgress:t}=C;return t||!e?p:s`(${o} ${o===1?"result":"results"})`}bindEventListeners(){window.addEventListener("BookReader:SearchStarted",this.onSearchStarted),window.addEventListener("BookReader:SearchCallback",this.onSearchResultsChange),window.addEventListener("BookReader:SearchCallbackEmpty",o=>{this.onSearchRequestError(o,"noResults")}),window.addEventListener("BookReader:SearchCallbackNotIndexed",o=>{this.onSearchRequestError(o,"notIndexed")}),window.addEventListener("BookReader:SearchCallbackError",o=>{this.onSearchRequestError(o)}),window.addEventListener("BookReader:SearchResultsCleared",()=>{this.onSearchResultsCleared()})}onSearchStarted(o){let{term:e=""}=o.detail.props;C.query=e,C.results=[],C.resultsCount=0,C.queryInProgress=!0,C.errorMessage="",this.updateMenu()}onBookSearchInitiated({detail:o}){C.query=o.query,this.bookreader.search(C.query)}onSearchRequestError(o,e="default"){let{detail:{props:t={}}}=o,{instance:i=null}=t;i&&(this.bookreader=i);let r={noResults:"0 results",notIndexed:`This book hasn't been indexed for searching yet.  We've just started indexing it,
       so search should be available soon.  Please try again later.  Thanks!`,default:"Sorry, there was an error with your search.  The text may still be processing."},n=r[e]??r.default;C.results=[],C.resultsCount=0,C.queryInProgress=!1,C.errorMessage=s`<p class="error">${n}</p>`,this.updateMenu()}onSearchResultsChange({detail:{props:o={}}}){let{instance:e=null,results:t=[]}=o;e&&(this.bookreader=e);let i=t.matches||[],r=i.length,n=t.q;C={results:i,resultsCount:r,query:n,queryInProgress:!1,errorMessage:""},this.updateMenu()}onSearchResultsCleared(){C={query:"",results:[],resultsCount:0,queryInProgress:!1,errorMessage:""},this.updateMenu(),this.bookreader?.searchView?.clearSearchFieldAndResults()}updateMenu(){this.menuDetails=this.getMenuDetails(),this.component=this.getComponent(),this.onSearchChange(this.bookreader)}getComponent(){let{query:o,results:e,queryInProgress:t,errorMessage:i}=C;return s`
    <ia-book-search-results
      .query=${o}
      .results=${e}
      .errorMessage=${i}
      ?queryInProgress=${t}
      ?renderSearchAllFiles=${!1}
      @resultSelected=${this.onSearchResultsClicked}
      @bookSearchInitiated=${this.onBookSearchInitiated}
      @bookSearchResultsCleared=${this.onSearchResultsCleared}
    ></ia-book-search-results>
  `}onSearchResultsClicked({detail:o}){let e=o.match.par[0].page;this.advanceToPage(e)}advanceToPage(o){let e=this.bookreader.leafNumToIndex(o);this.bookreader._searchPluginGoToResult(e),this.bookreader.updateSearchHilites()}},Bo=So;var Io=l`
:host {
  display: block;
  height: 100%;
  padding: 1.5rem 0;
  overflow-y: auto;
  font-size: 1.4rem;
  box-sizing: border-box;
}

header {
  display: flex;
  align-items: center;
  padding: 0 2rem;
}

h2 {
  font-size: 1.6rem;
}

h3 {
  padding: 0;
  margin: 0 1rem 0 0;
  font-size: 1.4rem;
}

header p {
  padding: 0;
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
  font-style: italic;
}

header div {
  display: flex;
  align-items: baseline;
}

a.close {
  justify-self: end;
}

a.close ia-icon {
  --iconWidth: 18px;
  --iconHeight: 18px;
}

ul {
  padding: 0;
  margin: 0;
  list-style: none;
}

li,
ul + p {
  padding-bottom: 1.2rem;
  font-size: 1.2rem;
  line-height: 140%;
}

p {
  margin: .3rem 0 0 0;
}

.button {
  display: inline-block;
  padding: .6rem 1rem;
  font-size: 1.4rem;
  text-decoration: none;
  text-shadow: 1px 1px #484848;
  border-radius: 4px;
  color: var(--downloadButtonColor);
  background: var(--downloadButtonBg);
  border: 1px solid var(--downloadButtonBorderColor);
}

.external {
  color: var(--externalButtonColor);
  text-shadow: none;
  background: var(--externalButtonBg);
  border: 1px solid var(--externalButtonBorderColor);
}
`;var Xe=class extends h{static get styles(){return Io}static get properties(){return{downloads:{type:Array},expiration:{type:Number},renderHeader:{type:Boolean}}}constructor(){super();this.downloads=[],this.expiration=0,this.renderHeader=!1}get formatsCount(){let e=this.downloads.length;return e?s`<p>${e} format${e>1?"s":""}</p>`:s``}get loanExpiryMessage(){return this.expiration?s`<h2>These files will expire in ${this.expiration} days.</h2>`:s``}renderDownloadOptions(){return this.downloads.map(e=>s`
        <li>
          <a class="button" href="${e.url}">Get ${e.type}</a>
          ${e.note?s`<p>${e.note}</p>`:s``}
        </li>
      `)}get header(){return this.renderHeader?s`
      <header>
        <h3>Downloadable files</h3>
        ${this.formatsCount}
      </header>
    `:p}render(){return s`
      ${this.header}
      ${this.loanExpiryMessage}
      <ul>${this.renderDownloadOptions()}</ul>
      <p>To access downloaded books, you need Adobe-compliant software on your device. The Internet Archive will administer this loan, but Adobe may also collect some information.</p>
      <a class="button external" href="https://www.adobe.com/solutions/ebook/digital-editions/download.html" rel="noopener noreferrer" target="_blank">Install Adobe Digital Editions</a>
    `}};customElements.define("ia-book-downloads",Xe);var Be=[],Zi={pdf:{type:"Encrypted Adobe PDF",url:"#",note:"PDF files contain high quality images of pages."},epub:{type:"Encrypted Adobe ePub",url:"#",note:"ePub files are smaller in size, but may contain errors."}},Mo=class{constructor(){this.icon=s`<ia-icon icon="download" style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon>`,this.label="Downloadable files",this.menuDetails="",this.id="downloads",this.component="",this.computeAvailableTypes=this.computeAvailableTypes.bind(this),this.update=this.update.bind(this)}update(o){this.computeAvailableTypes(o),this.component=this.menu;let e=Be.length===1?"":"s";this.menuDetails=`(${Be.length} format${e})`}computeAvailableTypes(o=[]){Be=o.reduce((t,i=[],r)=>{let[n="",a=""]=i,d=n.toLowerCase(),c=Zi[d]||null;if(c){let m=Object.assign({},c,{url:a});t.push(m)}return t},[])}get menu(){return s`<ia-book-downloads .downloads=${Be}></ia-book-downloads>`}},Lo=Mo;var Do=(o,e)=>{let t=o.startNode.parentNode,i=e===void 0?o.endNode:e.startNode,r=t.insertBefore(B(),i);t.insertBefore(B(),i);let n=new M(o.options);return n.insertAfterNode(r),n},O=(o,e)=>(o.setValue(e),o.commit(),o),Ke=(o,e,t)=>{let i=o.startNode.parentNode,r=t?t.startNode:o.endNode,n=e.endNode.nextSibling;n!==r&&ee(i,e.startNode,n,r)},et=o=>{$(o.startNode.parentNode,o.startNode,o.endNode.nextSibling)},$o=(o,e,t)=>{let i=new Map;for(let r=e;r<=t;r++)i.set(o[r],r);return i},To=new WeakMap,Eo=new WeakMap,K=A((o,e,t)=>{let i;return t===void 0?t=e:e!==void 0&&(i=e),r=>{if(!(r instanceof M))throw new Error("repeat can only be used in text bindings");let n=To.get(r)||[],a=Eo.get(r)||[],d=[],c=[],m=[],g=0;for(let y of o)m[g]=i?i(y,g):g,c[g]=t(y,g),g++;let u,w,v=0,b=n.length-1,f=0,k=c.length-1;for(;v<=b&&f<=k;)if(n[v]===null)v++;else if(n[b]===null)b--;else if(a[v]===m[f])d[f]=O(n[v],c[f]),v++,f++;else if(a[b]===m[k])d[k]=O(n[b],c[k]),b--,k--;else if(a[v]===m[k])d[k]=O(n[v],c[k]),Ke(r,n[v],d[k+1]),v++,k--;else if(a[b]===m[f])d[f]=O(n[b],c[f]),Ke(r,n[b],n[v]),b--,f++;else if(u===void 0&&(u=$o(m,f,k),w=$o(a,v,b)),!u.has(a[v]))et(n[v]),v++;else if(!u.has(a[b]))et(n[b]),b--;else{let y=w.get(m[f]),x=y!==void 0?n[y]:null;if(x===null){let S=Do(r,n[v]);O(S,c[f]),d[f]=S}else d[f]=O(x,c[f]),Ke(r,x,n[v]),n[y]=null;f++}for(;f<=k;){let y=Do(r,d[k+1]);O(y,c[f]),d[f++]=y}for(;v<=b;){let y=n[v++];y!==null&&et(y)}To.set(r,d),Eo.set(r,m)}});var zo=l`data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjEwIiB2aWV3Qm94PSIwIDAgMTMgMTAiIHdpZHRoPSIxMyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtNC4zMzMzMzMzMyAxMC00LjMzMzMzMzMzLTQuMTY2NjY2NjcgMS43MzMzMzMzMy0xLjY2NjY2NjY2IDIuNiAyLjUgNi45MzMzMzMzNy02LjY2NjY2NjY3IDEuNzMzMzMzMyAxLjY2NjY2NjY3eiIgZmlsbD0iI2ZmZiIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+`;var _o=l`
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

header p {
  padding: 0;
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
  font-style: italic;
}

ul {
  padding: 1rem 2rem 0 0;
  list-style: none;
  margin-top: 0;
}

[type="checkbox"] {
  display: none;
}

label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 1.4rem;
  font-weight: bold;
  line-height: 150%;
  vertical-align: middle;
}

.icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-left: .7rem;
  border: 1px solid var(--primaryTextColor);
  border-radius: 2px;
  background: var(--activeButtonBg) 50% 50% no-repeat;
}
:checked + .icon {
  background-image: url('${zo}');
}

.range {
  display: none;
  padding-top: .5rem;
}
.range.visible {
  display: flex;
}

.range p {
  margin-left: 1rem;
}

h4 {
  padding: 1rem 0;
  margin: 0;
  font-size: 1.4rem;
}

button {
  -webkit-appearance: none;
  appearance: none;
  border: none;
  border-radius: 0;
  background: transparent;
  outline: none;
  cursor: pointer;
  --iconFillColor: var(--primaryTextColor);
  --iconStrokeColor: var(--primaryTextColor);
  height: 4rem;
  width: 4rem;
}

button * {
  display: inline-block;
}
`;var Ao=class extends h{static get styles(){return l`
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
    `}render(){return fe}};customElements.define("ia-icon-magnify-minus",Ao);var Po=class extends h{static get styles(){return l`
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
    `}render(){return ge}};customElements.define("ia-icon-magnify-plus",Po);var tt=o=>`visualAdjustment${o}`,ot={optionChange:tt("OptionChanged"),zoomIn:tt("ZoomIn"),zoomOut:tt("ZoomOut")},it=class extends h{static get styles(){return _o}static get properties(){return{activeCount:{type:Number},options:{type:Array},renderHeader:{type:Boolean},showZoomControls:{type:Boolean}}}constructor(){super();this.activeCount=0,this.options=[],this.renderHeader=!1,this.showZoomControls=!0}firstUpdated(){this.activeCount=this.activeOptions.length,this.emitOptionChangedEvent()}get activeOptions(){return this.options.reduce((e,t)=>t.active?[...e,t.id]:e,[])}prepareEventDetails(e=""){return{options:this.options,activeCount:this.activeCount,changedOptionId:e}}emitOptionChangedEvent(e=""){let t=this.prepareEventDetails(e);this.dispatchEvent(new CustomEvent(ot.optionChange,{bubbles:!0,composed:!0,detail:t}))}emitZoomIn(){this.dispatchEvent(new CustomEvent(ot.zoomIn))}emitZoomOut(){this.dispatchEvent(new CustomEvent(ot.zoomOut))}changeActiveStateFor(e){let t=[...this.options],i=t.find(r=>r.id===e);i.active=!i.active,this.options=t,this.activeCount=this.activeOptions.length,this.emitOptionChangedEvent(i.id)}setRangeValue(e,t){let i=[...this.options];i.find(r=>r.id===e).value=t,this.options=[...i]}rangeSlider(e){return s`
      <div class=${`range${e.active?" visible":""}`}>
        <input
          type="range"
          name="${e.id}_range"
          min=${e.min||0}
          max=${e.max||100}
          step=${e.step||1}
          .value=${e.value}
          @input=${t=>this.setRangeValue(e.id,t.target.value)}
          @change=${()=>this.emitOptionChangedEvent()}
        />
        <p>${e.value}%</p>
      </div>
    `}adjustmentCheckbox(e){let t=`adjustment_${e.id}`;return s`<li>
      <label for="${t}">
        <span class="name">${e.name}</span>
        <input
          type="checkbox"
          name="${t}"
          id="${t}"
          @change=${()=>this.changeActiveStateFor(e.id)}
          ?checked=${e.active}
        />
        <span class="icon"></span>
      </label>
      ${e.value!==void 0?this.rangeSlider(e):p}
    </li>`}get headerSection(){let e=this.activeCount?s`<p>(${this.activeCount} active)</p>`:p,t=s`<header>
      <h3>Visual adjustments</h3>
      ${e}
    </header>`;return this.renderHeader?t:p}get zoomControls(){return s`
      <h4>Zoom</h4>
      <button class="zoom_out" @click=${this.emitZoomOut} title="zoom out">
        <ia-icon-magnify-minus></ia-icon-magnify-minus>
      </button>
      <button class="zoom_in" @click=${this.emitZoomIn} title="zoom in">
        <ia-icon-magnify-plus></ia-icon-magnify-plus>
      </button>
    `}render(){return s`
      ${this.headerSection}
      <ul>
        ${K(this.options,e=>e.id,this.adjustmentCheckbox.bind(this))}
      </ul>
      ${this.showZoomControls?this.zoomControls:p}
    `}};customElements.define("ia-book-visual-adjustments",it);var Ui=[{id:"brightness",name:"Adjust brightness",active:!1,min:0,max:150,step:1,value:100},{id:"contrast",name:"Adjust contrast",active:!1,min:0,max:150,step:1,value:100},{id:"invert",name:"Inverted colors (dark mode)",active:!1},{id:"grayscale",name:"Grayscale",active:!1}],jo=class{constructor(o){let{onOptionChange:e=()=>{},bookContainerSelector:t,bookreader:i}=o;this.onOptionChange=e,this.bookContainerSelector=t,this.bookreader=i,this.onAdjustmentChange=this.onAdjustmentChange.bind(this),this.optionUpdateComplete=this.optionUpdateComplete.bind(this),this.updateOptionsCount=this.updateOptionsCount.bind(this),this.onZoomIn=this.onZoomIn.bind(this),this.onZoomOut=this.onZoomOut.bind(this),this.activeCount=0,this.icon=s`<ia-icon icon="visualAdjustment" style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon>`,this.label="Visual Adjustments",this.menuDetails=this.updateOptionsCount(),this.id="adjustment",this.component=s`
      <ia-book-visual-adjustments
        .options=${Ui}
        @visualAdjustmentOptionChanged=${this.onAdjustmentChange}
        @visualAdjustmentZoomIn=${this.onZoomIn}
        @visualAdjustmentZoomOut=${this.onZoomOut}
      ></ia-book-visual-adjustments>
    `}onZoomIn(){this.bookreader.zoom(1)}onZoomOut(){this.bookreader.zoom()}onAdjustmentChange(o){let{detail:e}=o,t={brightness:r=>`brightness(${r}%)`,contrast:r=>`contrast(${r}%)`,grayscale:()=>"grayscale(100%)",invert:()=>"invert(100%)"},i=e.options.reduce((r,n)=>{let a=`${n.active?t[n.id](n.value):""}`;return a?[...r,a]:r},[]).join(" ");document.querySelector(this.bookContainerSelector).style.setProperty("filter",i),this.optionUpdateComplete(o)}optionUpdateComplete(o){this.activeCount=o.detail.activeCount,this.updateOptionsCount(o),this.onOptionChange(o)}updateOptionsCount(){this.menuDetails=`(${this.activeCount} active)`}},No=jo;var Ro=class{constructor(e){this.classes=new Set,this.changed=!1,this.element=e;let t=(e.getAttribute("class")||"").split(/\s+/);for(let i of t)this.classes.add(i)}add(e){this.classes.add(e),this.changed=!0}remove(e){this.classes.delete(e),this.changed=!0}commit(){if(this.changed){let e="";this.classes.forEach(t=>e+=t+" "),this.element.setAttribute("class",e)}}},Oo=new WeakMap,Ho=A(o=>e=>{if(!(e instanceof q)||e instanceof Q||e.committer.name!=="class"||e.committer.parts.length>1)throw new Error("The `classMap` directive must be used in the `class` attribute and must be the only part in the attribute.");let{committer:t}=e,{element:i}=t,r=Oo.get(e);r===void 0&&(i.setAttribute("class",t.strings.join(" ")),Oo.set(e,r=new Set));let n=i.classList||new Ro(i);r.forEach(a=>{a in o||(n.remove(a),r.delete(a))});for(let a in o){let d=o[a];d!=r.has(a)&&(d?(n.add(a),r.add(a)):(n.remove(a),r.delete(a)))}typeof n.commit=="function"&&n.commit()});var Fo=class extends h{static get styles(){return l`
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
    `}render(){return pe}};customElements.define("ia-icon-link",Fo);var Vo=l`
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
`;var qo=class extends h{static get styles(){return l`
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
    `}render(){return me}};customElements.define("ia-icon-email",qo);var Wo=class{constructor(o){this.promoCopy=" : Free Download, Borrow, and Streaming : Internet Archive",Object.assign(this,o)}get encodedDescription(){return this.encodeString(this.description)}get encodedCreator(){return this.encodeString(this.creator)}get encodedPromoCopy(){return this.encodeString(this.promoCopy)}encodeString(o){return encodeURIComponent(o.replace(/\s/g,"+")).replace(/%2B/g,"+")}},_=Wo;var Zo=class extends _{constructor(o){super(o);this.name="Email",this.icon=s`<ia-icon-email></ia-icon-email>`,this.class="email"}get url(){return`mailto:?body=https://${this.baseHost}/details/${this.identifier}&subject=${this.description} : ${this.creator}${this.promoCopy}`}},Uo=Zo;var Yo=class extends h{static get styles(){return l`
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
    `}render(){return ue}};customElements.define("ia-icon-facebook",Yo);var Go=class{constructor(o){this.name="Facebook",this.icon=s`<ia-icon-facebook></ia-icon-facebook>`,this.class="facebook",Object.assign(this,o)}get url(){return`https://www.facebook.com/sharer/sharer.php?u=https://${this.baseHost}/details/${this.identifier}`}},Jo=Go;var Qo=class extends h{static get styles(){return l`
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
    `}render(){return ve}};customElements.define("ia-icon-pinterest",Qo);var Xo=class extends _{constructor(o){super(o);this.name="Pinterest",this.icon=s`<ia-icon-pinterest></ia-icon-pinterest>`,this.class="pinterest"}get url(){return`http://www.pinterest.com/pin/create/button/?url=https://${this.baseHost}/details/${this.identifier}&description=${this.encodedDescription}+%3A+${this.encodedCreator}${this.encodedPromoCopy}`}},Ko=Xo;var ei=class extends h{static get styles(){return l`
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
    `}render(){return be}};customElements.define("ia-icon-tumblr",ei);var ti=class extends _{constructor(o){super(o);this.name="Tumblr",this.icon=s`<ia-icon-tumblr></ia-icon-tumblr>`,this.class="tumblr"}get url(){return`https://www.tumblr.com/share/video?embed=%3Ciframe+width%3D%22640%22+height%3D%22480%22+frameborder%3D%220%22+allowfullscreen+src%3D%22https%3A%2F%2F${this.baseHost}%2Fembed%2F%22+webkitallowfullscreen%3D%22true%22+mozallowfullscreen%3D%22true%22%26gt%3B%26lt%3B%2Fiframe%3E&name=${this.encodedDescription}+%3A+${this.encodedCreator}${this.encodedPromoCopy}`}},oi=ti;var ii=class extends h{static get styles(){return l`
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
    `}render(){return ke}};customElements.define("ia-icon-twitter",ii);var ri=class extends _{constructor(o){super(o);this.name="Twitter",this.icon=s`<ia-icon-twitter></ia-icon-twitter>`,this.class="twitter"}get url(){return`https://twitter.com/intent/tweet?url=https://${this.baseHost}/details/${this.identifier}&via=internetarchive&text=${this.encodedDescription}+%3A+${this.encodedCreator}${this.encodedPromoCopy}`}},si=ri;var ni=({currentTarget:o})=>{let e=o.querySelector("textarea"),t=o.querySelector("small");e.select(),document.execCommand("copy"),e.blur(),t.classList.add("visible"),clearTimeout(t.timeout),t.timeout=setTimeout(()=>t.classList.remove("visible"),4e3)},Ie=class extends h{static get styles(){return Vo}static get properties(){return{baseHost:{type:String},creator:{type:String},description:{type:String},embedOptionsVisible:{type:Boolean},identifier:{type:String},sharingOptions:{type:Array},type:{type:String},renderHeader:{type:Boolean}}}constructor(){super();this.baseHost="",this.sharingOptions=[]}firstUpdated(){let{baseHost:e,creator:t,description:i,identifier:r,type:n}=this,a={baseHost:e,creator:t,description:i,identifier:r,type:n};this.sharingOptions=[new si(a),new Jo(a),new oi(a),new Ko(a),new Uo(a)]}get sharingItems(){return this.sharingOptions.map(e=>s`<li>
        <a class="${e.class}" href="${e.url}" target="_blank">
          ${e.icon}
          ${e.name}
        </a>
      </li>`)}get embedOption(){return s`<li>
      <a href="#" @click=${this.toggleEmbedOptions}>
        <ia-icon-link></ia-icon-link>
        Get an embeddable link
      </a>
    </li>`}get iframeEmbed(){return s`&lt;iframe src="https://${this.baseHost}/embed/${this.identifier}" width="560" height="384" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen&gt;&lt;/iframe&gt;`}get bbcodeEmbed(){return`[archiveorg ${this.identifier} width=560 height=384 frameborder=0 webkitallowfullscreen=true mozallowfullscreen=true]`}get helpURL(){return`https://${this.baseHost}/help/audio.php?identifier=${this.identifier}`}toggleEmbedOptions(e){e.preventDefault(),this.embedOptionsVisible=!this.embedOptionsVisible}get header(){let e=s`<header><h3>Share this ${this.type}</h3></header>`;return this.renderHeader?e:p}render(){return s`
      ${this.header}
      <ul>
        ${this.sharingItems}
        ${this.embedOption}
        <div class=${Ho({visible:this.embedOptionsVisible,embed:!0})}>
          <h4>Embed</h4>
          <div class="code" @click=${ni}>
            <textarea readonly="readonly">${this.iframeEmbed}</textarea>
            <small>Copied to clipboard</small>
          </div>
          <h4>Embed for wordpress.com hosted blogs and archive.org item &lt;description&gt; tags</h4>
          <div class="code" @click=${ni}>
            <textarea readonly="readonly">${this.bbcodeEmbed}</textarea>
            <small>Copied to clipboard</small>
          </div>
          <p>Want more? <a href=${this.helpURL}>Advanced embedding details, examples, and help</a>!</p>
        </div>
      </ul>
    `}};customElements.define("ia-sharing-options",Ie);var ai=class{constructor(o,e,t){this.itemType=t;let i=`Share this ${this.reconcileItemType}`;this.icon=s`<ia-icon icon="share" style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon>`,this.label=i,this.id="share",this.component=s`<ia-sharing-options
      identifier="${o.identifier}"
      type="book"
      creator="${o.creator}"
      description="${o.title}"
      baseHost="${e}"
    ></ia-sharing-options>`}get reconcileItemType(){return this.itemType==="bookreader"?"book":"item"}},li=ai;var Me=class extends h{static get styles(){return l`
      button {
        -webkit-appearance: none;
        appearance: none;
        outline: 0;
        border: none;
        padding: 0;
        height: 4rem;
        width: 4rem;
        background: transparent;
        cursor: url('/images/bookreader/bookmark-add.png'), pointer;
        position: relative;
      }
      button > * {
        display: block;
        position: absolute;
        top: 0.2rem;
      }
      button.left > * {
        left: 0.2rem;
      }

      button.right > * {
        right: 0.2rem;
      }
    `}static get properties(){return{side:{type:String},state:{type:String}}}constructor(){super();this.state="hollow"}handleClick(e){e.preventDefault(),this.dispatchEvent(new CustomEvent("bookmarkButtonClicked"))}get title(){return`${this.state==="hollow"?"Add":"Remove"} bookmark`}render(){let e=this.side||"right";return s`
      <button title=${this.title} @click=${this.handleClick} class=${e}>
        <icon-bookmark state=${this.state}></icon-bookmark>
      </button>
    `}},O0=Me;customElements.define("bookmark-button",Me);var Le=class extends h{static get styles(){return l`
      div {
        display: flex;
        justify-content: center;
        padding-top: 2rem;
      }

      button {
        appearance: none;
        padding: 0.5rem 1rem;
        margin: 0 .5rem;
        box-sizing: border-box;
        font: 1.3rem "Helvetica Neue", Helvetica, Arial, sans-serif;
        color: var(--primaryTextColor);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        background: var(--saveButtonColor);
      }

      .delete {
        background: var(--deleteButtonColor);
      }
    `}static get properties(){return{cancelAction:{type:Function},deleteAction:{type:Function},pageID:{type:String}}}render(){return s`
      <div>
        <button class="delete" @click=${()=>this.deleteAction({detail:{id:`${this.pageID}`}})}>Delete</button>
        <button @click=${()=>this.cancelAction()}>Cancel</button>
      </div>
    `}},V0=Le;customElements.define("delete-modal-actions",Le);var di=l`
  .ia-button {
    min-height: 3rem;
    border: none;
    outline: none;
    cursor: pointer;
    color: #fff;
    line-height: normal;
    border-radius: .4rem;
    text-align: center;
    vertical-align: middle;
    font-size: 1.4rem;
    display: inline-block;
    padding: .6rem 1.2rem;
    border: 1px solid transparent;

    white-space: nowrap;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -o-user-select: none;
    user-select: none;
  }

  .ia-button:disabled,
  .ia-button.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .ia-button.transparent {
    background-color: transparent;
  }
  
  .ia-button.slim {
    padding: 0;
  }

  .ia-button.primary {
    background-color: #194880;
    border-color: #c5d1df;
  }

  .ia-button.cancel {
    background-color: #e51c26;
    border-color: #f8c6c8;
  }
`;var Yi={endpoint:"/services/bookmarks.php",headers:{"Content-Type":"application/json"},delete(o){return fetch(`${this.endpoint}?identifier=${this.identifier}&page_num=${o}`,{credentials:"same-origin",method:"DELETE",headers:this.headers})},get(o){return fetch(`${this.endpoint}?identifier=${this.identifier}&page_num=${o}`,{credentials:"same-origin",method:"GET",headers:this.headers})},getAll(){return fetch(`${this.endpoint}?identifier=${this.identifier}`,{credentials:"same-origin",method:"GET",headers:this.headers})},post(o){return this.sendBookmarkData(o,"POST")},put(o){return this.sendBookmarkData(o,"POST")},sendBookmarkData(o,e){let t={note:o.note,color:o.color};return fetch(`${this.endpoint}?identifier=${this.identifier}&page_num=${o.id}`,{credentials:"same-origin",method:e,headers:this.headers,body:JSON.stringify({notes:t})})}},De=class extends h{static get properties(){return{activeBookmarkID:{type:String},bookmarks:{type:Array},bookreader:{type:Object},editedBookmark:{type:Object}}}static get styles(){let e=l`
      .bookmarks {
        height: 100%;
        overflow: hidden;
        padding-bottom: 20px;
      }

      .list ia-bookmark-edit {
        display: none;
      }

      .edit ia-bookmarks-list {
        display: none;
      }
      
    `;return[di,e]}static formatPage(e){return isNaN(+e)?`(${e.replace(/\D/g,"")})`:e}constructor(){super();this.bookmarks=[],this.bookreader={},this.editedBookmark={},this.bookmarkColors=[{id:0,className:"red"},{id:1,className:"blue"},{id:2,className:"green"}],this.defaultColor=this.bookmarkColors[0],this.api=Yi}updated(e){this.emitBookmarksChanged()}setup(){this.api.identifier=this.bookreader.bookId,this.fetchBookmarks().then(()=>this.initializeBookmarks())}initializeBookmarks(){["3PageViewSelected"].forEach(e=>{window.addEventListener(`BookReader:${e}`,t=>{setTimeout(()=>{this.renderBookmarkButtons()},100)})}),["pageChanged","1PageViewSelected","2PageViewSelected"].forEach(e=>{window.addEventListener(`BookReader:${e}`,t=>{setTimeout(()=>{this.renderBookmarkButtons(),this.markActiveBookmark()},100)})}),["zoomOut","zoomIn","resize"].forEach(e=>{window.addEventListener(`BookReader:${e}`,()=>{this.bookreader.mode===this.bookreader.constModeThumb&&this.renderBookmarkButtons()})}),this.renderBookmarkButtons(),this.markActiveBookmark(!0),this.emitBookmarksChanged()}formatBookmark({leafNum:e="",notes:t={}}){let{note:i="",color:r}=t,n={note:i,color:this.getBookmarkColor(r)?r:this.defaultColor.id},a=De.formatPage(this.bookreader.getPageNum(e)),d=this.bookreader.getPageURI(`${e}`.replace(/\D/g,""),32);return{...n,id:e,leafNum:e,page:a,thumbnail:d}}fetchBookmarks(){return this.api.getAll().then(e=>e.json()).then(({success:e,error:t="Something happened while fetching bookmarks.",value:i=[]})=>{if(!e)throw new Error(`Failed to load bookmarks: ${t}`);let r={};return Object.keys(i).forEach(n=>{let a=i[n],d=parseInt(n,10),c=this.formatBookmark({...a,leafNum:d});r[n]=c}),this.bookmarks=r,r})}emitBookmarksChanged(){this.dispatchEvent(new CustomEvent("bookmarksChanged",{bubbles:!0,composed:!0,detail:{bookmarks:this.bookmarks}}))}emitBookmarkButtonClicked(){this.dispatchEvent(new CustomEvent("bookmarkButtonClicked",{bubbles:!0,composed:!0,detail:{editedBookmark:this.editedBookmark}}))}bookmarkButtonClicked(e){this.getBookmark(e)?this.confirmDeletion(e):this.createBookmark(e)}renderBookmarkButtons(){this.bookreader.$(".BRpagecontainer").not(".BRemptypage").get().forEach(t=>{let i=t.querySelector(".bookmark-button");i&&i.remove();let r=+t.classList.value.match(/pagediv\d+/)[0].replace(/\D/g,""),n=this.getBookmark(r),a=n?"filled":"hollow",d=this.bookreader._models.book.getPage(r),{isViewable:c}=d;if(!c)return;let m=document.createElement("div");["mousedown","mouseup"].forEach(u=>{m.addEventListener(u,w=>w.stopPropagation())}),m.classList.add("bookmark-button",a),n&&m.classList.add(this.getBookmarkColor(n.color));let g=t.getAttribute("data-side")==="L"&&this.bookreader.mode===this.bookreader.constMode2up?"left":"right";X(s`
        <bookmark-button
          @bookmarkButtonClicked=${()=>this.bookmarkButtonClicked(r)}
          state=${a}
          side=${g}
        ></bookmark-button>`,m),t.appendChild(m)})}markActiveBookmark(e=!1){let{mode:t,constMode2up:i,constModeThumb:r}=this.bookreader,n=this.bookreader.currentIndex();if(t===r){let a=this.bookmarks[n];e&&a&&(this.activeBookmarkID=n);return}if(!(t===i&&this.bookreader.displayedIndices.includes(+this.activeBookmarkID))){if(this.bookmarks[n]){this.activeBookmarkID=n;return}this.activeBookmarkID=""}}bookmarkEdited({detail:e}){let t=e.bookmark.id===this.editedBookmark.id;this.editedBookmark=t?{}:e.bookmark}getBookmark(e){return this.bookmarks[e]}getBookmarkColor(e){return this.bookmarkColors.find(t=>t.id===e)?.className}addBookmark(){let e=this.bookreader.currentIndex();if(this.bookreader.mode===this.bookreader.constMode2up){let t=this.bookreader.displayedIndices;e=t[t.length-1]}this.createBookmark(e)}createBookmark(e){let t=this.getBookmark(e);if(t){this.bookmarkEdited({detail:{bookmark:t}}),this.emitBookmarkButtonClicked();return}this.editedBookmark=this.formatBookmark({leafNum:e}),this.api.post(this.editedBookmark),this.bookmarks[e]=this.editedBookmark,this.activeBookmarkID=e,this.disableAddBookmarkButton=!0,this.renderBookmarkButtons(),this.emitBookmarkButtonClicked()}bookmarkSelected({detail:e}){let{leafNum:t}=e.bookmark;this.bookreader.jumpToPage(`${this.bookreader.getPageNum(`${t}`.replace(/\D/g,""))}`),this.activeBookmarkID=t}saveBookmark({detail:e}){let t=this.bookmarks[e.bookmark.id];Object.assign(t,e.bookmark),this.api.put(t),this.editedBookmark={},this.renderBookmarkButtons()}confirmDeletion(e){if(this.getBookmark(e).note){this.emitShowModal(e);return}this.deleteBookmark({detail:{id:`${e}`}})}emitShowModal(e){this.dispatchEvent(new CustomEvent("showItemNavigatorModal",{bubbles:!0,composed:!0,detail:{customModalContent:s`
          <delete-modal-actions
            .deleteAction=${()=>this.deleteBookmark({detail:{id:`${e}`}})}
            .cancelAction=${()=>this.emitCloseModal()}
            .pageID=${e}
          ></delete-modal-actions>
        `}}))}emitCloseModal(){this.dispatchEvent(new CustomEvent("closeItemNavigatorModal",{bubbles:!0,composed:!0}))}deleteBookmark({detail:e}){let{id:t}=e,i=this.bookmarks;delete i[t],this.bookmarks={...i},this.api.delete(e.id),this.editedBookmark={},this.emitCloseModal(),this.renderBookmarkButtons()}get shouldEnableAddBookmarkButton(){let e=this.bookreader.mode===this.bookreader.constMode2up?this.bookreader.displayedIndices[this.bookreader.displayedIndices.length-1]:this.bookreader.currentIndex();return!!this.getBookmark(e)}get allowAddingBookmark(){return this.bookreader.mode!==this.bookreader.constModeThumb}render(){let e=this.shouldEnableAddBookmarkButton,t=s`
      <button
        class="ia-button primary"
        ?disabled=${e}
        @click=${this.addBookmark}
      >Add bookmark</button>
    `;return s`
      <section class="bookmarks">
        <ia-bookmarks-list
          @bookmarkEdited=${this.bookmarkEdited}
          @bookmarkSelected=${this.bookmarkSelected}
          @saveBookmark=${this.saveBookmark}
          @deleteBookmark=${this.deleteBookmark}

          .editedBookmark=${this.editedBookmark}
          .bookmarks=${{...this.bookmarks}}
          .activeBookmarkID=${this.activeBookmarkID}

          .bookmarkColors=${this.bookmarkColors}
          .defaultBookmarkColor=${this.defaultColor}
        ></ia-bookmarks-list>
        ${this.allowAddingBookmark?t:p}
      </section
    `}};customElements.define("ia-bookmarks",De);var Gi=l`
:host {
  display: block;
  padding: 0 1rem 2rem 1rem;
  color: var(--primaryTextColor);
}

small {
  font-style: italic;
}

.bookmark {
  display: grid;
  grid-template-columns: var(--bookmarkThumbWidth) 1fr;
  grid-gap: 0 1rem;
  align-items: center;
}

img {
  display: block;
  width: var(--bookmarkThumbWidth);
  min-height: calc(var(--bookmarkThumbWidth) * 1.55);
  background: var(--loadingPagePlaceholder);
}

h4 {
  margin: 0;
  font-size: 1.4rem;
}

fieldset {
  padding: 2rem 0 0 0;
  border: none;
}

label {
  display: block;
  font-weight: bold;
}

p {
  padding: 0;
  margin: .5rem 0;
  font-size: 1.2rem;
  line-height: 120%;
}

textarea {
  width: 100%;
  margin-bottom: 2rem;
  box-sizing: border-box;
  font: normal 1.4rem "Helvetica Neue", Helvetica, Arial, sans-serif;
  resize: vertical;
}

ul {
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-gap: 0 2rem;
  justify-content: start;
  padding: 1rem 0 0 0;
  margin: 0 0 2rem 0;
  list-style: none;
}

li input {
  display: none;
}

li label {
  display: block;
  min-width: 50px;
  padding-top: .4rem;
  text-align: center;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
}

li input:checked + label {
  border-color: #fff;
}

input[type="submit"] {
  background: var(--saveButtonColor);
}

button {
  background: var(--deleteButtonColor);
}

.button {
  -webkit-appearance: none;
  appearance: none;
  padding: .5rem 1rem;
  box-sizing: border-box;
  font: normal 1.3rem "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: var(--primaryTextColor);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.actions {
  display: grid;
  grid-template-columns: auto auto;
  grid-gap: 0 1rem;
  justify-items: stretch;
}

.blue {
  --iconFillColor: var(--blueBookmarkColor);
}

.red {
  --iconFillColor: var(--redBookmarkColor);
}

.green {
  --iconFillColor: var(--greenBookmarkColor);
}
`;var ci=l`
:host {
  display: block;
  overflow-y: auto;
  box-sizing: border-box;
  color: var(--primaryTextColor);
  background: var(--activeButtonBg);
  margin-bottom: 2rem;
}

small {
  font-style: italic;
}

h4 {
  margin: 0;
  font-size: 1.4rem;
}
h4 * {
  display: inline-block;
}
h4 icon-bookmark {
  vertical-align: bottom;
}
h4 span {
  vertical-align: top;
  padding-top: 1%;
}

p {
  padding: 0;
  margin: .5rem 0 0 0;
  width: 98%;
  overflow-wrap: break-word;
}

img {
  display: block;
  width: var(--bookmarkThumbWidth);
  min-height: calc(var(--bookmarkThumbWidth) * 1.55);
  background: var(--loadingPagePlaceholder);
}

ul {
  margin: var(--activeBorderWidth) 0.5rem 1rem 0;
  padding: 0;
  list-style: none;
}

li {
  cursor: pointer;
  outline: none;
  position: relative;
}
li .content {
  border: var(--activeBorderWidth) solid transparent;
  padding: .2rem 0 .4rem .2rem;
}
li .content.active {
  border: var(--activeBorderWidth) solid var(--activeBookmark);
}
li button.edit {
  padding: .5rem .2rem 0 0;
  background: transparent;
  cursor: pointer;
  height: 4rem;
  width: 4rem;
  position: absolute;
  right: 0.2rem;
  top: 0.2rem;
  text-align: right;
}
li button.edit > * {
  width: var(--iconWidth, 20px);
  height: var(--iconHeight, 20px);
  display: block;
  height: 100%;
  width: 100%;
}

icon-bookmark {
  width: var(--bookmarkIconWidth, 16px);
  height: var(--bookmarkIconHeight, 24px);
}
icon-bookmark.blue {
  --iconFillColor: var(--blueBookmarkColor, #0023f5);
}
icon-bookmark.red {
  --iconFillColor: var(--redBookmarkColor, #eb3223);
}
icon-bookmark.green {
  --iconFillColor: var(--greenBookmarkColor, #75ef4c);
}

button {
  -webkit-appearance: none;
  appearance: none;
  outline: none;
  background: transparent;
  padding: .5rem 1rem;
  box-sizing: border-box;
  font: normal 1.3rem "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: var(--primaryTextColor);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button.add-bookmark:disabled {
  opacity: .5;
}

button.add-bookmark {
  background: var(--createButtonColor);
  height: 3rem;
  border: 1px solid var(--createButtonBorderColor);
  margin-left: 0.5rem;
}

ia-bookmark-edit {
  --saveButtonColor: #538bc5;
  --deleteButtonColor: #d33630;
  margin: .5rem .5rem .3rem .6rem;
}

ul > li:first-child .separator {
  display: none;
}
.separator {
  width: 98%;
  margin: .1rem auto;
  background-color: var(--bookmarkListSeparatorColor);
  height: 0.1rem;
}
`;var rt=class extends h{static get styles(){return ci}static get properties(){return{activeBookmarkID:{type:Number},bookmarkColors:{type:Array},defaultBookmarkColor:{type:Object},bookmarks:{type:Array},editedBookmark:{type:Object},renderAddBookmarkButton:{type:Boolean},disableAddBookmarkButton:{type:Boolean},renderHeader:{type:Boolean}}}constructor(){super();this.activeBookmarkID=void 0,this.bookmarkColors=[],this.defaultBookmarkColor={},this.bookmarks=[],this.editedBookmark={},this.renderAddBookmarkButton=!0,this.disableAddBookmarkButton=!1,this.renderHeader=!1}emitEditEvent(e,t){this.dispatchEvent(new CustomEvent("bookmarkEdited",{detail:{bookmark:t}}))}emitSelectedEvent(e){this.activeBookmarkID=e.id,this.dispatchEvent(new CustomEvent("bookmarkSelected",{detail:{bookmark:e}}))}emitSaveBookmark(e){this.dispatchEvent(new CustomEvent("saveBookmark",{detail:{bookmark:e}}))}emitDeleteBookmark(e){this.dispatchEvent(new CustomEvent("deleteBookmark",{detail:{id:e}}))}emitBookmarkColorChanged({detail:e}){let{bookmarkId:t,colorId:i}=e;this.dispatchEvent(new CustomEvent("bookmarkColorChanged",{detail:{bookmarkId:t,colorId:i}}))}emitAddBookmark(){this.dispatchEvent(new CustomEvent("addBookmark"))}editBookmark(e,t){this.emitEditEvent(e,t),this.editedBookmark=this.editedBookmark===t?{}:t}saveBookmark({detail:e}){let{bookmark:t}=e;this.editedBookmark={},this.emitSaveBookmark(t)}deleteBookmark({detail:e}){let{id:t}=e;this.editedBookmark={},this.emitDeleteBookmark(t)}bookmarkColorInfo(e=0){return this.bookmarkColors.find(t=>t?.id===e)}bookmarkItem(e){let t=this.editedBookmark.id===e.id,{className:i}=this.bookmarkColorInfo(e.color),r=e.id===this.activeBookmarkID?"active":"";return s`
      <li
        @click=${()=>this.emitSelectedEvent(e)}
        tabindex="0"
      >
        <div class="separator"></div>
        <div class="content ${r}">
          <button
            class="edit"
            @click=${n=>this.editBookmark(n,e)}
            title="Edit this bookmark"
          >
            <ia-icon-edit-pencil></ia-icon-edit-pencil>
          </button>
          <h4>
            <icon-bookmark class=${i}></icon-bookmark>
            <span> Page ${e.page}</span>
          </h4>
          ${!t&&e.note?s`<p>${e.note}</p>`:p}
          ${t?this.editBookmarkComponent:p}
        </div>
      </li>
    `}get editBookmarkComponent(){let e=!1;return s`
      <ia-bookmark-edit
        .bookmark=${this.editedBookmark}
        .bookmarkColors=${this.bookmarkColors}
        .defaultBookmarkColor=${this.defaultBookmarkColor}
        .showBookmark=${e}
        @saveBookmark=${this.saveBookmark}
        @deleteBookmark=${this.deleteBookmark}
        @bookmarkColorChanged=${this.emitBookmarkColorChanged}
      ></ia-bookmark-edit>
    `}get bookmarksCount(){let e=this.bookmarks.length;return s`<small>(${e})</small>`}get headerSection(){return s`<header>
      <h3>
        Bookmarks
        ${this.bookmarks.length?this.bookmarksCount:p}
      </h3>
    </header>`}get addBookmarkButton(){return s`<button class="add-bookmark" @click=${this.emitAddBookmark}>Add bookmark</button>`}get addBookmarkDisabledButton(){return s`<button disabled="disabled" class="add-bookmark" @click=${this.emitAddBookmark}>Add bookmark</button>`}render(){let e=this.disableAddBookmarkButton?this.addBookmarkDisabledButton:this.addBookmarkButton;return s`
      ${this.renderHeader?this.headerSection:p}
      <ul>
        ${this.bookmarks.length?K(this.bookmarks,t=>t.id,this.bookmarkItem.bind(this)):p}
        <div class="separator"></div>
      </ul>
      ${this.renderAddBookmarkButton?e:p}
    `}};var $e=class extends h{static get styles(){return l`
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
    `}static get properties(){return{state:{type:String}}}render(){return s`
      <div class=${this.state}>
        <svg height="24" viewBox="0 0 16 24" width="16" xmlns="http://www.w3.org/2000/svg" aria-labelledby="bookmarkTitleID bookmarDescID"><title id="bookmarkTitleID">Bookmark icon</title><desc id="bookmarkDescID">An outline of the shape of a bookmark</desc><path id="filled" d="m1 0h14c.5522847 0 1 .44771525 1 1v23l-8-5.4545455-8 5.4545455v-23c0-.55228475.44771525-1 1-1z" class="fill-color" fill-rule="evenodd"/><g class="fill-color" fill-rule="evenodd"><path id="hollow" d="m15 0c.5522847 0 1 .44771525 1 1v23l-8-5.4545455-8 5.4545455v-23c0-.55228475.44771525-1 1-1zm-2 2h-10c-.51283584 0-.93550716.38604019-.99327227.88337887l-.00672773.11662113v18l6-4.3181818 6 4.3181818v-18c0-.51283584-.3860402-.93550716-.8833789-.99327227z"/><path id="plus" d="m8.75 6v2.25h2.25v1.5h-2.25v2.25h-1.5v-2.25h-2.25v-1.5h2.25v-2.25z" fill-rule="nonzero"/><path id="minus" d="m11 8.25v1.5h-6v-1.5z" fill-rule="nonzero"/></g></svg>
      </div>
    `}};customElements.define("ia-bookmarks-list",rt);customElements.define("icon-bookmark",$e);var st=class{constructor(e,t){Object.assign(this,e),this.component=document.createElement("ia-bookmarks"),this.component.bookreader=t,this.bindEvents(),this.component.setup(),this.icon=s`<icon-bookmark state="hollow" style="--iconWidth: 16px; --iconHeight: 24px;"></icon-bookmark>`,this.label="Bookmarks",this.id="bookmarks",this.updateMenu(this.component.bookmarks.length)}updateMenu(e){this.menuDetails=`(${e})`}bindEvents(){this.component.addEventListener("bookmarksChanged",this.bookmarksChanged.bind(this)),this.component.addEventListener("showItemNavigatorModal",this.showItemNavigatorModal),this.component.addEventListener("closeItemNavigatorModal",this.closeItemNavigatorModal)}bookmarksChanged({detail:e}){let t=Object.keys(e.bookmarks).length;this.updateMenu(t),this.onBookmarksChanged(e.bookmarks)}},hi=st;var nt=class{constructor(e,t=250,i=void 0){this.callback=e,this.threshhold=t,this.context=i,this.deferTimeout=void 0}execute(){clearTimeout(this.deferTimeout),this.deferTimeout=setTimeout(this.executeCallback.bind(this),this.threshhold)}executeCallback(){this.callback.apply(this.context)}};var at=class{constructor(){this.debounceTime=250,this.setup=this.setup.bind(this),this.teardown=this.teardown.bind(this),this.resizeBookReaderContainer=this.resizeBookReaderContainer.bind(this),this.handleResizeEvent=this.handleResizeEvent.bind(this),this.handleBookReaderHeight=new nt(this.resizeBookReaderContainer,this.debounceTime,this)}setup(){this.resizeBookReaderContainer(),window.addEventListener("resize",this.handleResizeEvent)}teardown(){document.querySelector("#BookReader").setAttribute("style",""),window.removeEventListener("resize",this.handleResizeEvent)}handleResizeEvent(){this.handleBookReaderHeight.execute()}resizeBookReaderContainer(){let e=document.querySelector(".BookReaderMessage"),t=document.querySelector("#BookReader"),i=e?.offsetHeight??0,n=`${window.innerHeight-i}px`;t.style.height=n}},mi=at;var lt=class{constructor(){this.metadata={},this.isRestricted=null}setMetadata(e){this.metadata=e}setRestriction(e){this.isRestricted=e}};var ui=s`
  <svg
    height="100"
    viewBox="0 0 100 100"
    width="100"
    xmlns="http://www.w3.org/2000/svg"
    aria-labelledby="bookreader-loading"
  >
    <title id="bookreader-loading">Currenlty loading viewer.</title>
    <desc>Please wait while we load book reader.</desc>
    <g fill="#333" fill-rule="evenodd" class="book-icon">
      <g transform="matrix(1 0 0 -1 28 67.362264)">
        <path d="m44.71698 31.6981124v-29.99320678s-18.0956599.30735848-18.6322637-.7171698c-.0633962-.12226414-1.890566-.59207545-2.9745282-.59207545-1.3228302 0-3.5122641 0-4.1286791.74547168-.9707547 1.17452827-18.82811278.71660375-18.82811278.71660375v30.040754l1.83849052.7867924.29094339-28.48188608s15.94981097.15339622 17.09094297-1.10716978c.8145283-.90056602 4.997547-.91641507 5.3450942-.3526415.9611321 1.55716977 14.7101883 1.31716978 17.6077354 1.45981128l.3266038 28.22830118z"/>
        <path d="m40.1129424 33.5957539h-12.8337733c-1.8690565 0-3.1098112-.7545283-3.9299999-1.6279245v-26.70452764l1.2362264-.00792453c.4584906.72962262 3.0922641 1.39415091 3.0922641 1.39415091h10.1298111s1.0381131.01754717 1.5141509.47377357c.5643396.54056602.7913207 1.36981129.7913207 1.36981129z"/>
        <path d="m17.3354713 33.5957539h-12.8337733v-25.37660316s0-.75283017.49358489-1.14113205c.52867924-.41433961 1.3415094-.42849055 1.3415094-.42849055h10.59905631s2.2075471-.52698112 3.0928301-1.39415091l1.2.00792453v26.74245214c-.8201886.8581132-2.0530188 1.59-3.8932074 1.59"/>
      </g>
      <path
        class="ring"
        d="m17.8618849 11.6970233c18.5864635-15.59603144 45.6875867-15.59603102 64.2740497.000001 1.9271446 1.6170806 2.1785128 4.4902567.5614466 6.4174186-1.6170661 1.9271618-4.4902166 2.1785323-6.4173612.5614517-15.1996922-12.75416882-37.3625282-12.75416916-52.5622206-.000001-15.19969387 12.7541707-19.04823077 34.5805019-9.1273354 51.7641499 9.9208955 17.183646 30.7471499 24.7638499 49.3923323 17.9774983 18.6451823-6.7863521 29.7266014-25.9801026 26.2811129-45.5206248-.436848-2.4775114 1.2174186-4.8400696 3.6949079-5.2769215 2.4774893-.4368518 4.8400264 1.2174296 5.2768744 3.694941 4.2132065 23.8945096-9.3373563 47.3649806-32.137028 55.6634567-22.799672 8.2984758-48.2663986-.9707372-60.39785211-21.9832155-12.1314534-21.012481-7.42539173-47.7021198 11.16107351-63.2981544z"
        fill-rule="nonzero"
      />
    </g>
  </svg>
`;var pi=l`
  #book-navigator.loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 30vh;
  }

  #book-navigator .book-loader {
    width: 30%;
    margin: auto;
    text-align: center;
    color: var(--primaryTextColor);
  }

  .book-loader svg {
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
  }

  @keyframes rotate {
    0% {
      transform: rotate(-360deg);
    }
  }
`;var dt={menuUpdated:"menuUpdated",updateSideMenu:"updateSideMenu",ViewportInFullScreen:"ViewportInFullScreen"},fi=class extends h{static get styles(){return pi}static get properties(){return{book:{type:Object},mainBRSelector:{type:String},pageContainerSelector:{type:String},brWidth:{type:Number},bookReaderLoaded:{type:Boolean},bookreader:{type:Object},downloadableTypes:{type:Array},isAdmin:{type:Boolean},lendingInitialized:{type:Boolean},lendingStatus:{type:Object},menuProviders:{type:Object},menuShortcuts:{type:Array},sideMenuOpen:{type:Boolean},signedIn:{type:Boolean}}}constructor(){super();this.book={},this.mainBRSelector="#BookReader",this.pageContainerSelector=".BRcontainer",this.brWidth=0,this.bookReaderCannotLoad=!1,this.bookReaderLoaded=!1,this.bookreader=null,this.downloadableTypes=[],this.isAdmin=!1,this.lendingInitialized=!1,this.lendingStatus={},this.menuProviders={},this.menuShortcuts=[],this.sideMenuOpen=!1,this.signedIn=!1,this.fullscreenMgr=new mi,this.model=new lt,this.shortcutOrder=["volumes","search","bookmarks"]}firstUpdated(){this.model.setMetadata(this.book),this.bindEventListeners()}initializeBookSubmenus(){this.menuProviders={search:new Bo((e=null)=>{e&&(this.bookreader=e),this.updateMenuContents(),this.brWidth>=640&&this.openSideSearchMenu()},this.bookreader),downloads:new Lo,visualAdjustments:new No({onOptionChange:(e,t=null)=>{t&&(this.bookreader=t),this.updateMenuContents()},bookContainerSelector:this.pageContainerSelector,bookreader:this.bookreader}),share:new li(this.book.metadata,this.baseHost,this.itemType)},this.signedIn&&(this.menuProviders.bookmarks=new hi(this.bookmarksOptions,this.bookreader)),this.addMenuShortcut("search"),this.updateMenuContents()}get mainBRContainer(){return document.querySelector(this.mainBRSelector)}get bookmarksOptions(){return{showItemNavigatorModal:this.showItemNavigatorModal.bind(this),closeItemNavigatorModal:this.closeItemNavigatorModal.bind(this),onBookmarksChanged:e=>{let t=Object.keys(e).length?"add":"remove";this[`${t}MenuShortcut`]("bookmarks"),this.updateMenuContents()}}}openSideSearchMenu(){let e=new CustomEvent(dt.updateSideMenu,{detail:{menuId:"search",action:"open"}});this.dispatchEvent(e)}updateMenuContents(){let{search:e,downloads:t,visualAdjustments:i,share:r,bookmarks:n}=this.menuProviders,a=[e,n,i,r].filter(c=>!!c);this.shouldShowDownloadsMenu()&&(t.update(this.downloadableTypes),a.splice(1,0,t));let d=new CustomEvent(dt.menuUpdated,{detail:a});this.dispatchEvent(d)}shouldShowDownloadsMenu(){if(this.model.isRestricted===!1||this.isAdmin)return!0;let{user_loan_record:e={}}=this.lendingStatus;return Array.isArray(e)?!1:e.type&&e.type!=="SESSION_LOAN"}addMenuShortcut(e){this.menuShortcuts.find(t=>t.id===e)||(this.menuShortcuts.push(this.menuProviders[e]),this.sortMenuShortcuts(),this.emitMenuShortcutsUpdated())}removeMenuShortcut(e){this.menuShortcuts=this.menuShortcuts.filter(t=>t.id!==e),this.emitMenuShortcutsUpdated()}sortMenuShortcuts(){this.menuShortcuts=this.shortcutOrder.reduce((e,t)=>{let i=this.menuShortcuts.find(r=>r.id===t);return i&&e.push(i),e},[])}emitMenuShortcutsUpdated(){let e=new CustomEvent("menuShortcutsUpdated",{detail:this.menuShortcuts});this.dispatchEvent(e)}bindEventListeners(){window.addEventListener("BookReader:PostInit",e=>{this.bookreader=e.detail.props,this.bookReaderLoaded=!0,this.initializeBookSubmenus(),this.mainBRSelector=this.br?.el||"#BookReader",setTimeout(()=>this.bookreader.resize(),0),new ResizeObserver(i=>this.reactToBrResize(i)).observe(this.mainBRContainer)}),window.addEventListener("BookReader:fullscreenToggled",e=>{let{detail:{props:t=null}}=e;t&&(this.bookreader=t),this.manageFullScreenBehavior(e)},{passive:!0}),window.addEventListener("BookReader:ToggleSearchMenu",e=>{this.dispatchEvent(new CustomEvent(dt.updateSideMenu,{detail:{menuId:"search",action:"toggle"}}))}),window.addEventListener("LendingFlow:PostInit",({detail:e})=>{let{downloadTypesAvailable:t,lendingStatus:i,isAdmin:r,previewType:n}=e;this.lendingInitialized=!0,this.downloadableTypes=t,this.lendingStatus=i,this.isAdmin=r,this.bookReaderCannotLoad=n==="singlePagePreview"}),window.addEventListener("BRJSIA:PostInit",({detail:e})=>{let{isRestricted:t,downloadURLs:i}=e;this.downloadableTypes=i,this.model.setRestriction(t)})}reactToBrResize(e=[]){let t=this.brWidth,{animating:i}=this.bookreader;e.forEach(({contentRect:r,target:n})=>{n===this.mainBRContainer&&(this.brWidth=r.width)}),setTimeout(()=>{t&&!i&&this.bookreader.resize()},0)}manageFullScreenBehavior(e){this.emitFullScreenState(e);let{isFullscreenActive:t}=this.bookreader;t?this.fullscreenMgr.setup():this.fullscreenMgr.teardown()}emitFullScreenState({detail:e}){let{props:t}=e,i=t.isFullscreenActive,r=new CustomEvent("ViewportInFullScreen",{detail:{isFullScreen:i}});this.dispatchEvent(r)}emitShowItemNavigatorModal(e){this.dispatchEvent(new CustomEvent("showItemNavigatorModal",{detail:e.detail}))}emitCloseItemNavigatorModal(){this.dispatchEvent(new CustomEvent("closeItemNavigatorModal"))}showItemNavigatorModal(e){this.emitShowItemNavigatorModal(e)}closeItemNavigatorModal(){this.emitCloseItemNavigatorModal()}get loader(){let e=s`
      <div class="book-loader">${ui}<div>
      <h3>Loading viewer</h3>
    `;return this.bookReaderLoaded?p:e}get loadingClass(){return this.bookReaderLoaded?"":"loading"}get itemImage(){let e=`https://${this.baseHost}/services/img/${this.book.metadata.identifier}`;return s`<img src="${e}" alt="cover image for ${this.book.metadata.identifier}">`}render(){let e=this.bookReaderCannotLoad?this.itemImage:this.loader;return s`<div id="book-navigator" class="${this.loadingClass}">
      ${e}
      <slot name="bookreader"></slot>
    </div>
  `}};customElements.define("book-navigator",fi);var gi=class extends h{static get properties(){return{base64Json:{type:String}}}static get styles(){return l`
      #theatre-ia-wrap {
        background-color: #000000;
        position: relative;
        width: 100vw;
        height: auto;
      }

      item-navigator {
        display: block;
        width: 100%;
        --menuButtonLabelDisplay: block;
        --menuSliderBg: #151515;
        --subpanelRightBorderColor: #999;
        --activeButtonBg: #282828;
        --primaryTextColor: #fff;
        --menuWidth: 32rem;
        --animationTiming: 100ms;
        --iconFillColor: #fff;
        --iconStrokeColor: #fff;
        --menuSliderHeaderIconHeight: 2rem;
        --menuSliderHeaderIconWidth: 2rem;
        --iconWidth: 2.4rem;
        --iconHeight: 2.4rem;
        --searchResultText: #adaedc;
        --searchResultBg: #272958;
        --searchResultBorder: #fff;
        --downloadButtonColor: #fff;
        --downloadButtonBg: #194880;
        --downloadButtonBorderColor: #c5d1df;
        --externalButtonColor: #fff;
        --externalButtonBg: #333;
        --externalButtonBorderColor: #999;
        --shareLinkColor: #fff;
        --shareIconBorder: #fff;
        --shareIconBg: #151515;
        --activityIndicatorLoadingDotColor: #fff;
        --activityIndicatorLoadingRingColor: #fff;
        --activeBorderWidth: 2px;
        --activeBookmark: #538bc5;
        --defaultBookmarkColor: #282828;
        --blueBookmarkColor: #428bca;
        --redBookmarkColor: #eb3223;
        --greenBookmarkColor: #75ef4c;
        --yellowBookmarkColor: #fffd54;
        --bookmarkThumbWidth: 37px;
        --bookmarkListSeparatorColor: #151515;
        --loadingPagePlaceholder: #fefdeb;
        --createButtonColor: #194880;
        --createButtonBorderColor: #c5d1df;
        --saveButtonColor: #194880;
        --saveButtonBorderColor: #c5d1df;
        --deleteButtonColor: #e51c26;
        --deleteButtonBorderColor: #f8c6c8;
      }
    `}constructor(){super();this.base64Json=""}firstUpdated(){this.fetchData()}async fetchData(){let e=new URLSearchParams(location.search).get("ocaid"),i=await(await fetch(`https://archive.org/metadata/${e}`)).json(),r=btoa(JSON.stringify(i));this.setBaseJSON(r)}setBaseJSON(e){this.base64Json=e}render(){return s`
      <div id="theatre-ia-wrap" class="container container-ia width-max">
        <div id="theatre-ia" class="width-max">
          <div class="row">
            <div id="IABookReaderMessageWrapper" style="display:none;"></div>
            <item-navigator itemType="bookreader" basehost="archive.org" item=${this.base64Json}>
              <div slot="bookreader">
                <slot name="bookreader"></slot>
              </div>
            </item-navigator>
          </div>
        </div>
      </div>
    `}};window.customElements.define("bookreader-template",gi);})();
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
@license
Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/

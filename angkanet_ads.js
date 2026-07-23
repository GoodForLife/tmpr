// ==UserScript==
// @name         Angkanet Ad Blocker (Zero Flicker + Intercept)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Menghapus iklan #widgets-wrap-* di semua halaman Angkanet, dengan intercept script dan CSS instan
// @author       Anda
// @include      *://*angkanet*.*
// @grant        none
// @run-at       document-start
// ==/UserScript==

!function(){"use strict";const e=document.createElement("style");e.textContent="\n        #widgets-wrap-below-menu,\n        #widgets-wrap-after-content {\n            display: none !important;\n            height: 0 !important;\n            overflow: hidden !important;\n            visibility: hidden !important;\n            pointer-events: none !important;\n        }\n    ";const n=document.head||document.documentElement;function t(){let e=0;["#widgets-wrap-below-menu","#widgets-wrap-after-content"].forEach(n=>{const t=document.querySelector(n);t&&(t.remove(),e++)}),e>0&&console.log(`[AdBlocker] ${e} elemen iklan dihapus dari DOM.`)}n&&(n.appendChild(e),console.log("[AdBlocker] CSS penyembunyi terpasang.")),document.addEventListener("beforescriptexecute",function(e){const n=e.target?.src||"";n&&(n.includes("ads")||n.includes("ad")||n.includes("banner")||n.includes("popup"))&&(e.preventDefault(),console.log(`[AdBlocker] Script dicegat: ${n}`))},!0),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",t):t();const o=new MutationObserver(()=>{let e=!1;["#widgets-wrap-below-menu","#widgets-wrap-after-content"].forEach(n=>{document.querySelector(n)&&(e=!0)}),e&&t()});o.observe(document.documentElement,{childList:!0,subtree:!0}),setTimeout(()=>{o.disconnect(),console.log("[AdBlocker] Observer dihentikan.")},15e3)}();

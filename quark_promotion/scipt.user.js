// ==UserScript==
// @name         夸克项目推广查询
// @namespace    http://tampermonkey.net/
// @version      1.0.4
// @license      MIT
// @description  夸克项目推广查询!
// @author       PYY
// @match        https://dt.bd.cn/main/quark_list**
// @match        https://csj.sgj.cn/main/sfsjcx**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bd.cn
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    window.addEventListener('load', function() {

        // 要填写的夸克 UID
        const quarkUID = '100188018441';  // 请将此值替换为实际的夸克 UID

        const inputElement = document.querySelector('input[placeholder="请输入夸克UID查询"]');
        if (inputElement) {
            inputElement.value = quarkUID;
            // 触发 input 事件让 Vue 感知到输入框内容的变化
            const inputEvent = new Event('input', {bubbles: true});
            inputElement.dispatchEvent(inputEvent);
        }


        // 找到查询 div 并触发点击事件
        const submitDiv = document.querySelector('.submit');
        if (submitDiv) {
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            submitDiv.dispatchEvent(clickEvent);
        }
    });
})();

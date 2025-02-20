// ==UserScript==
// @name         夸克项目推广查询
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @license      MIT
// @description  夸克项目推广查询!
// @author       PYY
// @match        https://dt.bd.cn/main/quark_list**
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bd.cn
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 要填写的夸克 UID
    const quarkUID = '100188018441';  // 请将此值替换为实际的夸克 UID

    // 定义一个函数来查找输入框并填写内容，然后触发搜索按钮
    function fillAndSubmit() {
        // 通过类名和占位符查找输入框
        const inputElement = document.querySelector('input._input.bs[placeholder="请输入夸克UID查询"]');
        // 通过类名查找搜索按钮
        const searchButton = document.querySelector('button.submit');

        if (inputElement && searchButton) {
            // 如果找到输入框，填写夸克 UID
            inputElement.value = quarkUID;
            // 触发搜索按钮的点击事件
            searchButton.click();
            // 停止检查输入框和按钮的定时器
            clearInterval(intervalId);
        }
    }

    // 每隔 500 毫秒检查一次输入框和按钮是否已经加载
    const intervalId = setInterval(fillAndSubmit, 500);

})();

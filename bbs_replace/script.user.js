// ==UserScript==
// @name         社区内容替换
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @license      MIT
// @description  BBS社区内容替换
// @author       PYY
// @match        https://www.kuafuzys.com/thread-create-*.htm
// @match        https://bbs.52huahua.cc/?thread-create-*.htm
// @match        https://www.kuafuzys.com/post-update-*.htm
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kuafuzys.com
// ==/UserScript==


(function() {
    'use strict';
    // 创建一个输入框和按钮
    function createInputBox() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '10px';
        container.style.right = '10px';
        container.style.zIndex = '10000';
        container.style.backgroundColor = '#fff';
        container.style.border = '1px solid #ccc';
        container.style.padding = '10px';
        container.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = '请输入要替换的内容';
        input.style.width = '300px';
        input.style.padding = '10px';
        input.style.marginBottom = '10px';

        const button = document.createElement('button');
        button.innerText = '替换内容';
        button.style.padding = '10px 20px';
        button.style.backgroundColor = '#007bff';
        button.style.color = '#fff';
        button.style.border = 'none';
        button.style.cursor = 'pointer';
        button.style.borderRadius = '5px';

        button.addEventListener('click', () => {
            const userInput = input.value;
            if (userInput) {
                replaceContent(userInput);
                input.value = '';
            }
        });

        container.appendChild(input);
        container.appendChild(button);
        document.body.appendChild(container);
    }

    // 替换指定元素的内容
    function replaceContent(userInput) {
        const iframe = document.querySelector('iframe');
        if (!iframe) {
            alert('未找到iframe元素');
            return;
        }
        // 等待iframe加载完成
        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
            replaceContentInDocument(iframe.contentDocument, userInput);
        } else {
            iframe.onload = () => {
                replaceContentInDocument(iframe.contentDocument, userInput);
            };
        }
    }

    // 替换指定元素的内容
    function replaceContentInDocument(doc, userInput) {
        // 使用XPath定位元素
        const xpath = '//*[@id="tinymce"]';
        const result = doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const element = result.singleNodeValue;

        if (element) {
            // 直接替换元素的内容
            element.innerHTML = userInput;

        } else {
            alert('未找到指定的元素');
        }
    }

    // 确保DOM完全加载后再执行
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        createInputBox();
    } else {
        window.addEventListener('DOMContentLoaded', createInputBox);
    }
    // Your code here...
})();

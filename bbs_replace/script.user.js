// ==UserScript==
// @name         社区内容替换
// @namespace    http://tampermonkey.net/
// @version      1.0.1.1
// @license      MIT
// @description  BBS社区内容替换
// @author       PYY
// @match        https://www.kuafuzys.com/*
// @match        https://bbs.52huahua.cc/*
// @match        https://www.kuafuzy.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kuafuzys.com
// ==/UserScript==

(function() {
    'use strict';
    
    // 创建菜单和内容区域
    function createUI() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '10px';
        container.style.right = '10px';
        container.style.zIndex = '10000';
        container.style.backgroundColor = '#fff';
        container.style.border = '1px solid #ccc';
        container.style.padding = '10px';
        container.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
        container.style.width = '320px';

        // 创建菜单栏
        const menuBar = document.createElement('div');
        menuBar.style.marginBottom = '10px';
        menuBar.style.display = 'flex';
        menuBar.style.gap = '10px';

        // 创建提取按钮
        const extractBtn = createMenuButton('提取内容');
        extractBtn.dataset.panel = 'extract';
        extractBtn.classList.add('active');

        // 创建上传按钮
        const uploadBtn = createMenuButton('上传内容');
        uploadBtn.dataset.panel = 'upload';

        menuBar.appendChild(extractBtn);
        menuBar.appendChild(uploadBtn);

        // 创建内容面板容器
        const panelContainer = document.createElement('div');

        // 创建提取面板
        const extractPanel = createExtractPanel();
        extractPanel.id = 'extract-panel';

        // 创建上传面板
        const uploadPanel = createUploadPanel();
        uploadPanel.id = 'upload-panel';
        uploadPanel.style.display = 'none';

        panelContainer.appendChild(extractPanel);
        panelContainer.appendChild(uploadPanel);

        // 添加菜单切换事件
        menuBar.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                // 更新按钮状态
                menuBar.querySelectorAll('button').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');

                // 切换面板显示
                const panelToShow = e.target.dataset.panel;
                document.getElementById('extract-panel').style.display = 
                    panelToShow === 'extract' ? 'block' : 'none';
                document.getElementById('upload-panel').style.display = 
                    panelToShow === 'upload' ? 'block' : 'none';
            }
        });

        container.appendChild(menuBar);
        container.appendChild(panelContainer);
        document.body.appendChild(container);

        // 添加样式
        addStyles();
    }

    // 创建菜单按钮
    function createMenuButton(text) {
        const button = document.createElement('button');
        button.innerText = text;
        button.style.flex = '1';
        button.style.padding = '8px';
        button.style.cursor = 'pointer';
        button.style.border = '1px solid #ccc';
        button.style.borderRadius = '4px';
        return button;
    }

    // 创建提取面板
    function createExtractPanel() {
        const panel = document.createElement('div');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = '请输入要提取的内容';
        input.style.width = '100%';
        input.style.padding = '8px';
        input.style.marginBottom = '10px';
        input.style.boxSizing = 'border-box';

        const button = document.createElement('button');
        button.innerText = '提取';
        button.style.width = '100%';
        button.style.padding = '8px';
        button.style.backgroundColor = '#007bff';
        button.style.color = '#fff';
        button.style.border = 'none';
        button.style.cursor = 'pointer';
        button.style.borderRadius = '4px';

        button.addEventListener('click', () => {
            const userInput = input.value;
            if (userInput) {
                replaceContent(userInput);
                input.value = '';
            }
        });

        panel.appendChild(input);
        panel.appendChild(button);
        return panel;
    }

    // 创建上传面板
    function createUploadPanel() {
        const panel = document.createElement('div');
        
        const textarea = document.createElement('textarea');
        textarea.placeholder = '请输入要上传的内容';
        textarea.style.width = '100%';
        textarea.style.height = '100px';
        textarea.style.padding = '8px';
        textarea.style.marginBottom = '10px';
        textarea.style.boxSizing = 'border-box';
        textarea.style.resize = 'vertical';

        const button = document.createElement('button');
        button.innerText = '上传';
        button.style.width = '100%';
        button.style.padding = '8px';
        button.style.backgroundColor = '#28a745';
        button.style.color = '#fff';
        button.style.border = 'none';
        button.style.cursor = 'pointer';
        button.style.borderRadius = '4px';

        button.addEventListener('click', () => {
            const content = textarea.value;
            if (content) {
                replaceContent(content);
                textarea.value = '';
            }
        });

        panel.appendChild(textarea);
        panel.appendChild(button);
        return panel;
    }

    // 添加样式
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            button.active {
                background-color: #007bff !important;
                color: white !important;
            }
            button:hover {
                opacity: 0.9;
            }
        `;
        document.head.appendChild(style);
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
        createUI();
    } else {
        window.addEventListener('DOMContentLoaded', createUI);
    }
})();

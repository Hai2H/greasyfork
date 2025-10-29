// ==UserScript==
// @name         夸克网盘资源社-文章采集
// @namespace    http://tampermonkey.net/
// @version      V1.0.0
// @description  文章采集
// @author       PYY
// @match        https://kuakezy.cc/thread-*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const platform = "Kuake";
    const serverUrl = "http://127.0.0.1:82/biz/collection/save"; // ✅ 你的服务器接口

    // ========== 工具函数 ==========
    // 格式化日期为 YYYY-MM-DD HH:mm:ss
    const formatDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const collection = {
        // 平台
        collectionPlatform: "kkwpzys",
        // 资源链接
        resourceLink: null,
        // 标题
        title: null,
        // 用户
        username: null,
        // UID
        uid: null,
        // 内容
        content: null,
        // 节点
        node: null,
        // 标签
        tags: null,
        // 夸克链接
        quarkLink: null,
        // 状态
        status: "1",
        // 创建时间
        createTime: formatDateTime(new Date()),
        // 创建用户
        createUser: "1543837863788879871",
        // 删除标志
        deleteFlag: "NOT_DELETE",
        // 绑定用户
        bindCookieId: "1543837863788879871",
    };

    // XPath 辅助函数 - 获取单个元素
    const getElementByXPath = (xpath) => {
        try {
            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            return result.singleNodeValue;
        } catch (e) {
            console.error("XPath 错误:", e);
            return null;
        }
    };

    // XPath 辅助函数 - 获取所有匹配的元素
    const getElementsByXPath = (xpath) => {
        try {
            const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            const elements = [];
            for (let i = 0; i < result.snapshotLength; i++) {
                elements.push(result.snapshotItem(i));
            }
            return elements;
        } catch (e) {
            console.error("XPath 错误:", e);
            return [];
        }
    };

    const logBox = document.createElement("div");
    logBox.style = `
    position: fixed; bottom: 20px; right: 20px;
    width: 350px; background: #fff;
    border: 1px solid #ccc; border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    font-size: 13px; padding: 10px; z-index: 999999;
    max-height: 60vh; overflow: auto;
  `;

    // 添加账号选择下拉框
    const accountSelectContainer = document.createElement("div");
    accountSelectContainer.style = "margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #ddd;";

    const accountLabel = document.createElement("label");
    accountLabel.textContent = "选择绑定账号: ";
    accountLabel.style = "display:inline-block;margin-right:5px;";

    const accountSelect = document.createElement("select");
    accountSelect.id = "account-selector";
    accountSelect.style = `
    display:inline-block;padding:5px 10px;
    border:1px solid #aaa;border-radius:4px;
    background:#fff;cursor:pointer;
    min-width:150px;
  `;

    // 账号选项（可根据需要修改）
    const accounts = [
        { label: "我想我是海", value: "1896186752012374017" },
        { label: "书生", value: "1900922270486798338" },
        { label: "海海游戏社", value: "1900354501367640065" },
    ];

    accounts.forEach(({ label, value }) => {
        const option = document.createElement("option");
        option.textContent = label;
        option.value = value;
        accountSelect.appendChild(option);
    });

    // 设置默认选中第一个，并初始化 bindCookieId
    accountSelect.value = accounts[0].value;
    collection.bindCookieId = accounts[0].value;

    // 监听选择变化
    accountSelect.addEventListener("change", (e) => {
        collection.bindCookieId = e.target.value;
        addLog("已切换到账号: " + e.target.options[e.target.selectedIndex].text);
    });

    accountSelectContainer.appendChild(accountLabel);
    accountSelectContainer.appendChild(accountSelect);
    logBox.appendChild(accountSelectContainer);

    const logArea = document.createElement("div");
    logArea.style = "max-height:200px;overflow:auto;border-top:1px solid #ddd;margin-top:5px;padding-top:5px;";
    const addLog = (msg) => {
        console.log(`${platform}>>> ${msg}`);
        const p = document.createElement("div");
        p.textContent = msg;
        logArea.appendChild(p);
        logArea.scrollTop = logArea.scrollHeight;
    };

    // ========== 控制按钮 ==========
    const btns = [
        { text: "提取所有内容", fn: async () => await extractAll() },
        { text: "上传服务器", fn: uploadServer },
        { text: "查看数据", fn: showData },
    ];

    btns.forEach(({ text, fn }) => {
        const b = document.createElement("button");
        b.textContent = text;
        b.style = `
      display:inline-block;margin:3px;padding:5px 10px;
      border:1px solid #aaa;border-radius:4px;
      background:#f5f5f5;cursor:pointer;
    `;
        b.addEventListener("click", fn);
        logBox.appendChild(b);
    });
    logBox.appendChild(logArea);
    document.body.appendChild(logBox);

    addLog("手动模式已启动。请按步骤点击按钮。");

    // ========== 各步骤逻辑 ==========

    // 统一提取所有内容的函数
    function extractAll() {
        addLog("开始提取所有内容...");

        // 第一步：先提取夸克链接
        addLog("1. 检查夸克链接...");
        const alertDiv = document.querySelector("div.alert.alert-success[role='alert']");

        if (alertDiv) {
            const allText = alertDiv.textContent || alertDiv.innerText || '';
            const quarkPattern = /https?:\/\/pan\.quark\.(cn|com)\/s\/[a-zA-Z0-9]+/g;
            const matches = allText.match(quarkPattern);

            if (matches && matches.length > 0) {
                collection.quarkLink = matches[0];
                addLog("✓ 夸克链接提取成功: " + collection.quarkLink);
            } else {
                addLog("❌ 未找到夸克链接。请确认已回帖。");
                return; // 中断，不继续提取
            }
        } else {
            addLog("❌ 未找到回帖提示框。请先回帖查看链接。");
            return; // 中断，不继续提取
        }

        // 第二步：提取基本信息和节点
        addLog("2. 提取标题、作者、节点和资源链接...");
        extractMeta();

        // 第三步：提取标签
        addLog("3. 提取标签...");
        extractTags();

        // 第四步：提取正文
        addLog("4. 提取正文...");
        extractContent();

        addLog("✅ 所有内容提取完成！");
        addLog("可以点击【查看数据】查看完整数据，然后点击【上传服务器】");
    }

    function extractMeta() {
        // 提取当前页面链接
        const currentUrl = window.location.href;
        try {
            const urlObj = new URL(currentUrl);

            // 提取域名（仅用于日志显示验证）
            const domain = urlObj.hostname;

            // 提取 resourceLink（URL 的最后一段）
            const pathParts = urlObj.pathname.split('/').filter(part => part);
            if (pathParts.length > 0) {
                collection.resourceLink = pathParts[pathParts.length - 1];
            }

            addLog("页面链接解析成功");
            addLog("完整URL: " + currentUrl);
            addLog("域名: " + domain);
            addLog("资源链接: " + collection.resourceLink);
        } catch (e) {
            addLog("URL 解析失败: " + e.message);
        }

        // 提取标题
        const titleEl = document.querySelector("h4.break-all.font-weight-bold");
        if (titleEl) {
            collection.title = titleEl.textContent.trim().replace(/\s+/g, " ");
            addLog("标题提取成功: " + collection.title);
        } else {
            addLog("未找到标题。");
        }

        // 提取作者
        const userEl = document.querySelector("span.username.font-weight-bold.small a");
        if (userEl) {
            collection.username = userEl.textContent.trim();
            addLog("作者提取成功: " + collection.username);
        } else {
            addLog("未找到作者。");
        }

        // 提取节点（分类）
        const nodeEl = getElementByXPath("//*[@id='body']/div/div/div[2]/ol/li[2]/a");
        if (nodeEl) {
            collection.node = nodeEl.textContent.trim();
            addLog("节点提取成功: " + collection.node);
        } else {
            addLog("未找到节点信息。");
        }
    }

    function extractTags() {
        const tagsXPath = "/html/body/main/div/div/div[2]/div[1]/div[2]/div[2]//a";
        const tagElements = getElementsByXPath(tagsXPath);
        if (tagElements && tagElements.length > 0) {
            const tagTexts = tagElements.map(tag => tag.textContent.trim()).filter(text => text);
            collection.tags = tagTexts.join(",");
            addLog("标签提取成功，共 " + tagTexts.length + " 个");
            addLog("标签内容: " + collection.tags);
        } else {
            addLog("未找到标签信息。");
        }
    }

    function extractQuark() {
        // 定位到指定的div
        const alertDiv = document.querySelector("div.alert.alert-success[role='alert']");

        if (alertDiv) {
            // 获取整个div节点的所有文字内容
            const allText = alertDiv.textContent || alertDiv.innerText || '';

            // 使用正则表达式匹配夸克链接形式
            // 匹配: https://pan.quark.cn/s/xxx 或 https://pan.quark.com/s/xxx
            const quarkPattern = /https?:\/\/pan\.quark\.(cn|com)\/s\/[a-zA-Z0-9]+/g;
            const matches = allText.match(quarkPattern);

            if (matches && matches.length > 0) {
                collection.quarkLink = matches[0]; // 取第一个匹配的链接
                addLog("夸克链接提取成功: " + collection.quarkLink);
            } else {
                addLog("未找到夸克链接。");
            }
        } else {
            addLog("未找到指定的提示框。");
        }
    }

    async function extractContent() {
        const contentXPath = "/html/body/main/div/div/div[2]/div[1]/div[2]";
        const contentEl = getElementByXPath(contentXPath);

        if (!contentEl) {
            addLog("未找到正文区域。");
            return;
        }

        // 克隆节点
        const clonedContent = contentEl.cloneNode(true);

        // 删除多余的提示框元素
        try {
            let deleteCount = 0;
            const removeList = ['.tt-license', '.alert.alert-success', '.mt-3'];
            removeList.forEach(sel => {
                const el = clonedContent.querySelector(sel);
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                    deleteCount++;
                }
            });
            addLog(`正文提取成功，已删除 ${deleteCount} 个指定元素。`);
        } catch (e) {
            addLog("删除元素时出错: " + e.message);
        }

        // ✅ 处理图片：转成 Base64 并替换
        const imgEls = clonedContent.querySelectorAll("img");
        let converted = 0;

        const convertToBase64 = async (url) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                return await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (err) {
                console.error("图片转Base64失败：", err);
                return url; // 保留原始地址
            }
        };

        // 异步转换所有图片
        const tasks = Array.from(imgEls).map(async (img) => {
            const src = img.getAttribute("src");
            if (!src) return;
            try {
                // 相对路径转绝对路径
                const absoluteUrl = new URL(src, window.location.href).href;
                const base64 = await convertToBase64(absoluteUrl);
                img.setAttribute("src", base64);
                converted++;
            } catch (e) {
                console.warn("处理图片失败：", src, e);
            }
        });

        await Promise.all(tasks);
        addLog(`共处理图片 ${imgEls.length} 张，成功转为Base64：${converted} 张。`);

        // 保存完整 HTML
        collection.content = clonedContent.outerHTML;
        addLog("✅ 正文提取完成并包含Base64图片数据。");
    }



    function uploadServer() {
        if (!serverUrl.startsWith("http")) {
            addLog("❌ 请先设置服务器地址！");
            return;
        }
        addLog("开始上传到服务器...");
        fetch(serverUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(collection)
        })
            .then(res => res.json())
            .then(data => addLog("✅ 上传成功: " + JSON.stringify(data)))
            .catch(err => addLog("❌ 上传失败: " + err));
    }

    function showData() {
        addLog("当前收集数据：");
        addLog(JSON.stringify(collection, null, 2));
    }
})();

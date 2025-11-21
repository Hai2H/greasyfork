// ==UserScript==
// @name         智能随机回帖助手（夸父资源）
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  简洁高效的回帖工具：手动随机回帖、批量回帖、智能去重、拖拽面板。重构优化版。
// @match        https://kuafuzys.net/*
// @match        https://www.kuafuzy.com/*
// @match        https://www.kuakesou.com/*
// @match        https://www.kuakeq.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // ========================================
    // 配置模块
    // ========================================
    const CONFIG = {
        // 选择器配置
        selectors: {
            replyTextarea: '#message',
            replySubmitBtn: '#submit',
            threadList: 'ul.threadlist li.media.thread .style3_subject a[href^="thread-"]'
        },

        // 随机回复内容池
        replyTemplates: [
            "感谢分享，非常不错的资源！",
            "太棒了，正好需要这个！",
            "优秀的内容，支持楼主！",
            "收藏了，感谢分享！",
            "这个资源很实用，赞一个！",
            "好东西，感谢楼主的分享！",
            "非常感谢，辛苦了！",
            "很有帮助，支持一下！"
        ],

        // 延迟配置（毫秒）
        delays: {
            beforeSubmit: 800,      // 提交前等待
            afterSubmit: 2000,      // 提交后等待
            betweenPosts: 3000,     // 批量回帖间隔
            pageLoad: 1000          // 页面加载等待
        },

        // 限制配置
        limits: {
            maxBatchCount: 50,      // 单次批量最大数量
            maxLogEntries: 100,     // 最大日志条数
            maxPageAttempts: 30     // 最大翻页尝试
        },

        // 存储键名
        storageKeys: {
            repliedThreads: 'replied_threads_v4',
            batchQueue: 'batch_queue_v4',
            batchMode: 'batch_mode_v4',
            batchCount: 'batch_count_v4',
            currentUser: 'current_user_v4',
            logs: 'logs_v4',
            statusText: 'status_text_v4',
            failedAttempts: 'failed_attempts_v4'
        }
    };

    // ========================================
    // 工具函数模块
    // ========================================
    const Utils = {
        // 延迟函数
        delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

        // 随机延迟
        randomDelay: (min, max) => {
            const ms = min + Math.random() * (max - min);
            return Utils.delay(ms);
        },

        // 获取随机回复内容
        getRandomReply: () => {
            const templates = CONFIG.replyTemplates;
            return templates[Math.floor(Math.random() * templates.length)];
        },

        // 解析帖子ID
        parseThreadId: (url) => {
            const match = url.match(/thread-(\d+)(-\d+-\d+)?\.htm/);
            return match ? match[1] : null;
        },

        // 检查是否为帖子详情页
        isThreadPage: () => {
            return /\/thread-\d+(-\d+-\d+)?\.htm/.test(location.href);
        },

        // 检查是否为用户列表页
        isUserListPage: () => {
            return /\/user-thread-\d+(-\d+)?\.htm/.test(location.href);
        }
    };

    // ========================================
    // 存储管理模块
    // ========================================
    const Storage = {
        // 获取已回帖列表
        getRepliedThreads: () => {
            return GM_getValue(CONFIG.storageKeys.repliedThreads, []) || [];
        },

        // 添加已回帖记录
        addRepliedThread: (tid) => {
            const replied = Storage.getRepliedThreads();
            if (!replied.includes(tid)) {
                replied.push(tid);
                GM_setValue(CONFIG.storageKeys.repliedThreads, replied);
            }
        },

        // 检查是否已回帖
        isReplied: (tid) => {
            return Storage.getRepliedThreads().includes(tid);
        },

        // 清空已回帖记录
        clearRepliedThreads: () => {
            GM_setValue(CONFIG.storageKeys.repliedThreads, []);
        },

        // 获取批量队列
        getBatchQueue: () => {
            return GM_getValue(CONFIG.storageKeys.batchQueue, []) || [];
        },

        // 保存批量队列
        saveBatchQueue: (queue) => {
            GM_setValue(CONFIG.storageKeys.batchQueue, queue);
        },

        // 获取批量模式状态
        isBatchMode: () => {
            return GM_getValue(CONFIG.storageKeys.batchMode, false);
        },

        // 设置批量模式
        setBatchMode: (enabled) => {
            GM_setValue(CONFIG.storageKeys.batchMode, enabled);
        },

        // 获取批量剩余数量
        getBatchCount: () => {
            return GM_getValue(CONFIG.storageKeys.batchCount, 0);
        },

        // 设置批量剩余数量
        setBatchCount: (count) => {
            GM_setValue(CONFIG.storageKeys.batchCount, count);
        },

        // 获取日志
        getLogs: () => {
            return GM_getValue(CONFIG.storageKeys.logs, []) || [];
        },

        // 保存日志
        saveLogs: (logs) => {
            GM_setValue(CONFIG.storageKeys.logs, logs);
        },

        // 添加日志
        addLog: (message, type) => {
            const logs = Storage.getLogs();
            const time = new Date().toLocaleTimeString();
            logs.unshift({ time, message, type });
            // 限制日志数量
            if (logs.length > CONFIG.limits.maxLogEntries) {
                logs.pop();
            }
            Storage.saveLogs(logs);
        },

        // 清空日志
        clearLogs: () => {
            GM_setValue(CONFIG.storageKeys.logs, []);
        },

        // 获取状态文本
        getStatusText: () => {
            return GM_getValue(CONFIG.storageKeys.statusText, '待机中');
        },

        // 设置状态文本
        setStatusText: (text) => {
            GM_setValue(CONFIG.storageKeys.statusText, text);
        },

        // 获取失败尝试次数
        getFailedAttempts: () => {
            return GM_getValue(CONFIG.storageKeys.failedAttempts, 0);
        },

        // 设置失败尝试次数
        setFailedAttempts: (count) => {
            GM_setValue(CONFIG.storageKeys.failedAttempts, count);
        },

        // 重置失败尝试次数
        resetFailedAttempts: () => {
            GM_setValue(CONFIG.storageKeys.failedAttempts, 0);
        }
    };

    // ========================================
    // UI模块
    // ========================================
    const UI = {
        panel: null,
        logContainer: null,

        // 初始化样式
        initStyles: () => {
            GM_addStyle(`
                #replyHelperPanel {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    width: 320px;
                    background: #ffffff;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    font-size: 14px;
                }
                
                #replyHelperPanel .panel-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 15px;
                    border-radius: 8px 8px 0 0;
                    cursor: move;
                    user-select: none;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                #replyHelperPanel .panel-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                }
                
                #replyHelperPanel .panel-body {
                    padding: 15px;
                }
                
                #replyHelperPanel .btn-group {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                
                #replyHelperPanel button {
                    flex: 1;
                    padding: 8px 12px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                
                #replyHelperPanel button.primary {
                    background: #667eea;
                    color: white;
                }
                
                #replyHelperPanel button.primary:hover {
                    background: #5568d3;
                }
                
                #replyHelperPanel button.secondary {
                    background: #f5f5f5;
                    color: #333;
                }
                
                #replyHelperPanel button.secondary:hover {
                    background: #e8e8e8;
                }
                
                #replyHelperPanel button.danger {
                    background: #ef5350;
                    color: white;
                }
                
                #replyHelperPanel button.danger:hover {
                    background: #e53935;
                }
                
                #replyHelperPanel button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                #replyHelperPanel .input-group {
                    margin-bottom: 12px;
                }
                
                #replyHelperPanel input {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 13px;
                    box-sizing: border-box;
                }
                
                #replyHelperPanel input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                
                #replyHelperPanel .divider {
                    height: 1px;
                    background: #e0e0e0;
                    margin: 12px 0;
                }
                
                #replyHelperPanel .log-container {
                    max-height: 200px;
                    overflow-y: auto;
                    background: #f9f9f9;
                    border-radius: 5px;
                    padding: 8px;
                    font-size: 12px;
                }
                
                #replyHelperPanel .log-entry {
                    margin: 4px 0;
                    padding: 4px 6px;
                    border-radius: 3px;
                    line-height: 1.4;
                }
                
                #replyHelperPanel .log-entry.info {
                    color: #333;
                }
                
                #replyHelperPanel .log-entry.success {
                    color: #2e7d32;
                    background: #e8f5e9;
                }
                
                #replyHelperPanel .log-entry.error {
                    color: #c62828;
                    background: #ffebee;
                }
                
                #replyHelperPanel .log-entry .time {
                    color: #999;
                    font-size: 11px;
                    margin-right: 6px;
                }
                
                #replyHelperPanel .status-bar {
                    padding: 8px 12px;
                    background: #f5f5f5;
                    border-radius: 5px;
                    margin-bottom: 12px;
                    font-size: 12px;
                    color: #666;
                }
                
                #replyHelperPanel .status-bar .label {
                    font-weight: 600;
                    color: #333;
                }
            `);
        },

        // 创建面板
        createPanel: () => {
            const panel = document.createElement('div');
            panel.id = 'replyHelperPanel';
            panel.innerHTML = `
                <div class="panel-header">
                    <h3>🤖 智能回帖助手</h3>
                    <span style="cursor: pointer;" id="panelClose">✕</span>
                </div>
                <div class="panel-body">
                    <div class="status-bar" id="statusBar">
                        <span class="label">状态：</span><span id="statusText">待机中</span>
                    </div>
                    
                    <div class="input-group">
                        <input type="number" id="userIdInput" placeholder="输入用户ID（如：12059）">
                    </div>
                    
                    <div class="btn-group">
                        <button class="secondary" id="btnGoToUser">跳转列表</button>
                        <button class="primary" id="btnQuickReply">快速回帖</button>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="btn-group">
                        <button class="secondary" id="btnBatchReply">批量回帖</button>
                    </div>
                    
                    <div class="input-group" id="batchInputGroup" style="display:none;">
                        <input type="number" id="batchCount" placeholder="输入批量回帖数量 (1-50)" min="1" max="50">
                    </div>
                    
                    <div class="btn-group" id="batchControlGroup" style="display:none;">
                        <button class="primary" id="btnStartBatch">开始批量</button>
                        <button class="danger" id="btnStopBatch">停止</button>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="btn-group">
                        <button class="secondary" id="btnClearHistory">清空记录</button>
                        <button class="secondary" id="btnViewStats">查看统计</button>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="log-container" id="logContainer"></div>
                </div>
            `;
            
            document.body.appendChild(panel);
            UI.panel = panel;
            UI.logContainer = panel.querySelector('#logContainer');
            
            // 绑定事件
            UI.bindEvents();
            
            // 使面板可拖拽
            UI.makeDraggable();
        },

        // 绑定事件
        bindEvents: () => {
            // 跳转到用户列表页
            document.getElementById('btnGoToUser').onclick = () => {
                const userId = document.getElementById('userIdInput').value.trim();
                if (!userId) {
                    UI.log('请输入用户ID', 'error');
                    return;
                }
                if (!/^\d+$/.test(userId)) {
                    UI.log('用户ID必须是数字', 'error');
                    return;
                }
                UI.log(`跳转到用户 ${userId} 的帖子列表`, 'info');
                location.href = `https://kuafuzys.net/user-thread-${userId}.htm`;
            };
            
            // 快速回帖按钮
            document.getElementById('btnQuickReply').onclick = () => {
                ReplyHandler.quickReply();
            };
            
            // 批量回帖按钮
            document.getElementById('btnBatchReply').onclick = () => {
                UI.toggleBatchMode();
            };
            
            // 开始批量
            document.getElementById('btnStartBatch').onclick = () => {
                const count = parseInt(document.getElementById('batchCount').value);
                if (!count || count < 1 || count > CONFIG.limits.maxBatchCount) {
                    UI.log(`请输入有效的数量 (1-${CONFIG.limits.maxBatchCount})`, 'error');
                    return;
                }
                ReplyHandler.startBatch(count);
            };
            
            // 停止批量
            document.getElementById('btnStopBatch').onclick = () => {
                ReplyHandler.stopBatch();
            };
            
            // 清空记录
            document.getElementById('btnClearHistory').onclick = () => {
                if (confirm('确定要清空所有回帖记录、日志和队列吗？')) {
                    Storage.clearRepliedThreads();
                    Storage.clearLogs();
                    Storage.saveBatchQueue([]);
                    Storage.setBatchMode(false);
                    Storage.setBatchCount(0);
                    Storage.resetFailedAttempts();
                    if (UI.logContainer) {
                        UI.logContainer.innerHTML = '';
                    }
                    UI.log('已清空所有记录', 'success');
                    UI.updateStatus('待机中');
                    UI.setButtonsDisabled(false);
                }
            };
            
            // 查看统计
            document.getElementById('btnViewStats').onclick = () => {
                const replied = Storage.getRepliedThreads();
                UI.log(`已回帖数量：${replied.length} 个`, 'info');
            };
            
            // 关闭面板
            document.getElementById('panelClose').onclick = () => {
                UI.panel.style.display = 'none';
            };
        },

        // 切换批量模式UI
        toggleBatchMode: () => {
            const inputGroup = document.getElementById('batchInputGroup');
            const controlGroup = document.getElementById('batchControlGroup');
            const isVisible = inputGroup.style.display !== 'none';
            
            inputGroup.style.display = isVisible ? 'none' : 'block';
            controlGroup.style.display = isVisible ? 'none' : 'flex';
        },

        // 使面板可拖拽
        makeDraggable: () => {
            const header = UI.panel.querySelector('.panel-header');
            let isDragging = false;
            let currentX, currentY, initialX, initialY;
            
            header.addEventListener('mousedown', (e) => {
                if (e.target.id === 'panelClose') return;
                isDragging = true;
                initialX = e.clientX - UI.panel.offsetLeft;
                initialY = e.clientY - UI.panel.offsetTop;
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                UI.panel.style.left = currentX + 'px';
                UI.panel.style.top = currentY + 'px';
                UI.panel.style.right = 'auto';
            });
            
            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
        },

        // 记录日志
        log: (message, type = 'info') => {
            // 保存到存储
            Storage.addLog(message, type);
            
            // 显示到UI
            if (UI.logContainer) {
                const entry = document.createElement('div');
                entry.className = `log-entry ${type}`;
                const time = new Date().toLocaleTimeString();
                entry.innerHTML = `<span class="time">${time}</span>${message}`;
                
                UI.logContainer.insertBefore(entry, UI.logContainer.firstChild);
                
                // 限制日志数量
                const entries = UI.logContainer.querySelectorAll('.log-entry');
                if (entries.length > CONFIG.limits.maxLogEntries) {
                    entries[entries.length - 1].remove();
                }
            }
            
            console.log(`[回帖助手] ${message}`);
        },

        // 更新状态
        updateStatus: (text) => {
            // 保存到存储
            Storage.setStatusText(text);
            
            // 显示到UI
            const statusText = document.getElementById('statusText');
            if (statusText) {
                statusText.textContent = text;
            }
        },

        // 恢复日志
        restoreLogs: () => {
            const logs = Storage.getLogs();
            if (UI.logContainer && logs.length > 0) {
                UI.logContainer.innerHTML = '';
                logs.forEach(log => {
                    const entry = document.createElement('div');
                    entry.className = `log-entry ${log.type}`;
                    entry.innerHTML = `<span class="time">${log.time}</span>${log.message}`;
                    UI.logContainer.appendChild(entry);
                });
            }
        },

        // 恢复状态
        restoreStatus: () => {
            const statusText = Storage.getStatusText();
            UI.updateStatus(statusText);
        },

        // 禁用/启用按钮
        setButtonsDisabled: (disabled) => {
            const buttons = UI.panel.querySelectorAll('button');
            buttons.forEach(btn => {
                if (btn.id !== 'btnStopBatch') {
                    btn.disabled = disabled;
                }
            });
        }
    };

    // ========================================
    // 回帖处理模块
    // ========================================
    const ReplyHandler = {
        // 快速回帖（当前页面）
        quickReply: async () => {
            if (!Utils.isThreadPage()) {
                UI.log('请在帖子详情页使用快速回帖功能', 'error');
                return;
            }
            
            const tid = Utils.parseThreadId(location.href);
            if (!tid) {
                UI.log('无法解析帖子ID', 'error');
                return;
            }
            
            if (Storage.isReplied(tid)) {
                UI.log('该帖子已回复过，跳过', 'error');
                return;
            }
            
            UI.updateStatus('正在回帖...');
            UI.setButtonsDisabled(true);
            
            try {
                await ReplyHandler.submitReply(tid);
                UI.log('回帖成功！', 'success');
                UI.updateStatus('回帖完成');
            } catch (error) {
                UI.log(`回帖失败：${error.message}`, 'error');
                UI.updateStatus('回帖失败');
            } finally {
                UI.setButtonsDisabled(false);
            }
        },

        // 提交回复
        submitReply: async (tid) => {
            const textarea = document.querySelector(CONFIG.selectors.replyTextarea);
            const submitBtn = document.querySelector(CONFIG.selectors.replySubmitBtn);
            
            if (!textarea || !submitBtn) {
                throw new Error('未找到回复框或提交按钮');
            }
            
            // 填充随机内容
            const replyText = Utils.getRandomReply();
            textarea.value = replyText;
            
            // 触发事件
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            
            UI.log(`回复内容：${replyText}`, 'info');
            
            // 等待后提交
            await Utils.delay(CONFIG.delays.beforeSubmit);
            submitBtn.click();
            
            // 标记已回复
            Storage.addRepliedThread(tid);
            
            // 等待提交完成
            await Utils.delay(CONFIG.delays.afterSubmit);
        },

        // 开始批量回帖
        startBatch: async (count) => {
            if (!Utils.isUserListPage()) {
                UI.log('请在用户帖子列表页使用批量回帖功能', 'error');
                return;
            }
            
            // 获取所有未回复的帖子
            const threadLinks = document.querySelectorAll(CONFIG.selectors.threadList);
            const unrepliedLinks = Array.from(threadLinks)
                .map(link => ({
                    url: link.href,
                    tid: Utils.parseThreadId(link.href)
                }))
                .filter(item => item.tid && !Storage.isReplied(item.tid));
            
            if (unrepliedLinks.length === 0) {
                UI.log('当前页面没有未回复的帖子', 'error');
                return;
            }
            
            // 只取前 count 个
            const targetLinks = unrepliedLinks.slice(0, count);
            const queue = targetLinks.map(item => item.url);
            
            // 保存队列
            Storage.saveBatchQueue(queue);
            Storage.setBatchMode(true);
            Storage.setBatchCount(queue.length);
            Storage.resetFailedAttempts();
            
            UI.log(`开始批量回帖，队列中有 ${queue.length} 个帖子`, 'success');
            UI.updateStatus(`批量模式：剩余 ${queue.length} 个帖子`);
            UI.setButtonsDisabled(true);
            
            await ReplyHandler.processBatch();
        },

        // 处理批量回帖
        processBatch: async () => {
            if (!Storage.isBatchMode()) {
                return;
            }
            
            // 从队列获取下一个帖子
            let queue = Storage.getBatchQueue();
            
            if (queue.length === 0) {
                UI.log('🎉 批量回帖全部完成！', 'success');
                ReplyHandler.stopBatch();
                return;
            }
            
            // 随机选择一个
            const randomIndex = Math.floor(Math.random() * queue.length);
            const nextUrl = queue[randomIndex];
            const tid = Utils.parseThreadId(nextUrl);
            
            UI.log(`→ 准备回复帖子：${tid} (队列剩余 ${queue.length})`, 'info');
            UI.updateStatus(`批量模式：剩余 ${queue.length} 个帖子`);
            
            // 从队列中移除（访问前就删除，避免重复）
            queue.splice(randomIndex, 1);
            Storage.saveBatchQueue(queue);
            Storage.setBatchCount(queue.length);
            
            // 跳转到帖子页面
            location.href = nextUrl;
        },

        // 停止批量回帖
        stopBatch: () => {
            Storage.setBatchMode(false);
            Storage.setBatchCount(0);
            Storage.saveBatchQueue([]);
            Storage.resetFailedAttempts();
            UI.log('已停止批量回帖', 'success');
            UI.updateStatus('待机中');
            UI.setButtonsDisabled(false);
        },

        // 在帖子页面自动回帖（批量模式）
        autoReplyInThread: async () => {
            if (!Storage.isBatchMode()) return;
            
            const tid = Utils.parseThreadId(location.href);
            if (!tid) {
                UI.log('无法解析帖子ID', 'error');
                return;
            }
            
            if (Storage.isReplied(tid)) {
                UI.log(`帖子 ${tid} 已回复过，跳过`, 'info');
                await Utils.delay(1000);
                // 已经从队列中移除了，直接返回继续下一个
                history.back();
                return;
            }
            
            UI.updateStatus('正在自动回帖...');
            
            try {
                await Utils.delay(CONFIG.delays.pageLoad);
                await ReplyHandler.submitReply(tid);
                
                const remaining = Storage.getBatchCount();
                
                UI.log(`✓ 帖子 ${tid} 回复成功，剩余 ${remaining} 个帖子`, 'success');
                UI.updateStatus(`批量模式：剩余 ${remaining} 个帖子`);
                
                // 等待后返回列表
                await Utils.delay(CONFIG.delays.betweenPosts);
                history.back();
            } catch (error) {
                UI.log(`自动回帖失败：${error.message}`, 'error');
                // 出错也返回继续下一个（已从队列移除）
                await Utils.delay(2000);
                history.back();
            }
        }
    };

    // ========================================
    // 主程序初始化
    // ========================================
    const App = {
        init: async () => {
            // 初始化UI
            UI.initStyles();
            UI.createPanel();
            
            // 恢复日志和状态
            UI.restoreLogs();
            UI.restoreStatus();
            
            // 如果是批量模式，显示批量控制按钮
            if (Storage.isBatchMode()) {
                const inputGroup = document.getElementById('batchInputGroup');
                const controlGroup = document.getElementById('batchControlGroup');
                if (inputGroup && controlGroup) {
                    inputGroup.style.display = 'block';
                    controlGroup.style.display = 'flex';
                }
                UI.setButtonsDisabled(true);
            }
            
            UI.log('智能回帖助手已启动 v4.0', 'success');
            
            // 检查当前页面类型
            if (Utils.isThreadPage()) {
                UI.log('检测到帖子详情页', 'info');
                
                // 如果是批量模式，自动回帖
                if (Storage.isBatchMode()) {
                    await ReplyHandler.autoReplyInThread();
                } else {
                    UI.updateStatus('帖子详情页 - 可使用快速回帖');
                }
            } else if (Utils.isUserListPage()) {
                UI.log('检测到用户列表页', 'info');
                if (!Storage.isBatchMode()) {
                    UI.updateStatus('用户列表页 - 可使用批量回帖');
                } else {
                    // 批量模式下，在列表页继续处理
                    UI.log('批量模式中，准备处理下一个帖子...', 'info');
                    setTimeout(() => {
                        ReplyHandler.processBatch();
                    }, 1500);
                }
            } else {
                UI.log('当前页面类型未知', 'info');
                if (!Storage.isBatchMode()) {
                    UI.updateStatus('待机中');
                }
            }
        }
    };

    // 启动应用
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', App.init);
    } else {
        App.init();
    }

})();

// ==UserScript==
// @name         夸克项目推广查询
// @namespace    http://tampermonkey.net/
// @version      1.0.5
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

    const quarkUID = '100188018441'; // ✅ 你的UID

    function autoQuery() {
        const inputElement = document.querySelector('input[placeholder="请输入夸克UID查询"]');
        if (inputElement) {
            inputElement.value = quarkUID;
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        }

        const submitDiv = document.querySelector('.submit');
        if (submitDiv) {
            submitDiv.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
    }

    function addHeaderColumn() {
        const header = document.querySelector('.row.table_header');
        if (header && !header.querySelector('.custom-total-header')) {
            const headerCell = document.createElement('div');
            headerCell.textContent = '合计';
            headerCell.className = 'custom-total-header';
            headerCell.style.fontWeight = 'bold';
            headerCell.style.backgroundColor = '#f2f2f2';
            header.appendChild(headerCell);
        }
    }

    function calculateTotal(cells) {
        const col1 = parseFloat(cells[1]?.textContent.trim()) || 0;
        const col2 = parseFloat(cells[2]?.textContent.trim()) || 0;
        const col3 = parseFloat(cells[3]?.textContent.trim()) || 0;
        const col4 = parseFloat(cells[4]?.textContent.trim()) || 0;
        return col1 * 7 + col2 * 3 + col3 * 0.3 + col4;
    }

    function addTotalColumnToRow(row) {
        if (row.querySelector('.custom-total-cell')) return; // 避免重复添加

        const cells = row.querySelectorAll('div');
        const total = calculateTotal(cells);

        const sumDiv = document.createElement('div');
        sumDiv.textContent = total.toFixed(2);
        sumDiv.className = 'custom-total-cell';
        sumDiv.style.fontWeight = 'bold';
        sumDiv.style.color = '#007bff';
        row.appendChild(sumDiv);
    }

    function addTotalToAllRows() {
        const rows = document.querySelectorAll('.row.table_body_item');
        rows.forEach(addTotalColumnToRow);
    }

    function observeLazyLoading() {
        const tableBody = document.querySelector('.table_body');
        if (!tableBody) return;

        const observer = new MutationObserver(() => {
            addTotalColumnToRowHeader(); // 确保表头合计存在
            addTotalToAllRows();         // 给新增行加合计
        });

        observer.observe(tableBody, { childList: true, subtree: true });
    }

    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .row > div {
                padding: 4px 8px;
                min-width: 60px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    function addTotalColumnToRowHeader() {
        addHeaderColumn();
    }

    // 初始化流程
    window.addEventListener('load', () => {
        autoQuery();

        setTimeout(() => {
            addTotalColumnToRowHeader();
            addTotalToAllRows();
            observeLazyLoading(); // 🔥 开始监听新数据添加
            addStyles();
        }, 1500); // 延时可根据实际加载调整
    });
})();

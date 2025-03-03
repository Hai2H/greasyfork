// ==UserScript==
// @name         重庆理工自考自动选择答案
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  重庆理工自考自动选择答案，弹窗点击确定自动选择答案，直接交卷即可（只针对单选题型和判断题，因为我没有多选题）
// @license      MIT
// @match        *://cqlg.360xkw.com/*
// ==/UserScript==

(function () {
    'use strict';
    document.onreadystatechange = function () {
        if (document.readyState == 'complete') {

            //找到class为single_list的div
            var divs = document.getElementsByClassName('single_list')[0];
            var childNodes = divs.childNodes;

            for (let i = 0; i < childNodes.length; i++) {
                if (childNodes[i].nodeType === 1) { // check if node is an element node
                    let child = childNodes[i]
                    let parsing = child.getElementsByClassName('Parsing')[0]
                    let answer = parsing.getElementsByClassName('parsingInfo')[0]
                    let answerText = answer.innerText.trim()
                    let positon = 0
                    switch (answerText) {
                        case 'A': positon = 0; break;
                        case 'B': positon = 1; break;
                        case 'C': positon = 2; break;
                        case 'D': positon = 3; break;
                    }
                    let redio = child.getElementsByClassName('redio')[0]
                    let redioChild = redio.querySelectorAll('li')
                    let redioChildNode = redioChild[positon]
                    console.log(redioChildNode.innerText)
                    redioChildNode.click()
                }
            }

            let judgeList = document.getElementsByClassName('judge_list')[0];
            let judgeChild = judgeList.childNodes;
            for (let i = 0; i < judgeChild.length; i++) {
                if (judgeChild[i].nodeType === 1) { // check if node is an element node
                    let child = judgeChild[i]
                    let parsing = child.getElementsByClassName('Parsing')[0]
                    let answer = parsing.getElementsByClassName('parsingInfo')[0]
                    let answerText = answer.innerText.trim()
                    let positon = 0
                    switch (answerText) {
                        case 'A': positon = 0; break;
                        case 'B': positon = 1; break;
                    }
                    let redio = child.getElementsByClassName('redio')[0]
                    let redioChild = redio.querySelectorAll('li')
                    let redioChildNode = redioChild[positon]
                    console.log(redioChildNode.innerText)
                    redioChildNode.click()
                }
            }
        }
    }
    // Your code here...
})();

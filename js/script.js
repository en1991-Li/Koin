/**
 * Koin 記帳 App 完整邏輯控制
 * 整合：頁面切換、帳戶分組彈窗、信用帳戶聯動
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 Lucide 圖示
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // 2. 初始化圖表
    initOverviewChart();
});

// =========================================
// 1. 頁面切換邏輯
// =========================================
function showPage(pageId) {
    // 隱藏所有頁面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 顯示目標頁面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        // 重新渲染新頁面中的圖示
        lucide.createIcons();
    }
}

// =========================================
// 2. 帳戶分組選擇邏輯
// =========================================
function openGroupPicker() {
    const modal = document.getElementById('group-picker-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeGroupPicker() {
    const modal = document.getElementById('group-picker-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * 選擇分組並更新介面文字
 * @param {string} groupName 分組名稱
 */
function selectGroup(groupName) {
    const textElement = document.getElementById('selected-group-text');
    if (textElement) {
        // 更新文字並保留右側箭頭圖示
        textElement.innerHTML = `${groupName} <i data-lucide="chevron-right" class="s-icon"></i>`;
        // 重新渲染新插入的圖示
        lucide.createIcons();
    }
    closeGroupPicker();
}

// =========================================
// 3. 信用帳戶聯動邏輯
// =========================================
function toggleCreditFields() {
    const isCreditCheckbox = document.getElementById('in-is-credit');
    const creditExtraFields = document.getElementById('credit-extra-fields');
    const displayAmount = document.getElementById('add-display-amount');

    if (!isCreditCheckbox || !creditExtraFields || !displayAmount) return;

    if (isCreditCheckbox.checked) {
        // 顯示隱藏欄位 (繳款期限、信用額度)
        creditExtraFields.style.display = 'block';
        
        // 信用帳戶代表負債，餘額顯示為紅色
        displayAmount.classList.remove('text-green');
        displayAmount.classList.add('text-red');
    } else {
        // 隱藏欄位
        creditExtraFields.style.display = 'none';
        
        // 一般帳戶顯示為綠色
        displayAmount.classList.remove('text-red');
        displayAmount.classList.add('text-green');
    }
}

// =========================================
// 4. 圖表初始化
// =========================================
function initOverviewChart() {
    const canvas = document.getElementById('overviewChart');
    if (!canvas) return;

    // 這裡可以使用 Chart.js 或其他繪圖庫
    // 暫時以簡易邏輯代表
    console.log("Chart initialized based on IMG_1144 trend layout.");
}

// =========================================
// 5. 其他互動功能
// =========================================
function handleAccountSubmit() {
    // 這裡處理儲存邏輯
    alert("帳戶已儲存");
    showPage('page-overview');
}

/**
 * Koin 記帳 App 完整邏輯控制
 * 整合：頁面切換、帳戶分組彈窗、信用帳戶聯動、日期選擇優化
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 Lucide 圖示
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // 2. 初始化圖表
    initOverviewChart();

    // 3. 監聽帳單週期變更
    const cycleSelect = document.querySelector('.form-select');
    if (cycleSelect) {
        cycleSelect.addEventListener('change', handleCycleChange);
    }
});

// =========================================
// 1. 頁面切換邏輯
// =========================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
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

function selectGroup(groupName) {
    const textElement = document.getElementById('selected-group-text');
    if (textElement) {
        // 更新文字並保留右側箭頭圖示
        textElement.innerHTML = `${groupName} <i data-lucide="chevron-right" class="s-icon"></i>`;
        lucide.createIcons();
    }
    closeGroupPicker();
}

// =========================================
// 3. 信用帳戶聯動邏輯 (核心修改)
// =========================================
function toggleCreditFields() {
    const isCreditCheckbox = document.getElementById('in-is-credit');
    const creditExtraFields = document.getElementById('credit-extra-fields');
    const displayAmount = document.getElementById('add-display-amount');
    const dateInput = document.querySelector('.form-date');

    if (!isCreditCheckbox || !creditExtraFields || !displayAmount) return;

    if (isCreditCheckbox.checked) {
        // 顯示隱藏欄位 (繳款期限、信用額度)
        creditExtraFields.style.display = 'block';
        
        // 信用帳戶代表負債，餘額顯示為紅色
        displayAmount.classList.remove('text-green');
        displayAmount.classList.add('text-red');

        // 如果日期沒值，設定一個預設值 (例如下個月 1 號)
        if (dateInput && !dateInput.value) {
            dateInput.value = "2026-05-01";
        }
    } else {
        // 隱藏欄位
        creditExtraFields.style.display = 'none';
        
        // 一般帳戶顯示為綠色
        displayAmount.classList.remove('text-red');
        displayAmount.classList.add('text-green');
    }
}

/**
 * 處理帳單週期切換邏輯
 */
function handleCycleChange(event) {
    const selectedCycle = event.target.value;
    console.log("當前選擇的帳單週期為:", selectedCycle);
    
    // 你可以在這裡加入邏輯：當用戶選 4 月週期，自動把繳款期限改為 5 月
    // const datePicker = document.querySelector('.form-date');
    // if (selectedCycle.includes("04/01")) { datePicker.value = "2026-05-15"; }
}

// =========================================
// 4. 圖表初始化
// =========================================
function initOverviewChart() {
    const canvas = document.getElementById('overviewChart');
    if (!canvas) return;

    // 模擬圖表初始化
    console.log("Chart initialized based on IMG_1144 trend layout.");
}

// =========================================
// 5. 提交與存檔
// =========================================
function handleAccountSubmit() {
    // 這裡可以抓取所有的 input 值進行存檔
    const accountName = document.querySelector('input[placeholder="尚未設定"]').value;
    const isCredit = document.getElementById('in-is-credit').checked;
    
    console.log(`正在儲存帳戶: ${accountName}, 類型: ${isCredit ? '信用' : '一般'}`);
    
    alert("帳戶已儲存");
    showPage('page-overview');
}

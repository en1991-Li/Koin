/**
 * Koin 記帳 App 完整邏輯控制 (更新版)
 * 整合：頁面切換、帳戶分組、帳單週期滑桿、繳款期限彈窗
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 Lucide 圖示
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // 2. 初始化圖表
    initOverviewChart();

    // 3. 初始化帳單週期滑桿監聽
    initCycleSlider();
});

// =========================================
// 1. 頁面與彈窗基礎控制
// =========================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        lucide.createIcons();
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// =========================================
// 2. 帳單週期邏輯 (滑桿功能)
// =========================================
function openCyclePicker() {
    openModal('cycle-picker-modal');
}

function initCycleSlider() {
    const slider = document.getElementById('cycle-slider');
    const rangeDisplay = document.getElementById('modal-cycle-range');
    const noteDisplay = document.getElementById('modal-cycle-note');

    if (!slider) return;

    slider.addEventListener('input', (e) => {
        const day = parseInt(e.target.value);
        // 這裡以 2026 年 4 月作為基準進行計算 (對應截圖內容)
        if (day >= 28) {
            rangeDisplay.innerText = "2026/04/01 － 2026/04/30";
            noteDisplay.innerText = "帳單結帳日：每月月底";
        } else {
            const startDay = (day + 1).toString().padStart(2, '0');
            const endDay = day.toString().padStart(2, '0');
            // 跨月計算：從 3 月的隔天到 4 月的結帳日
            rangeDisplay.innerText = `2026/03/${startDay} － 2026/04/${endDay}`;
            noteDisplay.innerText = `帳單結帳日：每月 ${day} 號`;
        }
    });
}

function confirmCycle() {
    const selectedRange = document.getElementById('modal-cycle-range').innerText;
    const mainDisplayText = document.getElementById('display-main-cycle');
    
    if (mainDisplayText) {
        // 更新主頁面顯示並保留箭頭
        mainDisplayText.innerHTML = `${selectedRange} <i data-lucide="chevron-right" class="s-icon"></i>`;
        lucide.createIcons();
    }
    closeModal('cycle-picker-modal');
}

// =========================================
// 3. 繳款期限邏輯 (類型選擇)
// =========================================
function openDueDateTypePicker() {
    openModal('due-date-type-modal');
}

/**
 * 處理繳款期限類型選擇
 * @param {string} type - 'fixed' (每月固定日) 或 'after' (結帳日後幾日)
 */
function selectDueDateType(type) {
    closeModal('due-date-type-modal');
    
    let userValue = "";
    let finalString = "";

    if (type === 'fixed') {
        userValue = prompt("請輸入每月固定繳款日 (1-31):", "1");
        if (userValue) finalString = `每月 ${userValue} 號`;
    } else {
        userValue = prompt("請輸入結帳日後第幾天繳款:", "15");
        if (userValue) finalString = `結帳日後 ${userValue} 天`;
    }

    if (finalString) {
        const displayElement = document.getElementById('display-main-due-date');
        if (displayElement) {
            displayElement.innerHTML = `${finalString} <i data-lucide="chevron-right" class="s-icon"></i>`;
            lucide.createIcons();
        }
    }
}

// =========================================
// 4. 帳戶分組與信用聯動
// =========================================
function selectGroup(groupName) {
    const textElement = document.getElementById('selected-group-text');
    if (textElement) {
        textElement.innerHTML = `${groupName} <i data-lucide="chevron-right" class="s-icon"></i>`;
        lucide.createIcons();
    }
    closeModal('group-picker-modal');
}

function toggleCreditFields() {
    const isCredit = document.getElementById('in-is-credit').checked;
    const extraFields = document.getElementById('credit-extra-fields');
    const amountVal = document.getElementById('add-display-amount');

    if (extraFields) extraFields.style.display = isCredit ? 'block' : 'none';
    
    if (amountVal) {
        // 信用帳戶代表負債，顯示為紅色
        amountVal.className = isCredit ? 'val text-red' : 'val text-green';
    }
}

// =========================================
// 5. 其他初始化 (圖表與提交)
// =========================================
function initOverviewChart() {
    const canvas = document.getElementById('overviewChart');
    if (!canvas) return;
    console.log("圖表初始化完成");
}

function handleAccountSubmit() {
    alert("帳戶已儲存");
    showPage('page-overview');
}

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

// =========================================
// 復刻日曆選取與渲染邏輯
// =========================================

// 初始化：生成 2026/04 的日曆
document.addEventListener('DOMContentLoaded', () => {
    // 預設日期設定為 2026 年 4 月 8 日 (對應 image_3.png)
    const initialDate = new Date(2026, 3, 8); // 注意：月份從 0 開始，3 代表 4 月
    renderReplicatedCalendar(initialDate);
});

// 通用頁面切換 (你原本就有的，保持不變)
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

/**
 * 渲染復刻版日曆
 * @param {Date} date - 當前要顯示月份的任意一天
 */
function renderReplicatedCalendar(date) {
    const gridContainer = document.getElementById('replicant-days-grid');
    const selectedDateDisplay = document.getElementById('replicant-selected-date');
    if (!gridContainer || !selectedDateDisplay) return;

    // 清空舊內容
    gridContainer.innerHTML = '';

    const year = date.getFullYear();
    const month = date.getMonth();

    // 更新顯示的日期標題 (格式為 2026/04/xx)
    const formattedSelectedDay = date.getDate().toString().padStart(2, '0');
    selectedDateDisplay.innerText = `${year}/${(month + 1).toString().padStart(2, '0')}/${formattedSelectedDay}`;

    // 獲取當月第一天是星期幾 (0=週日)
    const firstDayIndex = new Date(year, month, 1).getDay();

    // 獲取當月總天數
    const lastDay = new Date(year, month + 1, 0).getDate();

    // 獲取上月最後一天日期
    const prevLastDay = new Date(year, month, 0).getDate();

    // 1. 生成上個月的剩餘日子 (淺灰色)
    for (let i = firstDayIndex; i > 0; i--) {
        const daySpan = document.createElement('span');
        daySpan.classList.add('replicant-day', 'prev-month');
        daySpan.innerText = (prevLastDay - i + 1).toString().padStart(2, '0');
        gridContainer.appendChild(daySpan);
    }

    // 2. 生成當月日期
    for (let i = 1; i <= lastDay; i++) {
        const daySpan = document.createElement('span');
        daySpan.classList.add('replicant-day', 'current-month');
        
        // 格式化日期 (補零)
        const formattedDay = i.toString().padStart(2, '0');
        daySpan.innerText = formattedDay;

        // 判斷是否為週日，應用紅色
        const currentCheckDate = new Date(year, month, i);
        if (currentCheckDate.getDay() === 0) {
            daySpan.classList.add('sunday');
        }

        // **判斷是否為選取日期** (復刻 image_3.png 至 image_10.png 的選取效果)
        // 這裡預設將 date 參數傳入的那天設為選取
        if (i === date.getDate()) {
            daySpan.classList.add('selected');
        }

        // 綁定點擊事件，處理選取與更新標題
        daySpan.addEventListener('click', () => {
            handleDaySelection(daySpan, year, month, i);
        });

        gridContainer.appendChild(daySpan);
    }

    // 3. 生成下個月的起始日子 (淺灰色，確保網格對齊)
    const totalSlots = firstDayIndex + lastDay;
    const nextDays = (7 - (totalSlots % 7)) % 7;
    for (let i = 1; i <= nextDays; i++) {
        const daySpan = document.createElement('span');
        daySpan.classList.add('replicant-day', 'next-month');
        daySpan.innerText = i.toString().padStart(2, '0');
        gridContainer.appendChild(daySpan);
    }
}

/**
 * 處理日期選取的點擊事件
 */
function handleDaySelection(selectedElement, year, month, day) {
    // 1. 移除舊的選取狀態
    const prevSelected = document.querySelector('.replicant-day.selected');
    if (prevSelected) {
        prevSelected.classList.remove('selected');
    }

    // 2. 加入新的選取狀態 (套用亮藍色圓圈)
    selectedElement.classList.add('selected');

    // 3. 更新標題顯示
    const selectedDateDisplay = document.getElementById('replicant-selected-date');
    if (selectedDateDisplay) {
        const formattedSelectedDay = day.toString().padStart(2, '0');
        const formattedMonth = (month + 1).toString().padStart(2, '0');
        selectedDateDisplay.innerText = `${year}/${formattedMonth}/${formattedSelectedDay}`;
    }
    
    // 這裡可以加入其他連動邏輯 (例如：載入該日期的記帳記錄)
}

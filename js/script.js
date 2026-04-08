/**
 * Koin 記帳 App 完整邏輯控制
 * 整合：頁面切換、導覽列狀態、帳戶分組、日曆渲染
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 Lucide 圖示
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // 2. 初始化功能
    initOverviewChart();
    initCycleSlider();
    
    // 3. 初始化日曆 (預設 2026/04/08)
    const initialDate = new Date(2026, 3, 8); 
    renderReplicatedCalendar(initialDate);

    // 4. 初始化導覽列監聽 (確保點擊時有顏色變化)
    initTabBar();
});

// =========================================
// 1. 核心：頁面切換與導覽列 Active 狀態
// =========================================
function showPage(pageId, element) {
    // 隱藏所有頁面，顯示目標頁面
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // 處理導覽列顏色切換
    if (element && element.classList.contains('tab-item')) {
        document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
        element.classList.add('active');
    }
}

// 備援監聽：確保沒有寫在 onclick 裡的導覽按鈕也能運作
function initTabBar() {
    const tabItems = document.querySelectorAll('.tab-item');
    tabItems.forEach(item => {
        item.addEventListener('click', function() {
            // 如果 HTML 沒有寫 onclick，就從這裡觸發顏色切換
            if (!this.getAttribute('onclick')) {
                document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

// =========================================
// 2. 彈窗控制
// =========================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// =========================================
// 3. 帳單週期滑桿
// =========================================
function initCycleSlider() {
    const slider = document.getElementById('cycle-slider');
    const rangeDisplay = document.getElementById('modal-cycle-range');
    const noteDisplay = document.getElementById('modal-cycle-note');

    if (!slider) return;

    slider.addEventListener('input', (e) => {
        const day = parseInt(e.target.value);
        if (day >= 28) {
            rangeDisplay.innerText = "2026/04/01 － 2026/04/30";
            noteDisplay.innerText = "帳單結帳日：每月月底";
        } else {
            const startDay = (day + 1).toString().padStart(2, '0');
            const endDay = day.toString().padStart(2, '0');
            rangeDisplay.innerText = `2026/03/${startDay} － 2026/04/${endDay}`;
            noteDisplay.innerText = `帳單結帳日：每月 ${day} 號`;
        }
    });
}

// =========================================
// 4. 日曆渲染與選取邏輯
// =========================================
function renderReplicatedCalendar(date) {
    const gridContainer = document.getElementById('replicant-days-grid');
    const selectedDateDisplay = document.getElementById('replicant-selected-date');
    if (!gridContainer || !selectedDateDisplay) return;

    gridContainer.innerHTML = '';
    const year = date.getFullYear();
    const month = date.getMonth();

    // 更新標題
    const formattedSelectedDay = date.getDate().toString().padStart(2, '0');
    selectedDateDisplay.innerText = `${year}/${(month + 1).toString().padStart(2, '0')}/${formattedSelectedDay}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    // 上個月
    for (let i = firstDayIndex; i > 0; i--) {
        const daySpan = document.createElement('span');
        daySpan.classList.add('replicant-day', 'prev-month');
        daySpan.innerText = (prevLastDay - i + 1).toString().padStart(2, '0');
        gridContainer.appendChild(daySpan);
    }

    // 當月
    for (let i = 1; i <= lastDay; i++) {
        const daySpan = document.createElement('span');
        daySpan.classList.add('replicant-day', 'current-month');
        daySpan.innerText = i.toString().padStart(2, '0');

        if (new Date(year, month, i).getDay() === 0) daySpan.classList.add('sunday');
        if (i === date.getDate()) daySpan.classList.add('selected');

        daySpan.addEventListener('click', () => {
            document.querySelectorAll('.replicant-day').forEach(d => d.classList.remove('selected'));
            daySpan.classList.add('selected');
            const fmtDay = i.toString().padStart(2, '0');
            const fmtMonth = (month + 1).toString().padStart(2, '0');
            selectedDateDisplay.innerText = `${year}/${fmtMonth}/${fmtDay}`;
        });

        gridContainer.appendChild(daySpan);
    }
}

// =========================================
// 5. 圖表與其他功能
// =========================================
function initOverviewChart() {
    console.log("圖表初始化完成");
}

function handleAccountSubmit() {
    alert("帳戶已儲存");
    showPage('page-overview');
}

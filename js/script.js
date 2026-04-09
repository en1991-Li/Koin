/**
 * Koin 記帳 App 完整邏輯控制 (修正版)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 Lucide 圖示
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // 2. 初始化各項功能
    initOverviewChart();
    initCycleSlider();
    
    // 3. 初始化日曆 (2026/04/08)
    const initialDate = new Date(2026, 3, 8); 
    // 確保 ID 存在才渲染
    if(document.getElementById('replicant-days-grid')) {
        renderReplicatedCalendar(initialDate);
    }
});

/**
 * 核心：頁面切換與導覽列狀態
 * @param {string} pageId - 目標頁面 ID
 * @param {HTMLElement} element - 被點擊的按鈕 (由 HTML 傳入 this)
 */
function showPage(pageId, element) {
    // 1. 切換分頁
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    // 2. 切換導覽列狀態
    document.querySelectorAll('.tab-item, .tab-fab').forEach(tab => tab.classList.remove('active'));
    
    if (element) {
        element.classList.add('active');
    }
    
    // 3. 重新整理圖示
    lucide.createIcons();
}

// =========================================
// 其他控制邏輯 (保持不變但優化穩定性)
// =========================================

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

function initCycleSlider() {
    const slider = document.getElementById('cycle-slider');
    const rangeDisplay = document.getElementById('modal-cycle-range');
    const noteDisplay = document.getElementById('modal-cycle-note');
    if (!slider) return;

    slider.addEventListener('input', (e) => {
        const day = parseInt(e.target.value);
        if (day >= 31) {
            rangeDisplay.innerText = "每月月底";
            noteDisplay.innerText = "帳單結帳日：每月月底";
        } else {
            rangeDisplay.innerText = `每月 ${day} 號`;
            noteDisplay.innerText = `帳單結帳日：每月 ${day} 號`;
        }
    });
}

function renderReplicatedCalendar(date) {
    const gridContainer = document.getElementById('replicant-days-grid');
    const selectedDateDisplay = document.getElementById('replicant-selected-date');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    // 渲染上個月
    for (let i = firstDayIndex; i > 0; i--) {
        const span = document.createElement('span');
        span.className = 'replicant-day prev-month';
        span.innerText = (prevLastDay - i + 1).toString().padStart(2, '0');
        gridContainer.appendChild(span);
    }

    // 渲染當月
    for (let i = 1; i <= lastDay; i++) {
        const span = document.createElement('span');
        span.className = 'replicant-day current-month';
        span.innerText = i.toString().padStart(2, '0');
        
        if (new Date(year, month, i).getDay() === 0) span.classList.add('sunday');
        if (i === date.getDate()) span.classList.add('selected');

        span.addEventListener('click', () => {
            document.querySelectorAll('.replicant-day').forEach(d => d.classList.remove('selected'));
            span.classList.add('selected');
            if(selectedDateDisplay) {
                selectedDateDisplay.innerText = `${year}/${(month+1).toString().padStart(2,'0')}/${i.toString().padStart(2,'0')}`;
            }
        });
        gridContainer.appendChild(span);
    }
}

function initOverviewChart() { console.log("圖表已就緒"); }

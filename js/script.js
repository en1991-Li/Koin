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
    // 1. 切換頁面本體
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');

    // 2. 清除所有導覽按鈕的標亮狀態
    const allTabs = document.querySelectorAll('.tab-item, .tab-fab');
    allTabs.forEach(tab => tab.classList.remove('active'));

    // 3. 處理標亮邏輯
    if (element) {
        // 如果是直接點擊導覽列進入
        element.classList.add('active');
    } else {
        // 如果是點擊頁面內的 "+" 跳轉，自動找對應的導覽按鈕
        // 我們找 onclick 屬性包含該 pageId 的按鈕
        const autoTab = document.querySelector(`.tab-bar [onclick*="${pageId}"]`);
        if (autoTab) autoTab.classList.add('active');
    }

    // 4. 特殊處理：進入「新增頁面」時讓導覽列半透明 (可選)
    document.querySelector('.tab-bar').style.opacity = (pageId === 'page-add-account') ? "0.6" : "1";

    // 5. 重新渲染圖示
    if (typeof lucide !== 'undefined') lucide.createIcons();
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

/**
 * Koin 記帳 App 核心邏輯
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 Lucide 圖示
    refreshIcons();
    
    // 2. 初始化各項功能
    initOverviewChart();
    initCycleSlider();
    
    // 3. 設定預設日期 (2026/04/10)
    const today = new Date();
    // 檢查日曆容器是否存在，若存在則調用 calendar.js 的渲染邏輯 (假設寫在裡面)
    if(document.getElementById('calendar-month-slider')) {
        console.log("日曆準備就緒");
    }
});

/**
 * 核心：頁面切換與導覽列狀態
 */
function showPage(pageId, element) {
    // 1. 切換頁面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        // 頁面切換後自動滾回頂部
        const scrollContent = targetPage.querySelector('.content-scroll');
        if (scrollContent) scrollContent.scrollTop = 0;
    }

    // 2. 切換 Tab 狀態
    document.querySelectorAll('.tab-item, .tab-fab').forEach(tab => tab.classList.remove('active'));
    
    if (element) {
        element.classList.add('active');
    } else {
        // 修正：更精確的選擇器，確保抓到導覽列內的按鈕
        const autoTab = document.querySelector(`.tab-bar [onclick*="'${pageId}'"]`);
        if (autoTab) autoTab.classList.add('active');
    }

    // 3. 重新渲染圖示
    refreshIcons();
}

/**
 * 輔助：刷新圖示
 */
function refreshIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * 帳單週期滑桿控制
 */
function initCycleSlider() {
    const slider = document.getElementById('cycle-slider');
    const rangeDisplay = document.getElementById('modal-cycle-range');
    
    if (!slider || !rangeDisplay) return;

    slider.addEventListener('input', (e) => {
        const val = e.target.value;
        rangeDisplay.innerText = (val == 31) ? "每月月底" : `每月 ${val} 號`;
    });
}

// 彈窗通用控制
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

function initOverviewChart() { 
    // 未來繪製 Chart.js 可以在此處實作
    console.log("圖表系統已掛載"); 
}

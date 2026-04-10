/**
 * Koin 記帳 App 核心邏輯 - script.js
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化圖示
    refreshIcons();
    
    // 2. 初始化各項 UI 功能
    initCycleSlider();
    initOverviewChart();
    
    // 3. 初始頁面處理：若有需要一進來就標亮的 Tab
    const activeTab = document.querySelector('.tab-item.active');
    if (activeTab) {
        // 確保初始頁面與 Tab 狀態同步
        console.log("App 初始化完成");
    }
});

/**
 * 核心：頁面切換與導覽列狀態
 * 設為全域函式，供 HTML onclick 調用
 */
window.showPage = function(pageId, element) {
    // 1. 切換頁面本體
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        // 切換後自動回到該頁面頂部
        const scrollContainer = targetPage.querySelector('.content-scroll');
        if (scrollContainer) scrollContainer.scrollTop = 0;
    }

    // 2. 更新導覽列狀態
    const allTabs = document.querySelectorAll('.tab-item, .tab-fab');
    allTabs.forEach(tab => tab.classList.remove('active'));
    
    if (element) {
        // 直接點擊 Tab 進入
        element.classList.add('active');
    } else {
        // 從頁面內按鈕跳轉 (例如 + 號跳到新增頁面)
        // 使用更具彈性的選擇器找尋包含該 pageId 的 onclick 屬性
        const autoTab = document.querySelector(`.tab-bar [onclick*="${pageId}"]`);
        if (autoTab) autoTab.classList.add('active');
    }

    // 3. 頁面特殊視覺處理
    const tabBar = document.querySelector('.tab-bar');
    if (tabBar) {
        // 範例：若在「新增頁面」可微調導覽列透明度，增加沉浸感
        tabBar.style.opacity = (pageId === 'page-add-account') ? "0.7" : "1";
    }

    // 4. 重新渲染 Lucide 圖示
    refreshIcons();
};

/**
 * 輔助：刷新圖示
 */
function refreshIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * 帳單週期滑桿控制 (Modal 內)
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

// 通用彈窗控制
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

function initOverviewChart() { 
    console.log("圖表系統就緒"); 
}

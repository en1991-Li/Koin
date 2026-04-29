/**
 * Koin 動態日曆選擇器 - calendar.js
 */

// 1. 設定初始狀態
let selectedDate = new Date();
const calendarData = {
    startYear: 2025,
    endYear: 2027
};

document.addEventListener('DOMContentLoaded', () => {
    renderInfiniteCalendar();
    setupScrollObserver();
});

/**
 * 自動生成指定年份區間的所有月份
 */
function renderInfiniteCalendar() {
    const slider = document.getElementById('calendar-month-slider');
    if (!slider) return;

    slider.innerHTML = '';

    // 從 2025 到 2027 遍歷年份與月份
    for (let y = calendarData.startYear; y <= calendarData.endYear; y++) {
        for (let m = 0; m < 12; m++) {
            slider.appendChild(createMonthGrid(new Date(y, m, 1)));
        }
    }

    // 預設滾動到「今天」所在的月份
    setTimeout(() => {
        focusOnCurrentMonth();
    }, 100);
}

/**
 * 建立單個月份的網格 (包含日期點擊邏輯)
 */
function createMonthGrid(date) {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const section = document.createElement('div');
    section.className = 'month-section';
    section.setAttribute('data-year', year);
    section.setAttribute('data-month', month);
    
    // 月份標籤 (1月, 2月...)
    const label = document.createElement('div');
    label.className = 'month-label';
    label.innerText = `${month + 1}月`;
    section.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'calendar-grid-body';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 1. 填充上個月空位
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-grid-day not-current';
        grid.appendChild(empty);
    }

    // 2. 填充日期
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        const isSelected = (year === selectedDate.getFullYear() && 
                            month === selectedDate.getMonth() && 
                            i === selectedDate.getDate());
        
        const dayOfWeek = new Date(year, month, i).getDay();
        
        // 標記今日、週末與選中狀態
        dayDiv.className = `calendar-grid-day current ${isSelected ? 'active' : ''} ${dayOfWeek === 0 ? 'sunday' : ''} ${dayOfWeek === 6 ? 'saturday' : ''}`;
        dayDiv.innerHTML = `<span class="date-val">${i < 10 ? '0' + i : i}</span>`;
        
        // 點擊事件：選取日期並更新 UI
        dayDiv.onclick = () => {
            // 清除全域所有的 active 狀態
            document.querySelectorAll('.calendar-grid-day').forEach(d => d.classList.remove('active'));
            dayDiv.classList.add('active');
            
            selectedDate = new Date(year, month, i);
            
            // 這裡可以觸發儲存或顯示該日帳目的功能
            updateDailyInfo(selectedDate);
        };
        
        grid.appendChild(dayDiv);
    }

    section.appendChild(grid);
    return section;
}

/**
 * 輔助：自動滾動到當前選中的月份
 */
function focusOnCurrentMonth() {
    const slider = document.getElementById('calendar-month-slider');
    const currentMonthSection = slider.querySelector(
        `[data-year="${selectedDate.getFullYear()}"][data-month="${selectedDate.getMonth()}"]`
    );
    
    if (currentMonthSection) {
        slider.scrollTo({
            left: currentMonthSection.offsetLeft,
            behavior: 'auto' // 初始跳轉用 auto，使用者操作用 smooth
        });
    }
}

/**
 * 更新頂部標題與資料顯示
 */
function updateHeaderTitle(year, month) {
    const title = document.getElementById('full-calendar-month');
    if (title) title.innerText = `${year}/${(month + 1).toString().padStart(2, '0')}`;
}

function updateDailyInfo(date) {
    // 範例：更新下方列表的標題
    const listTitle = document.getElementById('daily-details-list');
    if (listTitle) {
        console.log("切換日期至：", date.toLocaleDateString());
    }
}

/**
 * 監聽水平滾動，動態更新標題
 */
function setupScrollObserver() {
    const container = document.getElementById('calendar-month-slider');
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const year = entry.target.getAttribute('data-year');
                const month = entry.target.getAttribute('data-month');
                updateHeaderTitle(year, parseInt(month));
            }
        });
    }, { root: container, threshold: 0.6 });

    // 延遲觀察確保 DOM 已渲染
    setTimeout(() => {
        document.querySelectorAll('.month-section').forEach(s => observer.observe(s));
    }, 500);
}

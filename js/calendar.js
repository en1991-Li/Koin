/**
 * Koin 動態日曆選擇器 - calendar.js
 */

// 1. 設定初始狀態
let selectedDate = new Date(2026, 7, 16); // 預設 2026 年 7 月 16 日
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

    // 預設滾動到選中月份
    setTimeout(() => {
        focusOnCurrentMonth();
    }, 100);
}

/**
 * 建立單個月份的網格 (包含完整日期點擊與連動邏輯)
 */
function createMonthGrid(date) {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const section = document.createElement('div');
    section.className = 'month-section';
    section.setAttribute('data-year', year);
    section.setAttribute('data-month', month);
    
    // 月份標籤
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

    // 2. 填充實體日期
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        const isSelected = (year === selectedDate.getFullYear() && 
                            month === selectedDate.getMonth() && 
                            i === selectedDate.getDate());
        
        const dayOfWeek = new Date(year, month, i).getDay();
        
        dayDiv.className = `calendar-grid-day current ${isSelected ? 'active' : ''} ${dayOfWeek === 0 ? 'sunday' : ''} ${dayOfWeek === 6 ? 'saturday' : ''}`;
        dayDiv.innerHTML = `<span class="date-val">${i < 10 ? '0' + i : i}</span>`;
        
        // 點擊事件：直接觸發連動處理器
        dayDiv.onclick = function() {
            onCalendarDateClick(year, month + 1, i, this);
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
    if (!slider) return;
    const currentMonthSection = slider.querySelector(
        `[data-year="${selectedDate.getFullYear()}"][data-month="${selectedDate.getMonth()}"]`
    );
    
    if (currentMonthSection) {
        slider.scrollTo({
            left: currentMonthSection.offsetLeft,
            behavior: 'auto'
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

/**
 * 監聽水平滾動，動態更新頂部月份
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

    setTimeout(() => {
        document.querySelectorAll('.month-section').forEach(s => observer.observe(s));
    }, 500);
}

/**
 * 點擊日曆介面上的特定日期：切換高亮外圈並即時過濾明細
 */
function onCalendarDateClick(year, month, day, element) {
    const padMonth = String(month).padStart(2, '0');
    const padDay = String(day).padStart(2, '0');
    const fullDate = `${year}/${padMonth}/${padDay}`;

    // 1. 更新全域選中日期
    selectedDate = new Date(year, month - 1, day);
    if (typeof recordState !== 'undefined') {
        recordState.date = fullDate;
    }

    // 2. 更新頂部 Header 顯示選中日期 (例如 2026/08/16)
    const headerTitle = document.getElementById('full-calendar-month');
    if (headerTitle) {
        headerTitle.innerText = fullDate;
    }

    // 3. 切換選中高亮圈 (active class)
    document.querySelectorAll('.calendar-grid-day').forEach(el => el.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }

    // 4. 即時重新渲染該日期的明細清單
    if (typeof renderDailyDetailsList === 'function') {
        renderDailyDetailsList();
    }
}

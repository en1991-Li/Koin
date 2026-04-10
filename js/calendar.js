/**
 * Koin 日曆核心邏輯 - calendar.js
 */

// 1. 設定初始選中狀態 (2026/04/08)
let selectedDate = new Date(2026, 3, 8); 

document.addEventListener('DOMContentLoaded', () => {
    // 渲染全年度日曆
    renderYearlyCalendar();
    
    // 初始化滾動監聽 (IntersectionObserver)
    setupScrollObserver();
});

/**
 * 渲染全年度日曆
 */
function renderYearlyCalendar() {
    const slider = document.getElementById('calendar-month-slider');
    if (!slider) return;

    slider.innerHTML = '';
    // 生成 2026 年 1-12 月
    for (let m = 0; m < 12; m++) {
        slider.appendChild(createMonthGrid(new Date(2026, m, 1)));
    }

    // 當切換到日曆頁面時，確保滾動到 4 月
    // 這邊在 showPage 呼叫時處理會更準確，但在這裡先做預設滾動
    setTimeout(() => {
        scrollToMonth(3); // 跳轉到 4 月 (Index 3)
    }, 300);
}

/**
 * 建立單個月份的網格結構
 */
function createMonthGrid(date) {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const section = document.createElement('div');
    section.className = 'month-section';
    section.setAttribute('data-year', year);
    section.setAttribute('data-month', month);
    
    // 雖然 CSS 設為隱藏，但 data 屬性留著給標籤用
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
        dayDiv.className = `calendar-grid-day current ${isSelected ? 'active' : ''} ${dayOfWeek === 0 ? 'sunday' : ''} ${dayOfWeek === 6 ? 'saturday' : ''}`;
        
        dayDiv.innerHTML = `<span class="date-val">${i < 10 ? '0' + i : i}</span>`;
        
        dayDiv.onclick = () => {
            // 清除該容器內的所有 active
            document.querySelectorAll('.calendar-grid-day').forEach(d => d.classList.remove('active'));
            dayDiv.classList.add('active');
            
            selectedDate = new Date(year, month, i);
            console.log("當前選中：", selectedDate.toLocaleDateString());
            
            // 此處可擴充：更新下方的每日明細列表
            if (typeof renderDailyDetails === "function") {
                renderDailyDetails(selectedDate);
            }
        };
        
        grid.appendChild(dayDiv);
    }

    section.appendChild(grid);
    return section;
}

/**
 * 更新頂部標題 (2026/04)
 */
function updateHeaderTitle(year, month) {
    const title = document.getElementById('full-calendar-month');
    if (title) {
        title.innerText = `${year}/${(month + 1).toString().padStart(2, '0')}`;
    }
}

/**
 * 監聽滾動：當月份進入視野時更新標題
 */
function setupScrollObserver() {
    const container = document.getElementById('calendar-month-slider');
    if (!container) return;

    const observerOptions = {
        root: container,
        threshold: 0.6 // 提高門檻，確保過半才切換標題
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const year = entry.target.getAttribute('data-year');
                const month = parseInt(entry.target.getAttribute('data-month'));
                updateHeaderTitle(year, month);
            }
        });
    }, observerOptions);

    // 等待元素渲染後再開始觀察
    setTimeout(() => {
        document.querySelectorAll('.month-section').forEach(section => observer.observe(section));
    }, 500);
}

/**
 * 工具：滾動到特定月份
 */
function scrollToMonth(monthIndex) {
    const slider = document.getElementById('calendar-month-slider');
    if (slider && slider.children[monthIndex]) {
        slider.scrollTo({
            left: slider.children[monthIndex].offsetLeft,
            behavior: 'smooth'
        });
    }
}

// 1. 設定初始日期與狀態
let selectedDate = new Date(2026, 3, 8); // 預設選中 2026/04/08
const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

function renderYearlyCalendar() {
    const slider = document.getElementById('calendar-month-slider');
    if (!slider) return;

    slider.innerHTML = '';
    for (let m = 0; m < 12; m++) {
        slider.appendChild(createMonthGrid(new Date(2026, m, 1)));
    }

    // 初始滾動到當前月份 (4月)
    setTimeout(() => {
        const april = slider.children[3];
        april.scrollIntoView({ inline: 'start' });
    }, 100);

    // 監聽水平滾動以更新標題
    slider.addEventListener('scroll', () => {
        const index = Math.round(slider.scrollLeft / slider.offsetWidth);
        updateHeaderTitle(2026, index);
    });
}

function createMonthGrid(date) {
    const month = date.getMonth();
    const year = date.getFullYear();
    const section = document.createElement('div');
    section.className = 'month-section';
    
    section.innerHTML = `<div class="month-label">${month + 1}月</div>`;
    const grid = document.createElement('div');
    grid.className = 'calendar-grid-body';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 填補空格
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-grid-day not-current';
        grid.appendChild(empty);
    }

    // 填日期
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        const isSelected = (year === 2026 && month === 3 && i === 8);
        const dayOfWeek = new Date(year, month, i).getDay();
        
        dayDiv.className = `calendar-grid-day current ${isSelected ? 'active' : ''} ${dayOfWeek === 0 ? 'sunday' : ''} ${dayOfWeek === 6 ? 'saturday' : ''}`;
        dayDiv.innerHTML = `<span class="date-val">${i < 10 ? '0'+i : i}</span>`;
        
        dayDiv.onclick = () => {
            document.querySelectorAll('.calendar-grid-day').forEach(d => d.classList.remove('active'));
            dayDiv.classList.add('active');
            // 此處呼叫更新下方記錄的函數
            renderDailyDetails(`${year}/${(month+1).toString().padStart(2,'0')}/${i.toString().padStart(2,'0')}`);
        };
        grid.appendChild(dayDiv);
    }
    section.appendChild(grid);
    return section;
}

function updateHeaderTitle(year, month) {
    const title = document.getElementById('full-calendar-month');
    if (title) title.innerText = `${year}/${(month + 1).toString().padStart(2, '0')}`;
}


/**
 * 建立單個月份的網格結構
 */
function createMonthGrid(date) {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const section = document.createElement('div');
    section.className = 'month-section';
    // 設定 data 屬性供滾動偵測使用
    section.setAttribute('data-year', year);
    section.setAttribute('data-month', month);
    
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
            // 清除舊選取並更新新選取
            document.querySelectorAll('.calendar-grid-day').forEach(d => d.classList.remove('active'));
            dayDiv.classList.add('active');
            
            // 更新全域選中日期
            selectedDate = new Date(year, month, i);
            
            // 如果有同步函數（如更新首頁列表），在此呼叫
            if (typeof updateAllCalendars === "function") {
                updateAllCalendars(year, month, i);
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
    const container = document.getElementById('calendar-scroll-body');
    const sections = document.querySelectorAll('.month-section');

    const observerOptions = {
        root: container,
        threshold: 0.3 // 當月份區塊出現 30% 時觸發標題切換
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

    sections.forEach(section => observer.observe(section));
}

document.addEventListener('DOMContentLoaded', () => {
    // 渲染 12 個月
    renderYearlyCalendar(); 
    
    // 初始化中間按鈕的點擊事件，確保切換到日曆頁面時能看到內容
    const fabBtn = document.querySelector('.tab-fab');
    if (fabBtn) {
        fabBtn.onclick = () => {
            showPage('page-calendar');
            // 切換頁面後重新計算一次寬度 (防止滑動失效)
            const slider = document.getElementById('calendar-month-slider');
            if (slider) slider.scrollLeft = slider.offsetWidth * 3; // 預設跳到 4 月
        };
    }
});


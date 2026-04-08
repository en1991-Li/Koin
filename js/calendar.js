// 設定目前顯示的起始月份
let currentViewDate = new Date(2026, 3, 1); 

function renderInfiniteCalendar() {
    const container = document.getElementById('calendar-scroll-body');
    if (!container) return;

    container.innerHTML = '';

    // 生成前後各三個月，共七個月
    for (let i = -3; i <= 3; i++) {
        const monthDate = new Date(2026, 3 + i, 1);
        container.appendChild(createMonthGrid(monthDate));
    }
}

function createMonthGrid(date) {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const section = document.createElement('div');
    section.className = 'month-section';
    
    // 背景大大的月份字樣
    const label = document.createElement('div');
    label.className = 'month-label';
    label.innerText = `${month + 1}月`;
    section.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'calendar-grid-body';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 1. 填空位 (維持網格對齊)
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-grid-day not-current';
        grid.appendChild(empty);
    }

    // 2. 填日期
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        const isSelected = (year === selectedDate.getFullYear() && 
                            month === selectedDate.getMonth() && 
                            i === selectedDate.getDate());
        
        const dayOfWeek = new Date(year, month, i).getDay();
        dayDiv.className = `calendar-grid-day current ${isSelected ? 'active' : ''} ${dayOfWeek === 0 ? 'sunday' : ''} ${dayOfWeek === 6 ? 'saturday' : ''}`;
        
        dayDiv.innerHTML = `<span class="date-val">${i < 10 ? '0' + i : i}</span>`;
        
        dayDiv.onclick = () => {
            selectedDate = new Date(year, month, i);
            document.querySelectorAll('.calendar-grid-day').forEach(d => d.classList.remove('active'));
            dayDiv.classList.add('active');
            updateHeaderTitle(year, month);
        };
        
        grid.appendChild(dayDiv);
    }

    section.appendChild(grid);
    return section;
}

// 更新 Header 顯示的年月
function updateHeaderTitle(year, month) {
    const title = document.getElementById('full-calendar-month');
    if (title) title.innerText = `${year}/${(month + 1).toString().padStart(2, '0')}`;
}

// 監聽滾動以切換 Header 的年月 (選配，提升擬真度)
document.getElementById('calendar-scroll-body')?.addEventListener('scroll', (e) => {
    // 這裡可以加入 logic 偵測目前最靠近頂端的月份區塊，並更新 Header
});

document.addEventListener('DOMContentLoaded', renderInfiniteCalendar);

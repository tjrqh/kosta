/* ════════════════════════════════════════
   app.js  —  My Calendar Logic
════════════════════════════════════════ */

// ── STATE ──────────────────────────────
let events = JSON.parse(localStorage.getItem('mycal_events') || '[]');
let currentYear, currentMonth;
let selectedType = 'dday';
let activeDetail = null;

const today = new Date();
today.setHours(0, 0, 0, 0);


// ══════════════════════════════════════
//  INIT
// ══════════════════════════════════════
function init() {
  currentYear  = today.getFullYear();
  currentMonth = today.getMonth();
  bindEvents();
  render();
}


// ══════════════════════════════════════
//  PERSISTENCE
// ══════════════════════════════════════
function saveEvents() {
  localStorage.setItem('mycal_events', JSON.stringify(events));
}


// ══════════════════════════════════════
//  DATE UTILITIES
// ══════════════════════════════════════

/** "YYYY-MM-DD" 형식의 키 생성 */
function toDateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** 키를 Date 객체로 변환 */
function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** D-Day 텍스트 계산 */
function ddayText(dateKey) {
  const diff = Math.round((parseKey(dateKey) - today) / 86400000);
  if (diff === 0) return 'D-Day!';
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
}

/** D-Day 뱃지 CSS 클래스 결정 */
function ddayBadgeClass(dateKey) {
  const diff = Math.round((parseKey(dateKey) - today) / 86400000);
  if (diff === 0) return 'today-badge';
  return diff > 0 ? 'future' : 'past';
}

/** 날짜를 한국어 포맷으로 변환 */
function formatDate(key) {
  return parseKey(key).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  });
}


// ══════════════════════════════════════
//  RENDER — 메인 렌더 진입점
// ══════════════════════════════════════
function render() {
  renderHeader();
  renderCalendar();
  renderDdayList();
  renderMiniCal();
}

// ── 헤더 월 라벨 ──────────────────────
function renderHeader() {
  document.getElementById('currentMonthLabel').textContent =
    `${currentYear}년 ${currentMonth + 1}월`;
}

// ── 메인 캘린더 그리드 ─────────────────
function renderCalendar() {
  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  const firstDay     = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth  = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrev   = new Date(currentYear, currentMonth, 0).getDate();
  const totalCells   = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    let y = currentYear, m = currentMonth, d;
    let isOther = false;

    // 이전 달
    if (i < firstDay) {
      d = daysInPrev - firstDay + i + 1;
      m = currentMonth - 1;
      if (m < 0) { m = 11; y--; }
      isOther = true;

    // 다음 달
    } else if (i >= firstDay + daysInMonth) {
      d = i - firstDay - daysInMonth + 1;
      m = currentMonth + 1;
      if (m > 11) { m = 0; y++; }
      isOther = true;

    // 현재 달
    } else {
      d = i - firstDay + 1;
    }

    const key        = toDateKey(y, m, d);
    const dayOfWeek  = new Date(y, m, d).getDay();
    const isToday    = (y === today.getFullYear() && m === today.getMonth() && d === today.getDate());

    // 셀 생성
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    if (isOther)          cell.classList.add('other-month');
    if (isToday)          cell.classList.add('today');
    if (dayOfWeek === 0)  cell.classList.add('sunday');
    if (dayOfWeek === 6)  cell.classList.add('saturday');

    // 날짜 숫자
    const numDiv = document.createElement('div');
    numDiv.className  = 'day-number';
    numDiv.textContent = d;
    cell.appendChild(numDiv);

    // 이날의 이벤트
    const dayEvents = events.filter(e => e.date === key);
    const evBox     = document.createElement('div');
    evBox.className = 'cell-events';

    const maxShow = 3;
    dayEvents.slice(0, maxShow).forEach(ev => {
      const evEl = document.createElement('div');
      evEl.className   = `cell-event ${ev.type === 'dday' ? 'is-dday' : 'is-event'}`;
      evEl.textContent = (ev.type === 'dday' ? '📍 ' : '📅 ') + ev.title;
      evEl.addEventListener('click', e => { e.stopPropagation(); showDetail(ev, e); });
      evBox.appendChild(evEl);
    });

    if (dayEvents.length > maxShow) {
      const more = document.createElement('div');
      more.className   = 'more-events';
      more.textContent = `+${dayEvents.length - maxShow}개`;
      evBox.appendChild(more);
    }

    cell.appendChild(evBox);

    // 셀 클릭 → 해당 날짜로 모달 열기
    cell.addEventListener('click', () => {
      document.getElementById('eventDate').value = key;
      openModal();
    });

    grid.appendChild(cell);
  }
}

// ── D-Day 사이드바 목록 ────────────────
function renderDdayList() {
  const list  = document.getElementById('ddayList');
  const count = document.getElementById('ddayCount');

  const ddayEvents = events
    .filter(e => e.type === 'dday')
    .sort((a, b) => Math.abs(parseKey(a.date) - today) - Math.abs(parseKey(b.date) - today));

  count.textContent = ddayEvents.length;

  if (ddayEvents.length === 0) {
    list.innerHTML = '<div class="dday-empty">📭 등록된 D-Day가<br>없습니다</div>';
    return;
  }

  list.innerHTML = '';
  ddayEvents.forEach(ev => {
    const item = document.createElement('div');
    item.className = 'dday-item';
    item.innerHTML = `
      <button class="delete-btn" onclick="deleteEvent('${ev.id}', event)">✕</button>
      <div class="event-title">${ev.title}</div>
      <div class="event-date-small">${formatDate(ev.date)}</div>
      <span class="dday-badge ${ddayBadgeClass(ev.date)}">${ddayText(ev.date)}</span>
    `;
    item.addEventListener('click', e => showDetail(ev, e));
    list.appendChild(item);
  });
}

// ── 미니 캘린더 (사이드바 상단) ──────────
function renderMiniCal() {
  const container   = document.getElementById('miniCal');
  const y = currentYear, m = currentMonth;
  const firstDay    = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysInPrev  = new Date(y, m, 0).getDate();
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const monthNames  = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  let html = `
    <div class="mini-cal-header">
      <button onclick="changeMonth(-1)">‹</button>
      <span>${y}년 ${monthNames[m]}</span>
      <button onclick="changeMonth(1)">›</button>
    </div>
    <div class="mini-grid">
      <div class="wd">일</div><div class="wd">월</div><div class="wd">화</div>
      <div class="wd">수</div><div class="wd">목</div><div class="wd">금</div><div class="wd">토</div>
  `;

  for (let i = 0; i < totalCells; i++) {
    let cy = y, cm = m, cd;
    let isOther = false;

    if (i < firstDay) {
      cd = daysInPrev - firstDay + i + 1;
      cm = m - 1; if (cm < 0) { cm = 11; cy--; }
      isOther = true;
    } else if (i >= firstDay + daysInMonth) {
      cd = i - firstDay - daysInMonth + 1;
      cm = m + 1; if (cm > 11) { cm = 0; cy++; }
      isOther = true;
    } else {
      cd = i - firstDay + 1;
    }

    const key     = toDateKey(cy, cm, cd);
    const isToday = (cy === today.getFullYear() && cm === today.getMonth() && cd === today.getDate());
    const hasEv   = events.some(e => e.date === key);
    const cls     = ['md', isOther ? 'mini-other' : '', isToday ? 'mini-today' : '', hasEv ? 'has-event' : ''].join(' ');

    html += `<div class="${cls}" onclick="jumpToDate(${cy},${cm})">${cd}</div>`;
  }

  html += '</div>';
  container.innerHTML = html;
}


// ══════════════════════════════════════
//  MODAL  —  일정 추가 다이얼로그
// ══════════════════════════════════════
function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('eventTitle').focus();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('eventTitle').value = '';
  document.getElementById('eventNote').value  = '';
  selectType('dday');
}

/** D-Day / 일반 일정 타입 선택 */
function selectType(type) {
  selectedType = type;
  document.getElementById('typeDday').className  = `type-btn ${type === 'dday'  ? 'active-dday'  : ''}`;
  document.getElementById('typeEvent').className = `type-btn ${type === 'event' ? 'active-event' : ''}`;
}

/** 일정 저장 */
function saveEvent() {
  const title = document.getElementById('eventTitle').value.trim();
  const date  = document.getElementById('eventDate').value;
  const note  = document.getElementById('eventNote').value.trim();

  // 유효성 검사
  if (!title) { flashError('eventTitle'); return; }
  if (!date)  { flashError('eventDate');  return; }

  events.push({ id: Date.now().toString(), title, date, type: selectedType, note });
  saveEvents();
  closeModal();
  render();
}

/** 입력 오류 시 테두리 빨간색 깜빡임 */
function flashError(id) {
  const el = document.getElementById(id);
  el.style.borderColor = 'var(--dday)';
  setTimeout(() => (el.style.borderColor = ''), 1200);
}


// ══════════════════════════════════════
//  NAVIGATION  —  월 이동
// ══════════════════════════════════════
function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  if (currentMonth < 0)  { currentMonth = 11; currentYear--; }
  render();
}

function jumpToDate(y, m) {
  currentYear  = y;
  currentMonth = m;
  render();
}


// ══════════════════════════════════════
//  DETAIL POPUP  —  이벤트 상세 팝업
// ══════════════════════════════════════
function showDetail(ev, e) {
  e.stopPropagation();
  const popup = document.getElementById('detailPopup');

  document.getElementById('dp-title').textContent = ev.title;
  document.getElementById('dp-date').textContent  = formatDate(ev.date);

  const typeEl = document.getElementById('dp-type');
  if (ev.type === 'dday') {
    typeEl.textContent = 'D-Day';
    typeEl.className   = 'detail-type dday';
    document.getElementById('dp-dday').textContent = ddayText(ev.date);
  } else {
    typeEl.textContent = '일반 일정';
    typeEl.className   = 'detail-type event';
    document.getElementById('dp-dday').textContent = ev.note || '';
  }

  document.getElementById('dp-delete').onclick = () => {
    deleteEvent(ev.id);
    hideDetail();
  };

  // 팝업 위치 계산
  const rect = e.target.getBoundingClientRect();
  let left = rect.left;
  let top  = rect.bottom + 8;
  if (left + 280 > window.innerWidth) left = window.innerWidth - 290;
  if (top  + 180 > window.innerHeight) top = rect.top - 180;
  popup.style.left = left + 'px';
  popup.style.top  = top  + 'px';

  popup.classList.add('show');
  activeDetail = ev.id;
}

function hideDetail() {
  document.getElementById('detailPopup').classList.remove('show');
  activeDetail = null;
}


// ══════════════════════════════════════
//  DELETE
// ══════════════════════════════════════
function deleteEvent(id, e) {
  if (e) e.stopPropagation();
  events = events.filter(ev => ev.id !== id);
  saveEvents();
  render();
  hideDetail();
}


// ══════════════════════════════════════
//  EVENT BINDINGS  —  DOM 이벤트 연결
// ══════════════════════════════════════
function bindEvents() {
  // 헤더 버튼
  document.getElementById('prevBtn').addEventListener('click', () => changeMonth(-1));
  document.getElementById('nextBtn').addEventListener('click', () => changeMonth(1));
  document.getElementById('todayBtn').addEventListener('click', () => {
    currentYear  = today.getFullYear();
    currentMonth = today.getMonth();
    render();
  });

  // 일정 추가 버튼
  document.getElementById('openModalBtn').addEventListener('click', () => {
    document.getElementById('eventDate').value = toDateKey(currentYear, currentMonth, today.getDate());
    openModal();
  });

  // 모달 닫기
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  // 저장
  document.getElementById('saveEventBtn').addEventListener('click', saveEvent);
  document.getElementById('eventTitle').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveEvent();
  });

  // 팝업 닫기
  document.getElementById('closeDetail').addEventListener('click', hideDetail);
  document.addEventListener('click', e => {
    const popup = document.getElementById('detailPopup');
    if (popup.classList.contains('show') && !popup.contains(e.target)) hideDetail();
  });
}


// ══════════════════════════════════════
//  ENTRY POINT
// ══════════════════════════════════════
init();
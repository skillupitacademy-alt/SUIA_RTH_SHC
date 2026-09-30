document.addEventListener('DOMContentLoaded', () => {
  setupSidebarToggle();
  fetchData();
});

function setupSidebarToggle() {
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const closeBtn = document.getElementById('close-sidebar-btn');
  const sidebar = document.getElementById('metrics-sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  const openSidebar = () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  };

  const closeSidebar = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  };

  toggleBtn.addEventListener('click', openSidebar);
  closeBtn.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);
}

function fetchData() {
  fetch('data.json')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return response.json();
    })
    .then(data => renderDashboard(data))
    .catch(err => console.error('Error loading JSON data:', err));
}

function renderDashboard(data) {
  const block = data.blocks && data.blocks[0] ? data.blocks[0] : {};

  // Group 1: Lifecycle & Status
  document.getElementById('ts-first').innerText = formatDate(block.firstViewedAt);
  document.getElementById('ts-last').innerText = formatDate(block.lastViewedAt);
  document.getElementById('ts-complete').innerText = formatDate(block.completedAt);
  document.getElementById('block-status').innerText = (block.status || '').toUpperCase();

  // Group 2: Engagement Metrics
  document.getElementById('visit-count').innerText = block.visitCount ?? '-';
  document.getElementById('revision-count').innerText = block.revisionCount ?? '-';
  document.getElementById('attempts-count').innerText = block.attempts ?? '-';
  document.getElementById('score-val').innerText = block.score !== null && block.score !== undefined ? block.score : 'null';

  // Group 3: Time Performance
  document.getElementById('active-time').innerText = `${block.activeTimeSec || 0}s`;
  document.getElementById('target-time').innerText = `${block.expectedTimeSec || 0}s`;
  
  if (block.timeComparison) {
    const diff = block.timeComparison.differenceSec;
    document.getElementById('time-diff').innerText = diff !== undefined ? `${diff > 0 ? '+' : ''}${diff}s` : '-';
    document.getElementById('perf-pct').innerText = block.timeComparison.percentageOfExpected !== undefined ? `${block.timeComparison.percentageOfExpected}%` : '-';
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
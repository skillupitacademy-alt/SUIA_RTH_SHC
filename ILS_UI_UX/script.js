document.addEventListener('DOMContentLoaded', () => {
  setupSidebarToggle();
  
  fetch('data.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      renderOverallProgress(data);
      populateBlockDropdown(data.blocks);
      
      if (data.blocks && data.blocks.length > 0) {
        renderBlockDetails(data.blocks[0]);
      }
    })
    .catch(error => {
      console.error('Failed to load telemetry data:', error);
    });
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

function formatSeconds(totalSec) {
  if (totalSec === null || totalSec === undefined) return '0m 00s';
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function renderOverallProgress(data) {
  const totalActiveSec = data.blocks.reduce((acc, b) => acc + (b.activeTimeSec || 0), 0);
  const formattedState = (data.status || 'in_progress').replace('_', ' ');

  document.getElementById('overall-state').innerText = formattedState;
  document.getElementById('overall-pct').innerText = `${data.progressPercentage}%`;
  document.getElementById('overall-blocks-text').innerText = `${data.completedBlockCount} of ${data.totalBlockCount} blocks completed`;
  document.getElementById('overall-bar-fill').style.width = `${data.progressPercentage}%`;

  document.getElementById('summary-completed').innerText = data.completedBlockCount;
  document.getElementById('summary-total').innerText = data.totalBlockCount;
  document.getElementById('summary-required').innerText = data.totalBlockCount;
  document.getElementById('summary-active').innerText = formatSeconds(totalActiveSec);
}

function populateBlockDropdown(blocks) {
  const select = document.getElementById('block-select');
  select.innerHTML = '';

  blocks.forEach((block, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.innerText = `${block.blockVersion} · ${block.blockId}`;
    select.appendChild(opt);
  });

  select.addEventListener('change', (e) => {
    const selectedBlock = blocks[e.target.value];
    renderBlockDetails(selectedBlock);
  });
}

function renderBlockDetails(block) {
  document.getElementById('ts-first').innerText = formatDate(block.firstViewedAt);
  document.getElementById('ts-last').innerText = formatDate(block.lastViewedAt);
  document.getElementById('ts-complete').innerText = formatDate(block.completedAt);
  
  const statusEl = document.getElementById('block-status');
  const normalizedStatus = (block.status || '').replace('_', ' ').toUpperCase();
  statusEl.innerText = normalizedStatus;
  
  if (block.status === 'completed') {
    statusEl.className = 'text-green';
  } else {
    statusEl.className = '';
  }

  document.getElementById('visit-count').innerText = block.visitCount;
  document.getElementById('revision-count').innerText = block.revisionCount;
  document.getElementById('attempts-count').innerText = block.attempts;
  document.getElementById('score-val').innerText = block.score !== null ? block.score : '—';

  document.getElementById('active-time').innerText = formatSeconds(block.activeTimeSec);
  document.getElementById('target-time').innerText = formatSeconds(block.expectedTimeSec);
  
  const diffSec = block.timeComparison ? block.timeComparison.differenceSec : 0;
  const diffSign = diffSec > 0 ? '+' : '';
  document.getElementById('time-diff').innerText = `${diffSign}${diffSec}s`;
  
  const pctExp = block.timeComparison ? block.timeComparison.percentageOfExpected : 0;
  document.getElementById('perf-pct').innerText = `${pctExp}%`;
}
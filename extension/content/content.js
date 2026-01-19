let reviewMode = false;
let annotationMode = false;
let currentScreenshot = null;
let currentComments = [];
let isDrawing = false;
let startX = 0;
let startY = 0;
let sessionScreenshots = [];
let currentUrl = window.location.href;
let currentTabId = null;

let floatingButton;
let overlay;
let canvas;
let commentModal;

// Custom Modal Functions
function showAlert(message) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.id = 'df-alert-modal';
    modal.innerHTML = `
      <div class="df-alert-content">
        <button class="df-alert-close" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <p class="df-alert-message">${message}</p>
        <div class="df-alert-buttons">
          <button class="df-alert-button df-alert-button-primary">OK</button>
        </div>
      </div>
    `;
    
    const closeModal = () => {
      modal.remove();
      resolve();
    };
    
    modal.querySelector('.df-alert-close').onclick = closeModal;
    modal.querySelector('.df-alert-button-primary').onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
    
    document.body.appendChild(modal);
  });
}

function showConfirm(title, message, confirmText = 'OK', confirmVariant = 'primary') {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.id = 'df-alert-modal';
    
    const variantClass = confirmVariant === 'danger' ? 'df-alert-button-danger' : 'df-alert-button-primary';
    
    modal.innerHTML = `
      <div class="df-alert-content">
        <button class="df-alert-close" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <h3 class="df-alert-title">${title}</h3>
        <p class="df-alert-message">${message}</p>
        <div class="df-alert-buttons">
          <button class="df-alert-button df-alert-button-tertiary">Cancel</button>
          <button class="df-alert-button ${variantClass}">${confirmText}</button>
        </div>
      </div>
    `;
    
    const closeModal = (result) => {
      modal.remove();
      resolve(result);
    };
    
    modal.querySelector('.df-alert-close').onclick = () => closeModal(false);
    modal.querySelector('.df-alert-button-tertiary').onclick = () => closeModal(false);
    modal.querySelector(`.${variantClass}`).onclick = () => closeModal(true);
    modal.onclick = (e) => {
      if (e.target === modal) closeModal(false);
    };
    
    document.body.appendChild(modal);
  });
}

function createWorkspaceModal(workspaces) {
  const modal = document.createElement('div');
  modal.id = 'df-workspace-modal';
  
  const defaultWorkspace = workspaces.find(w => w.id === 'default') || workspaces[0];
  
  modal.innerHTML = `
    <div class="df-workspace-overlay">
      <div class="df-workspace-content">
        <button class="df-alert-close" id="df-workspace-close" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <h3>Save to Workspace</h3>
        <p class="df-workspace-description">
          Choose a workspace to save your reviews. You can also <a href="https://fetchhub.px-tester.workers.dev/workspaces" target="_blank" rel="noopener noreferrer">manage or create workspaces</a> on the web app.
        </p>

        <div class="df-workspace-dropdown-container">
          <button id="df-workspace-dropdown-button" class="df-workspace-dropdown-button" data-selected="${defaultWorkspace.id}">
            <span class="df-workspace-dropdown-text">${defaultWorkspace.name}</span>
            <svg class="df-workspace-dropdown-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div id="df-workspace-dropdown-menu" class="df-workspace-dropdown-menu" style="display: none;">
            <div class="df-workspace-search-container">
              <svg class="df-workspace-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input type="text" id="df-workspace-search" class="df-workspace-search-input" placeholder="Search workspaces..." autocomplete="off">
            </div>
            <div id="df-workspace-list" class="df-workspace-list">
              ${workspaces.map(w => 
                `<button class="df-workspace-dropdown-item" data-value="${w.id}" data-type="workspace" data-name="${w.name.toLowerCase()}">
                  ${w.name}
                </button>`
              ).join('')}
            </div>
            <div id="df-workspace-no-results" class="df-workspace-no-results" style="display: none;">
              No workspaces found
            </div>
          </div>
        </div>
        
        <div class="df-workspace-buttons">
          <button id="df-workspace-cancel" class="df-workspace-button-secondary">Cancel</button>
          <button id="df-workspace-save" class="df-workspace-button-primary">Save</button>
        </div>
      </div>
    </div>
  `;
  
  // Set up dropdown functionality
  setTimeout(() => {
    const closeButton = modal.querySelector('#df-workspace-close');
    const dropdownButton = modal.querySelector('#df-workspace-dropdown-button');
    const dropdownMenu = modal.querySelector('#df-workspace-dropdown-menu');
    const dropdownText = modal.querySelector('.df-workspace-dropdown-text');
    const searchInput = modal.querySelector('#df-workspace-search');
    const workspaceList = modal.querySelector('#df-workspace-list');
    const noResults = modal.querySelector('#df-workspace-no-results');
    const dropdownItems = modal.querySelectorAll('.df-workspace-dropdown-item');
    
    // Handle close button
    closeButton.addEventListener('click', () => {
      modal.remove();
    });
    
    dropdownButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdownMenu.style.display === 'block';
      dropdownMenu.style.display = isOpen ? 'none' : 'block';
      if (dropdownMenu.style.display === 'block') {
        searchInput.value = '';
        searchInput.focus();
        // Reset filter
        dropdownItems.forEach(item => item.style.display = 'block');
        workspaceList.style.display = 'block';
        noResults.style.display = 'none';
      }
    });
    
    // Handle search input
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      let hasResults = false;
      
      dropdownItems.forEach(item => {
        const name = item.getAttribute('data-name');
        if (name.includes(searchTerm)) {
          item.style.display = 'block';
          hasResults = true;
        } else {
          item.style.display = 'none';
        }
      });
      
      workspaceList.style.display = hasResults ? 'block' : 'none';
      noResults.style.display = hasResults ? 'none' : 'block';
    });
    
    searchInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    dropdownItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = item.getAttribute('data-value');
        const text = item.textContent.trim();
        dropdownButton.setAttribute('data-selected', value);
        dropdownText.textContent = text;
        dropdownMenu.style.display = 'none';
      });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdownButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.style.display = 'none';
      }
    });
  }, 0);
  
  return modal;
}

async function fetchWorkspaces() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getWorkspaces' });
    if (response.error) {
      console.error('Failed to fetch workspaces:', response.error);
      return [{ id: 'default', name: 'Default Workspace' }];
    }
    return response.workspaces || [{ id: 'default', name: 'Default Workspace' }];
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
    return [{ id: 'default', name: 'Default Workspace' }];
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  if (document.body) {
    canvas = createCanvas();
    floatingButton = createFloatingButton();
    overlay = createOverlay();
    commentModal = createCommentModal();
    
    document.body.appendChild(floatingButton);
    document.body.appendChild(overlay);
    
    // Get current tab ID and restore state
    await restoreReviewModeState();
    
    // Set up navigation listeners
    setupNavigationListeners();
  } else {
    setTimeout(init, 100);
  }
}

async function restoreReviewModeState() {
  try {
    // Ask background for current tab ID
    const response = await chrome.runtime.sendMessage({ action: 'getTabId' });
    currentTabId = response.tabId;
    
    // Check if review mode was enabled for this tab
    const result = await chrome.storage.local.get([`reviewMode_tab_${currentTabId}`]);
    const savedState = result[`reviewMode_tab_${currentTabId}`];
    
    if (savedState === true) {
      reviewMode = true;
      if (floatingButton) {
        floatingButton.style.display = 'flex';
      }
    }
  } catch (error) {
    // Silently fail - extension will work without state restoration
  }
}

async function saveReviewModeState(enabled) {
  if (currentTabId) {
    const key = `reviewMode_tab_${currentTabId}`;
    if (enabled) {
      await chrome.storage.local.set({ [key]: true });
    } else {
      await chrome.storage.local.remove(key);
    }
  }
}

function setupNavigationListeners() {
  // Listen for history API navigation (pushState, replaceState)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    handleNavigation();
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    handleNavigation();
  };
  
  // Listen for back/forward button navigation
  window.addEventListener('popstate', handleNavigation);
  
  // Listen for hash changes
  window.addEventListener('hashchange', handleNavigation);
  
  // Periodic check to ensure button stays visible
  setInterval(() => {
    if (reviewMode && floatingButton) {
      if (!document.body.contains(floatingButton)) {
        document.body.appendChild(floatingButton);
        floatingButton.style.display = 'flex';
      } else if (floatingButton.style.display !== 'flex') {
        floatingButton.style.display = 'flex';
      }
    }
    if (overlay && !document.body.contains(overlay)) {
      document.body.appendChild(overlay);
    }
  }, 500);
  
  // MutationObserver to detect if button gets removed from DOM
  const observer = new MutationObserver((mutations) => {
    if (reviewMode && floatingButton && !document.body.contains(floatingButton)) {
      document.body.appendChild(floatingButton);
      floatingButton.style.display = 'flex';
    }
    if (overlay && !document.body.contains(overlay)) {
      document.body.appendChild(overlay);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function handleNavigation() {
  const newUrl = window.location.href;
  
  if (newUrl !== currentUrl) {
    currentUrl = newUrl;
    
    // Maintain button visibility if in review mode
    if (reviewMode && floatingButton) {
      if (!document.body.contains(floatingButton)) {
        document.body.appendChild(floatingButton);
      }
      floatingButton.style.display = 'flex';
    }
    
    // Close annotation mode if open during navigation
    if (annotationMode) {
      hideAnnotationMode();
    }
  }
}

function createFloatingButton() {
  const container = document.createElement('div');
  container.id = 'df-floating-button';
  container.style.display = 'none';
  
  const button = document.createElement('button');
  button.id = 'df-add-comment-btn';
  button.innerHTML = 'Add Comment';
  button.addEventListener('click', () => {
    captureScreenshot();
  });
  
  const exitButton = document.createElement('button');
  exitButton.id = 'df-exit-btn';
  exitButton.innerHTML = '×';
  exitButton.title = 'Exit Review Mode';
  exitButton.addEventListener('click', () => {
    toggleReviewMode();
  });
  
  container.appendChild(button);
  container.appendChild(exitButton);
  
  return container;
}

function createOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'df-overlay';
  overlay.style.display = 'none';
  
  const header = document.createElement('div');
  header.id = 'df-overlay-header';
  header.innerHTML = `
    <div>
      <h2>Add Comments</h2>
      <p>Drag to select an area, then add your feedback</p>
    </div>
    <div id="df-overlay-actions">
      <button id="df-cancel-btn">Cancel</button>
      <button id="df-save-btn">Save (<span id="df-comment-count">0</span>)</button>
    </div>
  `;
  
  overlay.appendChild(header);
  overlay.appendChild(canvas);
  
  return overlay;
}

function createCanvas() {
  const canvas = document.createElement('canvas');
  canvas.id = 'df-canvas';
  
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  
  return canvas;
}

function createCommentModal() {
  const modal = document.createElement('div');
  modal.id = 'df-comment-modal';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="df-modal-backdrop"></div>
    <div class="df-modal-content">
      <input type="text" id="df-comment-text" placeholder="Add a comment" />
      <button id="df-modal-submit">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 7l9.2 9.2M17 7v10H7"/>
        </svg>
      </button>
    </div>
  `;
  
  // Close on backdrop click
  const backdrop = modal.querySelector('.df-modal-backdrop');
  backdrop.addEventListener('click', () => {
    modal.style.display = 'none';
    redrawCanvas();
  });
  
  // Close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      modal.style.display = 'none';
      redrawCanvas();
    }
  });
  
  return modal;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'ready' });
    return true;
  }
  
  if (request.action === 'toggleReviewMode') {
    toggleReviewMode();
  }
});

async function toggleReviewMode() {
  reviewMode = !reviewMode;
  
  // Save state to storage
  await saveReviewModeState(reviewMode);
  
  if (floatingButton) {
    floatingButton.style.display = reviewMode ? 'flex' : 'none';
  }
}

async function captureScreenshot() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'captureScreenshot' });
    
    if (response.error) {
      await showAlert('Failed to capture screenshot: ' + response.error);
      return;
    }
    
    currentScreenshot = response;
    currentComments = [];
    showAnnotationMode();
  } catch (error) {
    console.error('Capture failed:', error);
    await showAlert('Failed to capture screenshot.');
  }
}

function showAnnotationMode() {
  annotationMode = true;
  floatingButton.style.display = 'none';
  overlay.style.display = 'flex';
  
  document.body.appendChild(commentModal);
  
  canvas.width = currentScreenshot.width;
  canvas.height = currentScreenshot.height;
  
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    drawComments(ctx);
  };
  img.src = currentScreenshot.screenshot;
  
  document.getElementById('df-cancel-btn').onclick = cancelAnnotation;
  document.getElementById('df-save-btn').onclick = saveAnnotation;
  updateCommentCount();
}

function hideAnnotationMode() {
  annotationMode = false;
  overlay.style.display = 'none';
  floatingButton.style.display = reviewMode ? 'flex' : 'none';
  
  if (commentModal.parentNode) {
    commentModal.parentNode.removeChild(commentModal);
  }
}

function handleMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  startX = (e.clientX - rect.left) * scaleX;
  startY = (e.clientY - rect.top) * scaleY;
  isDrawing = true;
}

function handleMouseMove(e) {
  if (!isDrawing) return;
  
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const currentX = (e.clientX - rect.left) * scaleX;
  const currentY = (e.clientY - rect.top) * scaleY;
  
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    drawComments(ctx);
    
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    ctx.strokeStyle = '#ec4899';
    ctx.fillStyle = 'rgba(236, 72, 153, 0.15)';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
  };
  img.src = currentScreenshot.screenshot;
}

function handleMouseUp(e) {
  if (!isDrawing) return;
  isDrawing = false;
  
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const endX = (e.clientX - rect.left) * scaleX;
  const endY = (e.clientY - rect.top) * scaleY;
  
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  
  if (width > 10 && height > 10) {
    const xPercent = (x / canvas.width) * 100;
    const yPercent = (y / canvas.height) * 100;
    const widthPercent = (width / canvas.width) * 100;
    const heightPercent = (height / canvas.height) * 100;
    
    showCommentModal(xPercent, yPercent, widthPercent, heightPercent);
  }
}

function showCommentModal(x, y, width, height) {
  commentModal.style.display = 'flex';
  
  const input = document.getElementById('df-comment-text');
  input.value = '';
  input.focus();
  
  // Remove old submit handler if exists
  const submitBtn = document.getElementById('df-modal-submit');
  const newSubmitBtn = submitBtn.cloneNode(true);
  submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
  
  // Initially disable button
  newSubmitBtn.disabled = true;
  
  // Enable/disable button based on input value
  input.oninput = () => {
    newSubmitBtn.disabled = input.value.trim().length === 0;
  };
  
  // Add submit handler
  newSubmitBtn.onclick = () => {
    const text = input.value.trim();
    console.log('[DEBUG] Comment submit clicked, text:', text);
    if (text) {
      currentComments.push({ x, y, width, height, text });
      console.log('[DEBUG] Comment added. Total comments:', currentComments.length);
      commentModal.style.display = 'none';
      redrawCanvas();
      updateCommentCount();
    }
  };
  
  // Allow Enter key to submit
  input.onkeydown = (e) => {
    if (e.key === 'Enter' && !newSubmitBtn.disabled) {
      e.preventDefault();
      newSubmitBtn.click();
    }
  };
}

function drawComments(ctx) {
  currentComments.forEach((comment, index) => {
    const x = (comment.x / 100) * canvas.width;
    const y = (comment.y / 100) * canvas.height;
    const width = (comment.width / 100) * canvas.width;
    const height = (comment.height / 100) * canvas.height;
    
    ctx.strokeStyle = '#ec4899';
    ctx.fillStyle = 'rgba(236, 72, 153, 0.15)';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
    
    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`${index + 1}`, x + 8, y + 22);
  });
}

function redrawCanvas() {
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    drawComments(ctx);
  };
  img.src = currentScreenshot.screenshot;
}

function updateCommentCount() {
  const count = currentComments.length;
  console.log('[DEBUG] updateCommentCount called. Comments:', count);
  document.getElementById('df-comment-count').textContent = count;
  document.getElementById('df-save-btn').disabled = count === 0;
  console.log('[DEBUG] Save button disabled:', count === 0);
}

async function cancelAnnotation() {
  if (currentComments.length > 0) {
    const discard = await showConfirm(
      'Are you sure you want to discard this screenshot?',
      'All comments will be lost.',
      'Discard',
      'danger'
    );
    if (!discard) return;
  }
  
  currentScreenshot = null;
  currentComments = [];
  hideAnnotationMode();
}

async function saveAnnotation() {
  console.log('[DEBUG] saveAnnotation called! Comments:', currentComments.length);
  
  if (currentComments.length === 0) {
    console.log('[DEBUG] No comments, showing alert');
    await showAlert('Please add at least one comment.');
    return;
  }
  
  // Fetch workspaces and show modal
  const workspaces = await fetchWorkspaces();
  const workspaceModal = createWorkspaceModal(workspaces);
  document.body.appendChild(workspaceModal);
  
  const dropdownButton = document.getElementById('df-workspace-dropdown-button');
  const cancelBtn = document.getElementById('df-workspace-cancel');
  const saveBtn = document.getElementById('df-workspace-save');
  
  // Handle cancel
  cancelBtn.onclick = () => {
    workspaceModal.remove();
  };
  
  // Handle save
  saveBtn.onclick = async () => {
    const selectedWorkspaceId = dropdownButton.getAttribute('data-selected');
    
    if (!selectedWorkspaceId) {
      await showAlert('Please select a workspace');
      return;
    }
    
    workspaceModal.remove();
    
    console.log('[DEBUG] Preparing to save screenshot with comments to workspace:', selectedWorkspaceId);
    const screenshotToSave = {
      imageData: currentScreenshot.screenshot,
      width: currentScreenshot.width,
      height: currentScreenshot.height,
      url: currentScreenshot.url,
      title: currentScreenshot.title,
      comments: currentComments,
      workspace_id: selectedWorkspaceId
    };
    
    currentScreenshot = null;
    currentComments = [];
    hideAnnotationMode();
    
    // Save to backend with workspace
    try {
      const userInfo = await chrome.runtime.sendMessage({ action: 'getUserInfo' });
      
      const response = await chrome.runtime.sendMessage({
        action: 'saveSession',
        data: {
          screenshots: [screenshotToSave],
          userName: userInfo.name
        }
      });
      
      if (response.error) {
        await showAlert('Failed to save: ' + response.error);
        return;
      }
      
      await showAlert('Feedback saved successfully! Click the button to add another screenshot, or exit review mode when done.');
    } catch (error) {
      console.error('Save failed:', error);
      await showAlert('Failed to save feedback: ' + error.message);
    }
  };
}

async function saveSession() {
  if (sessionScreenshots.length === 0) return;
  
  try {
    const userInfo = await chrome.runtime.sendMessage({ action: 'getUserInfo' });
    
    const response = await chrome.runtime.sendMessage({
      action: 'saveSession',
      data: {
        screenshots: sessionScreenshots,
        userName: userInfo.name
      }
    });
    
    if (response.error) {
      await showAlert('Failed to save: ' + response.error);
      return;
    }
    
    await showAlert('Feedback saved successfully!');
    sessionScreenshots = [];
    reviewMode = false;
    floatingButton.style.display = 'none';
  } catch (error) {
    console.error('Save failed:', error);
    await showAlert('Failed to save feedback.');
  }
}

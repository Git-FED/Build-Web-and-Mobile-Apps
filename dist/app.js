/* web2app.studio — URL-to-app builder. No backend required: projects stay in localStorage. */
const isCapacitor = Boolean(window.Capacitor?.isNativePlatform?.());
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const state = { config: null, previewUrl: '' };
const storageKey = 'web2app-projects-v1';

function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2600); }
function slugify(value) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'myapp'; }
function normalizeUrl(value) { const raw = value.trim(); if (!raw) return ''; return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`; }
function parseUrl(value) { try { const url = new URL(normalizeUrl(value)); return /^https?:$/.test(url.protocol) ? url : null; } catch { return null; } }
function deriveAppId(url, name) { const host = url.hostname.replace(/^www\./, '').split('.').filter(Boolean); const domain = host.length > 1 ? host[host.length - 2] : host[0] || 'example'; return `com.${slugify(domain)}.${slugify(name)}`.replace(/\.+/g, '.'); }
function currentForm() { const url = parseUrl($('#site-url').value); return { url, urlValue: url?.toString() || '', name: $('#app-name').value.trim(), appId: $('#app-id').value.trim(), orientation: $('#orientation').value, displayMode: $('#display-mode').value, platforms: $$('input[name="platform"]:checked').map((input) => input.value) }; }
function validate(data) { let valid = true; if (!data.url) { $('#site-url').classList.add('invalid'); $('#url-help').textContent = 'Enter a valid public URL, such as https://yourwebsite.com'; valid = false; } else $('#site-url').classList.remove('invalid'); if (!data.name) { $('#app-name').classList.add('invalid'); valid = false; } else $('#app-name').classList.remove('invalid'); if (!/^[a-z][a-z0-9]*(\.[a-z0-9-]+)+$/.test(data.appId)) { $('#app-id').classList.add('invalid'); valid = false; } else $('#app-id').classList.remove('invalid'); if (!data.platforms.length) { toast('Select at least one build target'); valid = false; } return valid; }
function showPreview(url) { state.previewUrl = url; const parsed = parseUrl(url); const preview = $('#url-preview'); if (!parsed) { preview.hidden = true; $('#preview-domain').textContent = '—'; $('#preview-status').textContent = 'Waiting for a URL'; return; } preview.hidden = false; $('#preview-label').textContent = `${parsed.hostname} is ready to preview`; $('#preview-domain').textContent = parsed.hostname; $('#preview-status').textContent = 'URL ready to preview'; const screen = $('#device-screen'); screen.innerHTML = `<iframe title="Website preview" src="${parsed.href.replaceAll('"', '&quot;')}" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>`; }
function updatePlatformSelection() { $$('.platform-option').forEach((option) => option.classList.toggle('selected', option.querySelector('input').checked)); }
function makeConfig(data) { const selected = new Set(data.platforms); return { generatedBy: 'web2app.studio', generatedAt: new Date().toISOString(), app: { appId: data.appId, appName: data.name, url: data.urlValue }, platforms: data.platforms, capacitor: { appId: data.appId, appName: data.name, webDir: 'www', bundledWebRuntime: false, server: { url: data.urlValue, androidScheme: 'https' } }, electron: { startUrl: data.urlValue, targets: data.platforms.filter((p) => ['windows', 'macos', 'linux'].includes(p)) }, pwa: { name: data.name, short_name: data.name.slice(0, 12), start_url: data.urlValue, scope: '/', display: data.displayMode, orientation: data.orientation, theme_color: '#09111f', background_color: '#09111f' }, commands: { mobile: selected.has('android') || selected.has('ios') ? 'npm install && npx cap sync android ios' : '', desktop: selected.has('windows') || selected.has('macos') || selected.has('linux') ? 'npm install && npm run dist' : '', web: selected.has('web') ? 'npx serve www' : '' } }; }
function download(filename, data) { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; link.click(); URL.revokeObjectURL(link.href); }
function saveProject(data) { const projects = JSON.parse(localStorage.getItem(storageKey) || '[]').filter((item) => item.appId !== data.appId); projects.unshift({ ...data, savedAt: new Date().toISOString() }); localStorage.setItem(storageKey, JSON.stringify(projects.slice(0, 8))); renderSaved(); }
function renderSaved() { const list = $('#saved-list'); const projects = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (!projects.length) { list.innerHTML = '<div class="empty-saved">Your generated projects will appear here.</div>'; return; } list.innerHTML = projects.map((project) => `<div class="saved-item"><span class="saved-item-mark">↗</span><div class="saved-item-main"><div class="saved-item-title">${escapeHtml(project.name)}</div><div class="saved-item-url">${escapeHtml(project.urlValue)}</div></div><span class="saved-item-date">${new Date(project.savedAt).toLocaleDateString()}</span><button class="saved-load" data-id="${escapeHtml(project.appId)}">Load</button></div>`).join(''); $$('.saved-load').forEach((button) => button.addEventListener('click', () => loadProject(button.dataset.id)));
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char])); }
function loadProject(appId) { const project = JSON.parse(localStorage.getItem(storageKey) || '[]').find((item) => item.appId === appId); if (!project) return; $('#site-url').value = project.urlValue; $('#app-name').value = project.name; $('#app-id').value = project.appId; $('#orientation').value = project.orientation; $('#display-mode').value = project.displayMode; $$('input[name="platform"]').forEach((input) => { input.checked = project.platforms.includes(input.value); }); updatePlatformSelection(); showPreview(project.urlValue); generate(project); $('#builder').scrollIntoView({ behavior: 'smooth' }); toast('Project loaded'); }
function generate(data = currentForm()) { if (!validate(data)) return; state.config = makeConfig(data); $('#output-section').hidden = false; $('#command-output').textContent = state.config.commands.mobile || state.config.commands.desktop || state.config.commands.web || 'npm install'; saveProject(data); $('#save-status').textContent = 'Saved just now'; $('#output-section').scrollIntoView({ behavior: 'smooth', block: 'start' }); toast('App configuration generated'); }

$('#site-url').addEventListener('input', () => { const parsed = parseUrl($('#site-url').value); if (parsed && !$('#app-name').value) { $('#app-name').value = parsed.hostname.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); } if (parsed && (!$('#app-id').value || $('#app-id').classList.contains('invalid'))) $('#app-id').value = deriveAppId(parsed, $('#app-name').value || 'myapp'); showPreview(parsed?.href || ''); });
$('#app-name').addEventListener('input', () => { const parsed = parseUrl($('#site-url').value); if (parsed && (!$('#app-id').value || $('#app-id').value.startsWith('com.'))) $('#app-id').value = deriveAppId(parsed, $('#app-name').value || 'myapp'); });
$('#builder-form').addEventListener('submit', (event) => { event.preventDefault(); generate(); });
$('#test-url').addEventListener('click', () => { const parsed = parseUrl($('#site-url').value); if (!parsed) { toast('Enter a valid HTTPS URL first'); $('#site-url').focus(); return; } showPreview(parsed.href); toast('URL is valid and ready'); });
$('#open-url').addEventListener('click', () => state.previewUrl && window.open(state.previewUrl, '_blank', 'noopener,noreferrer'));
$$('input[name="platform"]').forEach((input) => input.addEventListener('change', updatePlatformSelection));
$$('[data-download]').forEach((button) => button.addEventListener('click', () => { if (!state.config) return; const type = button.dataset.download; const payload = type === 'capacitor' ? state.config.capacitor : type === 'desktop' ? state.config.electron : state.config.pwa; download(`${slugify(state.config.app.appName)}-${type}.json`, payload); toast(`${type} config downloaded`); }));
$('#copy-command').addEventListener('click', async () => { await navigator.clipboard.writeText($('#command-output').textContent); toast('Build command copied'); });
$('#clear-projects').addEventListener('click', () => { localStorage.removeItem(storageKey); renderSaved(); toast('Saved projects cleared'); });
function applyTheme(theme) { document.body.classList.remove('theme-ocean', 'theme-ember', 'theme-neon'); document.body.classList.add(`theme-${theme}`); localStorage.setItem('web2app-theme', theme); $$('.theme-dot').forEach((button) => button.classList.toggle('active', button.dataset.theme === theme)); }
const accents = { coral: ['#ff5a36', '#2357ff'], blue: ['#2357ff', '#00a7bb'], lime: ['#72b01d', '#f5a623'], violet: ['#a329ff', '#00a7bb'], gold: ['#e59f14', '#e03b2d'] };
function applyAccent(accent) { const pair = accents[accent] || accents.coral; document.documentElement.style.setProperty('--accent', pair[0]); document.documentElement.style.setProperty('--accent-2', pair[1]); document.body.style.setProperty('--accent', pair[0]); document.body.style.setProperty('--accent-2', pair[1]); document.body.dataset.accent = accent; localStorage.setItem('web2app-accent', accent); $$('.accent-dot').forEach((button) => button.classList.toggle('active', button.dataset.accent === accent)); }
const backgrounds = { paper: ['#f2efe7','#151515','#faf8f2','#e7e3d8','#cbc7bc','#6b6a64'], sky: ['#eaf4f7','#102530','#f7fcfd','#d7e7eb','#b4cbd1','#54717b'], sunset: ['#fff0e6','#2e1712','#fff9f4','#f8d7c7','#e0b29d','#7c5a4f'], night: ['#111827','#f4f1e8','#192235','#263248','#46516a','#b2bccd'] };
function applyBackground(background) { const palette = backgrounds[background] || backgrounds.paper; ['--paper','--ink','--card','--soft','--line','--muted'].forEach((name, index) => { document.documentElement.style.setProperty(name, palette[index]); document.body.style.setProperty(name, palette[index]); }); document.body.dataset.background = background; localStorage.setItem('web2app-background', background); $$('.background-dot').forEach((button) => button.classList.toggle('active', button.dataset.background === background)); }
$$('.theme-dot').forEach((button) => button.addEventListener('click', () => applyTheme(button.dataset.theme)));
$$('.accent-dot').forEach((button) => button.addEventListener('click', () => applyAccent(button.dataset.accent)));
$$('.background-dot').forEach((button) => button.addEventListener('click', () => applyBackground(button.dataset.background)));
$('#theme-toggle').addEventListener('click', () => applyTheme(document.body.classList.contains('theme-ember') ? 'neon' : document.body.classList.contains('theme-neon') ? 'ocean' : 'ember'));
applyTheme(localStorage.getItem('web2app-theme') || 'ocean');
applyAccent(localStorage.getItem('web2app-accent') || 'coral');
applyBackground(localStorage.getItem('web2app-background') || 'paper');
renderSaved(); updatePlatformSelection();

// Capacitor-only polish: native chrome and safe network/back-button behavior.
async function nativeBoot() { if (!isCapacitor) return; try { const status = window.Capacitor.Plugins?.StatusBar; await status?.setBackgroundColor({ color: '#08111d' }); await status?.setOverlaysWebView({ overlay: false }); window.Capacitor.Plugins?.SplashScreen?.hide(); } catch (error) { console.info('[web2app] native setup skipped', error); } }
nativeBoot();
if ('serviceWorker' in navigator && !isCapacitor) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));


// Inline GitFed subscription form. This avoids third-party iframe blocking while retaining a direct fallback.
const substackForm = $('#substack-form');
if (substackForm) {
  const substackInput = $('#substack-email');
  const substackButton = $('#substack-submit');
  const substackMessage = $('#substack-msg');
  const substackPublication = 'gitfed';
  const substackEndpoint = `https://${substackPublication}.substack.com/api/v1/free?nojs=true`;
  const setSubstackMessage = (message, type = '') => { substackMessage.textContent = message; substackMessage.className = `substack-msg${type ? ` ${type}` : ''}`; };
  substackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = substackInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setSubstackMessage('Please enter a valid email address.', 'error'); substackInput.focus(); return; }
    substackButton.disabled = true;
    const original = substackButton.textContent;
    substackButton.textContent = 'Subscribing…';
    try {
      const body = new URLSearchParams({ email, source: 'embed' });
      const response = await fetch(substackEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
      let data = {};
      try { data = await response.json(); } catch (_) {}
      if (!response.ok) throw new Error(data.error || data.message || 'Something went wrong. Please try again.');
      substackForm.reset();
      setSubstackMessage(data.requires_confirmation ? 'Almost there — check your inbox to confirm.' : "You're subscribed. Welcome aboard!", 'success');
    } catch (error) {
      if (error instanceof TypeError) { setSubstackMessage('Opening subscribe page…', 'error'); window.open(`https://${substackPublication}.substack.com/subscribe?email=${encodeURIComponent(email)}`, '_blank', 'noopener'); }
      else setSubstackMessage(error.message || 'Subscription failed.', 'error');
    } finally { substackButton.disabled = false; substackButton.textContent = original; }
  });
}

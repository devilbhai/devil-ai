export function renderTunnelTemplate(
	sessionData: any,
	sessionListHtml: string,
	requestedSessionId: string,
	escapeHtml: (text: string) => string
): string {
	return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Devil AI - ${escapeHtml(sessionData.title)}</title>
	<style>
		*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

		:root {
			--background: #181818;
			--foreground: #ffffff;
			--secondary: #212121;
			--secondary-foreground: #ffffff;
			--muted: #282828;
			--muted-foreground: #afafaf;
			--accent: #282828;
			--accent-foreground: #ffffff;
			--border: #2e2e2e;
			--ring: #6fcbf3;
			--sidebar: #0d0d0d;
			--sidebar-foreground: #ffffff;
			--sidebar-border: #ffffff;
			--sidebar-accent: #001a2b;
			--radius: 0.75rem;
			--sidebar-width: 260px;
		}

		body {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
			font-size: 0.9375rem;
			line-height: 1.5;
			background: var(--background);
			color: var(--foreground);
			height: 100vh;
			overflow: hidden;
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
		}

		/* ─── App Layout ──────────────────────────────── */
		.app-layout {
			display: flex;
			height: 100vh;
		}

		/* ─── Sidebar ─────────────────────────────────── */
		.sidebar {
			width: var(--sidebar-width);
			background: var(--sidebar);
			border-right: 1px solid var(--border);
			display: flex;
			flex-direction: column;
			flex-shrink: 0;
			overflow: hidden;
		}
		.sidebar-header {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 12px 14px;
			border-bottom: 1px solid var(--border);
			min-height: 48px;
		}
		.sidebar-logo {
			width: 28px;
			height: 28px;
			border-radius: 7px;
			background: linear-gradient(135deg, #05bdf5 0%, #0080bd 100%);
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}
		.sidebar-logo svg { width: 16px; height: 16px; }
		.sidebar-brand {
			font-weight: 600;
			font-size: 14px;
			color: var(--foreground);
		}
		.sidebar-status {
			display: flex;
			align-items: center;
			gap: 6px;
			margin-left: auto;
			padding: 3px 8px;
			border-radius: 9999px;
			background: rgba(34, 197, 94, 0.08);
			border: 1px solid rgba(34, 197, 94, 0.15);
			font-size: 10px;
			color: #4ade80;
			font-weight: 500;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		.sidebar-status-dot {
			width: 5px;
			height: 5px;
			border-radius: 50%;
			background: #22c55e;
			animation: pulse 2s ease-in-out infinite;
		}
		@keyframes pulse {
			0%, 100% { opacity: 1; transform: scale(1); }
			50% { opacity: 0.5; transform: scale(0.85); }
		}

		.sidebar-section {
			padding: 8px;
		}
		.sidebar-label {
			padding: 4px 8px;
			font-size: 11px;
			font-weight: 600;
			color: var(--muted-foreground);
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		.sidebar-list {
			display: flex;
			flex-direction: column;
			gap: 1px;
		}
		.sidebar-item {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 7px 8px;
			border-radius: 6px;
			cursor: pointer;
			transition: background 0.1s;
			position: relative;
		}
		.sidebar-item:hover { background: var(--accent); }
		.sidebar-item.active {
			background: var(--sidebar-accent);
		}
		.sidebar-item-icon {
			color: var(--muted-foreground);
			flex-shrink: 0;
			display: flex;
			align-items: center;
		}
		.sidebar-item.active .sidebar-item-icon { color: var(--ring); }
		.sidebar-item-content {
			flex: 1;
			min-width: 0;
			overflow: hidden;
		}
		.sidebar-item-title {
			font-size: 13px;
			color: var(--foreground);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.sidebar-item.active .sidebar-item-title { font-weight: 500; }
		.sidebar-item-meta {
			font-size: 11px;
			color: var(--muted-foreground);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.sidebar-active-dot {
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: var(--ring);
			flex-shrink: 0;
		}
		.sidebar-divider {
			height: 1px;
			background: var(--border);
			margin: 4px 8px;
		}
		.sidebar-footer {
			margin-top: auto;
			padding: 8px;
			border-top: 1px solid var(--border);
		}
		.sidebar-footer-item {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 7px 8px;
			border-radius: 6px;
			color: var(--muted-foreground);
			font-size: 13px;
			cursor: pointer;
			transition: background 0.1s;
		}
		.sidebar-footer-item:hover { background: var(--accent); color: var(--foreground); }

		/* ─── Main Content ────────────────────────────── */
		.main-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			min-width: 0;
			overflow: hidden;
		}

		/* ─── Titlebar ─────────────────────────────────── */
		.titlebar {
			display: flex;
			align-items: center;
			gap: 12px;
			height: 48px;
			padding: 0 16px;
			background: var(--background);
			border-bottom: 1px solid var(--border);
			user-select: none;
			flex-shrink: 0;
		}
		.titlebar-title {
			font-weight: 600;
			font-size: 13px;
			color: var(--foreground);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.titlebar-session {
			font-size: 13px;
			color: var(--muted-foreground);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.titlebar-spacer { flex: 1; }
		.live-badge {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 4px 10px;
			border-radius: 9999px;
			background: rgba(34, 197, 94, 0.1);
			border: 1px solid rgba(34, 197, 94, 0.2);
			font-size: 11px;
			font-weight: 500;
			color: #4ade80;
			letter-spacing: 0.025em;
		}

		/* ─── Chat Area ────────────────────────────────── */
		.chat-area {
			flex: 1;
			overflow-y: auto;
			display: flex;
			flex-direction: column;
			gap: 32px;
			max-width: 860px;
			width: 100%;
			margin: 0 auto;
			padding: 24px 16px 120px;
		}

		/* ─── Messages ─────────────────────────────────── */
		.message-group {
			display: flex;
			flex-direction: column;
			gap: 8px;
			width: 100%;
		}
		.message-group.user { align-items: flex-end; }
		.message-group.assistant { align-items: flex-start; }
		.message-wrapper {
			display: flex;
			flex-direction: column;
			gap: 4px;
			max-width: 90%;
			width: fit-content;
		}
		.message-group.user .message-wrapper { margin-left: auto; }
		.message-role {
			font-size: 11px;
			font-weight: 500;
			color: var(--muted-foreground);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			padding: 0 4px;
		}
		.message-group.user .message-role { text-align: right; }
		.message-bubble {
			padding: 12px 16px;
			border-radius: var(--radius);
			font-size: 0.9375rem;
			line-height: 1.6;
			white-space: pre-wrap;
			word-wrap: break-word;
			overflow-wrap: break-word;
		}
		.message-group.user .message-bubble {
			background: var(--secondary);
			color: var(--secondary-foreground);
			border: 1px solid var(--border);
		}
		.message-group.assistant .message-bubble { color: var(--foreground); }
		.message-bubble code {
			font-family: ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, monospace;
			font-size: 0.875rem;
			padding: 2px 6px;
			border-radius: 4px;
			background: rgba(255,255,255,0.06);
		}
		.message-bubble pre {
			margin: 8px 0;
			padding: 12px;
			border-radius: 8px;
			background: var(--sidebar);
			border: 1px solid var(--border);
			overflow-x: auto;
		}
		.message-bubble pre code { padding: 0; background: none; font-size: 0.8125rem; line-height: 1.5; }

		/* ─── Empty State ──────────────────────────────── */
		.empty-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 12px;
			padding: 80px 20px;
			text-align: center;
		}
		.empty-icon {
			width: 48px;
			height: 48px;
			border-radius: 12px;
			background: var(--muted);
			display: flex;
			align-items: center;
			justify-content: center;
			color: var(--muted-foreground);
		}
		.empty-state h3 { font-size: 14px; font-weight: 500; color: var(--foreground); }
		.empty-state p { font-size: 13px; color: var(--muted-foreground); }

		/* ─── Input Bar ────────────────────────────────── */
		.input-bar {
			position: fixed;
			bottom: 0;
			left: var(--sidebar-width);
			right: 0;
			z-index: 100;
			display: flex;
			align-items: flex-end;
			gap: 8px;
			padding: 12px 16px;
			background: var(--background);
			border-top: 1px solid var(--border);
		}
		.input-bar textarea {
			flex: 1;
			resize: none;
			background: var(--secondary);
			color: var(--foreground);
			border: 1px solid var(--border);
			border-radius: var(--radius);
			padding: 10px 14px;
			font-family: inherit;
			font-size: 0.9375rem;
			line-height: 1.5;
			outline: none;
			min-height: 42px;
			max-height: 150px;
			transition: border-color 0.15s;
		}
		.input-bar textarea:focus { border-color: var(--ring); }
		.input-bar textarea::placeholder { color: var(--muted-foreground); opacity: 0.6; }
		.input-bar button {
			flex-shrink: 0;
			width: 42px;
			height: 42px;
			border-radius: var(--radius);
			border: none;
			background: var(--foreground);
			color: var(--background);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: opacity 0.15s;
		}
		.input-bar button:hover { opacity: 0.85; }
		.input-bar button:disabled { opacity: 0.4; cursor: not-allowed; }
		.input-bar button svg { width: 18px; height: 18px; }

		/* ─── Thinking ─────────────────────────────────── */
		.thinking {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 8px 14px;
			color: var(--muted-foreground);
			font-size: 13px;
		}
		.thinking-dots { display: flex; gap: 4px; }
		.thinking-dots span {
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: var(--muted-foreground);
			animation: dotPulse 1.4s ease-in-out infinite;
		}
		.thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
		.thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
		@keyframes dotPulse {
			0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
			40% { opacity: 1; transform: scale(1); }
		}

		/* ─── Responsive ───────────────────────────────── */
		@media (max-width: 768px) {
			.sidebar { display: none; }
			.input-bar { left: 0; }
		}

		/* ─── Password Overlay ─────────────────────────── */
		.auth-overlay {
			position: fixed;
			inset: 0;
			z-index: 200;
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--background);
		}
		.auth-overlay.hidden { display: none; }
		.auth-card {
			width: 100%;
			max-width: 380px;
			padding: 32px;
			background: var(--secondary);
			border: 1px solid var(--border);
			border-radius: 12px;
			text-align: center;
		}
		.auth-logo {
			width: 48px;
			height: 48px;
			margin: 0 auto 16px;
			border-radius: 12px;
			background: linear-gradient(135deg, #05bdf5 0%, #0080bd 100%);
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.auth-logo svg { width: 28px; height: 28px; }
		.auth-card h2 {
			font-size: 18px;
			font-weight: 600;
			margin-bottom: 4px;
		}
		.auth-card p {
			font-size: 13px;
			color: var(--muted-foreground);
			margin-bottom: 20px;
		}
		.auth-input {
			width: 100%;
			padding: 10px 14px;
			background: var(--background);
			color: var(--foreground);
			border: 1px solid var(--border);
			border-radius: var(--radius);
			font-size: 16px;
			font-family: ui-monospace, monospace;
			letter-spacing: 8px;
			text-align: center;
			outline: none;
			margin-bottom: 12px;
		}
		.auth-input:focus { border-color: var(--ring); }
		.auth-input::placeholder { letter-spacing: normal; color: var(--muted-foreground); opacity: 0.5; }
		.auth-btn {
			width: 100%;
			padding: 10px;
			background: var(--foreground);
			color: var(--background);
			border: none;
			border-radius: var(--radius);
			font-size: 14px;
			font-weight: 500;
			cursor: pointer;
			transition: opacity 0.15s;
		}
		.auth-btn:hover { opacity: 0.85; }
		.auth-btn:disabled { opacity: 0.4; cursor: not-allowed; }
		.auth-error {
			margin-top: 8px;
			font-size: 12px;
			color: #ef4444;
		}
		.auth-hint {
			margin-top: 12px;
			font-size: 11px;
			color: var(--muted-foreground);
		}
	</style>
</head>
<body>
	<!-- Password Overlay -->
	<div class="auth-overlay" id="authOverlay">
		<div class="auth-card">
			<div class="auth-logo">
				<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 2L2 7l10 5 10-5-10-5z"/>
					<path d="M2 17l10 5 10-5"/>
					<path d="M2 12l10 5 10-5"/>
				</svg>
			</div>
			<h2>Devil AI</h2>
			<p>Enter password to access this shared session</p>
			<input
				type="password"
				class="auth-input"
				id="authInput"
				placeholder="Enter 6-digit OTP or password"
				maxlength="20"
				autocomplete="off"
			/>
			<button class="auth-btn" id="authBtn" onclick="verifyPassword()">Unlock</button>
			<div class="auth-error" id="authError"></div>
			<div class="auth-hint">Ask the session owner for the access code</div>
		</div>
	</div>

	<div class="app-layout">
		<!-- Sidebar -->
		<aside class="sidebar">
			<div class="sidebar-header">
				<div class="sidebar-logo">
					<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 2L2 7l10 5 10-5-10-5z"/>
						<path d="M2 17l10 5 10-5"/>
						<path d="M2 12l10 5 10-5"/>
					</svg>
				</div>
				<span class="sidebar-brand">Devil AI</span>
				<div class="sidebar-status">
					<span class="sidebar-status-dot"></span>
					LIVE
				</div>
			</div>

			<div class="sidebar-section" style="flex:1; overflow-y:auto;">
				<div class="sidebar-label">Sessions</div>
				<div class="sidebar-list">
					${sessionListHtml || `<div class="sidebar-item active">
						<div class="sidebar-item-icon">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
							</svg>
						</div>
						<div class="sidebar-item-content">
							<div class="sidebar-item-title">${escapeHtml(sessionData.title)}</div>
							<div class="sidebar-item-meta">Shared session</div>
						</div>
						<div class="sidebar-active-dot"></div>
					</div>`}
				</div>
			</div>

			<div class="sidebar-footer">
				<div class="sidebar-footer-item">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="3"/>
						<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
					</svg>
					Settings
				</div>
			</div>
		</aside>

		<!-- Main Content -->
		<div class="main-content">
			<div class="titlebar">
				<span class="titlebar-title">${escapeHtml(sessionData.title)}</span>
				<span class="titlebar-session">\u2022 Shared Session</span>
				<span class="titlebar-spacer"></span>
				<div class="live-badge">
					<span class="sidebar-status-dot"></span>
					LIVE
				</div>
			</div>

			<div class="chat-area" id="chatArea">
			${sessionData.messages.length > 0
				? sessionData.messages.map((msg: any) => {
					const role = msg.role || 'assistant'
					const content = escapeHtml(msg.content || '')
					const label = role === 'user' ? 'You' : 'Devil AI'
					return `<div class="message-group ${role}">
						<div class="message-wrapper">
							<div class="message-role">${label}</div>
							<div class="message-bubble">${content}</div>
						</div>
					</div>`
				}).join('')
				: `<div class="empty-state" id="emptyState">
					<div class="empty-icon">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 2L2 7l10 5 10-5-10-5z"/>
							<path d="M2 17l10 5 10-5"/>
							<path d="M2 12l10 5 10-5"/>
						</svg>
					</div>
					<h3>Welcome to Devil AI</h3>
					<p>Start a conversation from the input below.</p>
				</div>`
			}
			</div>
		</div>
	</div>

	<!-- Input Bar -->
	<div class="input-bar" id="inputBar">
		<textarea
			id="msgInput"
			placeholder="Type a message to Devil AI..."
			rows="1"
			onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMessage()}"
		></textarea>
		<button id="sendBtn" onclick="sendMessage()" title="Send message">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="22" y1="2" x2="11" y2="13"/>
				<polygon points="22 2 15 22 11 13 2 9 22 2"/>
			</svg>
		</button>
	</div>

	<script>
		// ─── Auth System ────────────────────────────────
		const authOverlay = document.getElementById('authOverlay');
		const authInput = document.getElementById('authInput');
		const authBtn = document.getElementById('authBtn');
		const authError = document.getElementById('authError');
		let isAuthenticated = false;

		// Check if already authenticated (stored in sessionStorage)
		const storedViewerId = sessionStorage.getItem('devil-ai-viewer-id');
		if (storedViewerId) {
			isAuthenticated = true;
			authOverlay.classList.add('hidden');
		}

		async function verifyPassword() {
			const password = authInput.value.trim();
			if (!password) return;

			authBtn.disabled = true;
			authBtn.textContent = 'Verifying...';
			authError.textContent = '';

			try {
				const res = await fetch('/api/auth', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ password, viewerId })
				});
				const data = await res.json();

				if (data.ok) {
					isAuthenticated = true;
					sessionStorage.setItem('devil-ai-viewer-id', viewerId);
					authOverlay.classList.add('hidden');
					sendHeartbeat();
					connectSSE();
				} else {
					authError.textContent = data.error || 'Invalid password';
					authInput.value = '';
					authInput.focus();
				}
			} catch (e) {
				authError.textContent = 'Connection error. Please try again.';
			}

			authBtn.disabled = false;
			authBtn.textContent = 'Unlock';
		}

		authInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') verifyPassword();
		});

		if (!isAuthenticated) {
			authInput.focus();
		}

		// ─── Main App ──────────────────────────────────
		const viewerId = storedViewerId || 'viewer-' + Date.now() + '-' + Array.from(window.crypto.getRandomValues(new Uint8Array(4))).map(b => b.toString(16).padStart(2, '0')).join('');
		const chatArea = document.getElementById('chatArea');
		const msgInput = document.getElementById('msgInput');
		const sendBtn = document.getElementById('sendBtn');
		const SESSION_ID = '${requestedSessionId}';

		msgInput.addEventListener('input', () => {
			msgInput.style.height = 'auto';
			msgInput.style.height = Math.min(msgInput.scrollHeight, 150) + 'px';
		});

		async function sendHeartbeat() {
			try {
				await fetch('/api/join', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ viewerId })
				});
			} catch (e) {}
		}

		async function sendLeave() {
			try {
				await fetch('/api/leave', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ viewerId })
				});
			} catch (e) {}
		}

		// ─── Streaming state ──────────────────────────
		let streamingGroup = null;
		let streamingBubble = null;
		let streamBuffer = '';
		let streamCharIndex = 0;
		let typeInterval = null;

		function typewriterTick() {
			if (streamCharIndex < streamBuffer.length) {
				const chunk = streamBuffer.slice(streamCharIndex, streamCharIndex + 3);
				streamCharIndex += 3;
				if (streamingBubble) {
					streamingBubble.innerText = streamBuffer.slice(0, streamCharIndex);
				}
				chatArea.scrollTop = chatArea.scrollHeight;
			} else {
				clearInterval(typeInterval);
				typeInterval = null;
			}
		}

		function startStreaming() {
			const emptyState = document.getElementById('emptyState');
			if (emptyState) emptyState.remove();
			const group = document.createElement('div');
			group.className = 'message-group assistant';
			const wrapper = document.createElement('div');
			wrapper.className = 'message-wrapper';
			const role = document.createElement('div');
			role.className = 'message-role';
			role.textContent = 'Devil AI';
			const bubble = document.createElement('div');
			bubble.className = 'message-bubble';
			wrapper.appendChild(role);
			wrapper.appendChild(bubble);
			group.appendChild(wrapper);
			chatArea.appendChild(group);
			streamingGroup = group;
			streamingBubble = group.querySelector('.message-bubble');
			streamBuffer = '';
			streamCharIndex = 0;
			chatArea.scrollTop = chatArea.scrollHeight;
		}

		function appendToStream(text) {
			streamBuffer += text;
			if (!typeInterval) {
				typeInterval = setInterval(typewriterTick, 15);
			}
		}

		function finishStreaming() {
			if (typeInterval) {
				clearInterval(typeInterval);
				typeInterval = null;
			}
			if (streamingBubble) {
				streamingBubble.innerText = streamBuffer;
			}
			if (streamBuffer.length === 0 && streamingBubble) {
				const em = document.createElement('em');
				em.style.opacity = '0.5';
				em.textContent = 'No response';
				streamingBubble.innerText = '';
				streamingBubble.appendChild(em);
			}
			streamingGroup = null;
			streamingBubble = null;
			streamBuffer = '';
			streamCharIndex = 0;
		}

		// ─── SSE Streaming connection ─────────────────
		let eventSource = null;
		let pendingTextFor = null;

		function connectSSE() {
			if (eventSource) eventSource.close();
			eventSource = new EventSource('/api/stream');

			eventSource.addEventListener('message.part.delta', (e) => {
				try {
					const data = JSON.parse(e.data);
					const props = data.properties || {};
					if (props.sessionID !== SESSION_ID) return;
					if (props.field === 'text') {
						if (!streamingGroup) startStreaming();
						appendToStream(props.delta || '');
					}
				} catch (err) {}
			});

			eventSource.addEventListener('message.part.updated', (e) => {
				try {
					const data = JSON.parse(e.data);
					const part = data.properties?.part;
					if (!part || part.sessionID !== SESSION_ID) return;
					if (part.type === 'text' && part.text) {
						if (!streamingGroup) startStreaming();
						streamBuffer = part.text;
						streamCharIndex = part.text.length;
						finishStreaming();
					}
				} catch (err) {}
			});

			eventSource.addEventListener('session.status', (e) => {
				try {
					const data = JSON.parse(e.data);
					const props = data.properties || {};
					if (props.sessionID !== SESSION_ID) return;
					if (props.status?.type === 'idle' || props.status?.type === 'completed' || props.status?.type === 'failed') {
						if (streamingGroup) finishStreaming();
					}
				} catch (err) {}
			});

			eventSource.addEventListener('error', () => {
				setTimeout(connectSSE, 3000);
			});
		}

		// ─── Send message ──────────────────────────────
		async function sendMessage() {
			const text = msgInput.value.trim();
			if (!text) return;

			const emptyState = document.getElementById('emptyState');
			if (emptyState) emptyState.remove();

			const userGroup = document.createElement('div');
			userGroup.className = 'message-group user';
			const wrapper = document.createElement('div'); wrapper.className = 'message-wrapper'; const role = document.createElement('div'); role.className = 'message-role'; role.textContent = 'You'; const bubble = document.createElement('div'); bubble.className = 'message-bubble'; bubble.textContent = text; wrapper.appendChild(role); wrapper.appendChild(bubble); userGroup.appendChild(wrapper);
			chatArea.appendChild(userGroup);
			chatArea.scrollTop = chatArea.scrollHeight;

			msgInput.value = '';
			msgInput.style.height = 'auto';
			sendBtn.disabled = true;

			startStreaming();

			try {
				const res = await fetch('/api/message', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ text, viewerId })
				});
				const data = await res.json();
				if (data.response && !streamingGroup) {
					streamBuffer = data.response;
					streamCharIndex = 0;
					startStreaming();
					appendToStream(data.response);
					finishStreaming();
				} else if (data.error && !streamingGroup) {
					startStreaming();
					appendToStream('Error: ' + data.error);
					finishStreaming();
				}
			} catch (e) {
				if (!streamingGroup) {
					startStreaming();
					appendToStream('Failed to send message.');
					finishStreaming();
				}
			}
			sendBtn.disabled = false;
			msgInput.focus();
		}

		// ─── Sidebar session switch ────────────────────
		document.querySelectorAll('.sidebar-item').forEach(item => {
			item.addEventListener('click', () => {
				const sessionId = item.getAttribute('data-session-id');
				if (sessionId && sessionId !== SESSION_ID) {
					window.location.href = '/?session=' + sessionId;
				}
			});
		});

		msgInput.focus();
		if (isAuthenticated) {
			sendHeartbeat();
			setInterval(sendHeartbeat, 10000);
			connectSSE();
		}
		window.addEventListener('beforeunload', sendLeave);
	</script>
</body>
</html>`;
}

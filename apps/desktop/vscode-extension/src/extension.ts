/**
 * Devil AI VS Code Extension
 * 
 * Integrates Devil AI's AI capabilities directly into VS Code.
 * Features:
 * - Send code selections to AI for explanation, review, fix, optimization
 * - Write tests for selected code
 * - Inline code suggestions
 * - Chat panel for interactive AI assistance
 */

import * as vscode from 'vscode';

// ============================================================
// Types
// ============================================================

interface AIResponse {
	success: boolean;
	result?: string;
	error?: string;
}

interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
}

// ============================================================
// Extension State
// ============================================================

let outputChannel: vscode.OutputChannel;
let chatPanel: vscode.WebviewPanel | undefined;
let chatHistory: ChatMessage[] = [];

// ============================================================
// Activation
// ============================================================

export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel('Devil AI');
	outputChannel.appendLine('Devil AI extension activated');

	// Register commands
	const commands = [
		vscode.commands.registerCommand('devil-ai.sendSelection', sendSelection),
		vscode.commands.registerCommand('devil-ai.explainCode', explainCode),
		vscode.commands.registerCommand('devil-ai.reviewCode', reviewCode),
		vscode.commands.registerCommand('devil-ai.fixCode', fixCode),
		vscode.commands.registerCommand('devil-ai.optimizeCode', optimizeCode),
		vscode.commands.registerCommand('devil-ai.writeTests', writeTests),
		vscode.commands.registerCommand('devil-ai.openChat', openChatPanel),
		vscode.commands.registerCommand('devil-ai.applySuggestion', applySuggestion),
	];

	commands.forEach(cmd => context.subscriptions.push(cmd));

	// Register chat panel provider
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('devil-ai.chat', new ChatViewProvider())
	);

	outputChannel.appendLine('All commands registered');
}

export function deactivate() {
	outputChannel.appendLine('Devil AI extension deactivated');
}

// ============================================================
// Helper Functions
// ============================================================

function getSelectedCode(): string | undefined {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active editor');
		return undefined;
	}

	const selection = editor.selection;
	if (selection.isEmpty) {
		vscode.window.showErrorMessage('No code selected');
		return undefined;
	}

	return editor.document.getText(selection);
}

function getLanguageId(): string {
	const editor = vscode.window.activeTextEditor;
	return editor?.document.languageId || 'plaintext';
}

async function sendToAI(prompt: string, code?: string): Promise<AIResponse> {
	try {
		const config = vscode.workspace.getConfiguration('devil-ai');
		const serverUrl = config.get<string>('serverUrl', 'http://localhost:3100');

		const body: Record<string, unknown> = {
			prompt,
			language: getLanguageId(),
		};

		if (code) {
			body.code = code;
		}

		const response = await fetch(`${serverUrl}/api/ai/chat`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw new Error(`HTTP error ${response.status}`);
		}

		const data = await response.json();
		return { success: true, result: data.response || data.result };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		outputChannel.appendLine(`AI request failed: ${message}`);
		return { success: false, error: message };
	}
}

// ============================================================
// Command Handlers
// ============================================================

async function sendSelection() {
	const code = getSelectedCode();
	if (!code) return;

	const prompt = `Analyze this code and provide insights:\n\n\`\`\`${getLanguageId()}\n${code}\n\`\`\``;
	const response = await sendToAI(prompt, code);

	if (response.success && response.result) {
		showResponse('Code Analysis', response.result);
	} else {
		vscode.window.showErrorMessage(`Failed: ${response.error}`);
	}
}

async function explainCode() {
	const code = getSelectedCode();
	if (!code) return;

	const prompt = `Explain this code in detail. What does it do? How does it work?\n\n\`\`\`${getLanguageId()}\n${code}\n\`\`\``;
	const response = await sendToAI(prompt, code);

	if (response.success && response.result) {
		showResponse('Code Explanation', response.result);
	} else {
		vscode.window.showErrorMessage(`Failed: ${response.error}`);
	}
}

async function reviewCode() {
	const code = getSelectedCode();
	if (!code) return;

	const prompt = `Review this code for potential issues, bugs, security vulnerabilities, and improvements. Provide a detailed code review.\n\n\`\`\`${getLanguageId()}\n${code}\n\`\`\``;
	const response = await sendToAI(prompt, code);

	if (response.success && response.result) {
		showResponse('Code Review', response.result);
	} else {
		vscode.window.showErrorMessage(`Failed: ${response.error}`);
	}
}

async function fixCode() {
	const code = getSelectedCode();
	if (!code) return;

	const prompt = `Find and fix any bugs or issues in this code. Provide the corrected code with explanations.\n\n\`\`\`${getLanguageId()}\n${code}\n\`\`\``;
	const response = await sendToAI(prompt, code);

	if (response.success && response.result) {
		showResponse('Code Fix', response.result, true);
	} else {
		vscode.window.showErrorMessage(`Failed: ${response.error}`);
	}
}

async function optimizeCode() {
	const code = getSelectedCode();
	if (!code) return;

	const prompt = `Optimize this code for better performance, readability, and maintainability. Provide the optimized code with explanations.\n\n\`\`\`${getLanguageId()}\n${code}\n\`\`\``;
	const response = await sendToAI(prompt, code);

	if (response.success && response.result) {
		showResponse('Optimized Code', response.result, true);
	} else {
		vscode.window.showErrorMessage(`Failed: ${response.error}`);
	}
}

async function writeTests() {
	const code = getSelectedCode();
	if (!code) return;

	const prompt = `Write comprehensive unit tests for this code. Include edge cases and important scenarios.\n\n\`\`\`${getLanguageId()}\n${code}\n\`\`\``;
	const response = await sendToAI(prompt, code);

	if (response.success && response.result) {
		showResponse('Generated Tests', response.result, true);
	} else {
		vscode.window.showErrorMessage(`Failed: ${response.error}`);
	}
}

async function applySuggestion() {
	// Get the last suggestion from chat
	const lastAssistant = [...chatHistory].reverse().find(m => m.role === 'assistant');
	if (!lastAssistant) {
		vscode.window.showErrorMessage('No suggestion to apply');
		return;
	}

	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active editor');
		return;
	}

	const config = vscode.workspace.getConfiguration('devil-ai');
	const autoApply = config.get<boolean>('autoApply', false);

	if (!autoApply) {
		const confirmed = await vscode.window.showWarningMessage(
			'Apply AI suggestion to editor?',
			'Yes',
			'No'
		);
		if (confirmed !== 'Yes') return;
	}

	// Extract code block from the response
	const codeBlockMatch = lastAssistant.content.match(/```[\s\S]*?\n([\s\S]*?)```/);
	if (codeBlockMatch) {
		const newCode = codeBlockMatch[1];
		const selection = editor.selection;
		await editor.edit(editBuilder => {
			editBuilder.replace(selection, newCode);
		});
		vscode.window.showInformationMessage('Code applied successfully');
	} else {
		vscode.window.showWarningMessage('No code block found in the suggestion');
	}
}

// ============================================================
// UI Helpers
// ============================================================

function showResponse(title: string, content: string, isCode: boolean = false) {
	// Show in output channel
	outputChannel.appendLine(`\n=== ${title} ===\n${content}\n`);

	// Show notification
	const config = vscode.workspace.getConfiguration('devil-ai');
	const showNotifications = config.get<boolean>('showNotifications', true);

	if (showNotifications) {
		vscode.window.showInformationMessage(`${title}: ${content.substring(0, 100)}...`);
	}

	// Add to chat history
	chatHistory.push({
		role: 'assistant',
		content,
		timestamp: Date.now(),
	});

	// Show in webview if open
	if (chatPanel) {
		chatPanel.webview.postMessage({
			type: 'addMessage',
			message: { role: 'assistant', content, timestamp: Date.now() }
		});
	}
}

// ============================================================
// Chat Panel Provider
// ============================================================

class ChatViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'devil-ai.chat';
	private _view?: vscode.WebviewView;

	resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	): void {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: []
		};

		webviewView.webview.html = this.getHtmlForWebview();

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.type) {
					case 'sendMessage':
						await this.handleChatMessage(message.text);
						break;
				}
			},
			undefined,
			[]
		);
	}

	private async handleChatMessage(text: string) {
		// Add user message to history
		chatHistory.push({
			role: 'user',
			content: text,
			timestamp: Date.now(),
		});

		// Send to AI
		const response = await sendToAI(text);

		if (response.success && response.result) {
			// Add assistant response to history
			chatHistory.push({
				role: 'assistant',
				content: response.result,
				timestamp: Date.now(),
			});

			// Send response to webview
			this._view?.webview.postMessage({
				type: 'addMessage',
				message: { role: 'assistant', content: response.result, timestamp: Date.now() }
			});
		} else {
			this._view?.webview.postMessage({
				type: 'addError',
				error: response.error || 'Unknown error'
			});
		}
	}

	private getHtmlForWebview(): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Devil AI Chat</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            padding: 10px;
            margin: 0;
        }
        #messages {
            height: calc(100vh - 80px);
            overflow-y: auto;
            margin-bottom: 10px;
        }
        .message {
            padding: 8px 12px;
            margin: 4px 0;
            border-radius: 8px;
            max-width: 90%;
        }
        .user {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            margin-left: auto;
            text-align: right;
        }
        .assistant {
            background: var(--vscode-editor-inactiveSelectionBackground);
        }
        #input-container {
            display: flex;
            gap: 8px;
        }
        #input {
            flex: 1;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
        }
        button {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <div id="messages"></div>
    <div id="input-container">
        <input type="text" id="input" placeholder="Ask Devil AI anything..." />
        <button onclick="sendMessage()">Send</button>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        const messages = document.getElementById('messages');
        const input = document.getElementById('input');

        // Load existing chat history
        ${JSON.stringify(chatHistory)}.forEach(msg => addMessage(msg));

        function sendMessage() {
            const text = input.value.trim();
            if (!text) return;

            addMessage({ role: 'user', content: text, timestamp: Date.now() });
            vscode.postMessage({ type: 'sendMessage', text });
            input.value = '';
        }

        function addMessage(msg) {
            const div = document.createElement('div');
            div.className = 'message ' + msg.role;
            div.textContent = msg.content;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'addMessage':
                    addMessage(message.message);
                    break;
                case 'addError':
                    addMessage({ role: 'assistant', content: 'Error: ' + message.error, timestamp: Date.now() });
                    break;
            }
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    </script>
</body>
</html>`;
	}
}

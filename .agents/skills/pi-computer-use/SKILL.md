# Pi Computer Use - Desktop App Control Skill

## Overview
Pi Computer Use lets AI agents control desktop apps on macOS and Windows. The agent can look at app windows, understand buttons and text, and perform actions like clicking, typing, scrolling.

## When to Use
- User asks to automate desktop app interactions
- User wants to click buttons, type text, or scroll in apps
- User needs to interact with GUI applications
- User wants to take screenshots of apps and understand UI
- User asks to automate repetitive desktop tasks

## Installation Check
Before using, verify Pi Computer Use is installed:
```bash
which pi || echo "NOT_INSTALLED"
```

If not installed, run:
```bash
npm install -g pi
pi install npm:@injaneity/pi-computer-use
```

## Required Permissions (macOS)
- Accessibility
- Screen Recording (Screen and System Audio Recording)

Grant permissions to:
```
~/Applications/pi-computer-use.app
```

## Available Tools

### find_roots
Find all open app windows and their IDs.
```bash
pi computer-use find_roots
```

### observe_ui
Look at what's visible in a window.
```bash
pi computer-use observe_ui --window-id <ID>
```

### search_ui
Search the visible interface for text, buttons, and controls.
```bash
pi computer-use search_ui --window-id <ID> --query "button text"
```

### expand_ui
Get more details about a UI element.
```bash
pi computer-use expand_ui --element-id <ID>
```

### inspect_ui
Inspect parts of the interface in detail.
```bash
pi computer-use inspect_ui --element-id <ID>
```

### act_ui
Perform actions like clicking, typing, scrolling.
```bash
pi computer-use act_ui --action click --element-id <ID>
pi computer-use act_ui --action type --text "Hello"
pi computer-use act_ui --action scroll --direction down
```

### read_text
Read text from a UI element.
```bash
pi computer-use read_text --element-id <ID>
```

### wait_for
Wait for UI changes.
```bash
pi computer-use wait_for --condition "text_appears" --value "Done"
```

## Example Usage Prompts

- "Open Safari and search for something"
- "Click the Submit button in the form"
- "Type my email in the login field"
- "Scroll down in this window"
- "Take a screenshot and tell me what you see"
- "Automate filling out this form"
- "Click through this wizard step by step"
- "Read the text from this app window"

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| macOS 14+ | ✅ Supported | Requires Accessibility + Screen Recording permissions |
| Windows | ✅ Supported | Uses platform accessibility APIs |
| Linux | ❌ Not supported | - |

## Troubleshooting

If tools don't work:
1. Check permissions are granted
2. Run `pi computer-use doctor`
3. Restart the app after granting permissions

## Limitations

- Not a replacement for app APIs or MCP servers
- Use direct integrations when available
- Computer use is best when only GUI interface exists

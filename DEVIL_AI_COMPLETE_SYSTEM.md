# Devil AI - Complete Autonomous Agent System

## Overview
Devil AI ab ek complete autonomous agent hai jo sab kuch kar sakta hai:
- **Voice Control** - "Hey Devil AI" bol kar commands do
- **File Automation** - Files automatically organize karo
- **Browser Control** - Websites automate karo
- **Advanced Tools** - 20+ tools available hain

## Components Created

### 1. Voice Integration (`voice.ts`)
```typescript
// Voice-to-text aur text-to-speech
const voice = new VoiceIntegration()

// Sunna shuru karo
voice.startListening((result) => {
  console.log('Bola:', result.transcript)
})

// Bol kar jawaab do
voice.speak('Hello! Devil AI ready hai!')
```

**Features:**
- Speech-to-Text (STT)
- Text-to-Speech (TTS)
- Multiple languages support
- Wake word detection

### 2. File Automation (`file-automation.ts`)
```typescript
// Files automatically organize karo
const files = new FileAutomation()

// Downloads folder organize karo
await files.organizeDirectory('~/Downloads')

// Files search karo
const results = await files.searchFiles('~', /\.pdf$/i)

// Backup banao
await files.backupDirectory('~/Documents', '~/Backups')
```

**Features:**
- Automatic file organization by type
- File search with patterns
- Backup creation
- Directory watching
- Custom rules

### 3. Browser Control (`browser-control.ts`)
```typescript
// Browser automate karo
const browser = new BrowserControl()

// Google pe search karo
await browser.searchGoogle('React tutorials')

// YouTube pe search karo
await browser.searchYouTube('Devil AI demo')

// Website open karo
await browser.navigate('https://github.com')

// Form fill karo
await browser.fillForm({
  name: 'John',
  email: 'john@example.com'
})
```

**Features:**
- Website navigation
- Element clicking
- Text typing
- Form filling
- Screenshot capture
- Content extraction

### 4. Advanced Tools (`tools.ts`)
```typescript
// 20+ tools available hain
const tools = new DevilAITools()

// File tools
await tools.executeTool('file_read', { path: 'file.txt' })
await tools.executeTool('file_write', { path: 'file.txt', content: 'data' })
await tools.executeTool('file_search', { directory: '~', pattern: '*.pdf' })

// Web tools
await tools.executeTool('web_search', { query: 'React tutorials' })
await tools.executeTool('web_scrape', { url: 'https://example.com' })

// System tools
await tools.executeTool('system_info')
await tools.executeTool('process_list')
await tools.executeTool('shell_exec', { command: 'ls -la' })

// Memory tools
await tools.executeTool('memory_add', { key: 'user', value: 'John' })
await tools.executeTool('memory_get', { key: 'user' })

// Automation tools
await tools.executeTool('schedule_task', { task: 'backup', schedule: 'daily' })
await tools.executeTool('create_workflow', { name: 'daily', steps: [...] })
```

**Tool Categories:**
- **File**: read, write, search, organize
- **Web**: search, scrape, download
- **System**: info, processes, shell
- **Memory**: add, get, search
- **Automation**: schedule, workflow
- **Communication**: email, notification, message

### 5. Main Controller (`devil-ai.ts`)
```typescript
// Complete Devil AI system
const devilAI = new DevilAI()

// Initialize
await devilAI.initialize()

// Process input (text or voice)
const response = await devilAI.processInput('Hey Devil AI, organize my files')

// Direct commands
await devilAI.organizeFiles('~/Downloads')
await devilAI.browse('https://github.com')
await devilAI.search('React tutorials')
await devilAI.useTool('file_search', { pattern: '*.pdf' })

// Voice control
devilAI.startVoice()
devilAI.speak('Files organize ho gaye!')
```

## How to Use

### Method 1: Voice Commands
```
1. Devil AI App Open Karo
2. "Hey Devil AI" bolo
3. Command do: "organize my downloads"
4. Devil AI automatically karega!
```

### Method 2: Text Input
```
1. Chat interface mein type karo
2. "Hey Devil AI, search React tutorials"
3. Devil AI execute karega
```

### Method 3: Direct API
```typescript
import { DevilAI } from '@devil-ai/agent-bridge'

const devilAI = new DevilAI()
await devilAI.initialize()

// Any task
const result = await devilAI.processInput('organize my files')
console.log(result.message)
```

## Example Workflows

### Workflow 1: Morning Routine
```
User: "Hey Devil AI, good morning!"

Devil AI:
1. System info check karo
2. Downloads folder organize karo
3. Important emails check karo
4. Weather search karo
5. Summary bolo
```

### Workflow 2: Research Task
```
User: "Hey Devil AI, research React vs Vue"

Devil AI:
1. Google pe search karo
2. Top 5 results open karo
3. Content extract karo
4. Comparison table banao
5. Summary likho
```

### Workflow 3: File Management
```
User: "Hey Devil AI, clean up my computer"

Devil AI:
1. Sab folders scan karo
2. Duplicate files dhundho
3. Old files delete karo
4. Remaining files organize karo
5. Space saved batao
```

## Configuration

### Voice Settings
```typescript
const devilAI = new DevilAI({
  voiceEnabled: true,
  language: 'en-US'  // ya 'hi-IN' for Hindi
})
```

### File Settings
```typescript
// Custom rules add karo
devilAI.files.addRule({
  name: 'Code Files',
  pattern: /\.(js|ts|py|java)$/i,
  destination: '~/Code',
  action: 'move',
  enabled: true
})
```

### Browser Settings
```typescript
const devilAI = new DevilAI({
  browserHeadless: true  // Background mein browse karo
})
```

## Available Commands

### Voice Commands
- "Hey Devil AI, organize my files"
- "Hey Devil AI, search for [topic]"
- "Hey Devil AI, open [website]"
- "Hey Devil AI, what's my system info?"
- "Hey Devil AI, remember [something]"
- "Hey Devil AI, help me with [task]"

### Text Commands
- "organize downloads"
- "search google for React"
- "open github.com"
- "show system info"
- "remember my preferences"
- "backup my documents"

## Integration with Devil AI App

### Main Process Integration
```typescript
// apps/desktop/src/main/index.ts
import { DevilAI } from '@devil-ai/agent-bridge'

const devilAI = new DevilAI()
await devilAI.initialize()

// IPC handlers for renderer
ipcMain.handle('devil-ai:process', async (event, input) => {
  return devilAI.processInput(input)
})

ipcMain.handle('devil-ai:voice-start', async () => {
  devilAI.startVoice()
})

ipcMain.handle('devil-ai:voice-stop', async () => {
  devilAI.stopVoice()
})
```

### Renderer Integration
```typescript
// In React component
const processCommand = async (command: string) => {
  const result = await window.devilAi.process(command)
  console.log(result.message)
}

const startVoice = async () => {
  await window.devilAi.voiceStart()
}
```

## Testing

### Test Voice
```typescript
const devilAI = new DevilAI()
await devilAI.initialize()

// Test voice recognition
devilAI.startVoice()
console.log('Say "Hey Devil AI"...')
```

### Test File Automation
```typescript
// Test organize
const result = await devilAI.organizeFiles('~/Downloads')
console.log(result.message)
```

### Test Browser
```typescript
// Test search
const result = await devilAI.search('React tutorials')
console.log(result.data)
```

## Summary

**Devil AI ab ek complete autonomous agent hai:**

✅ **Voice Control** - "Hey Devil AI" se commands do
✅ **File Automation** - Files automatically organize
✅ **Browser Control** - Websites automate
✅ **20+ Tools** - Sab kuch kar sakta hai
✅ **Memory System** - Yaad rakhta hai
✅ **Workflow Automation** - Tasks schedule karo

**Bas bolo: "Hey Devil AI, [task]" aur wo khud karega!** 🚀

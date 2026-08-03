const fs = require('fs');
const content = fs.readFileSync('src/renderer/router.tsx', 'utf-8');

const imports = [
	{ name: 'AutomationDetail', path: './components/automations/automation-detail' },
	{ name: 'AutomationRunDetail', path: './components/automations/automation-run-detail' },
	{ name: 'AutomationsPage', path: './components/automations/automations-page' },
	{ name: 'InboxEmptyState', path: './components/automations/inbox-empty-state' },
	{ name: 'ErrorPage', path: './components/error-page' },
	{ name: 'NewChat', path: './components/new-chat' },
	{ name: 'NotFoundPage', path: './components/not-found-page' },
	{ name: 'NotesPage', path: './components/notes/notes-page' },
	{ name: 'RootLayout', path: './components/root-layout' },
	{ name: 'SessionRoute', path: './components/session-route' },
	{ name: 'AboutSettings', path: './components/settings/about-settings' },
	{ name: 'GeneralSettings', path: './components/settings/general-settings' },
	{ name: 'NotificationSettings', path: './components/settings/notification-settings' },
	{ name: 'ProviderSettings', path: './components/settings/provider-settings' },
	{ name: 'ServerSettings', path: './components/settings/server-settings' },
	{ name: 'SettingsPage', path: './components/settings/settings-page' },
	{ name: 'SetupSettings', path: './components/settings/setup-settings' },
	{ name: 'WorktreeSettings', path: './components/settings/worktree-settings' },
	{ name: 'ExperimentalFeaturesSettings', path: './components/settings/experimental-features' },
	{ name: 'DeveloperToolsSettings', path: './components/settings/developer-tools-settings' },
	{ name: 'SidebarLayout', path: './components/sidebar-layout' },
];

let newContent = content.replace(/import {[^}]+} from "\.[^"]+"/g, '');
// Add React import and generic wrapper
let replacements = `import React, { Suspense } from "react";\n\nconst lazyRoute = (importFn, name) => {\n  const LazyComponent = React.lazy(() => importFn().then(m => ({ default: m[name] })));\n  return (props) => (\n    <Suspense fallback={null}>\n      <LazyComponent {...props} />\n    </Suspense>\n  );\n};\n\n`;

for (const imp of imports) {
  replacements += `const ${imp.name} = lazyRoute(() => import("${imp.path}"), "${imp.name}");\n`;
}

// Just insert after the first tanstack import
newContent = newContent.replace('} from "@tanstack/react-router"', '} from "@tanstack/react-router"\n' + replacements);

// clean up multiple newlines
newContent = newContent.replace(/\n{3,}/g, '\n\n');

fs.writeFileSync('src/renderer/router.tsx', newContent);

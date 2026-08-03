import { Hono } from "hono"

const legal = new Hono()

const layout = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="X-Frame-Options" content="DENY">
    <title>${title.replace(/</g, "&lt;").replace(/>/g, "&gt;")} - Devil AI</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            color: #d4d4d8;
            background-color: #09090b;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }
        h1, h2, h3 { color: #fff; }
        a { color: #f87171; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .container {
            background: #18181b;
            padding: 2rem 3rem;
            border-radius: 12px;
            border: 1px solid #27272a;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }
        .header { text-align: center; margin-bottom: 2rem; border-bottom: 1px solid #27272a; padding-bottom: 2rem; }
        .footer { text-align: center; margin-top: 3rem; font-size: 0.875rem; color: #a1a1aa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <p>Last updated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} Agribee. All rights reserved.
        </div>
    </div>
</body>
</html>
`

legal.get("/privacy", (c) => {
	const content = `
        <h2>1. Introduction</h2>
        <p>Welcome to Devil AI. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you use our application.</p>
        
        <h2>2. Data We Collect</h2>
        <p>When you connect third-party services (such as Gmail, Google Calendar, etc.) to Devil AI, we request permissions to access specific data on your behalf. We only collect data necessary to provide the AI features you request.</p>
        <ul>
            <li><strong>Email Data:</strong> If you connect Gmail, we access your emails solely to process your requests (e.g., summarizing, drafting replies) when you explicitly ask the AI to do so.</li>
            <li><strong>Authentication Tokens:</strong> We securely store OAuth access tokens and refresh tokens to maintain your connection.</li>
        </ul>

        <h2>3. How We Use Your Data</h2>
        <p>Devil AI's use and transfer of information received from Google APIs to any other app will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
        <p>We do not use your data for training AI models without your explicit consent, and we do not sell your personal data to third parties.</p>

        <h2>4. Data Storage and Security</h2>
        <p>Your authentication tokens are stored securely using industry-standard encryption. Your emails and other sensitive data are processed in real-time and are not permanently stored on our servers unless required for a specific feature you enable.</p>

        <h2>5. Your Rights</h2>
        <p>You can disconnect your third-party accounts at any time from within the Devil AI application. Upon disconnection, we will delete your authentication tokens from our systems.</p>

        <h2>6. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at support@agribee.in.</p>
    `
	return c.html(layout("Privacy Policy", content))
})

legal.get("/terms", (c) => {
	const content = `
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using Devil AI, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
        
        <h2>2. Description of Service</h2>
        <p>Devil AI is an AI-powered coding and productivity assistant. The service includes integration with third-party platforms (like Google Workspace, GitHub, Slack, etc.) to enhance your workflow.</p>

        <h2>3. User Responsibilities</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree not to use the service for any illegal or unauthorized purpose.</p>

        <h2>4. Third-Party Services</h2>
        <p>Our service may contain links to or integrations with third-party web sites or services that are not owned or controlled by Devil AI. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.</p>

        <h2>5. Limitation of Liability</h2>
        <p>In no event shall Devil AI, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>

        <h2>6. Changes to Terms</h2>
        <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any significant changes.</p>
    `
	return c.html(layout("Terms of Service", content))
})

export default legal

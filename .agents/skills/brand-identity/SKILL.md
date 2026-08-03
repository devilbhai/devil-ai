---
name: brand-identity
description: Brand identity design - logo, colors, typography, guidelines, brand voice.
---

# Brand Identity

## When to Apply
Use this skill for creating brand identity, designing logos, or establishing brand guidelines.

## Core Concepts
- Logo design
- Color palette
- Typography
- Brand voice
- Visual guidelines
- Brand consistency

## Best Practices
- Research target audience
- Create unique visual identity
- Ensure scalability
- Test across mediums
- Document guidelines
- Maintain consistency

## Logo Design Process
```markdown
## Logo Brief

### Company
[TechStartup]

### Industry
SaaS / Developer Tools

### Values
- Innovation
- Simplicity
- Reliability

### Target Audience
- Developers
- Tech leads
- CTOs

### Deliverables
- Primary logo
- Secondary logo
- Icon mark
- Favicon
```

## Color Palette
```css
:root {
  /* Primary Colors */
  --brand-primary: #007bff;
  --brand-primary-light: #4dabf7;
  --brand-primary-dark: #0056b3;
  
  /* Secondary Colors */
  --brand-secondary: #6c757d;
  --brand-secondary-light: #adb5bd;
  --brand-secondary-dark: #495057;
  
  /* Accent Colors */
  --brand-accent: #28a745;
  --brand-accent-light: #5cb85c;
  --brand-accent-dark: #1e7e34;
  
  /* Neutral Colors */
  --brand-dark: #212529;
  --brand-gray: #6c757d;
  --brand-light: #f8f9fa;
  --brand-white: #ffffff;
}
```

## Typography
```css
:root {
  /* Headings */
  --font-heading: 'Inter', sans-serif;
  --font-weight-heading: 700;
  
  /* Body */
  --font-body: 'Inter', sans-serif;
  --font-weight-body: 400;
  
  /* Code */
  --font-code: 'Fira Code', monospace;
  --font-weight-code: 400;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: var(--font-weight-heading);
}

body {
  font-family: var(--font-body);
  font-weight: var(--font-weight-body);
}

code, pre {
  font-family: var(--font-code);
  font-weight: var(--font-weight-code);
}
```

## Brand Voice
```markdown
## Brand Voice Guidelines

### Tone
- Professional but approachable
- Technical but clear
- Confident but humble

### Language
- Use active voice
- Keep sentences short
- Avoid jargon when possible
- Use specific examples

### Personality Traits
- Innovative
- Reliable
- Developer-friendly
- Solution-oriented

### Examples

#### Do
"We built this for developers who want to ship faster."

#### Don't
"Our enterprise solution leverages cutting-edge technology to optimize developer workflows."
```

## Brand Guidelines Document
```markdown
# Brand Guidelines

## Logo Usage
- Minimum size: 24px height
- Clear space: 1x logo height
- Background: Use on white or dark backgrounds

## Color Usage
- Primary: CTAs, links, highlights
- Secondary: Supporting elements
- Accent: Success states, badges

## Typography
- H1: 48px / 700
- H2: 36px / 700
- H3: 24px / 600
- Body: 16px / 400
- Small: 14px / 400

## Spacing
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
```

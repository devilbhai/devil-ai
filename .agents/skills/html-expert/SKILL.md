---
name: html-expert
description: HTML5 development. Semantic markup, accessibility, forms, multimedia, SEO.
---

# HTML Expert

## When to Apply
Use this skill when building or maintaining HTML5 documents, focusing on semantic structure, accessibility, responsive media, forms, and SEO-friendly markup.

## Core Concepts
- **Semantic Elements**: `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`, `<figure>`
- **Accessibility (WCAG)**: ARIA roles, landmarks, screen reader support, keyboard navigation, focus management
- **Forms**: Input types, validation attributes, fieldset/legend grouping, label associations, custom controls
- **Multimedia**: `<video>`, `<audio>`, `<picture>`, `<source>`, responsive images, lazy loading
- **SEO**: Structured data (JSON-LD), Open Graph, meta tags, canonical URLs, heading hierarchy
- **Performance**: Preload/prefetch hints, resource hints, async/defer scripts, critical CSS
- **Validation**: W3C validation, HTML spec compliance, semantic correctness

## Implementation
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Page description for search engines">
  <title>Page Title</title>

  <!-- Preload critical resources -->
  <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preconnect" href="https://api.example.com">

  <!-- Structured data for SEO -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "My App",
    "description": "App description"
  }
  </script>

  <!-- Open Graph -->
  <meta property="og:title" content="Page Title">
  <meta property="og:description" content="Page description">
  <meta property="og:image" content="https://example.com/og-image.jpg">
  <meta property="og:type" content="website">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <header role="banner">
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/" aria-current="page">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <main id="main-content" role="main">
    <article>
      <header>
        <h1>Article Title</h1>
        <time datetime="2026-07-05">July 5, 2026</time>
      </header>

      <section aria-labelledby="section-1">
        <h2 id="section-1">Section Heading</h2>
        <p>Content with <strong>semantic emphasis</strong> and <em>logical notation</em>.</p>

        <!-- Responsive image with art direction -->
        <figure>
          <picture>
            <source media="(min-width: 800px)" srcset="large.webp" type="image/webp">
            <source media="(min-width: 400px)" srcset="medium.webp" type="image/webp">
            <img src="small.jpg" alt="Descriptive alt text for the image"
                 loading="lazy" width="800" height="600">
          </picture>
          <figcaption>Caption describing the image content</figcaption>
        </figure>
      </section>

      <!-- Accessible form -->
      <section aria-labelledby="form-heading">
        <h2 id="form-heading">Contact Form</h2>
        <form action="/api/contact" method="POST" novalidate>
          <fieldset>
            <legend>Personal Information</legend>

            <div>
              <label for="name">Full Name <span aria-hidden="true">*</span></label>
              <input type="text" id="name" name="name" required
                     autocomplete="name" aria-required="true">
            </div>

            <div>
              <label for="email">Email <span aria-hidden="true">*</span></label>
              <input type="email" id="email" name="email" required
                     autocomplete="email" aria-required="true"
                     aria-describedby="email-hint">
              <span id="email-hint">We'll never share your email</span>
            </div>

            <div>
              <label for="message">Message</label>
              <textarea id="message" name="message" rows="5"
                        aria-describedby="message-count"></textarea>
              <span id="message-count" aria-live="polite"></span>
            </div>
          </fieldset>

          <button type="submit">Send Message</button>
        </form>
      </section>
    </article>
  </main>

  <footer role="contentinfo">
    <p>&copy; 2026 Company Name. All rights reserved.</p>
  </footer>
</body>
</html>
```

## Best Practices
- Always use semantic HTML elements — never use `<div>` for everything
- Ensure every interactive element is keyboard accessible
- Provide meaningful alt text for images, or use `alt=""` for decorative images
- Use `aria-live` regions for dynamic content updates
- Maintain a logical heading hierarchy (h1 → h2 → h3)
- Include a "skip to content" link as the first focusable element
- Use `loading="lazy"` for below-the-fold images
- Validate HTML with W3C validator and test with screen readers

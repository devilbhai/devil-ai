---
name: email-automation
description: Email automation - sequences, templates, tracking, A/B testing, deliverability.
---

# Email Automation

## When to Apply
Use this skill for email marketing, automated sequences, or transactional emails.

## Core Concepts
- Email sequences
- Template design
- A/B testing
- Deliverability optimization
- Tracking and analytics
- Segmentation

## Best Practices
- Personalize content
- Optimize send times
- A/B test subject lines
- Monitor deliverability
- Segment your audience
- Respect unsubscribe requests
- Use double opt-in

## Email Sequence
```yaml
welcome_sequence:
  - delay: 0
    subject: "Welcome to {{company}}!"
    template: welcome_email
  - delay: 2d
    subject: "Getting started guide"
    template: getting_started
  - delay: 5d
    subject: "Tips for success"
    template: tips
  - delay: 10d
    subject: "Need help?"
    template: support_offer
```

## Template Structure
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #007bff; color: white; padding: 20px; }
    .content { padding: 20px; }
    .button { 
      background: #007bff; 
      color: white; 
      padding: 10px 20px; 
      text-decoration: none; 
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome, {{first_name}}!</h1>
    </div>
    <div class="content">
      <p>Thank you for joining {{company}}.</p>
      <p>Here's how to get started:</p>
      <ol>
        <li>Complete your profile</li>
        <li>Explore the dashboard</li>
        <li>Connect your accounts</li>
      </ol>
      <a href="{{dashboard_url}}" class="button">Go to Dashboard</a>
    </div>
  </div>
</body>
</html>
```

## A/B Testing
```python
def send_ab_test(template_a, template_b, audience, split=0.5):
    half = len(audience) // 2
    group_a = audience[:half]
    group_b = audience[half:]
    
    send_email(template_a, group_a)
    send_email(template_b, group_b)
    
    results_a = track_opens(template_a)
    results_b = track_opens(template_b)
    
    winner = "A" if results_a.open_rate > results_b.open_rate else "B"
    return winner
```

## Deliverability
- Authenticate with SPF, DKIM, DMARC
- Clean your list regularly
- Monitor bounce rates
- Avoid spam triggers
- Use double opt-in
- Honor unsubscribe requests

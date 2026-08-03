---
name: social-media-scheduler
description: Social media scheduling - content calendar, cross-platform posting, analytics, engagement.
---

# Social Media Scheduler

## When to Apply
Use this skill for social media management, content scheduling, or engagement automation.

## Core Concepts
- Content calendar management
- Cross-platform scheduling
- Analytics and reporting
- Engagement automation
- Content optimization

## Best Practices
- Maintain consistent posting schedule
- Adapt content for each platform
- Use analytics to optimize
- Engage with audience regularly
- Track performance metrics
- Repurpose content across platforms

## Content Calendar
```yaml
content_calendar:
  monday:
    - platform: linkedin
      time: "09:00"
      content: "Industry insight article"
      hashtags: ["#business", "#growth"]
    - platform: twitter
      time: "12:00"
      content: "Quick tip thread"
  tuesday:
    - platform: instagram
      time: "10:00"
      content: "Behind the scenes photo"
      format: story
    - platform: linkedin
      time: "14:00"
      content: "Team spotlight"
```

## Cross-Platform Posting
```python
class SocialScheduler:
    def __init__(self):
        self.platforms = {
            "twitter": TwitterAPI(),
            "linkedin": LinkedInAPI(),
            "instagram": InstagramAPI()
        }
    
    def schedule_post(self, content, platforms, time):
        for platform in platforms:
            adapted_content = self.adapt_for_platform(content, platform)
            self.platforms[platform].schedule(adapted_content, time)
    
    def adapt_for_platform(self, content, platform):
        if platform == "twitter":
            return self.truncate(content, 280)
        elif platform == "linkedin":
            return self.format_for_linkedin(content)
        elif platform == "instagram":
            return self.add_hashtags(content)
```

## Analytics Dashboard
```python
def generate_report(scheduler, period="weekly"):
    report = {
        "twitter": {
            "posts": 15,
            "impressions": 50000,
            "engagement_rate": 0.032,
            "top_post": "Tech tip thread"
        },
        "linkedin": {
            "posts": 8,
            "impressions": 25000,
            "engagement_rate": 0.045,
            "top_post": "Industry analysis"
        }
    }
    return report
```

## Engagement Automation
```python
class EngagementBot:
    def respond_to_comments(self, comments):
        for comment in comments:
            if self.is_positive(comment):
                self.send_thank_you(comment)
            elif self.is_question(comment):
                self.send_answer(comment)
            else:
                self.flag_for_review(comment)
```

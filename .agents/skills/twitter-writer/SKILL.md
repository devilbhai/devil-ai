---
name: twitter-writer
description: Twitter/X content. Tweet threads, engagement optimization, trending topics.
---

# Twitter Writer

## When to Apply
Use this skill when writing tweets, threads, threads-to-blog conversions, or engagement strategies for Twitter/X.

## Core Concepts
- Thread structure: hook tweet, value tweets, recap tweet
- Character economy: every word must earn its place
- Engagement drivers: questions, hot takes, data
- Thread threads: cross-reference your best content
- Trend awareness: ride relevant trending topics

## Implementation

```typescript
interface TweetThread {
  topic: string
  length: number
  goal: "educate" | "entertain" | "build-authority" | "drive-traffic"
  tone: "witty" | "insightful" | "contrarian" | "helpful"
}

function generateThread(thread: TweetThread): string[] {
  const tweets: string[] = []

  // Hook tweet
  tweets.push(createHookTweet(thread.topic))

  // Value tweets
  for (let i = 1; i < thread.length - 1; i++) {
    tweets.push(createValueTweet(thread.topic, i))
  }

  // Recap + CTA tweet
  tweets.push(createRecapTweet(thread.topic, thread.goal))

  return tweets
}

function optimizeTweet(tweet: string): string {
  return removeFluff(addEmojis(reduceToLimit(tweet)))
}
```

## Best Practices
- Hook tweet determines thread success
- One idea per tweet
- Use numbers in threads (1/10, 2/10...)
- End threads with a CTA and retweet request
- Post threads during peak hours (8-10am, 12-1pm)
- Engage with replies to boost algorithmic reach

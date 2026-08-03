---
name: skill-manager
description: Skill lifecycle management. Skill creation, versioning, dependency resolution, conflict detection.
---

# Skill Manager

## When to Apply
Use when creating new skills, updating existing ones, resolving skill conflicts, or managing skill dependencies. Apply to maintain the skill ecosystem and ensure skill quality.

## Core Concepts
- **Skill creation**: Designing and implementing new skills
- **Versioning**: Semantic versioning for skill evolution
- **Dependency resolution**: Managing skill dependencies and conflicts
- **Conflict detection**: Identifying overlapping or incompatible skills
- **Quality assurance**: Testing and validating skills
- **Lifecycle management**: From creation to deprecation

## Implementation
```
1. Define skill purpose and scope
2. Create skill following template structure
3. Add skill metadata and dependencies
4. Test skill in isolation
5. Register skill in available_skills
6. Monitor skill usage and feedback
7. Update or deprecate as needed
```

## Best Practices
- Keep skills focused on a single responsibility
- Document when to use (and when not to use) each skill
- Version skills semantically (major.minor.patch)
- Test skills with realistic scenarios
- Archive deprecated skills rather than deleting

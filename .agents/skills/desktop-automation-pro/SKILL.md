---
name: desktop-automation-pro
description: Advanced desktop automation - complex workflows, screen recognition, adaptive automation.
---

# Desktop Automation Pro

## When to Apply
Use this skill for complex desktop automation, screen recognition, or adaptive workflows.

## Core Concepts
- Screen recognition and OCR
- Complex workflow orchestration
- Error recovery and retry
- Adaptive automation
- Multi-application workflows
- Data extraction from UI

## Best Practices
- Build resilient selectors
- Implement retry logic
- Use fallback strategies
- Log all actions
- Handle dynamic UIs
- Use image recognition as backup
- Test across platforms

## Complex Workflow
```python
class DesktopAutomation:
    def __init__(self):
        self.steps = []
        self.retries = 3
    
    def add_step(self, name, action, selector=None):
        self.steps.append({
            "name": name,
            "action": action,
            "selector": selector
        })
    
    def execute(self):
        for step in self.steps:
            for attempt in range(self.retries):
                try:
                    self.perform_action(step)
                    break
                except Exception as e:
                    if attempt == self.retries - 1:
                        self.handle_failure(step, e)
                    else:
                        self.retry_delay(attempt)
```

## Screen Recognition
```python
import pyautogui
import pytesseract
from PIL import Image

def find_element_by_text(text):
    screenshot = pyautogui.screenshot()
    data = pytesseract.image_to_data(screenshot, output_type=pytesseract.Output.DICT)
    
    for i, word in enumerate(data["text"]):
        if text.lower() in word.lower():
            x = data["left"][i] + data["width"][i] // 2
            y = data["top"][i] + data["height"][i] // 2
            return (x, y)
    
    return None
```

## Adaptive Automation
```python
class AdaptiveAutomation:
    def __init__(self):
        self.fallback_strategies = [
            self.click_by_text,
            self.click_by_image,
            self.click_by_coordinates
        ]
    
    def click_element(self, target):
        for strategy in self.fallback_strategies:
            try:
                strategy(target)
                return True
            except:
                continue
        return False
```

## Error Recovery
```python
def execute_with_recovery(action, max_retries=3):
    for attempt in range(max_retries):
        try:
            return action()
        except ElementNotFoundError:
            wait_for_element(action.target, timeout=5)
        except Exception as e:
            log.warning(f"Attempt {attempt + 1} failed: {e}")
            time.sleep(2 ** attempt)
    raise AutomationError(f"Failed after {max_retries} attempts")
```

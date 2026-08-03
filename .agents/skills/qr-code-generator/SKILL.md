---
name: qr-code-generator
description: QR code generation. Covers QR codes, barcodes, custom styling, logos, error correction, batch generation.
---

# QR Code Generator

## When to Apply
Use this skill when generating QR codes for URLs, contact information, Wi-Fi credentials, or other data. Apply for custom styling, logo embedding, and batch generation.

## Core Concepts
- QR Code Standards: QR Code Model 2, Micro QR, iQR
- Error Correction: L, M, Q, H levels (7%-30% recovery)
- Data Encoding: Numeric, alphanumeric, byte, Kanji
- Customization: Colors, patterns, logos, frames
- Scanning: Compatibility with various readers
- Batch Generation: Multiple QR codes efficiently
- Dynamic QR: Updatable content without regeneration
- Size and Resolution: Print quality considerations

## Implementation
```python
# Python qrcode library
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer

# Basic QR code
qr = qrcode.QRCode(version=1, box_size=10, border=5)
qr.add_data("https://example.com")
qr.make(fit=True)
img = qr.make_image(fill_color="black", back_color="white")
img.save("qrcode.png")

# QR code with logo
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H)
qr.add_data("https://example.com")
qr.make(fit=True)
img = qr.make_image().convert("RGB")

# Add logo
from PIL import Image
logo = Image.open("logo.png")
logo_size = 60
logo = logo.resize((logo_size, logo_size))
pos = ((img.size[0] - logo_size) // 2, (img.size[1] - logo_size) // 2)
img.paste(logo, pos)
img.save("qrcode_with_logo.png")

# Styled QR code
img = qr.make_image(
    image_factory=StyledPilImage,
    module_drawer=RoundedModuleDrawer(),
    fill_color="#2c3e50",
    back_color="#ecf0f1"
)

# Batch generation
def generate_qr_batch(data_list, prefix="qr"):
    for i, data in enumerate(data_list):
        qr = qrcode.QRCode(box_size=8, border=4)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image()
        img.save(f"{prefix}_{i}.png")
```

```javascript
// JavaScript qrcode library
import QRCode from 'qrcode';

// Generate QR code to canvas
QRCode.toCanvas(document.getElementById('canvas'), 'https://example.com', {
  width: 256,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#ffffff'
  }
});

// Generate QR code to data URL
QRCode.toDataURL('https://example.com', {
  errorCorrectionLevel: 'H'
}).then(url => {
  document.getElementById('qr-image').src = url;
});
```

## Best Practices
- Use error correction level H (30%) when adding logos
- Test scanning with multiple devices and apps
- Choose appropriate size for scanning distance
- Use high contrast colors for better scanning
- Avoid placing logos on critical data areas
- Generate PNG for web, SVG for print
- Test with various lighting conditions
- Consider dynamic QR codes for updatable content
- Document QR code content and purpose
- Batch generate with consistent styling
- Provide fallback text representation
- Test encoding with target data types
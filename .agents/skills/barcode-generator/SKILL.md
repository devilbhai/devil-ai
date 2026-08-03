---
name: barcode-generator
description: Barcode generation. Covers Code128, EAN13, UPC, Code39, custom formats, label printing.
---

# Barcode Generator

## When to Apply
Use this skill when generating barcodes for products, inventory, asset tracking, or labeling. Apply for various barcode formats and label printing.

## Core Concepts
- Barcode Types: Code128, EAN13, UPC, Code39, QR Code
- Encoding: Data representation in bars and spaces
- Checksums: Validation digits for accuracy
- Human Readable: Text below barcode
- Label Design: Size, placement, additional info
- Printing: Resolution, contrast, placement
- Scanning: Compatibility with various scanners
- Standards: GS1, ISBN, ISSN requirements

## Implementation
```python
# Python barcode library
import barcode
from barcode.writer import ImageWriter

# Code128 barcode
code128 = barcode.get('code128', 'ABC1234567890', writer=ImageWriter())
code128.save('barcode_code128')

# EAN13 barcode
ean = barcode.get('ean13', '5901234123457', writer=ImageWriter())
ean.save('barcode_ean13')

# UPC-A barcode
upc = barcode.get('upca', '012345678905', writer=ImageWriter())
upc.save('barcode_upc')

# Code39 barcode
code39 = barcode.get('code39', 'HELLO123', writer=ImageWriter())
code39.save('barcode_code39')

# Custom options
from barcode.writer import ImageWriter

def create_barcode_with_options(data, barcode_type='code128'):
    writer = ImageWriter()
    writer.set_options({
        'module_width': 0.3,
        'module_height': 15,
        'quiet_zone': 6.5,
        'font_size': 10,
        'text_distance': 5,
        'center_text': True
    })
    
    barcode_obj = barcode.get(barcode_type, data, writer=writer)
    return barcode_obj.save('custom_barcode')

# Batch generation
def generate_barcode_batch(items, barcode_type='code128'):
    for item in items:
        barcode_obj = barcode.get(barcode_type, item['data'])
        barcode_obj.save(f"barcode_{item['name']}")
```

```javascript
// JavaScript JsBarcode library
import JsBarcode from 'jsbarcode';

// Generate barcode to canvas
JsBarcode('#barcode', '1234567890128', {
  format: 'EAN13',
  width: 2,
  height: 100,
  displayValue: true,
  fontSize: 20,
  margin: 5
});

// Generate to image
const canvas = document.createElement('canvas');
JsBarcode(canvas, 'ABC123', {
  format: 'CODE128',
  lineColor: '#000',
  width: 2,
  height: 100
});
document.body.appendChild(canvas);
```

```python
# Label printing with barcode
from reportlab.lib.pagesizes import label
from reportlab.pdfgen import canvas
import barcode

def create_label(data, product_name, filename):
    c = canvas.Canvas(filename, pagesize=label.LABEL)
    
    # Add product name
    c.setFont("Helvetica", 12)
    c.drawString(20, 100, product_name)
    
    # Generate barcode
    barcode_obj = barcode.get('code128', data, writer=barcode.writer.ImageWriter())
    barcode_file = barcode_obj.save('temp_barcode')
    
    # Add barcode to label
    c.drawImage(barcode_file, 20, 20, width=200, height=50)
    
    c.save()
```

## Best Practices
- Use appropriate barcode type for your use case
- Verify checksum calculation for validation
- Test scanning with multiple scanner types
- Ensure sufficient quiet zone around barcode
- Use high contrast colors (black on white)
- Print at sufficient resolution (300 DPI minimum)
- Test printing on actual label stock
- Document barcode format and encoding
- Follow GS1 standards for retail products
- Store barcode data in database for tracking
- Provide human-readable fallback text
- Test scanning under various lighting conditions
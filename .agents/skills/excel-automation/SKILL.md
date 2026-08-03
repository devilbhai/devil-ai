---
name: excel-automation
description: Excel/Spreadsheet automation. Covers OpenPyXL, xlsx reading/writing, formulas, charts, pivot tables, data validation, formatting.
---

# Excel/Spreadsheet Automation

## When to Apply
- Reading and writing Excel files programmatically
- Generating reports with charts and formatting
- Data validation and conditional formatting
- Bulk data import/export from spreadsheets

## Core Concepts
- **OpenPyXL**: Python library for .xlsx files (sheets, cells, styles)
- **SheetJS (xlsx)**: JavaScript library for reading/writing Excel/CSV
- **Formulas**: Cell references, functions (SUM, VLOOKUP, IF)
- **Styling**: Colors, borders, fonts, alignment, number formats
- **Validation**: Dropdown lists, custom validation rules

## Implementation

### Reading Excel (SheetJS)
```ts
import * as XLSX from "xlsx"

function readExcel(filePath: string) {
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)
}
```

### Writing Excel
```ts
function writeExcel(data: Record<string, unknown>[], filePath: string) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)

  // Set column widths
  ws["!cols"] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 30 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
  XLSX.writeFile(wb, filePath)
}
```

### Formatted Report
```ts
function createFormattedReport(data: Record<string, unknown>[]) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)

  // Add header styling (via sheetjs-style or xlsx-style)
  const range = XLSX.utils.decode_range(ws["!ref"]!)
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c })
    ws[addr].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4472C4" } },
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "Report")
  return wb
}
```

### Chart Generation (Python/OpenPyXL)
```python
from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference

wb = Workbook()
ws = wb.active
ws.append(["Category", "Value"])
ws.append(["A", 10])
ws.append(["B", 20])
ws.append(["C", 15])

chart = BarChart()
chart.title = "Sales by Category"
data = Reference(ws, min_col=2, min_row=1, max_row=4)
cats = Reference(ws, min_col=1, min_row=2, max_row=4)
chart.add_data(data, titles_from_data=True)
chart.set_categories(cats)
ws.add_chart(chart, "D1")

wb.save("report.xlsx")
```

## Best Practices
- Preserve existing formatting when modifying files
- Use streaming for large files (>10k rows)
- Validate data types before writing cells
- Set column widths automatically based on content
- Add freeze panes for headers
- Use named ranges for formula references
- Back up files before overwriting

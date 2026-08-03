---
name: xml-viewer
description: XML visualization. Formatting, validation, tree view, XSLT transformation.
---

# XML Viewer

## When to Apply
Use this skill when displaying XML data, validating XML documents, or transforming XML with XSLT.

## Core Concepts
- **XML parsing**: DOMParser, SAX, or streaming parsers
- **Pretty printing**: Indent and format XML for readability
- **Tree view**: Render XML as expandable/collapsible tree
- **Validation**: Schema validation (XSD, DTD, RelaxNG)
- **XSLT transformation**: Transform XML to HTML, JSON, or other formats

## Implementation
```typescript
// Parse and pretty-print XML
function formatXml(xml: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, "text/xml")
  return new XMLSerializer().serializeToString(doc)
    .replace(/></g, ">\n<")
    .replace(/^/gm, "  ")
    .replace(/^  (<\/)/gm, "$1")
}

// XML to tree structure
interface XmlNode {
  name: string
  attributes: Record<string, string>
  children: XmlNode[]
  text?: string
}

function parseXmlNode(node: Element): XmlNode {
  return {
    name: node.tagName,
    attributes: Object.fromEntries(
      Array.from(node.attributes).map((a) => [a.name, a.value])
    ),
    children: Array.from(node.children).map(parseXmlNode),
    text: node.textContent?.trim() || undefined,
  }
}

// XSLT transform
function transformXml(xml: string, xslt: string): string {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xml, "text/xml")
  const xsltDoc = parser.parseFromString(xslt, "text/xml")
  const processor = new XSLTProcessor()
  processor.importStylesheet(xsltDoc)
  const result = processor.transformToFragment(xmlDoc, document)
  return new XMLSerializer().serializeToString(result)
}
```

## Best Practices
- Validate XML before rendering — handle malformed input gracefully
- Show line numbers for validation errors
- Support collapsible tree view for large documents
- Cache parsed XML for performance on repeated renders
- Provide syntax highlighting for raw XML view
- Handle namespaces correctly in attribute and element names

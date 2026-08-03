---
name: code-generator
description: Automated code generation. Template-based generation, pattern matching, code synthesis.
---

# Code Generator

## When to Apply
Use this skill when generating code programmatically: creating boilerplate, scaffolding projects, generating repetitive patterns, or synthesizing code from templates.

## Core Concepts
- Template engines: Handlebars, EJS, Pug for HTML; string templates for code
- AST-based generation: parse, transform, print for safe code modification
- Scaffolding tools: Yeoman, Plop.js, Hygen for project structure
- Code generation from schema: OpenAPI, GraphQL, JSON Schema
- Meta-programming: macros, AST manipulation, code reflection

## Implementation

### Template-based Generation
```typescript
function generateComponent(name: string, props: string[]): string {
  const propsInterface = props.length
    ? `interface ${name}Props {\n${props.map((p) => `  ${p}: string`).join("\n")}\n}`
    : ""

  return `import type React from "react"

${propsInterface}

export function ${name}(${props.length ? `{ ${props.join(", ")} }: ${name}Props` : ""}) {
  return (
    <div>
      <h1>${name}</h1>
    </div>
  )
}
`
}
```

### File Scaffolding
```typescript
import fs from "node:fs/promises"
import path from "node:path"

interface FileTemplate {
  path: string
  content: string
}

async function scaffoldFeature(name: string, dir: string) {
  const templates: FileTemplate[] = [
    {
      path: `${dir}/${name}/${name}.tsx`,
      content: generateComponent(name, ["title"]),
    },
    {
      path: `${dir}/${name}/${name}.test.tsx`,
      content: `import { render } from "@testing-library/react"\nimport { ${name} } from "./${name}"\n\ndescribe("${name}", () => {\n  it("renders", () => {\n    render(<${name} title="test" />)\n  })\n})`,
    },
    {
      path: `${dir}/${name}/index.ts`,
      content: `export { ${name} } from "./${name}"`,
    },
  ]

  for (const template of templates) {
    await fs.mkdir(path.dirname(template.path), { recursive: true })
    await fs.writeFile(template.path, template.content)
  }
}
```

### Schema-driven Generation
```typescript
interface ApiEndpoint {
  method: string
  path: string
  params: string[]
  returnType: string
}

function generateApiRoute(endpoint: ApiEndpoint): string {
  return `router.${endpoint.method}("${endpoint.path}", async (c) => {
  const { ${endpoint.params.join(", ")} } = c.req.valid("param")
  const result: ${endpoint.returnType} = await service.${endpoint.method}(id)
  return c.json(result)
})`
}
```

### AST-based Generation
```typescript
// Using TypeScript compiler API
import ts from "typescript"

function generateInterface(name: string, fields: Array<{ name: string; type: string }>) {
  const members = fields.map((f) =>
    ts.factory.createPropertySignature(
      undefined,
      f.name,
      undefined,
      ts.factory.createTypeReferenceNode(f.type),
    ),
  )
  return ts.factory.createInterfaceDeclaration(
    undefined,
    name,
    undefined,
    undefined,
    members,
  )
}
```

## Best Practices
- Always validate generated code compiles/type-checks before outputting
- Use AST manipulation over string concatenation for complex transformations
- Include tests in generation templates for consistency
- Keep templates version-controlled and review template changes carefully
- Generate type-safe code; avoid `any` or unchecked casts in generated output

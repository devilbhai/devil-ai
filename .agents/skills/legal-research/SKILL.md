---
name: legal-research
description: Legal research. Case law search, statute analysis, compliance checking.
---

# Legal Research

## When to Apply

- Searching case law and legal precedents
- Analyzing statutes and regulations
- Checking compliance requirements
- Preparing legal documents
- Reviewing contract terms

## Core Concepts

- **Case Law**: Judicial decisions and precedents
- **Statutes**: Legislative laws and codes
- **Regulations**: Administrative rules and guidelines
- **Legal Citations**: Bluebook format, case citations
- **Jurisdiction**: Federal, state, local authority

## Implementation

```typescript
interface LegalDocument {
  id: string
  title: string
  type: 'case' | 'statute' | 'regulation' | 'contract'
  jurisdiction: string
  citation: string
  content: string
  summary: string
  keywords: string[]
  effectiveDate: Date
  lastUpdated: Date
}

interface CaseLaw {
  caseName: string
  court: string
  year: number
  citation: string
  holding: string
  facts: string
  reasoning: string
  dissent?: string
  precedent: string[]
}

interface Statute {
  title: string
  section: string
  text: string
  history: string[]
  amendments: { date: Date; change: string }[]
}

function searchCaseLaw(
  query: string,
  jurisdiction: string,
  dateRange?: { start: Date; end: Date }
): CaseLaw[] {
  // In real implementation, use legal database API
  const mockResults: CaseLaw[] = [
    {
      caseName: 'Example v. Case',
      court: 'Supreme Court',
      year: 2020,
      citation: '123 U.S. 456 (2020)',
      holding: 'This is a mock holding',
      facts: 'These are mock facts',
      reasoning: 'This is mock reasoning',
      precedent: ['Previous Case 1', 'Previous Case 2'],
    },
  ]
  
  return mockResults.filter((caseLaw) => {
    const matchesQuery = caseLaw.caseName
      .toLowerCase()
      .includes(query.toLowerCase())
    const matchesJurisdiction = jurisdiction === 'all' || 
      caseLaw.court.toLowerCase().includes(jurisdiction.toLowerCase())
    
    return matchesQuery && matchesJurisdiction
  })
}

function analyzeContractTerms(contractText: string): {
  clauses: string[]
  risks: string[]
  recommendations: string[]
} {
  // Simple contract analysis
  const clauses = contractText.split('\n').filter((line) => 
    line.toLowerCase().includes('clause') || 
    line.toLowerCase().includes('section')
  )
  
  return {
    clauses,
    risks: ['Review liability clauses', 'Check termination terms'],
    recommendations: ['Consult legal counsel', 'Negotiate unfavorable terms'],
  }
}
```

## Best Practices

1. Always verify current laws and regulations
2. Check jurisdiction-specific requirements
3. Use proper legal citation formats
4. Document research sources thoroughly
5. Consider recent amendments and updates
6. Cross-reference multiple sources
7. Understand legal terminology
8. Keep up with legal developments
9. Use legal research databases
10. Consult attorneys for complex matters
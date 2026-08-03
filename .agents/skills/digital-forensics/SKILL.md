---
name: digital-forensics
description: Digital forensics - evidence collection, disk imaging, memory analysis, timeline reconstruction.
---

# Digital Forensics

## When to Apply
Use this skill for incident response, evidence collection, forensic analysis, or legal investigations.

## Core Concepts
- Evidence preservation
- Disk imaging and analysis
- Memory forensics
- Timeline reconstruction
- Log analysis
- Chain of custody

## Legal Requirements
- Maintain chain of custody
- Document all actions
- Use write blockers
- Create forensic images
- Preserve original evidence

## Forensic Process
1. **Identification**
 - Identify potential evidence
 - Document scene
 - Secure area

2. **Collection**
 - Use write blockers
 - Create forensic images
 - Calculate hashes
 - Document chain of custody

3. **Examination**
 - Mount images read-only
 - Extract relevant data
 - Recover deleted files
 - Analyze metadata

4. **Analysis**
 - Timeline analysis
 - Correlate evidence
 - Identify patterns
 - Draw conclusions

5. **Reporting**
 - Document findings
 - Present evidence
 - Maintain objectivity

## Tools
- FTK Imager - Disk imaging
- Autopsy - Digital forensics platform
- Volatility - Memory forensics
- Sleuth Kit - File system analysis
- Wireshark - Network forensics

## Evidence Handling
```bash
# Create disk image
dd if=/dev/sda of=evidence.img bs=4M

# Calculate hash
sha256sum evidence.img

# Document chain of custody
echo "Collected by: [Name]" >> custody.txt
echo "Date: $(date)" >> custody.txt
echo "Hash: $(sha256sum evidence.img)" >> custody.txt
```

## Timeline Analysis
```bash
# Extract timestamps
fls -r -m "/" evidence.img > timeline.txt

# Analyze with log2timeline
log2timeline.pl evidence.plaso evidence.img

# Generate report
psort.py -o l2tcsv evidence.plaso > timeline.csv
```

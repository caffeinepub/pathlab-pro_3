# PathLab Pro

## Current State
App has Motoko backend with all APIs working. Frontend has 6 pages. Reported issues: PDF print not working, bill creation confusing, reports not opening.

## Requested Changes (Diff)

### Add
- Proper print for reports/invoices

### Modify
- Reports.tsx: fix patientId in usePatientReports, fix reportId for signature
- Billing.tsx: better CreateBill flow with patient+report dropdowns
- NewReport.tsx: post-submit option to go to billing
- index.css: fix print styles

### Remove
- Nothing

## Implementation Plan
1. Fix Reports.tsx
2. Fix Billing.tsx
3. Fix index.css print styles
4. Fix NewReport.tsx

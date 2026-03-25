# PathLab Pro

## Current State
Test Catalog page mein Code, Test Name, Sample Type, Unit, Price columns hain. Reference Range field form mein hai (add karte waqt) lekin table mein show nahi hota. Normal range edit karne ka koi tarika nahi hai.

## Requested Changes (Diff)

### Add
- Test Catalog table mein "Normal Range" column add karo
- Reference Range ke liye inline edit functionality (Price jaise)
- `useUpdateTestRange` hook jo `addTestCatalog` upsert use kare

### Modify
- TestCatalog.tsx: table mein Normal Range column dikhao, inline edit enable karo
- useQueries.ts: `useUpdateTestRange` hook add karo

### Remove
- Kuch nahi

## Implementation Plan
1. useQueries.ts mein `useUpdateTestRange` hook add karo (addTestCatalog upsert use kare with full test data)
2. TestCatalog.tsx mein Normal Range column add karo table mein
3. Price edit jaise inline edit for Normal Range implement karo

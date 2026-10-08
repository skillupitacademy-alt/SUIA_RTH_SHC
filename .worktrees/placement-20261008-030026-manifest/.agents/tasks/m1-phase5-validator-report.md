# M1 Phase 5 Validator Report

## Snapshot Details
- **HEAD**: `187a0ccc3b0a414222be0b43d8a9c0be39a64402`
- **Canonical Hash**: `c4c328afede726241730a490a15a065c6c685398c62419e8d1185cfb08ada101`
- **Snapshot Path**: `.agents/tasks/m1-snapshot-final.json`

## Validator Results

| Validator | Status | Errors | Warnings |
|-----------|--------|--------|----------|
| V1 - Schema | ✅ PASS | 0 | 0 |
| V2 - Reference Integrity | ✅ PASS | 0 | 9 |
| V3 - Evidence Paths | ✅ PASS | 0 | 0 |
| V4 - Block Consistency | ✅ PASS | 0 | 0 |
| V5 - Composer | ✅ PASS | 0 | 0 |
| V6 - Dependency Graph | ✅ PASS | 0 | 0 |
| V7 - Test References | ✅ PASS | 0 | 2 |
| V8 - Evidence Completeness | ✅ PASS | 0 | 0 |
| V9 - Determinism | ✅ PASS | 0 | 0 |

**Total: 0 errors, 11 warnings**

## Warnings Summary

### V2 Warnings (9)
- API handlers without explicit service references (expected for certain endpoints)

### V7 Warnings (2)
- Test suite files not found for legacy web-app and admin-app structures

## Conclusion

✅ **All validators PASS with 0 errors**

The snapshot is valid and ready for attestation.

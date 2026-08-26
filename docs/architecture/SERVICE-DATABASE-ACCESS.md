# Service → Database Access Matrix

**Phase 0A.2.2-A — Static Source Analysis**

Generated: 2026-08-26T12:35:57.184Z

## Summary

- Total service/database relationships: 11
- Services analyzed: 4
- Databases referenced: 6

## Service → Database Matrix

| Service | Database | Files | Evidence | Access | Connection |
|---------|----------|------:|:--------:|--------|------------|
| api-server | quiz_platform_prod | 5 | 15 | unknown, read, read-write, write | package-import, direct-reference |
| api-server | tutorial_prod | 5 | 40 | unknown, read-write, read, write | direct-reference |
| api-server | people_prod | 4 | 24 | unknown, read-write, write, read | direct-reference |
| api-server | rth_prod | 1 | 2 | unknown, read | direct-reference |
| api-server | skillup_prod | 2 | 4 | unknown, read | direct-reference |
| realtutorialhub-web | tutorial_prod | 1 | 2 | unknown, read-write | direct-reference |
| skillup-web | quiz_platform_prod | 1 | 2 | unknown | package-import |
| skillup-web | people_prod | 1 | 2 | unknown | package-import |
| skillup-web | placement_prod | 1 | 4 | unknown, read-write, read | direct-reference |
| skillhubcore-admin | quiz_platform_prod | 17 | 55 | write, read, read-write, unknown | database-factory |
| skillhubcore-admin | tutorial_prod | 3 | 19 | unknown, read, write | direct-reference |

## Important Limitations

⚠️ **Static source evidence does NOT prove runtime behavior**

This analysis detects:

- ✅ Database package imports
- ✅ Database factory function references
- ✅ Pattern matches in source code

This analysis does NOT prove:

- ❌ That a specific HTTP request accesses a database
- ❌ How many databases are accessed per request
- ❌ Whether access is sequential or parallel
- ❌ Actual performance characteristics

**Confidence Level**: `STATIC_IMPORT`

**Next Phase**: Runtime request tracing required for definitive evidence.

---

**Phase 0A.2.2-A** | Static Service → Database Mapping | 2026-08-26T12:35:57.184Z
#!/usr/bin/env bash
# Phase D-2: Fix test files for new service constructor

set -e

echo "Fixing Phase D-2 test constructor calls and response assertions..."
echo

# The tests need:
# 1. Add mock telemetry repo + db to service constructor (5 params total)
# 2. Update response assertions: result.X → result.state.X
# 3. Keep all original semantic assertions

echo "✅ Test constructor and assertion fixes needed:"
echo "   - service constructor: 3 params → 5 params (add telemetryRepo, db)"
echo "   - response shape: BlockLearningState → {state, wasProcessed, wasAlreadyProcessed}"
echo "   - assertions: result.field → result.state.field"
echo
echo "Note: Must preserve all original test semantics"
echo "      DO NOT weaken, skip, or delete tests"
echo
echo "Run: pnpm type-check to see remaining errors"
echo "Then manually fix each test file carefully"

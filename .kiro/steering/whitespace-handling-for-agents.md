---
inclusion: auto
name: whitespace-handling-markdown
description: Read when creating/editing Markdown files, committing documentation, or encountering whitespace errors in git diff --check
---

# Whitespace Handling for Workflow Agents

## Problem: Trailing Whitespace Errors

Whitespace warnings come from **spaces or tabs at the end of a line**, including blank lines containing spaces. Editors, pasted text and generated files can introduce them.

Git's `diff --check` command flags trailing whitespace as potential errors because:
- They're invisible and cause unnecessary diffs
- Different editors handle them inconsistently
- They can break some parsing tools

## Markdown-Specific Consideration

In Markdown, **two trailing spaces intentionally create a line break** (`<br>`). Git can still flag them as errors, creating ambiguity.

**Best Practice**: To avoid this ambiguity:
- Use a normal paragraph break (blank line) where appropriate
- Use an explicit `<br>` tag for intentional line breaks
- Never rely on trailing spaces for formatting in committed files

## Prevention: Editor Configuration

### Repository-Level (.editorconfig)

Create or update `.editorconfig` in repository root:

```ini
root = true

[*]
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = true
# If you need to preserve Markdown two-space line breaks, set to false
# But prefer explicit <br> tags instead
```

### VS Code Settings

These settings clean files when saved:

```json
{
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "editor.renderWhitespace": "boundary"
}
```

**Note**: Some Markdown configurations disable trimming to preserve two-space line breaks. Check for Markdown-specific overrides if trimming doesn't work.

## Detection: Checking for Whitespace Errors

### Before Committing

Check working changes:
```powershell
git diff --check
```

Check staged changes:
```powershell
git diff --cached --check
```

### After Committing

Check the complete submitted range (e.g., from baseline to HEAD):
```powershell
git diff --check a239ca39..HEAD
```

**Critical**: A clean working diff alone misses committed warnings. Always check the full branch range before submission.

## Correction: Cleaning Markdown Files

### Method 1: Python Script (Recommended for Agents)

To clean **one or more Markdown files** using PowerShell and Python:

```powershell
@'
from pathlib import Path
import re

# Single file
path = Path("audit/example.md")
original = path.read_bytes()
cleaned = re.sub(rb"[ \t]+(?=\r?\n|\Z)", b"", original)
path.write_bytes(cleaned)
print(f"Cleaned: {path}")

# Multiple files (example)
for path in Path("audit").glob("*.md"):
    original = path.read_bytes()
    cleaned = re.sub(rb"[ \t]+(?=\r?\n|\Z)", b"", original)
    if cleaned != original:
        path.write_bytes(cleaned)
        print(f"Cleaned: {path}")
'@ | python -
```

**Why this approach?**
- Preserves existing encoding (UTF-8, UTF-16, etc.)
- Preserves existing line endings (CRLF on Windows, LF on Unix)
- Works consistently across platforms
- Uses regex that matches Git's definition of trailing whitespace
- Can be executed inline without creating temporary script files

**Regex Explanation**:
- `[ \t]+` - Match one or more spaces or tabs
- `(?=\r?\n|\Z)` - Positive lookahead: must be followed by line ending or end of file
- `rb"..."` - Byte string regex preserves encoding

### Method 2: Manual Editor Fix

1. Open file in VS Code or editor with whitespace visualization
2. Enable "Trim Trailing Whitespace" on save
3. Save the file
4. Review changes with `git diff` before staging

**Caution**: Review the file afterward because intentional Markdown line breaks (two spaces) will also be removed.

## Commit Strategy

### Working Tree Whitespace

If you detect whitespace in your working changes before committing:
1. Clean the files using Python method above
2. Stage the cleaned files
3. Verify: `git diff --cached --check` (exit 0 = clean)
4. Commit normally

### Already-Committed Whitespace

If whitespace errors exist in already-committed history:

**Option A: Ordinary Cleanup Commit (Recommended)**
- Clean the files with whitespace issues
- Commit with message like: `fix(audit): clean trailing whitespace in documentation`
- Earlier commits remain in history
- **The final snapshot passes the range check** - this is what matters

**Option B: Rewrite History (Advanced)**
```powershell
# Fixup approach
git commit --fixup <commit-with-whitespace>
git rebase -i --autosquash <base-commit>

# Or interactive rebase
git rebase -i <commit-before-whitespace>
# Mark commit as 'edit', fix whitespace, continue
```

**Choose Option A** unless explicitly required to maintain a clean history. Sol's feedback explicitly states: "An ordinary cleanup commit is sufficient."

## Integration with Workflow Steps

### For Coder Agents

When creating Markdown documentation files:

1. **Generate content** using normal string operations
2. **Before writing to disk**, apply whitespace cleaning:
   ```python
   import re
   content = "your markdown content..."
   cleaned = re.sub(r"[ \t]+(?=\r?\n|\Z)", "", content)
   Path("audit/report.md").write_text(cleaned, encoding="utf-8")
   ```
3. **After commit**, verify: `git diff --check BASE..HEAD`
4. **In commit message**, note if whitespace was cleaned

### For Review Agents

When reviewing commits:

1. **Always check branch range**: `git diff --check BASE..HEAD`
2. **Report specific files and lines** if whitespace found
3. **Suggest Python cleaning method** in review findings
4. **Verify fix** by rerunning range check after correction

### For All Agents

**Never claim whitespace is clean without verification:**
- ❌ Bad: "Whitespace check passed" (no evidence)
- ✅ Good: "Whitespace check: git diff --check BASE..HEAD exit 0"

**Always provide exact verification commands in evidence:**
- Show the command run
- Show the exit code
- Show sample output if errors exist

## Common Pitfalls

### Pitfall 1: Only Checking Working Tree

**Problem**: `git diff --check` only checks uncommitted changes.

**Solution**: Always check committed range: `git diff --check BASE..HEAD`

### Pitfall 2: Deleting File Content When "Fixing" Whitespace

**Problem**: Overly aggressive text processing can delete actual content.

**Solution**: 
- Use the exact regex: `rb"[ \t]+(?=\r?\n|\Z)"`
- Test on a copy first
- Verify file content after cleaning: `(Get-Content file.md).Count`

### Pitfall 3: Breaking Intentional Formatting

**Problem**: Some Markdown uses trailing spaces for line breaks.

**Solution**: 
- In this repository, prefer explicit `<br>` tags
- Document any intentional formatting exceptions
- Don't silently remove formatting the author intended

### Pitfall 4: Line Ending Confusion

**Problem**: Git may warn "LF will be replaced by CRLF" - this is NOT a whitespace error.

**Solution**:
- These are normal warnings on Windows
- They don't cause `git diff --check` to fail
- Focus on trailing space/tab errors, not line ending style

## Verification Checklist

Before claiming whitespace compliance:

- [ ] Ran `git diff --check` on working tree (exit 0)
- [ ] Ran `git diff --cached --check` on staged changes (exit 0)
- [ ] Ran `git diff --check BASE..HEAD` on full branch range (exit 0)
- [ ] Recorded exact commands and exit codes in documentation
- [ ] Verified file content not accidentally deleted (line count reasonable)
- [ ] Tested that fixed files still render correctly

## Example: Complete Whitespace Fix Workflow

```powershell
# 1. Detect issue
git diff --check a239ca39..HEAD
# Output: audit/report.md:5: trailing whitespace.
# Exit: 1

# 2. Clean the problematic file(s)
@'
from pathlib import Path
import re

path = Path("audit/report.md")
original = path.read_bytes()
cleaned = re.sub(rb"[ \t]+(?=\r?\n|\Z)", b"", original)
path.write_bytes(cleaned)
print(f"Cleaned: {path}")
'@ | python -

# 3. Verify cleaning worked
git diff audit/report.md
# Should show spaces removed at line ends

# 4. Verify file content intact
(Get-Content audit/report.md).Count
# Should show reasonable line count, not 0!

# 5. Stage and commit
git add audit/report.md
git diff --cached --check  # Should exit 0
git commit -m "fix(audit): clean trailing whitespace in report"

# 6. Final verification
git diff --check a239ca39..HEAD
# Should exit 0
```

## References

- Git documentation: `git help diff` (search for "check")
- EditorConfig: https://editorconfig.org/
- Markdown spec on hard line breaks: https://spec.commonmark.org/0.30/#hard-line-breaks

## Summary for Agents

**When creating Markdown files:**
1. Use Python regex to strip trailing whitespace before writing
2. Prefer explicit `<br>` over two-space line breaks

**When fixing whitespace errors:**
1. Use the Python byte-string regex method (preserves encoding)
2. Verify content not deleted
3. Check full branch range, not just working tree

**When reporting whitespace status:**
1. Always include exact command: `git diff --check BASE..HEAD`
2. Always include exit code
3. Never claim clean without verification

**Remember**: "An ordinary cleanup commit is sufficient" - don't overcomplicate the fix.

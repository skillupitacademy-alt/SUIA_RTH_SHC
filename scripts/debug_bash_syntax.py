import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("scripts/deploy-direct.sh", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    line_num = idx + 1
    if "traffic" in line.lower():
        print(f"Line {line_num}: {line.strip()}")

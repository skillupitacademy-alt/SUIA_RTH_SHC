with open("scripts/deploy-direct.sh", "r", encoding="utf-8") as f:
    lines = f.readlines()

in_single = False
in_double = False
last_single_line = 0
last_single_content = ""

for idx, line in enumerate(lines):
    line_num = idx + 1
    clean_line = line.split("#")[0]
    
    col = 0
    while col < len(clean_line):
        char = clean_line[col]
        if char == "'" and not in_double:
            in_single = not in_single
            if in_single:
                last_single_line = line_num
                last_single_content = line.strip()
        elif char == '"' and not in_single:
            in_double = not in_double
        col += 1

if in_single:
    print(f"Unclosed single quote started at line {last_single_line}:")
    print(f"Content: {last_single_content}")
elif in_double:
    print("Unclosed double quote found.")
else:
    print("No unclosed quotes found when correctly ignoring masks.")

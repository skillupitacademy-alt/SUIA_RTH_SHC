with open("scripts/deploy-direct.sh", "r", encoding="utf-8") as f:
    content = f.read()

single_quotes = content.count("'")
double_quotes = content.count('"')

print(f"Single quotes count: {single_quotes} (even? {single_quotes % 2 == 0})")
print(f"Double quotes count: {double_quotes} (even? {double_quotes % 2 == 0})")

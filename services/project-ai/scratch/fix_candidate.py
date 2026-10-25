with open('app/api/routes/candidate.py', 'r', encoding='utf-8') as f:
    text = f.read()

target = """    files = [CandidateFile(
        filename=f["filename"],
        content=f["content"],
        contentType=f["contentType"]
    ) for f in model.files]"""

replacement = """    files = [CandidateFile(
        filename=f["filename"],
        content=f["content"],
        contentType=f["contentType"],
        hash=f.get("hash") or hashlib.sha256(f["content"].encode("utf-8")).hexdigest()
    ) for f in model.files]"""

if target in text:
    text = text.replace(target, replacement, 1)
    with open('app/api/routes/candidate.py', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Updated successfully")
else:
    print("Target not found")

import sys

files = [
    r'd:\onlinewebsites\quiz-platform\apps\web-app\src\app\exam\[examId]\page.tsx',
    r'd:\onlinewebsites\quiz-platform\apps\api-server\src\app\api\telemetry\route.ts',
    r'd:\onlinewebsites\quiz-platform\packages\api-client\src\modules\telemetry-client.ts',
    r'd:\onlinewebsites\quiz-platform\packages\api-client\src\index.ts'
]

for file_path in files:
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
            for i, byte in enumerate(content):
                if byte > 127:
                    print(f"Non-ASCII character {byte} found at index {i} in {file_path}")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

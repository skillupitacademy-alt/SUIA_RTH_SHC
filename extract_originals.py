import subprocess
import os

files_to_extract = {
    "landing": "apps/web-app/src/app/(public)/page.tsx",
    "login": "apps/web-app/src/app/(public)/login/page.tsx",
    "signup": "apps/web-app/src/app/(public)/signup/page.tsx",
    "dashboard": "apps/web-app/src/app/(authenticated)/dashboard/page.tsx",
    "statscards": "apps/web-app/src/components/dashboard/StatsCards.tsx",
    "layout": "apps/web-app/src/app/layout.tsx",
    "tailwind_config": "apps/web-app/tailwind.config.ts",
    "globals_css": "apps/web-app/src/app/globals.css"
}

commit = "bf63f2d9"

for key, path in files_to_extract.items():
    try:
        print(f"Extracting {path}...")
        result = subprocess.run(["git", "show", f"{commit}:{path}"], capture_output=True, text=True, encoding='utf-8')
        if result.returncode == 0:
            filename = f"original_{key}.tsx"
            with open(filename, "w", encoding='utf-8') as f:
                f.write(result.stdout)
            print(f"Saved to {filename}")
        else:
            print(f"Error extracting {path}: {result.stderr}")
    except Exception as e:
        print(f"Exception for {path}: {str(e)}")

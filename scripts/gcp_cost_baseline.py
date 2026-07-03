#!/usr/bin/env python3
import json
import subprocess
import sys
from datetime import datetime
import os

PROJECT_ID = "project-48af6a2d-e8bb-46dd-a58"
REGION = "asia-southeast1"
MARKETING_REGION = "asia-south1"
REGISTRY_SE = "asia-southeast1-docker.pkg.dev"
REGISTRY_S = "asia-south1-docker.pkg.dev"
REPOSITORY = "quiz-platform"

# Ensure UTF-8 output encoding for console prints if supported
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

def run_command(args):
    try:
        # Use shell=True on Windows to allow resolving batch/command files like gcloud
        use_shell = os.name == 'nt'
        # If shell=True, args should be a single string for proper parsing
        if use_shell:
            cmd = ' '.join(args)
            result = subprocess.run(cmd, capture_output=True, text=True, check=True, shell=True)
        else:
            result = subprocess.run(args, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running {' '.join(args)}: {e.stderr}", file=sys.stderr)
        return ""

def main():
    print("=== Capturing current GCP resource state via Python ===")
    
    # Resolve monorepo root path dynamically relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    audit_reports_dir = os.path.join(repo_root, "audit-reports")
    
    os.makedirs(audit_reports_dir, exist_ok=True)
    date_str = datetime.now().strftime("%Y-%m-%d")
    
    json_output = os.path.join(audit_reports_dir, f"gcp-cost-baseline-{date_str}.json")
    md_output = os.path.join(audit_reports_dir, "gcp-infrastructure-dashboard.md")
    
    # 1. Cloud Build Metrics (last 30 runs)
    print("Checking Cloud Build stats...")
    builds_raw = run_command([
        "gcloud", "builds", "list",
        f"--project={PROJECT_ID}",
        "--limit=30",
        "--format=value(id,status,duration,createTime)"
    ])
    
    total_builds = 0
    success_builds = 0
    failed_builds = 0
    total_duration_sec = 0
    
    if builds_raw:
        for line in builds_raw.splitlines():
            parts = line.split()
            if len(parts) >= 2:
                total_builds += 1
                status = parts[1]
                if status == "SUCCESS":
                    success_builds += 1
                else:
                    failed_builds += 1
                
                if len(parts) >= 3:
                    duration = parts[2]
                    if duration != "None":
                        try:
                            # Remove trailing 's' and convert to float/int
                            dur_val = float(duration.replace("s", ""))
                            total_duration_sec += int(dur_val)
                        except ValueError:
                            pass
                            
    avg_duration_sec = int(total_duration_sec / total_builds) if total_builds > 0 else 0

    # 2. Artifact Registry Metrics
    print("Checking Artifact Registry stats...")
    total_images_se = 0
    total_images_s = 0
    
    images_se_raw = run_command([
        "gcloud", "artifacts", "docker", "images", "list",
        f"{REGISTRY_SE}/{PROJECT_ID}/{REPOSITORY}",
        f"--project={PROJECT_ID}",
        "--format=value(package)"
    ])
    if images_se_raw:
        total_images_se = len(images_se_raw.splitlines())
        
    images_s_raw = run_command([
        "gcloud", "artifacts", "docker", "images", "list",
        f"{REGISTRY_S}/{PROJECT_ID}/{REPOSITORY}",
        f"--project={PROJECT_ID}",
        "--format=value(package)"
    ])
    if images_s_raw:
        total_images_s = len(images_s_raw.splitlines())
        
    total_images = total_images_se + total_images_s

    # 3. Cloud Run Services
    print("Checking Cloud Run services...")
    services_raw = run_command([
        "gcloud", "run", "services", "list",
        f"--project={PROJECT_ID}",
        "--format=value(metadata.name)"
    ])
    
    cr_services_count = 0
    cr_total_revisions = 0
    cr_rows = []
    
    if services_raw:
        for service_name in services_raw.splitlines():
            service_name = service_name.strip()
            if not service_name:
                continue
            cr_services_count += 1
            
            # Describe in REGION
            desc = run_command([
                "gcloud", "run", "services", "describe", service_name,
                f"--project={PROJECT_ID}",
                f"--region={REGION}",
                "--format=value(spec.template.spec.containers[0].resources.limits.memory,spec.template.spec.containers[0].resources.limits.cpu,spec.template.spec.containers[0].resources.limits.concurrency)"
            ])
            
            # Fallback to MARKETING_REGION
            if not desc:
                desc = run_command([
                    "gcloud", "run", "services", "describe", service_name,
                    f"--project={PROJECT_ID}",
                    f"--region={MARKETING_REGION}",
                    "--format=value(spec.template.spec.containers[0].resources.limits.memory,spec.template.spec.containers[0].resources.limits.cpu,spec.template.spec.containers[0].resources.limits.concurrency)"
                ])
                
            mem, cpu, conc = "Unknown", "Unknown", "Unknown"
            if desc:
                parts = desc.split()
                if len(parts) >= 1: mem = parts[0]
                if len(parts) >= 2: cpu = parts[1]
                if len(parts) >= 3: conc = parts[2]
                
            # Count revisions
            revs = run_command([
                "gcloud", "run", "revisions", "list",
                f"--project={PROJECT_ID}",
                f"--service={service_name}",
                f"--region={REGION}",
                "--format=value(metadata.name)"
            ])
            if not revs:
                revs = run_command([
                    "gcloud", "run", "revisions", "list",
                    f"--project={PROJECT_ID}",
                    f"--service={service_name}",
                    f"--region={MARKETING_REGION}",
                    "--format=value(metadata.name)"
                ])
                
            rev_count = len(revs.splitlines()) if revs else 0
            cr_total_revisions += rev_count
            cr_rows.append(f"| `{service_name}` | {cpu} CPU | {mem} | {conc} | {rev_count} |")

    # 4. Secret Manager Metrics
    print("Checking Secret Manager...")
    secrets_raw = run_command([
        "gcloud", "secrets", "list",
        f"--project={PROJECT_ID}",
        "--format=value(name)"
    ])
    
    total_secrets = 0
    total_secret_versions = 0
    
    if secrets_raw:
        for secret_line in secrets_raw.splitlines():
            secret_name = secret_line.strip()
            if not secret_name:
                continue
            total_secrets += 1
            
            versions = run_command([
                "gcloud", "secrets", "versions", "list", secret_name,
                f"--project={PROJECT_ID}",
                "--format=value(name)"
            ])
            if versions:
                total_secret_versions += len(versions.splitlines())

    # Build JSON data
    data = {
        "date": date_str,
        "builds": {
            "total_last_30": total_builds,
            "success": success_builds,
            "failed": failed_builds,
            "avg_duration_sec": avg_duration_sec
        },
        "registry": {
            "images_se": total_images_se,
            "images_s": total_images_s,
            "total_images": total_images
        },
        "cloud_run": {
            "services_count": cr_services_count,
            "total_revisions": cr_total_revisions
        },
        "secrets": {
            "total_secrets": total_secrets,
            "total_versions": total_secret_versions
        }
    }
    
    with open(json_output, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        
    # Generate MD dashboard
    cr_summary_md = "\n".join(cr_rows)
    md_content = f"""# GCP Infrastructure & Cost Dashboard

*Generated on {date_str}*

## Cost Summary & Baseline Metrics

This dashboard tracks key resources driving GCP billing, updated via `scripts/gcp_cost_baseline.py`.

### Summary Metrics

| Metric | Baseline (Pre-Opt) | Current State | Target Post-Opt | Status |
|--------|:------------------:|:-------------:|:---------------:|:------:|
| **Monthly Estimate** | ~₹6,800 | **₹6,800** | **₹1,500–₹2,500** | Active |
| **Artifact Registry Images** | {total_images} | **{total_images}** | < 80 | Pending Cleanup |
| **Active Secrets / Versions** | {total_secrets} / {total_secret_versions} | **{total_secrets} / {total_secret_versions}** | {total_secrets} / {total_secrets} | Pending Version Cleanup |
| **Cloud Run Revisions** | {cr_total_revisions} | **{cr_total_revisions}** | < 25 | Pending Revision Cleanup |
| **Avg Build Time (Last 30)** | {avg_duration_sec}s | **{avg_duration_sec}s** | < 120s (with Cache) | Pending Cache |

---

### Cloud Run Services Sizing Audit

| Service | CPU | Memory | Concurrency | Total Revisions |
|---------|:---:|:------:|:-----------:|:---------------:|
{cr_summary_md}

---

### Cloud Build Activity (Last 30 Runs)

- **Total Runs Checked**: {total_builds}
- **Success Rate**: {int(success_builds * 100 / total_builds) if total_builds > 0 else 0}% ({success_builds} success, {failed_builds} failed)
- **Average Duration**: {avg_duration_sec} seconds

---

### Artifact Registry Breakdown

- **asia-southeast1 (Core Repository)**: {total_images_se} images
- **asia-south1 (Marketing Repository)**: {total_images_s} images
- **Total Registered Images / Tags**: {total_images}

---

### Secret Manager

- **Total Unique Secrets**: {total_secrets}
- **Total Versions Stored**: {total_secret_versions} (Avg {int(total_secret_versions / total_secrets) if total_secrets > 0 else 0} versions per secret)
"""
    
    with open(md_output, "w", encoding="utf-8") as f:
        f.write(md_content)
        
    print("Baseline captured successfully!")
    print(f"JSON: {json_output}")
    print(f"Dashboard: {md_output}")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Cloud Run Revision Cleanup Script (Parallelized)
Deletes old, inactive revisions for each service, keeping only the latest N revisions.
Uses ThreadPoolExecutor for concurrent API calls to speed up deletion significantly.
Supports dry-run mode by default.
"""
import json
import subprocess
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

PROJECT_ID = "project-48af6a2d-e8bb-46dd-a58"
KEEP_REVISIONS = 2  # Keep the latest N revisions per service
MAX_WORKERS = 15     # Number of concurrent deletion threads

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

def run_cmd(cmd):
    try:
        use_shell = os.name == 'nt'
        if use_shell and isinstance(cmd, list):
            cmd = ' '.join(cmd)
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, shell=use_shell)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return ""

def delete_revision(rev, region):
    print(f"   🗑️  Deleting: {rev} in {region}...", flush=True)
    res = run_cmd([
        "gcloud", "run", "revisions", "delete", rev,
        f"--project={PROJECT_ID}",
        f"--region={region}",
        "--quiet"
    ])
    if res is not None:
        print(f"   ✅ Deleted: {rev}", flush=True)
        return True
    else:
        print(f"   ❌ Failed to delete: {rev}", flush=True)
        return False

def main():
    dry_run = "--confirm" not in sys.argv
    
    if dry_run:
        print("🔍 DRY-RUN mode — no revisions will be deleted.", flush=True)
        print("   Use --confirm to actually delete revisions.\n", flush=True)
    else:
        print("🚀 EXECUTION mode — old revisions WILL be deleted concurrently.\n", flush=True)

    # Get all services across all regions
    services_raw = run_cmd([
        "gcloud", "run", "services", "list",
        f"--project={PROJECT_ID}",
        "--format=json"
    ])
    
    if not services_raw:
        print("No services found.", flush=True)
        return
        
    services = json.loads(services_raw)
    
    deletions_to_run = []
    
    for svc in services:
        name = svc["metadata"]["name"]
        region = svc["metadata"]["labels"]["cloud.googleapis.com/location"]
        
        # Get traffic-serving revisions (these must never be deleted)
        traffic_revisions = set()
        for traffic in svc.get("status", {}).get("traffic", []):
            rev = traffic.get("revisionName", "")
            if rev:
                traffic_revisions.add(rev)
        
        # List all revisions for this service
        revisions_raw = run_cmd([
            "gcloud", "run", "revisions", "list",
            f"--project={PROJECT_ID}",
            f"--service={name}",
            f"--region={region}",
            "--sort-by=~metadata.creationTimestamp",
            "--format=value(metadata.name)"
        ])
        
        if not revisions_raw:
            print(f"  {name} ({region}): No revisions found", flush=True)
            continue
            
        revisions = revisions_raw.splitlines()
        print(f"\n📦 {name} ({region}): {len(revisions)} revisions, keeping {KEEP_REVISIONS}", flush=True)
        print(f"   Traffic-serving: {traffic_revisions or 'none'}", flush=True)
        
        # Keep the latest N + any traffic-serving revisions
        keep_set = set(revisions[:KEEP_REVISIONS]) | traffic_revisions
        to_delete = [r for r in revisions if r not in keep_set]
        
        if not to_delete:
            print(f"   ✅ Nothing to clean up", flush=True)
            continue
            
        for rev in to_delete:
            if dry_run:
                print(f"   [DRY-RUN] Would delete: {rev}", flush=True)
            else:
                deletions_to_run.append((rev, region))

    if not dry_run and deletions_to_run:
        print(f"\n⚡ Starting parallel deletion of {len(deletions_to_run)} revisions using {MAX_WORKERS} workers...", flush=True)
        
        total_deleted = 0
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(delete_revision, rev, reg): rev for rev, reg in deletions_to_run}
            for future in as_completed(futures):
                if future.result():
                    total_deleted += 1
                    
        print(f"\n{'='*50}", flush=True)
        print(f"🏁 Cleanup complete. Deleted {total_deleted} old revisions.", flush=True)
    elif not dry_run:
        print(f"\n✅ No revisions to delete.", flush=True)
    else:
        print(f"\n{'='*50}", flush=True)
        print(f"🏁 DRY-RUN complete. Run with --confirm to execute.", flush=True)

if __name__ == "__main__":
    main()

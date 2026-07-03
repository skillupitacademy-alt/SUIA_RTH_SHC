#!/usr/bin/env python3
import json
import subprocess
import sys
import os

PROJECT_ID = "project-48af6a2d-e8bb-46dd-a58"
REPOSITORY = "quiz-platform"
REGIONS = ["asia-southeast1", "asia-south1"]
DRY_RUN = True

# Parse arguments
if len(sys.argv) > 1 and sys.argv[1] == "--confirm":
    DRY_RUN = False

if DRY_RUN:
    print("=== Running in DRY RUN mode. Pass '--confirm' to execute changes. ===")
else:
    print("=== RUNNING IN ACTIVE MODE. Changes will be executed. ===")

def run_command(args):
    try:
        # Use shell=True on Windows to resolve batch files
        use_shell = os.name == 'nt'
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
    # Resolve absolute path for the policy file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    policy_file = os.path.join(script_dir, "ar-cleanup-policy.json")
    
    # 1. Apply native lifecycle policies
    for region in REGIONS:
        print(f"Applying native cleanup policy to repository '{REPOSITORY}' in region '{region}'...")
        if not DRY_RUN:
            res = run_command([
                "gcloud", "artifacts", "repositories", "set-cleanup-policies", REPOSITORY,
                f"--project={PROJECT_ID}",
                f"--location={region}",
                f"--policy={policy_file}",
                "--quiet"
            ])
            print(f"Native policy applied in {region}.")
        else:
            print(f"[DRY RUN] Would run: gcloud artifacts repositories set-cleanup-policies {REPOSITORY} --project={PROJECT_ID} --location={region} --policy={policy_file}")

    # 2. Query active Cloud Run images to protect them
    print("Querying active Cloud Run revisions to build safety exclusion list...")
    revisions_raw = run_command([
        "gcloud", "run", "revisions", "list",
        f"--project={PROJECT_ID}",
        "--format=value(spec.container.image)",
        "--filter=status.conditions.type=Active AND status.conditions.status=True"
    ])
    
    exclude_list = set()
    if revisions_raw:
        for line in revisions_raw.splitlines():
            img = line.strip()
            if img:
                exclude_list.add(img)
                
    print(f"Protection list compiled ({len(exclude_list)} active container images protected).")

    # 3. Clean untagged/dangling digests
    for region in REGIONS:
        print(f"Scanning region '{region}' for dangling/untagged digests...")
        packages_raw = run_command([
            "gcloud", "artifacts", "packages", "list",
            f"--project={PROJECT_ID}",
            f"--repository={REPOSITORY}",
            f"--location={region}",
            "--format=value(package)"
        ])
        
        if not packages_raw:
            continue
            
        for pkg in packages_raw.splitlines():
            pkg = pkg.strip()
            if not pkg:
                continue
            
            print(f"  Image package: {pkg}")
            
            # List all versions/digests for this package
            versions_raw = run_command([
                "gcloud", "artifacts", "versions", "list",
                f"--project={PROJECT_ID}",
                f"--repository={REPOSITORY}",
                f"--location={region}",
                f"--package={pkg}",
                "--format=value(name,tags)"
            ])
            
            if not versions_raw:
                continue
                
            for line in versions_raw.splitlines():
                parts = line.strip().split()
                if not parts:
                    continue
                digest = parts[0]
                tags = parts[1] if len(parts) > 1 else ""
                
                # Check if it has no tags (dangling digest)
                if not tags or tags == "None" or tags.strip() == "":
                    full_image_ref = f"{region}-docker.pkg.dev/{PROJECT_ID}/{REPOSITORY}/{pkg}@{digest}"
                    
                    # Check safety exclusion
                    is_protected = False
                    for protected_img in exclude_list:
                        if digest in protected_img or full_image_ref in protected_img:
                            is_protected = True
                            break
                            
                    if is_protected:
                        print(f"    Skipping active digest: {digest} (in use by Cloud Run)")
                    else:
                        if DRY_RUN:
                            print(f"    [DRY RUN] Would delete untagged version: {digest}")
                        else:
                            print(f"    Deleting untagged version: {digest}")
                            run_command([
                                "gcloud", "artifacts", "versions", "delete", digest,
                                f"--project={PROJECT_ID}",
                                f"--repository={REPOSITORY}",
                                f"--location={region}",
                                f"--package={pkg}",
                                "--quiet"
                            ])

    print("Artifact Registry cleanup policy update complete!")

if __name__ == "__main__":
    main()

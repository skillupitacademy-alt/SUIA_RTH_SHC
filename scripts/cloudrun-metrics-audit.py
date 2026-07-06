#!/usr/bin/env python3
import json
import urllib.request
import subprocess
import os
from datetime import datetime

PROJECT_ID = "project-48af6a2d-e8bb-46dd-a58"

def run_cmd(cmd):
    try:
        use_shell = os.name == 'nt'
        if use_shell and isinstance(cmd, list):
            cmd = ' '.join(cmd)
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, shell=use_shell)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running {cmd}: {e.stderr}")
        return ""

def get_mql_data(token, query):
    url = f"https://monitoring.googleapis.com/v3/projects/{PROJECT_ID}/timeSeries:query"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    data = {"query": query}
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"MQL Error: {e.read().decode('utf-8')}")
        return {}

def extract_metric(ts_data):
    results = {}
    if "timeSeriesData" not in ts_data:
        return results
        
    for ts in ts_data["timeSeriesData"]:
        # Find service_name from labelValues
        service_name = None
        for label in ts.get("labelValues", []):
            if "stringValue" in label:
                service_name = label["stringValue"]
                break
                
        if not service_name or "pointData" not in ts or not ts["pointData"]:
            continue
            
        # Get max value from pointData
        max_val = 0
        for point in ts["pointData"]:
            if "values" in point and point["values"]:
                val = point["values"][0].get("doubleValue", point["values"][0].get("int64Value", 0))
                max_val = max(max_val, float(val))
                
        results[service_name] = max_val
    return results

def main():
    print("Fetching GCP Auth Token...")
    token = run_cmd("gcloud auth print-access-token")
    if not token:
        print("Failed to get auth token")
        return
        
    print("Querying Cloud Run metrics (last 7 days)...")
    
    # Max CPU %
    cpu_query = """
    fetch cloud_run_revision
    | metric 'run.googleapis.com/container/cpu/utilizations'
    | group_by [resource.service_name], [value_utilizations_percentile: percentile(value.utilizations, 99)]
    | within 7d
    """
    cpu_data = extract_metric(get_mql_data(token, cpu_query))
    
    # Max Memory %
    mem_query = """
    fetch cloud_run_revision
    | metric 'run.googleapis.com/container/memory/utilizations'
    | group_by [resource.service_name], [value_utilizations_percentile: percentile(value.utilizations, 99)]
    | within 7d
    """
    mem_data = extract_metric(get_mql_data(token, mem_query))
    
    # Get current configurations
    print("Fetching current Cloud Run configurations...")
    services_raw = run_cmd(["gcloud", "run", "services", "list", f"--project={PROJECT_ID}", "--format=json"])
    services = json.loads(services_raw) if services_raw else []
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    audit_reports_dir = os.path.join(repo_root, "audit-reports")
    os.makedirs(audit_reports_dir, exist_ok=True)
    date_str = datetime.now().strftime("%Y-%m-%d")
    
    report_lines = [
        f"# Cloud Run Rightsizing Audit ({date_str})",
        "",
        "| Service | Region | Cur CPU | Cur Mem | Max CPU (7d) | Max Mem (7d) | Recommended CPU | Recommended Mem |",
        "|---|---|---|---|---|---|---|---|"
    ]
    
    audit_data = {}
    
    for svc in services:
        name = svc["metadata"]["name"]
        region = svc["metadata"]["labels"]["cloud.googleapis.com/location"]
        
        containers = svc["spec"]["template"]["spec"]["containers"]
        limits = containers[0].get("resources", {}).get("limits", {})
        cur_cpu = limits.get("cpu", "1")
        cur_mem = limits.get("memory", "512Mi")
        
        max_cpu_pct = cpu_data.get(name, 0.0) * 100
        max_mem_pct = mem_data.get(name, 0.0) * 100
        
        # Calculate raw memory used
        mem_value_mb = 512
        if "Gi" in cur_mem:
            mem_value_mb = int(float(cur_mem.replace("Gi", "")) * 1024)
        elif "Mi" in cur_mem:
            mem_value_mb = int(cur_mem.replace("Mi", ""))
            
        max_mem_used_mb = (max_mem_pct / 100.0) * mem_value_mb
        
        # Recommendations
        rec_cpu = "1" # Cloud Run gen2 minimum is typically 1 CPU for practical use
        
        # Memory recommendations
        if max_mem_used_mb < 150:
            rec_mem = "256Mi"
        elif max_mem_used_mb < 350:
            rec_mem = "512Mi"
        elif max_mem_used_mb < 700:
            rec_mem = "1Gi"
        else:
            rec_mem = cur_mem # Keep as is if heavily utilized
            
        report_lines.append(
            f"| {name} | {region} | {cur_cpu} | {cur_mem} | {max_cpu_pct:.1f}% | {max_mem_pct:.1f}% ({max_mem_used_mb:.0f}MB) | {rec_cpu} | {rec_mem} |"
        )
        
        audit_data[name] = {
            "current_cpu": cur_cpu,
            "current_mem": cur_mem,
            "max_cpu_pct": max_cpu_pct,
            "max_mem_pct": max_mem_pct,
            "max_mem_mb": max_mem_used_mb,
            "rec_cpu": rec_cpu,
            "rec_mem": rec_mem
        }
        
    md_output = os.path.join(audit_reports_dir, f"cloudrun-rightsizing-{date_str}.md")
    json_output = os.path.join(audit_reports_dir, f"cloudrun-rightsizing-{date_str}.json")
    
    with open(md_output, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
        
    with open(json_output, "w", encoding="utf-8") as f:
        json.dump(audit_data, f, indent=2)
        
    print(f"\nAudit complete. Reports saved to:")
    print(f" - {md_output}")
    print(f" - {json_output}")

if __name__ == "__main__":
    main()

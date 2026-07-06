import json
import urllib.request
import subprocess

def run_cmd(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, check=True, shell=True).stdout.strip()

token = run_cmd("gcloud auth print-access-token")
project = "project-48af6a2d-e8bb-46dd-a58"
url = f"https://monitoring.googleapis.com/v3/projects/{project}/timeSeries:query"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

query = """
fetch cloud_run_revision
| metric 'run.googleapis.com/container/cpu/utilizations'
| group_by [resource.service_name],
    [value_utilizations_percentile: percentile(value.utilizations, 99)]
| within 7d
"""

data = {"query": query}
req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as response:
        print(json.dumps(json.loads(response.read().decode("utf-8")), indent=2))
except urllib.error.HTTPError as e:
    print(e.read().decode("utf-8"))

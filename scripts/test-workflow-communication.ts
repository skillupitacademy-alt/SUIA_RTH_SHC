import { Client } from "@upstash/workflow";
import * as dotenv from "dotenv";
import path from "path";

// Load env from api-server
dotenv.config({ path: path.join(__dirname, "../apps/api-server/.env.local") });

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_URL = process.env.QSTASH_URL || "https://qstash.upstash.io";
const WORKFLOW_URL = "https://api.realtutorialhub.com/api/workflows/exam-report";

async function testWorkflow() {
  if (!QSTASH_TOKEN) {
    console.error("❌ QSTASH_TOKEN not found in .env.local");
    return;
  }

  const client = new Client({
    baseUrl: QSTASH_URL,
    token: QSTASH_TOKEN,
  });

  console.log(`🚀 Sending test workflow trigger to: ${WORKFLOW_URL}`);
  
  const payload = {
    examId: "test-exam-" + Date.now(),
    userId: "54726a2e-fca5-4d93-abc6-e7cee97a86f8", // ajayshah@gmail.com
    jobId: "test-job-" + Date.now()
  };

  try {
    const { workflowRunId } = await client.trigger({
        url: WORKFLOW_URL,
        body: payload,
    });

    console.log(`✅ Workflow triggered successfully!`);
    console.log(`🆔 Run ID: ${workflowRunId}`);
    console.log(`🔗 Monitor at: https://console.upstash.io/qstash?workflowRunId=${workflowRunId}`);
    
    console.log("\n⏳ Waiting 10 seconds for Cloudflare/Vercel callback...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log("\n🔍 Checking status via QStash API...");
    // We try to fetch the status of the run
    const res = await fetch(`${QSTASH_URL}/v2/workflows/runs/${workflowRunId}`, {
        headers: { Authorization: `Bearer ${QSTASH_TOKEN}` }
    });
    
    if (res.ok) {
        const data = await res.json();
        console.log("📊 Workflow Status:", data.status);
        console.log("📝 Details:", JSON.stringify(data, null, 2));
        
        if (data.status === 'failed' || data.status === 'error') {
             console.log("\n❌ Workflow failed. This might be due to Cloudflare blocking or app error.");
        } else {
             console.log("\n✅ Workflow seems to be proceeding!");
        }
    } else {
        console.log("⚠️ Could not fetch workflow status (might be too early or API limitation).");
        console.log(`Response: ${res.status} ${res.statusText}`);
    }

  } catch (error) {
    console.error("❌ Failed to trigger workflow:", error);
  }
}

testWorkflow();

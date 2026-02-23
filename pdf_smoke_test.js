
const ATTEMPT_ID = "6bfd54eb-7a05-413b-8b50-9e8b42e51f8c";
const API_URL = "https://api.realtutorialhub.com/api";
const INTERNAL_KEY = "dummy_for_now"; // I'll extract it in the command

async function smokeTest() {
    console.log(`Starting smoke test for attempt: ${ATTEMPT_ID}`);

    // 1. Trigger
    const triggerRes = await fetch(`${API_URL}/queue-report`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-internal-key': process.env.INTERNAL_API_KEY
        },
        body: JSON.stringify({ attemptId: ATTEMPT_ID })
    });

    const triggerData = await triggerRes.json();
    console.log("Trigger response:", triggerData);

    if (!triggerRes.ok) {
        console.error("Failed to trigger generation");
        return;
    }

    // 2. Polling
    let ready = false;
    let attempts = 0;
    while (!ready && attempts < 20) {
        attempts++;
        console.log(`Polling status (attempt ${attempts})...`);
        const statusRes = await fetch(`${API_URL}/report-status?attemptId=${ATTEMPT_ID}`, {
            headers: { 'x-internal-key': process.env.INTERNAL_API_KEY }
        });
        const statusData = await statusRes.json();
        console.log("Status:", statusData.status);

        if (statusData.status === 'ready') {
            console.log("SUCCESS! PDF is ready at:", statusData.url);
            ready = true;
        } else if (statusData.status === 'failed') {
            console.error("PDF generation failed according to status API");
            break;
        }

        if (!ready) await new Promise(r => setTimeout(r, 3000));
    }
}

smokeTest();

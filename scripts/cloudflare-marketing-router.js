const ORIGINS = {
  "www.realtutorialhub.com": "https://realtutorialhub-site-581488566988.asia-south1.run.app",
  "www.skillupitacademy.com": "https://skillupitacademy-site-581488566988.asia-south1.run.app",
};

const REDIRECTS = {
  "realtutorialhub.com": "www.realtutorialhub.com",
  "skillupitacademy.com": "www.skillupitacademy.com",
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const incomingUrl = new URL(request.url);
  const host = incomingUrl.hostname.toLowerCase();

  if (REDIRECTS[host]) {
    const redirectUrl = new URL(request.url);
    redirectUrl.hostname = REDIRECTS[host];
    return Response.redirect(redirectUrl.toString(), 301);
  }

  const origin = ORIGINS[host];
  if (!origin) {
    return new Response("Unknown marketing host", { status: 404 });
  }

  const targetUrl = new URL(request.url);
  const originUrl = new URL(origin);
  targetUrl.protocol = originUrl.protocol;
  targetUrl.hostname = originUrl.hostname;
  targetUrl.port = originUrl.port;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("x-forwarded-host", host);
  headers.set("x-marketing-origin", originUrl.hostname);

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = request.body;
  }

  return fetch(new Request(targetUrl.toString(), init));
}

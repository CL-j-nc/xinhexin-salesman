interface Env {
  API_BASE_URL?: string;
  CF_ACCESS_CLIENT_ID?: string;
  CF_ACCESS_CLIENT_SECRET?: string;
}

const DEFAULT_API_BASE = "https://xinhexin-api.chinalife-shiexinhexin.workers.dev";

const normalizeBase = (value: string | undefined): string =>
  (value || "").trim().replace(/\/+$/, "");

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const apiBase = normalizeBase(env.API_BASE_URL) || DEFAULT_API_BASE;
  const tokenId = env.CF_ACCESS_CLIENT_ID;
  const tokenSecret = env.CF_ACCESS_CLIENT_SECRET;

  if (!tokenId || !tokenSecret) {
    return new Response("Missing Cloudflare Access service token", { status: 500 });
  }

  const url = new URL(request.url);
  const pathSegments = Array.isArray(params.path) ? params.path : [params.path].filter(Boolean);
  const path = pathSegments.join("/");

  const target = new URL(apiBase);
  target.pathname = `/api/${path}`;
  target.search = url.search;

  const headers = new Headers(request.headers);
  headers.set("CF-Access-Client-Id", tokenId);
  headers.set("CF-Access-Client-Secret", tokenSecret);
  headers.delete("origin");
  headers.delete("host");

  return fetch(target.toString(), {
    method: request.method,
    headers,
    body: request.body,
    redirect: "manual",
  });
};

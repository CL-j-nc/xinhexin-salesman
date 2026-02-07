interface Env {
  XINHEXIN_API?: Fetcher;
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

  const url = new URL(request.url);
  const pathSegments = Array.isArray(params.path) ? params.path : [params.path].filter(Boolean);
  const path = pathSegments.join("/");

  const headers = new Headers(request.headers);
  headers.delete("origin");
  headers.delete("host");

  const init: RequestInit = {
    method: request.method,
    headers,
    body: request.body,
    redirect: "manual",
  };

  const relativePath = `/api/${path}${url.search}`;

  if (url.searchParams.has("__debug")) {
    return new Response(
      JSON.stringify({
        paramsPath: params.path ?? null,
        pathSegments,
        relativePath,
        hasBinding: Boolean(env.XINHEXIN_API),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  if (env.XINHEXIN_API) {
    const boundRequest = new Request(`https://xinhexin-api.internal${relativePath}`, init);
    return env.XINHEXIN_API.fetch(boundRequest);
  }

  const apiBase = normalizeBase(env.API_BASE_URL) || DEFAULT_API_BASE;
  const tokenId = env.CF_ACCESS_CLIENT_ID;
  const tokenSecret = env.CF_ACCESS_CLIENT_SECRET;

  if (tokenId && tokenSecret) {
    headers.set("CF-Access-Client-Id", tokenId);
    headers.set("CF-Access-Client-Secret", tokenSecret);
  }

  return fetch(`${apiBase}${relativePath}`, init);
};

const FALLBACK_API_BASE = "https://xinhexin-api.chinalife-shiexinhexin.workers.dev";
const DEFAULT_TIMEOUT_MS = 12000;
const ACCESS_LOGIN_URL_BASE = "https://chinalife-shiexinhexin.cloudflareaccess.com/cdn-cgi/access/login/f87bf63e374a03dfbf116664af985f1c9acf3cfcd33af189d19efd9e8e02bf1c";

export type ApiErrorKind = "network" | "timeout" | "http" | "parse";

interface ApiRequestErrorParams {
    kind: ApiErrorKind;
    message: string;
    status?: number;
    url?: string;
    responseText?: string;
    cause?: unknown;
}

export class ApiRequestError extends Error {
    kind: ApiErrorKind;
    status?: number;
    url?: string;
    responseText?: string;
    cause?: unknown;

    constructor(params: ApiRequestErrorParams) {
        super(params.message);
        this.name = "ApiRequestError";
        this.kind = params.kind;
        this.status = params.status;
        this.url = params.url;
        this.responseText = params.responseText;
        this.cause = params.cause;
    }
}

export interface FetchFallbackOptions {
    timeoutMs?: number;
    expectJson?: boolean;
    bases?: string[];
}

export interface ApiHealthProbeResult {
    ok: boolean;
    baseUrl?: string;
    reason?: string;
}

const normalizeBase = (base: string): string => base.trim().replace(/\/+$/, "");

const ensurePath = (path: string): string => {
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return path.startsWith("/") ? path : `/${path}`;
};

const getPrimaryApiBase = (): string => {
    const envBase = normalizeBase(import.meta.env.VITE_API_BASE_URL || "");

    // 开发环境优先走本地 API（允许自定义 envBase）
    if (import.meta.env.DEV) return envBase || "http://localhost:8787";

    // 生产环境优先同域，避免跨域 + Access 预检失败
    if (typeof window !== "undefined" && window.location?.origin) {
        return window.location.origin;
    }

    return envBase || FALLBACK_API_BASE;
};

export const getApiBases = (): string[] => {
    const candidates = [getPrimaryApiBase(), normalizeBase(FALLBACK_API_BASE)];
    const seen = new Set<string>();

    return candidates.filter(base => {
        if (!base || seen.has(base)) return false;
        seen.add(base);
        return true;
    });
};

export const buildApiUrl = (path: string, base?: string): string => {
    const absolutePath = ensurePath(path);
    if (absolutePath.startsWith("http://") || absolutePath.startsWith("https://")) {
        return absolutePath;
    }

    const resolvedBase = normalizeBase(base || getApiBases()[0] || "");
    if (!resolvedBase) {
        throw new ApiRequestError({
            kind: "network",
            message: "未配置可用的 API 地址",
        });
    }
    return `${resolvedBase}${absolutePath}`;
};

const withTimeout = async (url: string, init: RequestInit, timeoutMs: number): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    try {
        const finalInit: RequestInit = {
            credentials: init.credentials ?? "include",
            ...init,
            signal: controller.signal,
        };
        return await fetch(url, finalInit);
    } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new ApiRequestError({
                kind: "timeout",
                message: `请求超时（${timeoutMs}ms）`,
                url,
                cause: error,
            });
        }

        throw new ApiRequestError({
            kind: "network",
            message: "网络请求失败",
            url,
            cause: error,
        });
    } finally {
        globalThis.clearTimeout(timeoutId);
    }
};

const extractHttpErrorMessage = (status: number, responseText: string): string => {
    if (!responseText) return `请求失败（HTTP ${status}）`;

    try {
        const parsed = JSON.parse(responseText);
        if (parsed && typeof parsed.error === "string" && parsed.error.trim()) {
            return parsed.error.trim();
        }
        if (parsed && typeof parsed.message === "string" && parsed.message.trim()) {
            return parsed.message.trim();
        }
    } catch {
        // 非 JSON 文本直接走原文
    }
    return responseText.slice(0, 300);
};

export const fetchJsonWithFallback = async <T = unknown>(
    path: string,
    init: RequestInit = {},
    options: FetchFallbackOptions = {}
): Promise<T> => {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const expectJson = options.expectJson ?? true;
    const bases = (options.bases || getApiBases()).map(normalizeBase).filter(Boolean);

    if (bases.length === 0) {
        throw new ApiRequestError({
            kind: "network",
            message: "未配置可用的 API 地址",
        });
    }

    let lastError: ApiRequestError | null = null;

    for (let index = 0; index < bases.length; index++) {
        const base = bases[index];
        const url = buildApiUrl(path, base);

        try {
            const response = await withTimeout(url, init, timeoutMs);
            const responseText = await response.text();

            if (response.status === 401 || response.status === 403) {
                if (typeof window !== "undefined") {
                    const redirectUrl = encodeURIComponent(window.location.href);
                    window.location.href = `${ACCESS_LOGIN_URL_BASE}?redirect_url=${redirectUrl}`;
                }
                throw new ApiRequestError({
                    kind: "http",
                    message: "Access denied",
                    status: response.status,
                    url,
                    responseText,
                });
            }

            if (!response.ok) {
                throw new ApiRequestError({
                    kind: "http",
                    message: extractHttpErrorMessage(response.status, responseText),
                    status: response.status,
                    url,
                    responseText,
                });
            }

            if (!expectJson) {
                return undefined as T;
            }

            if (!responseText.trim()) {
                return undefined as T;
            }

            try {
                return JSON.parse(responseText) as T;
            } catch (parseError) {
                throw new ApiRequestError({
                    kind: "parse",
                    message: "接口响应格式异常",
                    url,
                    responseText: responseText.slice(0, 300),
                    cause: parseError,
                });
            }
        } catch (error) {
            const normalizedError = error instanceof ApiRequestError
                ? error
                : new ApiRequestError({
                    kind: "network",
                    message: "网络请求失败",
                    url,
                    cause: error,
                });

            const canFallback = normalizedError.kind === "network" || normalizedError.kind === "timeout";
            const hasNext = index < bases.length - 1;

            if (canFallback && hasNext) {
                lastError = normalizedError;
                continue;
            }

            throw normalizedError;
        }
    }

    throw lastError || new ApiRequestError({
        kind: "network",
        message: "网络请求失败",
    });
};

export const probeApiHealth = async (): Promise<ApiHealthProbeResult> => {
    const bases = getApiBases();
    let lastReason = "";

    for (const base of bases) {
        const healthPath = "/api/health";

        try {
            await fetchJsonWithFallback(healthPath, { method: "HEAD" }, {
                timeoutMs: 6000,
                expectJson: false,
                bases: [base],
            });
            return { ok: true, baseUrl: base };
        } catch (headError) {
            try {
                await fetchJsonWithFallback(healthPath, { method: "GET" }, {
                    timeoutMs: 6000,
                    expectJson: false,
                    bases: [base],
                });
                return { ok: true, baseUrl: base };
            } catch (getError) {
                const err = getError instanceof ApiRequestError ? getError : headError;
                const errMessage = err instanceof ApiRequestError ? err.message : "健康检查失败";
                lastReason = `${base} => ${errMessage}`;
            }
        }
    }

    return {
        ok: false,
        reason: lastReason || "API 健康检查失败",
    };
};

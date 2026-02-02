// functions/api/application/apply.ts
// 功能：接收投保申请，存储到 KV，返回 requestId

interface Env {
    POLICY_KV: KVNamespace;
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
    try {
        const data = await request.json();
        const requestId = `REQ-${crypto.randomUUID()}`;
        const applicationNo = `APP-${Date.now()}`;

        // 构造存储数据
        const payload = {
            applicationNo,
            ...data,
            status: "APPLIED",
            createdAt: new Date().toISOString(),
        };

        // 存储到 KV，30天过期
        await env.POLICY_KV.put(applicationNo, JSON.stringify(payload), {
            expirationTtl: 2592000,
        });

        // RequestId 映射到 ApplicationNo
        await env.POLICY_KV.put(`request:${requestId}`, applicationNo, {
            expirationTtl: 86400,
        });

        return new Response(JSON.stringify({ success: true, requestId, applicationNo }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || "提交失败" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }
}

// CORS 预检请求
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
        },
    });
}

// functions/api/application/apply.ts
// 功能：接收投保申请，存储到 KV，返回 requestId

interface Env {
    POLICY_KV: KVNamespace;
    DB: D1Database;
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

        // 1. 存储到 KV，30天过期 (用于快速状态查询)
        await env.POLICY_KV.put(applicationNo, JSON.stringify(payload), {
            expirationTtl: 2592000,
        });

        // 2. RequestId 映射到 ApplicationNo
        await env.POLICY_KV.put(`request:${requestId}`, applicationNo, {
            expirationTtl: 86400,
        });

        // 3. 持久化到 D1 数据库 (正式业务存储)
        await env.DB.prepare(
            `INSERT INTO application (
        application_no, 
        request_id, 
        energy_type, 
        vehicle_data, 
        owner_data, 
        proposer_data, 
        insured_data, 
        coverages_data, 
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            applicationNo,
            requestId,
            data.vehicle?.energyType || 'FUEL',
            JSON.stringify(data.vehicle || {}),
            JSON.stringify(data.owner || {}),
            JSON.stringify(data.proposer || {}),
            JSON.stringify(data.insured || {}),
            JSON.stringify(data.coverages || []),
            "APPLIED"
        ).run();

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

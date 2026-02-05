// functions/api/application/apply.ts
// 功能：接收投保申请，存储到 KV，返回 requestId

interface Env {
    KV_BINDING: KVNamespace;
    DB?: D1Database;
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
        await env.KV_BINDING.put(applicationNo, JSON.stringify(payload), {
            expirationTtl: 2592000,
        });

        // 2. RequestId 映射到 ApplicationNo
        await env.KV_BINDING.put(`request:${requestId}`, applicationNo, {
            expirationTtl: 86400,
        });

        // 3. 持久化到 D1 数据库 (可选，如果绑定了 DB 则执行)
        if (env.DB) {
            try {
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
            } catch (dbError: any) {
                console.error("D1 Database error:", dbError.message);
                // 继续执行，因为 KV 已经保存了数据，不影响用户前端流程
            }
        } else {
            console.warn("D1 Database binding 'DB' is missing. Data only saved to KV.");
        }

        return new Response(JSON.stringify({ success: true, requestId, applicationNo }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error: any) {
        console.error("Application apply error:", error.message);
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

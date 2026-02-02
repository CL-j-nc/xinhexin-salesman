// functions/api/application/[id].ts
// 功能：根据 requestId 或 applicationNo 查询投保状态

interface Env {
    POLICY_KV: KVNamespace;
}

export async function onRequestGet({ params, env }: { params: { id: string }; env: Env }) {
    try {
        const id = params.id;

        // 先检查是否是 requestId 映射
        let applicationNo = await env.POLICY_KV.get(`request:${id}`);
        if (!applicationNo) {
            applicationNo = id; // 直接使用 id 作为 applicationNo
        }

        // 从 KV 读取数据
        const data = await env.POLICY_KV.get(applicationNo);

        if (!data) {
            return new Response(
                JSON.stringify({ status: null, reason: "未找到投保记录" }),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }

        const parsed = JSON.parse(data);

        return new Response(
            JSON.stringify({
                applicationNo: parsed.applicationNo,
                status: parsed.status || "APPLIED",
                reason: parsed.reason || "",
                vehicle: parsed.vehicle,
                owner: parsed.owner,
                coverages: parsed.coverages,
                createdAt: parsed.createdAt,
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ status: null, reason: error.message || "查询失败" }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    }
}

// CORS 预检请求
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
        },
    });
}

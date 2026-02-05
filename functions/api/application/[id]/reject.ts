// functions/api/application/[id]/reject.ts
// 功能：核保拒绝操作

interface RejectRequest {
    reason?: string;
}

export async function onRequestPost({ params, request, env }: any) {
    try {
        const applicationNo = params.id;

        if (!applicationNo) {
            return new Response(
                JSON.stringify({ error: "缺少投保单号" }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }

        // 读取请求体中的拒绝原因
        let rejectReason = "";
        try {
            const body: RejectRequest = await request.json();
            rejectReason = body.reason || "";
        } catch (e) {
            // 如果没有请求体，继续处理
        }

        // 从 KV 读取投保数据
        const data = await env.KV_BINDING.get(applicationNo);

        if (!data) {
            return new Response(
                JSON.stringify({ error: "未找到投保记录" }),
                {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }

        // 解析并更新状态为 UR（需要修改）
        const parsed = JSON.parse(data);
        parsed.status = "UR";
        parsed.reason = rejectReason;
        parsed.rejectedAt = new Date().toISOString();

        // 保存回 KV
        await env.KV_BINDING.put(applicationNo, JSON.stringify(parsed), {
            expirationTtl: 2592000, // 30天
        });

        return new Response(
            JSON.stringify({ success: true, status: "UR" }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    } catch (error: any) {
        console.error("Reject error:", error.message);
        return new Response(
            JSON.stringify({ error: error.message || "操作失败" }),
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

// CORS 预检
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

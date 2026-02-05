// functions/api/application/[id]/approve.ts
// 功能：核保通过操作

export async function onRequestPost({ params, env }: any) {
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

        // 解析并更新状态为 UA（核保通过）
        const parsed = JSON.parse(data);
        parsed.status = "UA";
        parsed.approvedAt = new Date().toISOString();

        // 保存回 KV
        await env.KV_BINDING.put(applicationNo, JSON.stringify(parsed), {
            expirationTtl: 2592000, // 30天
        });

        return new Response(
            JSON.stringify({ success: true, status: "UA" }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    } catch (error: any) {
        console.error("Approve error:", error.message);
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

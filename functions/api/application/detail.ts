// functions/api/application/detail.ts
// 功能：根据 applicationId 或 requestId 查询投保详情

export async function onRequestGet({ request, env }: any) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return new Response(
                JSON.stringify({
                    error: "缺少 id 参数",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }

        // 先检查是否是 requestId 映射
        let applicationNo = await env.KV_BINDING.get(`request:${id}`);
        if (!applicationNo) {
            applicationNo = id; // 直接使用 id 作为 applicationNo
        }

        // 从 KV 读取数据
        const data = await env.KV_BINDING.get(applicationNo);

        if (!data) {
            return new Response(
                JSON.stringify({
                    error: "未找到投保记录",
                }),
                {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        }

        const parsed = JSON.parse(data);

        // 返回完整的投保详情
        return new Response(JSON.stringify(parsed), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error: any) {
        return new Response(
            JSON.stringify({
                error: error.message || "查询失败",
            }),
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

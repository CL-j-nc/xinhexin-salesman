// functions/api/application/list.ts
// 功能：列出所有待核保的投保申请（供核保端查询）

interface Application {
    applicationNo: string;
    status: string;
    createdAt: string;
    vehicle?: any;
    owner?: any;
}

export async function onRequestGet({ env }: any) {
    try {
        const applications: Application[] = [];

        // 使用游标分页获取所有 KV 记录
        let cursor = undefined;
        let hasMore = true;

        while (hasMore) {
            // 从 KV 列出所有 key
            const listResult = await env.KV_BINDING.list({ cursor });

            if (!listResult || !listResult.keys) {
                break;
            }

            // 遍历所有 KV 记录，过滤出投保申请数据
            for (const key of listResult.keys) {
                const keyName = key.name;

                // 跳过 requestId 映射数据（以 request: 开头的）
                if (keyName.startsWith("request:")) {
                    continue;
                }

                // 读取投保数据
                const data = await env.KV_BINDING.get(keyName);
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        applications.push({
                            applicationNo: parsed.applicationNo || keyName,
                            status: parsed.status || "APPLIED",
                            createdAt: parsed.createdAt || new Date().toISOString(),
                            vehicle: parsed.vehicle,
                            owner: parsed.owner,
                        });
                    } catch (e) {
                        // 忽略解析错误的记录
                        console.error(`Failed to parse KV data for key: ${keyName}`);
                    }
                }
            }

            // 检查是否有更多记录
            cursor = listResult.cursor;
            hasMore = listResult.list_complete === false;
        }

        // 按创建时间倒序排列（最新的在前）
        applications.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return new Response(JSON.stringify(applications), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch (error: any) {
        console.error("List applications error:", error.message, error.stack);
        return new Response(
            JSON.stringify({
                error: error.message || "列表查询失败",
                applications: [],
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

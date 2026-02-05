// functions/api/application/search.ts
// 功能：根据多个字段搜索投保申请

interface SearchQuery {
    insuredName?: string;
    idCard?: string;
    mobile?: string;
    plate?: string;
    engineNo?: string;
}

interface Application {
    applicationNo: string;
    status: string;
    createdAt: string;
    vehicle?: any;
    owner?: any;
}

export async function onRequestPost({ request, env }: any) {
    try {
        const query: SearchQuery = await request.json();

        // 验证至少有两个搜索条件
        const conditions = [
            query.insuredName,
            query.idCard,
            query.mobile,
            query.plate,
            query.engineNo,
        ].filter(c => c && c.trim());

        if (conditions.length < 2) {
            return new Response(
                JSON.stringify({ error: '请提供至少 2 个搜索条件' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                }
            );
        }

        const applications: Application[] = [];
        let cursor = undefined;
        let hasMore = true;

        // 遍历 KV 中的所有记录
        while (hasMore) {
            const listResult = await env.KV_BINDING.list({ cursor });

            if (!listResult || !listResult.keys) {
                break;
            }

            for (const key of listResult.keys) {
                const keyName = key.name;

                // 跳过 requestId 映射数据
                if (keyName.startsWith('request:')) {
                    continue;
                }

                // 读取投保数据
                const data = await env.KV_BINDING.get(keyName);
                if (data) {
                    try {
                        const parsed = JSON.parse(data);

                        // 检查是否匹配搜索条件
                        let matchCount = 0;

                        if (query.insuredName && parsed.owner?.name?.includes(query.insuredName)) {
                            matchCount++;
                        }
                        if (query.idCard && parsed.owner?.idCard?.includes(query.idCard)) {
                            matchCount++;
                        }
                        if (query.mobile && parsed.owner?.mobile?.includes(query.mobile)) {
                            matchCount++;
                        }
                        if (query.plate && parsed.vehicle?.plate?.toUpperCase().includes(query.plate.toUpperCase())) {
                            matchCount++;
                        }
                        if (query.engineNo && parsed.vehicle?.engineNo?.includes(query.engineNo)) {
                            matchCount++;
                        }

                        // 如果至少匹配 2 个条件，就添加到结果中
                        if (matchCount >= 2) {
                            applications.push({
                                applicationNo: parsed.applicationNo || keyName,
                                status: parsed.status || 'APPLIED',
                                createdAt: parsed.createdAt || new Date().toISOString(),
                                vehicle: parsed.vehicle,
                                owner: parsed.owner,
                            });
                        }
                    } catch (e) {
                        // 忽略解析错误
                        console.error(`Failed to parse KV data for key: ${keyName}`);
                    }
                }
            }

            // 检查是否有更多记录
            cursor = listResult.cursor;
            hasMore = listResult.list_complete === false;
        }

        // 按创建时间倒序排列
        applications.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return new Response(JSON.stringify(applications), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error: any) {
        console.error('Search applications error:', error.message, error.stack);
        return new Response(
            JSON.stringify({
                error: error.message || '搜索失败',
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
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
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
}

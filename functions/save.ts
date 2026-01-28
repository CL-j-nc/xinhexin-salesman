// functions/api/save.ts
// 功能：接收 Salesman 前端提交的投保数据，存储到 KV，返回 application_id
// 状态：仅写入 APPLIED，不允许写其他状态

export async function onRequestPost({ request, env }: any) {
  try {
    const data = await request.json();
    const id = crypto.randomUUID();

    // 构造存储数据：固定写入 status: "APPLIED"
    const payload = {
      ...data,
      status: "APPLIED",
      createdAt: Date.now(),
    };

    // 存储到 KV，30天过期
    await env.KV_BINDING.put(
      id,
      JSON.stringify(payload),
      { expirationTtl: 2592000 } // 30天 = 2592000秒
    );

    // 返回 application_id
    return new Response(
      JSON.stringify({ id }),
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
      JSON.stringify({
        error: error.message || "保存失败",
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

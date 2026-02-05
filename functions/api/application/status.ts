// functions/api/application/status.ts
// 功能：根据 application_id 或 requestId 查询投保状态
// 返回：{ status: "APPLIED" | "UNDERWRITING" | "APPROVED" | "REJECTED" | "PAID" | "ISSUED", reason: "" }

export async function onRequestGet({ request, env }: any) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({
          status: null,
          reason: "缺少申请单号",
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
          status: null,
          reason: "未找到投保记录",
        }),
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

    // 严格按照规范返回：只返回 status 和 reason
    return new Response(
      JSON.stringify({
        status: parsed.status || "APPLIED",
        reason: parsed.reason || "",
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
      JSON.stringify({
        status: null,
        reason: error.message || "查询失败",
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

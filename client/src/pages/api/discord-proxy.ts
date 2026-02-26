import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // نسمح فقط بطلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { method, endpoint, token, body } = req.body;

    // تحقق من المدخلات
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    // تأكد أن الـ endpoint يبدأ بـ /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    console.log(`🔵 Proxy: ${method || 'GET'} ${cleanEndpoint}`);

    // جهز الـ URL
    const url = `https://discord.com/api/v9${cleanEndpoint}`;
    
    // جهز الـ headers
    const headers: Record<string, string> = {
      'Authorization': token,
      'Content-Type': 'application/json',
    };

    // نضيف User-Agent عشان نتجنب الحظر
    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

    // نفذ الطلب
    const response = await fetch(url, {
      method: method || 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // نجيب النص
    const text = await response.text();
    
    // نحاول نحوله لـ JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    // نرجع الـ response
    return res.status(response.status).json({
      status: response.status,
      ok: response.ok,
      data,
      headers: Object.fromEntries(response.headers)
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
// Netlify Function: api-luan-giai.mjs
// Returns chart + AI interpretation from DeepSeek
import { lapDiaBan, lapThienBan } from './lib/tuvi-engine.mjs';
import { buildChartJSON, buildTuviPrompt } from './lib/chart-builder.mjs';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

export default async function handler(req) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  
  try {
    const params = req.method === 'POST' ? JSON.parse(req.body || '{}') : (req.queryStringParameters || {});
    const { nam, thang, ngay, gio, gioi_tinh, name } = params;
    
    if (!nam || !thang || !ngay || !gio) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Thiếu thông tin' }) };
    }
    
    const gioi = (String(gioi_tinh || 'nam').toLowerCase() === 'nam') ? 1 : -1;
    const db = lapDiaBan(parseInt(ngay), parseInt(thang), parseInt(nam), parseInt(gio), gioi, true, 7);
    const tb = lapThienBan(parseInt(ngay), parseInt(thang), parseInt(nam), parseInt(gio), gioi, name || '', db);
    
    const chart = buildChartJSON(db, tb, nam, thang, ngay, gio, gioi_tinh);
    chart.name = name || '';
    
    // Call DeepSeek AI
    if (DEEPSEEK_API_KEY) {
      const prompt = buildTuviPrompt(chart);
      try {
        const aiResp = await fetch('https://api.deepseek.com/anthropic/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
          body: JSON.stringify({
            model: DEEPSEEK_MODEL,
            system: 'Bạn là chuyên gia tử vi đẩu số lão luyện với 30 năm kinh nghiệm. Phong cách viết: rất dài, rất chi tiết, sâu sắc, có hồn. Luôn viết thành đoạn văn dài, không dùng bullet point, không tóm tắt. Mỗi lần trả lời ít nhất 2000 từ.',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 16000,
            temperature: 0.85
          })
        });
        const aiData = await aiResp.json();
        const aiText = (aiData.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
        
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ chart, luan_giai: { ai_luan_giai: aiText || 'Không có phản hồi từ AI', nguon: 'DeepSeek' } })
        };
      } catch (aiErr) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ chart, luan_giai: { error: 'Lỗi gọi AI: ' + aiErr.message, nguon: 'built-in' } })
        };
      }
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ chart, luan_giai: { error: 'Chưa cấu hình DEEPSEEK_API_KEY', nguon: 'none' } })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}

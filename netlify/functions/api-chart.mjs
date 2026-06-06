// Netlify Function: api-chart.mjs
// Returns birth chart JSON
import { lapDiaBan, lapThienBan } from './lib/tuvi-engine.js';
import { buildChartJSON } from './lib/chart-builder.js';

export default async function handler(req) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  
  try {
    const params = req.method === 'POST' ? JSON.parse(req.body) : req.queryStringParameters || {};
    const { nam, thang, ngay, gio, gioi_tinh } = params;
    
    if (!nam || !thang || !ngay || !gio) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Thiếu thông tin' }) };
    }
    
    const gioi = (String(gioi_tinh || 'nam').toLowerCase() === 'nam') ? 1 : -1;
    const db = lapDiaBan(parseInt(ngay), parseInt(thang), parseInt(nam), parseInt(gio), gioi, true, 7);
    const tb = lapThienBan(parseInt(ngay), parseInt(thang), parseInt(nam), parseInt(gio), gioi, '', db);
    
    const chart = buildChartJSON(db, tb, nam, thang, ngay, gio, gioi_tinh);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(chart)
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}

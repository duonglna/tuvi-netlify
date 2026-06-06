# 🦊 Tử Vi Đẩu Số — Netlify Deploy

Lập lá số tử vi + AI luận giải bằng DeepSeek.

## Cấu trúc

```
netlify-app/
├── public/index.html        # Frontend React (SPA)
├── netlify/functions/
│   ├── api-chart.mjs        # API: lập lá số
│   ├── api-luan-giai.mjs    # API: lá số + AI luận giải
│   └── lib/
│       ├── tuvi-engine.js   # Engine tử vi (port từ Python lasotuvi)
│       └── chart-builder.js # Build chart JSON + prompt
├── netlify.toml             # Netlify config
├── package.json
└── .env.example
```

## Deploy lên Netlify

### Cách 1: Deploy bằng Netlify CLI

```bash
npm install -g netlify-cli
cd netlify-app
npm install
netlify deploy --prod
```

### Cách 2: Connect GitHub repo

1. Push repo này lên GitHub
2. Vào Netlify → Add new site → Import an existing project → Chọn GitHub repo
3. Build settings: để trống (không cần build)
4. Publish directory: `public`
5. Deploy

## Environment Variables

Set trên Netlify Dashboard (Site settings → Environment variables):

| Key | Value |
|-----|-------|
| `DEEPSEEK_API_KEY` | `sk-...` (API key DeepSeek) |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` |

## Local Dev

```bash
npm install -g netlify-cli
cd netlify-app
netlify dev
```

Mở `http://localhost:8888`

## Visual Product Matcher

AI-powered visual similarity search for products. Upload an image or paste a URL and get visually similar catalog items, ranked by cosine similarity. Backend: FastAPI + TensorFlow (MobileNetV2). Frontend: Vite + React + Tailwind, deployable on Vercel.

### Features
- Image upload (file/URL), JPEG/PNG/WebP; reliable “Browse Files” behavior
- Precomputed embeddings for fast search; MobileNetV2 for low memory
- Cosine similarity ranking, adjustable threshold (defaults to show all)
- Clean UI with loading skeletons; correct image URL handling
- Dockerized backend/frontend; Render (backend) + Vercel (frontend) ready

### Quick Start (Docker)
```sh
docker compose up -d --build
# Backend: http://localhost:8000 (health at /api/health)
# Frontend: http://localhost:3000
```

Rebuild embeddings when data/images change:
```sh
docker compose exec backend python scripts/build_embeddings.py
docker compose restart backend
```

### Quick Start (Dev without Docker)
```sh
# Frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Configuration
- Frontend env: `VITE_API_URL` (points to backend, e.g. `http://localhost:8000` or your Render URL)
- Data files: `backend/data/products.csv` or `products.xlsx`
- Images folder: `backend/static/images/...` and use `static/images/...` in `image_path`

### API Endpoints
- `GET /api/health` — health check
- `GET /api/products` — product list
- `GET /api/categories` — categories (if present)
- `POST /api/search` — body: image (multipart) or `image_url`, optional `threshold`

### Deploy
- Backend (Render, Docker): connect repo, use Docker, set `PORT=8000`, health path `/api/health`. Use MobileNetV2 and limited threads for free tier.
- Frontend (Vercel): import repo as Vite project, set `VITE_API_URL` env to your backend URL. Avoid custom `vercel.json` unless necessary.

### Troubleshooting
- Images not showing: ensure spreadsheet `image_path` like `static/images/...` and frontend uses `getImageUrl(...)`.
- Vite not found in Docker: use `npm ci || npm install` during build.
- Memory errors on Render free tier: MobileNetV2, `OMP_NUM_THREADS=1`, `TF_CPP_MIN_LOG_LEVEL=3`, disable reload.

### Tech Stack
- FastAPI, TensorFlow (MobileNetV2), scikit-learn
- Vite, React, TypeScript, Tailwind, shadcn-ui

### License
MIT

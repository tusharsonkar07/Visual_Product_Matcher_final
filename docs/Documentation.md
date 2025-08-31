## Visual Product Matcher — Detailed Documentation

### 1) Overview
An AI-powered visual similarity search for products. Users upload an image or enter a URL; the system returns visually similar catalog items, ranked by cosine similarity.

### 2) Architecture
- Backend: FastAPI, TensorFlow (MobileNetV2), scikit-learn cosine similarity, served via Uvicorn. Static assets in `/static`. Precomputed embeddings stored in `backend/data`.
- Frontend: Vite + React + TypeScript + Tailwind + shadcn/ui, built and served by Nginx (Docker) or via Vercel as static assets.
- Containers: `docker-compose.yml` coordinates `backend` and `frontend`. Backend on port 8000, frontend on port 3000.

### 3) Data & Embeddings
- Sources: `backend/data/products.csv` or `products.xlsx` (normalized to `valid_products.xlsx` once embeddings are built).
- Images: Served from `backend/static/images/...`. In sheets, use paths like `static/images/filename.jpg`.
- Build embeddings:
  - `docker compose exec backend python scripts/build_embeddings.py`
  - Outputs: `backend/data/embeddings.npy` and `backend/data/valid_products.xlsx`.

### 4) Backend API
- `/api/health`: service health.
- `/api/products`: list catalog products.
- `/api/categories`: available categories (if present in data).
- `/api/search`: POST with image (multipart) or image_url, plus optional threshold. Returns ranked results with similarity scores.

### 5) Image Processing
- Validation: format (JPEG/PNG/WebP), size, and load errors handled gracefully.
- Preprocessing: resize to model input, normalize, optional enhancements.
- Embedding: MobileNetV2 (ImageNet) for low memory footprint; cosine similarity via scikit-learn.

### 6) Frontend Flow
- ImageUploader: drag-and-drop or URL input; supports JPEG/JPG, PNG, WebP. Ensures file input always triggers.
- ProductMatcher: calls backend, applies threshold filter (defaults to 0% to show all), shows skeleton loaders, and renders `ProductCard`s.
- ProductCard: constructs image URLs safely using `getImageUrl`, lazy-load friendly.

### 7) Running Locally
With Docker:
```sh
docker compose up -d --build
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```
Without Docker:
```sh
# Frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 8) Deployment
- Backend (Render, Docker): Push to GitHub; connect Render; use Docker. Set `PORT=8000`. Health: `/api/health`. Ensure free-tier memory: MobileNetV2, no reload, limited threads.
- Frontend (Vercel): Import GitHub repo as Vite project. Set `VITE_API_URL` to your Render backend URL. Remove custom `vercel.json` unless needed.

### 9) Configuration
- Env vars: `VITE_API_URL` (frontend), `ENVIRONMENT` (backend), `PYTHONPATH` (Docker), optional logging.
- Nginx: returns 204 for `/favicon.ico` and `/favicon.svg` to avoid unwanted favicons.

### 10) Troubleshooting
- Images not showing: ensure sheet `image_path` values like `static/images/...` and backend serves `/static/...`. Use `getImageUrl` on the frontend.
- Memory on Render: use MobileNetV2, `OMP_NUM_THREADS=1`, `TF_CPP_MIN_LOG_LEVEL=3`, disable reload.
- Vite build missing: install dev deps (`npm ci || npm install`) in Dockerfile.
- Port conflicts locally: stop conflicting containers on port 8000.

### 11) Maintenance
- Update data: modify `products.csv` / images, rebuild embeddings, restart backend.
- UI updates: adjust React components in `src/components`, rebuild frontend.



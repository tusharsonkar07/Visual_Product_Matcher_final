## Visual Product Matcher

AI-powered visual product similarity search with a FastAPI backend and a Vite + React frontend.

### Run locally with Docker

```sh
docker compose up -d --build
# Backend: http://localhost:8000 (health at /api/health)
# Frontend: http://localhost:3000
```

Generate embeddings (optional, when product data changes):

```sh
docker compose exec backend python scripts/build_embeddings.py
docker compose restart backend
```

### Development (without Docker)

```sh
# Frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Tech Stack
- FastAPI, TensorFlow, scikit-learn
- Vite, React, TypeScript, Tailwind, shadcn-ui

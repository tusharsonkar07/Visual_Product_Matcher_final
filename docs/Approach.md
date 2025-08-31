## Approach

This project delivers fast, accurate visual product matching by combining a lightweight deep-learning encoder with a simple, robust search pipeline.

On the backend, a FastAPI service loads a MobileNetV2 image encoder (ImageNet weights) to transform images into fixed-length embeddings. For the product catalog, we precompute embeddings once (via a script) and store them alongside a cleaned dataset so queries are efficient and memory-friendly. At request time, a user image (uploaded file or URL) is validated, resized, normalized, embedded, and compared to the catalog using cosine similarity from scikit-learn. CORS is enabled, static product images are served from `/static`, and the service exposes clean JSON endpoints for health, products, categories, and search.

On the frontend, a Vite + React + TypeScript app orchestrates uploads, thresholds, filters, and result display. It includes a reliable uploader (drag-and-drop, URL, JPEG/PNG/WebP support), a default “show all” threshold, and responsive UI with loading skeletons. Image URLs are constructed safely to avoid broken paths.

Deployment prioritizes free-tier limits. The backend is containerized (Docker) with reduced memory usage (no reload, constrained threads), and the frontend is served statically behind Nginx. Recommended hosting is Render (backend, Docker) and Vercel (frontend), configured via environment variables like `VITE_API_URL`.



from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
import numpy as np
import pandas as pd
from typing import List, Optional
import logging
from datetime import datetime
import uuid
import aiofiles
from PIL import Image
import io
import requests

from .utils.embedding import EmbeddingExtractor
from .utils.similarity import SimilaritySearcher
from .utils.preprocessing import ImagePreprocessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Visual Product Matcher API",
    description="AI-powered visual product similarity search",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Global variables for models and data
embedding_extractor = None
similarity_searcher = None
products_df = None

@app.on_event("startup")
async def startup_event():
    global embedding_extractor, similarity_searcher, products_df
    
    try:
        # Initialize embedding extractor
        embedding_extractor = EmbeddingExtractor()
        logger.info("Embedding extractor initialized")

        # Helper to normalize image paths to static/images/<filename>
        def _normalize_image_path(path: str) -> str:
            try:
                filename = os.path.basename(str(path))
                return f"static/images/{filename}" if filename else str(path)
            except Exception:
                return str(path)

        # Determine which products file to load
        embeddings_path = "data/embeddings.npy"
        valid_products_xlsx = "data/valid_products.xlsx"
        products_csv = "data/products.csv"
        products_xlsx = "data/products.xlsx"

        # Prefer valid_products.xlsx when embeddings exist (ensures order alignment)
        if os.path.exists(embeddings_path) and os.path.exists(valid_products_xlsx):
            products_df = pd.read_excel(valid_products_xlsx)
            logger.info(f"Loaded {len(products_df)} products from valid_products.xlsx")
        else:
            # Load CSV if available, else fallback to XLSX
            if os.path.exists(products_csv):
                products_df = pd.read_csv(products_csv)
                logger.info(f"Loaded {len(products_df)} products from products.csv")
            elif os.path.exists(products_xlsx):
                products_df = pd.read_excel(products_xlsx)
                logger.info(f"Loaded {len(products_df)} products from products.xlsx")
            else:
                raise FileNotFoundError("No products file found. Expected data/products.csv or data/products.xlsx")

        # Normalize image_path column if present
        if 'image_path' in products_df.columns:
            products_df['image_path'] = products_df['image_path'].apply(_normalize_image_path)

        # Load precomputed embeddings
        if os.path.exists(embeddings_path):
            embeddings = np.load(embeddings_path)
            similarity_searcher = SimilaritySearcher(embeddings, products_df)
            logger.info("Embeddings loaded and similarity searcher initialized")
        else:
            logger.warning("Embeddings file not found. Run build_embeddings.py first")

    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": embedding_extractor is not None and similarity_searcher is not None
    }

@app.get("/api/products")
async def get_products(
    category: Optional[str] = None,
    available: Optional[bool] = None,
    limit: Optional[int] = None
):
    """Get all products with optional filtering"""
    try:
        df = products_df.copy()
        
        if category and category.lower() != "all":
            df = df[df['category'].str.lower() == category.lower()]
        
        if available is not None:
            df = df[df['available'] == available]
            
        if limit:
            df = df.head(limit)
            
        products = df.to_dict('records')
        
        return {
            "products": products,
            "total": len(products),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch products")

@app.post("/api/search")
async def search_similar_products(
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    top_k: int = Form(11),
    similarity_threshold: float = Form(0.0)
):
    """Search for visually similar products"""
    try:
        if not embedding_extractor or not similarity_searcher:
            raise HTTPException(status_code=503, detail="Models not loaded")
        
        if not file and not image_url:
            raise HTTPException(status_code=400, detail="Either file or image_url must be provided")
        
        # Process input image
        if file:
            # Handle file upload
            image_data = await file.read()
            image = Image.open(io.BytesIO(image_data))
            
            # Save query image for logging
            query_id = str(uuid.uuid4())
            query_path = f"logs/queries/{query_id}_{file.filename}"
            os.makedirs(os.path.dirname(query_path), exist_ok=True)
            
            async with aiofiles.open(query_path, 'wb') as f:
                await f.write(image_data)
                
        elif image_url:
            # Handle URL
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            image = Image.open(io.BytesIO(response.content))
            
            # Save query image for logging
            query_id = str(uuid.uuid4())
            query_path = f"logs/queries/{query_id}_url_image.jpg"
            os.makedirs(os.path.dirname(query_path), exist_ok=True)
            image.save(query_path)
        
        # Extract embedding from query image
        query_embedding = embedding_extractor.extract_embedding(image)
        
        # Search for similar products
        results = similarity_searcher.search(
            query_embedding, 
            top_k=top_k, 
            threshold=similarity_threshold
        )
        
        # Log query
        log_entry = {
            "query_id": query_id,
            "timestamp": datetime.now().isoformat(),
            "input_type": "file" if file else "url",
            "filename": file.filename if file else image_url,
            "top_k": top_k,
            "threshold": similarity_threshold,
            "results_count": len(results)
        }
        
        # Save log entry
        log_path = "logs/queries.log"
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
        async with aiofiles.open(log_path, 'a') as f:
            await f.write(f"{log_entry}\n")
        
        return {
            "query_id": query_id,
            "results": results,
            "total_results": len(results),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in search: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/api/categories")
async def get_categories():
    """Get all available product categories"""
    try:
        categories = products_df['category'].unique().tolist()
        return {
            "categories": ["All"] + sorted(categories),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch categories")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
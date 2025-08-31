#!/usr/bin/env python3
"""
Script to build embeddings for all products in the dataset
Run this script whenever you add new products or want to rebuild the embeddings
"""

import os
import sys
import pandas as pd
import numpy as np
from PIL import Image
import logging
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.embedding import EmbeddingExtractor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def build_embeddings():
    """Build embeddings for all products"""
    try:
        # Initialize embedding extractor
        logger.info("Initializing ResNet50 model...")
        extractor = EmbeddingExtractor()
        
        # Load products data (prefer CSV, fallback to XLSX)
        products_csv = "data/products.csv"
        products_xlsx = "data/products.xlsx"
        if os.path.exists(products_csv):
            products_df = pd.read_csv(products_csv)
            logger.info(f"Loaded {len(products_df)} products from products.csv")
        elif os.path.exists(products_xlsx):
            products_df = pd.read_excel(products_xlsx)
            logger.info(f"Loaded {len(products_df)} products from products.xlsx")
        else:
            raise FileNotFoundError("Products file not found: data/products.csv or data/products.xlsx")
        
        # Process each product
        embeddings = []
        valid_products = []
        
        for idx, product in products_df.iterrows():
            try:
                image_path = product['image_path']
                # Normalize to backend static path if absolute or unexpected
                try:
                    filename = os.path.basename(str(image_path))
                    image_path = os.path.join("static", "images", filename)
                except Exception:
                    pass
                
                # Check if image exists
                if not os.path.exists(image_path):
                    logger.warning(f"Image not found: {image_path}")
                    continue
                
                # Load and process image
                img = Image.open(image_path)
                
                # Extract embedding
                embedding = extractor.extract_embedding(img)
                
                embeddings.append(embedding)
                valid_products.append(product)
                
                logger.info(f"Processed {idx + 1}/{len(products_df)}: {product['name']}")
                
            except Exception as e:
                logger.error(f"Error processing product {product['name']}: {e}")
                continue
        
        if not embeddings:
            raise ValueError("No valid embeddings generated")
        
        # Convert to numpy array
        embeddings_array = np.array(embeddings)
        logger.info(f"Generated embeddings shape: {embeddings_array.shape}")
        
        # Save embeddings
        embeddings_path = "data/embeddings.npy"
        os.makedirs(os.path.dirname(embeddings_path), exist_ok=True)
        np.save(embeddings_path, embeddings_array)
        logger.info(f"Saved embeddings to: {embeddings_path}")
        
        # Save valid products (in case some were skipped)
        valid_products_df = pd.DataFrame(valid_products)
        valid_products_path = "data/valid_products.xlsx"
        valid_products_df.to_excel(valid_products_path, index=False)
        logger.info(f"Saved valid products to: {valid_products_path}")
        
        logger.info("✅ Embeddings built successfully!")
        
        return embeddings_array, valid_products_df
        
    except Exception as e:
        logger.error(f"Error building embeddings: {e}")
        raise

def verify_embeddings():
    """Verify that embeddings were built correctly"""
    try:
        embeddings_path = "data/embeddings.npy"
        products_path = "data/products.xlsx"
        
        if not os.path.exists(embeddings_path):
            logger.error("Embeddings file not found")
            return False
        
        if not os.path.exists(products_path):
            logger.error("Products file not found")
            return False
        
        embeddings = np.load(embeddings_path)
        products_df = pd.read_excel(products_path)
        
        logger.info(f"Embeddings shape: {embeddings.shape}")
        logger.info(f"Products count: {len(products_df)}")
        
        # Basic validation
        if embeddings.shape[0] != len(products_df):
            logger.warning("Mismatch between embeddings count and products count")
        
        # Check for NaN values
        if np.isnan(embeddings).any():
            logger.error("Found NaN values in embeddings")
            return False
        
        # Check embedding dimensions (MobileNetV2 outputs 1280)
        if embeddings.shape[1] not in (1280, 1024, 2048):
            logger.error(f"Unexpected embedding dimension: {embeddings.shape[1]}")
            return False
        
        logger.info("✅ Embeddings verification passed!")
        return True
        
    except Exception as e:
        logger.error(f"Error verifying embeddings: {e}")
        return False

if __name__ == "__main__":
    try:
        logger.info("🚀 Starting embedding generation...")
        
        # Build embeddings
        embeddings, products = build_embeddings()
        
        # Verify embeddings
        if verify_embeddings():
            logger.info("🎉 All done! Embeddings are ready to use.")
        else:
            logger.error("❌ Embedding verification failed")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("Process interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)
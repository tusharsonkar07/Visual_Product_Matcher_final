import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any
import pandas as pd
import logging

logger = logging.getLogger(__name__)

class SimilaritySearcher:
    """Search for similar products using cosine similarity"""
    
    def __init__(self, embeddings: np.ndarray, products_df: pd.DataFrame):
        """
        Initialize similarity searcher
        
        Args:
            embeddings: Precomputed product embeddings (n_products, embedding_dim)
            products_df: DataFrame with product metadata
        """
        self.embeddings = embeddings
        self.products_df = products_df
        
        # Ensure embeddings are L2 normalized
        self.embeddings = self.embeddings / np.linalg.norm(
            self.embeddings, axis=1, keepdims=True
        )
        
        logger.info(f"Initialized similarity searcher with {len(embeddings)} products")
    
    def search(self, query_embedding: np.ndarray, top_k: int = 11, threshold: float = 0.0) -> List[Dict[str, Any]]:
        """
        Search for similar products
        
        Args:
            query_embedding: Query image embedding
            top_k: Number of top results to return
            threshold: Minimum similarity threshold
            
        Returns:
            List of similar products with similarity scores
        """
        try:
            # Ensure query embedding is normalized
            query_embedding = query_embedding / np.linalg.norm(query_embedding)
            
            # Compute cosine similarity with all products
            similarities = cosine_similarity(
                query_embedding.reshape(1, -1), 
                self.embeddings
            ).flatten()
            
            # Get indices sorted by similarity (descending)
            sorted_indices = np.argsort(similarities)[::-1]
            
            # Filter by threshold and get top_k
            results = []
            for idx in sorted_indices:
                similarity_score = float(similarities[idx])
                
                if similarity_score < threshold:
                    continue
                
                if len(results) >= top_k:
                    break
                
                # Get product info
                product = self.products_df.iloc[idx].to_dict()
                product['similarity'] = round(similarity_score, 4)
                product['similarity_percentage'] = round(similarity_score * 100, 2)
                
                results.append(product)
            
            logger.info(f"Found {len(results)} similar products with threshold {threshold}")
            return results
            
        except Exception as e:
            logger.error(f"Error in similarity search: {e}")
            raise
    
    def search_by_category(self, query_embedding: np.ndarray, category: str, top_k: int = 11) -> List[Dict[str, Any]]:
        """Search for similar products within a specific category"""
        try:
            # Filter products by category
            category_mask = self.products_df['category'].str.lower() == category.lower()
            category_indices = self.products_df[category_mask].index.tolist()
            
            if not category_indices:
                return []
            
            # Get embeddings for category products
            category_embeddings = self.embeddings[category_indices]
            
            # Ensure query embedding is normalized
            query_embedding = query_embedding / np.linalg.norm(query_embedding)
            
            # Compute similarities
            similarities = cosine_similarity(
                query_embedding.reshape(1, -1), 
                category_embeddings
            ).flatten()
            
            # Get top results
            sorted_local_indices = np.argsort(similarities)[::-1][:top_k]
            
            results = []
            for local_idx in sorted_local_indices:
                global_idx = category_indices[local_idx]
                similarity_score = float(similarities[local_idx])
                
                product = self.products_df.iloc[global_idx].to_dict()
                product['similarity'] = round(similarity_score, 4)
                product['similarity_percentage'] = round(similarity_score * 100, 2)
                
                results.append(product)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in category search: {e}")
            raise
    
    def get_product_recommendations(self, product_id: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Get recommendations for a specific product"""
        try:
            # Find product index
            product_idx = self.products_df[self.products_df['id'] == product_id].index
            
            if len(product_idx) == 0:
                return []
            
            product_idx = product_idx[0]
            product_embedding = self.embeddings[product_idx]
            
            # Compute similarities
            similarities = cosine_similarity(
                product_embedding.reshape(1, -1), 
                self.embeddings
            ).flatten()
            
            # Exclude the product itself
            similarities[product_idx] = -1
            
            # Get top recommendations
            sorted_indices = np.argsort(similarities)[::-1][:top_k]
            
            results = []
            for idx in sorted_indices:
                if similarities[idx] == -1:  # Skip the original product
                    continue
                    
                similarity_score = float(similarities[idx])
                product = self.products_df.iloc[idx].to_dict()
                product['similarity'] = round(similarity_score, 4)
                product['similarity_percentage'] = round(similarity_score * 100, 2)
                
                results.append(product)
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting recommendations: {e}")
            raise
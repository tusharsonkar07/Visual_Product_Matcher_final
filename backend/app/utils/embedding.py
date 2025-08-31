import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing import image
import numpy as np
from PIL import Image
import logging

logger = logging.getLogger(__name__)

class EmbeddingExtractor:
    """Extract feature embeddings using a lightweight CNN (MobileNetV2)."""
    
    def __init__(self):
        """Initialize ResNet50 model for feature extraction"""
        try:
            # Load MobileNetV2 (much smaller memory footprint than ResNet50)
            self.model = MobileNetV2(
                weights='imagenet',
                include_top=False,
                pooling='avg',
                input_shape=(224, 224, 3)
            )

            # Make model non-trainable
            self.model.trainable = False

            logger.info("MobileNetV2 model loaded successfully")

        except Exception as e:
            logger.error(f"Error loading ResNet50 model: {e}")
            raise
    
    def preprocess_image(self, img: Image.Image) -> np.ndarray:
        """Preprocess image for ResNet50"""
        try:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to 224x224
            img = img.resize((224, 224), Image.Resampling.LANCZOS)
            
            # Convert to array
            img_array = image.img_to_array(img)
            
            # Add batch dimension
            img_array = np.expand_dims(img_array, axis=0)
            
            # Preprocess for ResNet50
            img_array = preprocess_input(img_array)
            
            return img_array
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            raise
    
    def extract_embedding(self, img: Image.Image) -> np.ndarray:
        """Extract feature embedding from image"""
        try:
            # Preprocess image
            processed_img = self.preprocess_image(img)
            
            # Extract features
            features = self.model.predict(processed_img, verbose=0)
            
            # Normalize features (L2 normalization)
            normalized_features = features / np.linalg.norm(features, axis=1, keepdims=True)
            
            return normalized_features.flatten()
            
        except Exception as e:
            logger.error(f"Error extracting embedding: {e}")
            raise
    
    def extract_batch_embeddings(self, images: list) -> np.ndarray:
        """Extract embeddings for a batch of images"""
        try:
            processed_images = []
            
            for img in images:
                processed_img = self.preprocess_image(img)
                processed_images.append(processed_img[0])  # Remove batch dimension
            
            # Stack into batch
            batch = np.array(processed_images)
            
            # Extract features for entire batch
            features = self.model.predict(batch, verbose=0)
            
            # Normalize features
            normalized_features = features / np.linalg.norm(features, axis=1, keepdims=True)
            
            return normalized_features
            
        except Exception as e:
            logger.error(f"Error extracting batch embeddings: {e}")
            raise
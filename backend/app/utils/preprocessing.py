from PIL import Image, ImageOps, ImageEnhance
import numpy as np
import io
import logging

logger = logging.getLogger(__name__)

class ImagePreprocessor:
    """Image preprocessing utilities"""
    
    @staticmethod
    def validate_image(image_bytes: bytes) -> bool:
        """Validate if the uploaded file is a valid image"""
        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify()
            return True
        except Exception:
            return False
    
    @staticmethod
    def load_and_preprocess(image_bytes: bytes, target_size: tuple = (224, 224)) -> Image.Image:
        """Load and preprocess image from bytes"""
        try:
            # Open image
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Auto-orient image
            img = ImageOps.exif_transpose(img)
            
            # Resize while maintaining aspect ratio
            img = ImagePreprocessor.smart_resize(img, target_size)
            
            return img
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            raise
    
    @staticmethod
    def smart_resize(img: Image.Image, target_size: tuple) -> Image.Image:
        """Resize image while maintaining aspect ratio and padding if needed"""
        try:
            # Get original dimensions
            original_width, original_height = img.size
            target_width, target_height = target_size
            
            # Calculate scaling factor
            scale = min(target_width / original_width, target_height / original_height)
            
            # Calculate new dimensions
            new_width = int(original_width * scale)
            new_height = int(original_height * scale)
            
            # Resize image
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Create new image with target size and paste resized image in center
            new_img = Image.new('RGB', target_size, (255, 255, 255))
            
            # Calculate paste position (center)
            paste_x = (target_width - new_width) // 2
            paste_y = (target_height - new_height) // 2
            
            new_img.paste(img, (paste_x, paste_y))
            
            return new_img
            
        except Exception as e:
            logger.error(f"Error in smart resize: {e}")
            raise
    
    @staticmethod
    def enhance_image(img: Image.Image, enhance_factor: float = 1.2) -> Image.Image:
        """Enhance image quality (sharpness, contrast)"""
        try:
            # Enhance sharpness
            enhancer = ImageEnhance.Sharpness(img)
            img = enhancer.enhance(enhance_factor)
            
            # Enhance contrast slightly
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.1)
            
            return img
            
        except Exception as e:
            logger.error(f"Error enhancing image: {e}")
            return img  # Return original if enhancement fails
    
    @staticmethod
    def normalize_image_array(img_array: np.ndarray) -> np.ndarray:
        """Normalize image array to [0, 1]"""
        return img_array.astype(np.float32) / 255.0
    
    @staticmethod
    def center_crop(img: Image.Image, crop_size: tuple) -> Image.Image:
        """Center crop image to specified size"""
        try:
            width, height = img.size
            crop_width, crop_height = crop_size
            
            left = (width - crop_width) // 2
            top = (height - crop_height) // 2
            right = left + crop_width
            bottom = top + crop_height
            
            return img.crop((left, top, right, bottom))
            
        except Exception as e:
            logger.error(f"Error in center crop: {e}")
            raise
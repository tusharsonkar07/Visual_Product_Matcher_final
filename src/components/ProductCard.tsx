import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Eye, ShoppingCart } from 'lucide-react';
import { Product } from '@/data/mockProducts';
import { getImageUrl } from '@/lib/api';

interface ProductCardProps {
  product: Product;
  showSimilarity?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, showSimilarity = false }) => {
  const similarityPercentage = product.similarity ? Math.round(product.similarity * 100) : 0;
  
  const getSimilarityColor = (score: number) => {
    if (score >= 90) return 'bg-success text-success-foreground';
    if (score >= 75) return 'bg-warning text-warning-foreground';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Card className="group overflow-hidden transition-all duration-150 hover:shadow-lg hover:scale-102 border-0 shadow-lg">
      <div className="relative overflow-hidden">
        <img
          src={getImageUrl(product.image_path)}
          alt={product.name}
          className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105"
          onLoad={(e) => e.currentTarget.classList.add('loaded')}
          loading="lazy"
        />
        
        {showSimilarity && product.similarity && (
          <Badge 
            className={`absolute top-3 right-3 font-bold ${getSimilarityColor(similarityPercentage)}`}
          >
            {similarityPercentage}% match
          </Badge>
        )}
        
        <Badge 
          variant="secondary" 
          className="absolute top-3 left-3 bg-white/90 text-foreground"
        >
          {product.category}
        </Badge>
        
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
          <Button
            variant="secondary"
            size="icon"
            className="bg-white/90 hover:bg-white transition-transform transform scale-0 group-hover:scale-100 duration-150"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-sm line-clamp-2 flex-1 pr-2">
              {product.name}
            </h3>
            <Badge variant="outline" className="text-xs shrink-0">
              {product.brand}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary">
                ${product.price}
              </span>
              <span className="text-xs text-muted-foreground">
                {product.currency}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${product.available ? 'bg-success' : 'bg-destructive'}`} />
              <span className="text-xs text-muted-foreground">
                {product.available ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all hover:scale-105"
          disabled={!product.available}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {product.available ? 'Add to Cart' : 'Notify Me'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
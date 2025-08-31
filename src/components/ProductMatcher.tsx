import React, { useState, useMemo, useEffect } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ImageUploader from './ImageUploader';
import ProductCard from './ProductCard';
import FilterPanel from './FilterPanel';
import { Product, searchProducts, getCategories, getImageUrl } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const ProductMatcher: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<File | string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [error, setError] = useState<string | null>(null);

  const ProductCardSkeleton: React.FC = () => (
    <Card className="group overflow-hidden border-0 shadow-lg">
      <div className="relative overflow-hidden">
        <Skeleton className="w-full h-48" />
      </div>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.categories);
      } catch (error) {
        console.error('Failed to load categories:', error);
        // Use default categories if API fails
        setCategories(['All', 'Electronics', 'Shoes', 'Bags', 'Clothing', 'Home', 'Accessories']);
      }
    };
    
    loadCategories();
  }, []);

  // Filter results based on similarity threshold and categories
  const filteredResults = useMemo(() => {
    return searchResults.filter(product => {
      const similarity = product.similarity_percentage || product.similarity || 0;
      const meetsThreshold = similarity >= similarityThreshold;
      
      const meetsCategory = selectedCategories.length === 0 || 
        selectedCategories.includes('All') || 
        selectedCategories.includes(product.category);
      
      return meetsThreshold && meetsCategory;
    });
  }, [searchResults, similarityThreshold, selectedCategories]);

  const handleImageUpload = (image: File | string) => {
    setError(null);
    
    if (typeof image === 'string') {
      setUploadedImage(image);
      setImageUrl(image);
      setUploadedFile(null);
    } else {
      const imageObjectUrl = URL.createObjectURL(image);
      setUploadedImage(imageObjectUrl);
      setUploadedFile(image);
      setImageUrl(null);
    }
    setHasSearched(false);
  };

  const handleSearch = async () => {
    if (!uploadedImage) {
      toast({
        title: "No image selected",
        description: "Please upload an image to search for similar products",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      toast({
        title: "Searching...",
        description: "Finding visually similar products using AI",
      });

      // Call real API
      const response = await searchProducts(
        uploadedFile || undefined,
        imageUrl || undefined,
        11, // top_k
        0.0 // minimum threshold for initial search
      );
      
      setSearchResults(response.results);
      setHasSearched(true);

      // Count products that actually display after current filters
      const filteredCount = response.results.filter((product) => {
        const similarity = product.similarity_percentage || product.similarity || 0;
        const meetsThreshold = similarity >= similarityThreshold;
        const meetsCategory = selectedCategories.length === 0 ||
          selectedCategories.includes('All') ||
          selectedCategories.includes(product.category);
        return meetsThreshold && meetsCategory;
      }).length;

      toast({
        title: "Search completed!",
        description: `Found ${filteredCount} products`,
        variant: "default"
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "Search failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    if (category === 'All') {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(prev => 
        prev.includes(category)
          ? prev.filter(c => c !== category)
          : [...prev.filter(c => c !== 'All'), category]
      );
    }
  };

  const handleClearFilters = () => {
    setSimilarityThreshold(0);
    setSelectedCategories([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            Visual Product Matcher
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload an image and find visually similar products using AI-powered MobileNetV2 image recognition
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <ImageUploader 
            onImageUpload={handleImageUpload}
            isLoading={isLoading}
          />
          
          {uploadedImage && (
            <div className="mt-6 text-center">
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-8 py-3 text-lg bg-gradient-to-r from-primary to-primary-glow hover:shadow-xl transition-all hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Find Similar Products
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Loading skeletons while searching */}
        {isLoading && (
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card className="p-4">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            </div>
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {hasSearched && !isLoading && (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Error Display */}
            {error && (
              <div className="lg:col-span-4 mb-6">
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="flex items-center gap-2 pt-6">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <FilterPanel
                  similarityThreshold={similarityThreshold}
                  onSimilarityChange={setSimilarityThreshold}
                  categories={categories}
                  selectedCategories={selectedCategories}
                  onCategoryToggle={handleCategoryToggle}
                  onClearFilters={handleClearFilters}
                  isCollapsed={filtersCollapsed}
                  onToggleCollapse={() => setFiltersCollapsed(!filtersCollapsed)}
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="lg:col-span-3">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Search Results
                </h2>
                <div className="text-muted-foreground">
                  {filteredResults.length} products
                </div>
              </div>

              {filteredResults.length === 0 ? (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {searchResults.length === 0 
                      ? "No similar products found. Try with a different image."
                      : "No products match your current filters. Try adjusting the similarity threshold or category selection."
                    }
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredResults.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={{
                        ...product,
                        image_path: getImageUrl(product.image_path)
                      }}
                      showSimilarity={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && !uploadedImage && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Ready to find similar products?</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Upload an image of any product and our AI will find visually similar items using advanced computer vision
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductMatcher;
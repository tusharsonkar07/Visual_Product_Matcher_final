import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { X, Filter } from 'lucide-react';
interface FilterPanelProps {
  similarityThreshold: number;
  onSimilarityChange: (value: number) => void;
  categories: string[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  onClearFilters: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  similarityThreshold,
  categories,
  onSimilarityChange,
  selectedCategories,
  onCategoryToggle,
  onClearFilters,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const hasActiveFilters = similarityThreshold < 100 || selectedCategories.length > 0;

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="md:hidden"
              >
                {isCollapsed ? 'Show' : 'Hide'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`space-y-6 ${isCollapsed ? 'hidden md:block' : ''}`}>
        {/* Similarity Threshold */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Similarity Threshold</label>
            <Badge variant="outline" className="text-xs">
              {Math.round(similarityThreshold)}%
            </Badge>
          </div>
          <Slider
            value={[similarityThreshold]}
            onValueChange={([value]) => onSimilarityChange(value)}
            max={100}
            min={50}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>50% (More results)</span>
            <span>100% (Exact matches)</span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Categories</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category) || category === 'All';
              const isAllSelected = selectedCategories.length === 0 || selectedCategories.includes('All');
              
              return (
                <Badge
                  key={category}
                  variant={
                    (category === 'All' && isAllSelected) || 
                    (category !== 'All' && isSelected)
                      ? "default" 
                      : "outline"
                  }
                  className={`
                    cursor-pointer transition-all hover:scale-105 select-none
                    ${(category === 'All' && isAllSelected) || 
                      (category !== 'All' && isSelected)
                        ? 'bg-gradient-to-r from-primary to-primary-glow shadow-md' 
                        : 'hover:bg-primary/10'
                    }
                  `}
                  onClick={() => onCategoryToggle(category)}
                >
                  {category}
                  {((category === 'All' && isAllSelected) || 
                    (category !== 'All' && isSelected)) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              );
            })}
          </div>
          
          {selectedCategories.length > 1 && (
            <div className="text-xs text-muted-foreground">
              {selectedCategories.length} categories selected
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground space-y-1">
              {similarityThreshold < 100 && (
                <div>• Similarity: {Math.round(similarityThreshold)}%+</div>
              )}
              {selectedCategories.length > 0 && !selectedCategories.includes('All') && (
                <div>• Categories: {selectedCategories.join(', ')}</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FilterPanel;
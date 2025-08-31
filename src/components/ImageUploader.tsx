import React, { useState, useCallback, useRef } from 'react';
import { Upload, Image, X, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onImageUpload: (image: File | string) => void;
  isLoading?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large", 
        description: "Please upload an image smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onImageUpload(file);
  }, [onImageUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    
    try {
      new URL(urlInput); // Validate URL
      setPreviewUrl(urlInput);
      onImageUpload(urlInput);
      setShowUrlInput(false);
      setUrlInput('');
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive"
      });
    }
  };

  const clearPreview = () => {
    setPreviewUrl('');
    setUrlInput('');
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {previewUrl ? (
        <div className="relative bg-card rounded-xl border-2 border-border overflow-hidden shadow-lg">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-96 md:h-[28rem] object-contain bg-muted"
          />
          <Button
            onClick={clearPreview}
            variant="destructive"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
            ${dragActive 
              ? 'border-primary bg-primary/5 scale-105' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
            }
            ${isLoading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
            min-h-[320px] md:min-h-[380px] flex items-center justify-center
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Upload an image</h3>
              <p className="text-muted-foreground mb-4">
                Drag & drop your image here, or click to browse
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                <span>Supports: JPG/JPEG, PNG, WebP</span>
                <span>•</span>
                <span>Max size: 10MB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex-1 transition-transform hover:scale-105 bg-primary/10 text-primary hover:text-primary border border-primary/30 hover:bg-primary/10"
          disabled={isLoading}
        >
          <Link2 className="h-4 w-4 mr-2" />
          Use Image URL
        </Button>
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all hover:scale-105"
          disabled={isLoading}
        >
          <Image className="h-4 w-4 mr-2" />
          Browse Files
        </Button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
            className="flex-1"
          />
          <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
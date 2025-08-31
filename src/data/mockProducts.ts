import phoneImg from "@/assets/product-phone.jpg";
import bagImg from "@/assets/product-bag.jpg";
import shoesImg from "@/assets/product-shoes.jpg";
import headphonesImg from "@/assets/product-headphones.jpg";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  image_path: string;
  description: string;
  brand: string;
  available: boolean;
  similarity?: number;
}

export const categories = [
  "All",
  "Electronics",
  "Shoes", 
  "Bags",
  "Clothing",
  "Home",
  "Accessories"
];

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro",
    category: "Electronics",
    price: 999,
    currency: "USD",
    image_path: phoneImg,
    description: "Latest flagship smartphone with titanium design",
    brand: "Apple",
    available: true
  },
  {
    id: "2", 
    name: "Premium Leather Handbag",
    category: "Bags",
    price: 299,
    currency: "USD",
    image_path: bagImg,
    description: "Luxury leather handbag with elegant design",
    brand: "Designer Brand",
    available: true
  },
  {
    id: "3",
    name: "Athletic Running Shoes",
    category: "Shoes", 
    price: 129,
    currency: "USD",
    image_path: shoesImg,
    description: "Premium running sneakers for athletic performance",
    brand: "SportBrand",
    available: true
  },
  {
    id: "4",
    name: "Wireless Headphones",
    category: "Electronics",
    price: 199,
    currency: "USD", 
    image_path: headphonesImg,
    description: "High-quality wireless headphones with noise cancellation",
    brand: "AudioTech",
    available: true
  },
  // Additional mock products for demonstration
  {
    id: "5",
    name: "Samsung Galaxy S24",
    category: "Electronics",
    price: 899,
    currency: "USD",
    image_path: phoneImg,
    description: "Android flagship with AI features",
    brand: "Samsung",
    available: true
  },
  {
    id: "6",
    name: "Classic Crossbody Bag",
    category: "Bags",
    price: 179,
    currency: "USD", 
    image_path: bagImg,
    description: "Versatile crossbody bag for everyday use",
    brand: "Fashion Co",
    available: true
  },
  {
    id: "7",
    name: "Trail Running Shoes",
    category: "Shoes",
    price: 149,
    currency: "USD",
    image_path: shoesImg,
    description: "Durable shoes designed for trail running",
    brand: "OutdoorGear",
    available: true
  },
  {
    id: "8",
    name: "Gaming Headset",
    category: "Electronics",
    price: 89,
    currency: "USD",
    image_path: headphonesImg,
    description: "Professional gaming headset with RGB lighting",
    brand: "GameTech",
    available: true
  }
];

// Simulate similarity scores for search results
export const generateMockSearchResults = (uploadedImage?: string): Product[] => {
  return mockProducts.map(product => ({
    ...product,
    similarity: Math.random() * 0.4 + 0.6 // Random similarity between 0.6-1.0
  })).sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
};
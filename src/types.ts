export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating?: number;
  reviewCount?: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  timestamp: Date;
  restaurantId?: string;
  menuItemId?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  priceLevel: number; // 1: $, 2: $$, 3: $$$
  deliveryTime: string;
  deliveryFee: number;
  image: string;
  categories: string[];
  menu: MenuItem[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

export type UserRole = 'customer' | 'restaurant' | 'courier';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  loyaltyPoints?: number;
}

export interface Message {
  id: string;
  sender: 'user' | 'restaurant' | 'courier';
  text: string;
  timestamp: Date;
}

export const RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Burger Haven',
    rating: 4.8,
    reviewCount: 128,
    priceLevel: 1,
    deliveryTime: '20-30 min',
    deliveryFee: 2.99,
    image: 'https://picsum.photos/seed/burger/800/600',
    categories: ['Burgers', 'American', 'Fast Food'],
    menu: [
      { id: 'm1', name: 'Classic Cheeseburger', description: 'Juicy beef patty with cheddar, lettuce, and tomato.', price: 12.99, image: 'https://picsum.photos/seed/cheeseburger/400/300', category: 'Burgers' },
      { id: 'm2', name: 'Bacon BBQ Burger', description: 'Smoky bacon, BBQ sauce, and crispy onions.', price: 14.99, image: 'https://picsum.photos/seed/bbqburger/400/300', category: 'Burgers' },
      { id: 'm3', name: 'Truffle Fries', description: 'Crispy fries tossed in truffle oil and parmesan.', price: 6.99, image: 'https://picsum.photos/seed/fries/400/300', category: 'Sides' },
    ]
  },
  {
    id: '2',
    name: 'Sushi Zen',
    rating: 4.9,
    reviewCount: 256,
    priceLevel: 3,
    deliveryTime: '30-45 min',
    deliveryFee: 3.50,
    image: 'https://picsum.photos/seed/sushi/800/600',
    categories: ['Sushi', 'Japanese', 'Healthy'],
    menu: [
      { id: 'm4', name: 'Dragon Roll', description: 'Eel, cucumber, topped with avocado and eel sauce.', price: 16.99, image: 'https://picsum.photos/seed/dragonroll/400/300', category: 'Rolls' },
      { id: 'm5', name: 'Salmon Sashimi', description: 'Fresh slices of premium Atlantic salmon.', price: 18.99, image: 'https://picsum.photos/seed/sashimi/400/300', category: 'Sashimi' },
      { id: 'm6', name: 'Miso Soup', description: 'Traditional Japanese soup with tofu and seaweed.', price: 4.50, image: 'https://picsum.photos/seed/miso/400/300', category: 'Sides' },
    ]
  },
  {
    id: '3',
    name: 'Pasta Primavera',
    rating: 4.7,
    reviewCount: 184,
    priceLevel: 2,
    deliveryTime: '25-40 min',
    deliveryFee: 1.99,
    image: 'https://picsum.photos/seed/pasta/800/600',
    categories: ['Italian', 'Pasta', 'Vegetarian'],
    menu: [
      { id: 'm7', name: 'Fettuccine Alfredo', description: 'Rich creamy parmesan sauce over fresh pasta.', price: 15.99, image: 'https://picsum.photos/seed/alfredo/400/300', category: 'Pasta' },
      { id: 'm8', name: 'Margherita Pizza', description: 'Fresh mozzarella, basil, and tomato sauce.', price: 13.99, image: 'https://picsum.photos/seed/pizza/400/300', category: 'Pizza' },
      { id: 'm9', name: 'Tiramisu', description: 'Classic Italian coffee-flavored dessert.', price: 8.50, image: 'https://picsum.photos/seed/tiramisu/400/300', category: 'Dessert' },
    ]
  },
  {
    id: '4',
    name: 'Taco Loco',
    rating: 4.6,
    reviewCount: 92,
    priceLevel: 1,
    deliveryTime: '15-25 min',
    deliveryFee: 0.99,
    image: 'https://picsum.photos/seed/tacos/800/600',
    categories: ['Mexican', 'Tacos', 'Street Food'],
    menu: [
      { id: 'm10', name: 'Al Pastor Tacos', description: 'Marinated pork with pineapple and cilantro.', price: 11.50, image: 'https://picsum.photos/seed/alpastor/400/300', category: 'Tacos' },
      { id: 'm11', name: 'Guacamole & Chips', description: 'Freshly made guacamole with corn chips.', price: 7.99, image: 'https://picsum.photos/seed/guac/400/300', category: 'Sides' },
      { id: 'm12', name: 'Churros', description: 'Fried dough pastry with cinnamon sugar.', price: 5.50, image: 'https://picsum.photos/seed/churros/400/300', category: 'Dessert' },
    ]
  }
];

export const CATEGORIES = ['All', 'Burgers', 'Sushi', 'Italian', 'Mexican', 'Healthy', 'Fast Food', 'Vegetarian'];

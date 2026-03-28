import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { 
  Search, 
  ShoppingBag, 
  Star, 
  Clock, 
  ChevronRight, 
  X, 
  Plus, 
  Minus, 
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Bike,
  Navigation,
  Phone,
  MessageSquare,
  MessageCircle,
  Send,
  User,
  Store,
  Truck,
  Mail,
  Smartphone,
  Key,
  LogOut,
  DollarSign,
  List,
  CheckCircle,
  CreditCard,
  Wallet,
  Banknote
} from 'lucide-react';
import { RESTAURANTS, CATEGORIES, Restaurant, MenuItem, CartItem, Message, User as UserType, UserRole, PastOrder } from './types';

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriceLevel, setSelectedPriceLevel] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'confirmed' | 'delivered'>('idle');
  const [trackingProgress, setTrackingProgress] = useState(0);
  const [trackingPhase, setTrackingPhase] = useState<'preparing' | 'pickup' | 'delivering' | 'arrived'>('preparing');
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const socketRef = useRef<Socket | null>(null);

  // Auth State
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    const savedUser = localStorage.getItem('quickbite_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Socket Connection
  useEffect(() => {
    // Connect to the same host as the app
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to chat server');
      // Join a default room for the active delivery demo
      socket.emit('join-room', 'order-123');
    });

    socket.on('receive-message', (message: Message) => {
      // Convert string timestamp back to Date object
      const msgWithDate = {
        ...message,
        timestamp: new Date(message.timestamp)
      };
      setMessages(prev => [...prev, msgWithDate]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const [loginStep, setLoginStep] = useState<'role' | 'input' | 'otp'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authInput, setAuthInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isEmail, setIsEmail] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'paypal' | 'bkash' | 'nagad'>('cod');
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

  // Courier State
  const [isOnline, setIsOnline] = useState(true);

  // Order History State
  const [pastOrders, setPastOrders] = useState<PastOrder[]>(() => {
    const savedOrders = localStorage.getItem('quickbite_past_orders');
    if (savedOrders) {
      try {
        const parsed = JSON.parse(savedOrders);
        return parsed.map((o: any) => ({ ...o, date: new Date(o.date) }));
      } catch (e) {
        console.error('Failed to parse past orders', e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('quickbite_past_orders', JSON.stringify(pastOrders));
  }, [pastOrders]);

  // Review State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [lastOrderItems, setLastOrderItems] = useState<CartItem[]>([]);
  const [lastRestaurant, setLastRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<any[]>([
    {
      id: 'r1',
      userId: 'u1',
      userName: 'Sarah M.',
      rating: 5,
      comment: 'Absolutely delicious! The food arrived hot and the flavors were incredible.',
      timestamp: new Date(Date.now() - 86400000),
      restaurantId: '1'
    },
    {
      id: 'r2',
      userId: 'u2',
      userName: 'James L.',
      rating: 4,
      comment: 'Great burger, but the fries could have been crispier. Overall a good experience.',
      timestamp: new Date(Date.now() - 172800000),
      restaurantId: '1'
    }
  ]);
  
  // Local Review Modal State
  const [tempRestaurantRating, setTempRestaurantRating] = useState(5);
  const [tempRestaurantComment, setTempRestaurantComment] = useState('');
  const [tempItemRatings, setTempItemRatings] = useState<{ [key: string]: number }>({});

  const filteredRestaurants = useMemo(() => {
    return RESTAURANTS.filter(r => {
      const matchesCategory = selectedCategory === 'All' || r.categories.includes(selectedCategory);
      
      const searchLower = searchQuery.toLowerCase();
      const matchesRestaurantName = r.name.toLowerCase().includes(searchLower);
      const matchesDishName = r.menu.some(item => item.name.toLowerCase().includes(searchLower));
      const matchesSearch = searchQuery === '' || matchesRestaurantName || matchesDishName;

      const matchesPrice = selectedPriceLevel === null || r.priceLevel === selectedPriceLevel;
      const matchesRating = r.rating >= minRating;

      return matchesCategory && matchesSearch && matchesPrice && matchesRating;
    });
  }, [selectedCategory, searchQuery, selectedPriceLevel, minRating]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (orderStatus === 'confirmed') {
      setTrackingProgress(0);
      setTrackingPhase('preparing');
      setMessages([
        { id: '1', sender: 'restaurant', text: "Hello! We've received your order and we're starting to prepare it now.", timestamp: new Date() }
      ]);
      
      let progress = 0;
      interval = setInterval(() => {
        progress += 1;
        setTrackingProgress(progress);

        if (progress < 30) setTrackingPhase('preparing');
        else if (progress < 40) {
          if (trackingPhase !== 'pickup') {
            setTrackingPhase('pickup');
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'courier', text: "Hi! I'm Alex, your courier. I've arrived at the restaurant to pick up your order.", timestamp: new Date() }]);
          }
        }
        else if (progress < 95) setTrackingPhase('delivering');
        else if (progress >= 100) {
          setTrackingPhase('arrived');
          clearInterval(interval);
          setTimeout(() => setOrderStatus('delivered'), 2000);
        }
      }, 200); // Fast simulation for demo
    }
    return () => clearInterval(interval);
  }, [orderStatus]);

  const sendMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    
    const senderRole = currentUser?.role === 'courier' ? 'courier' : 'user';
    
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: senderRole,
      text: chatInput,
      timestamp: new Date()
    };

    // Update local state
    setMessages(prev => [...prev, newMessage]);
    setChatInput('');

    // Emit to socket
    socketRef.current.emit('send-message', {
      room: 'order-123',
      message: newMessage
    });
  };

  const addToCart = (item: MenuItem, restaurant: Restaurant) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, restaurantId: restaurant.id, restaurantName: restaurant.name }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const POINTS_VALUE = 0.1; // Each point is worth $0.10
  const pointsDiscount = useLoyaltyPoints ? (currentUser?.loyaltyPoints || 0) * POINTS_VALUE : 0;
  const finalTotal = Math.max(0, cartTotal + (selectedRestaurant?.deliveryFee || 0) - pointsDiscount);

  const handleCheckout = () => {
    setOrderStatus('processing');
    
    // Simulate payment processing time
    const processingTime = paymentMethod === 'cod' ? 1500 : 3000;
    
    setTimeout(() => {
      // Award points: 1 point per $1 spent (on final total)
      const pointsEarned = Math.floor(finalTotal);
      
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          loyaltyPoints: (currentUser.loyaltyPoints || 0) - (useLoyaltyPoints ? currentUser.loyaltyPoints || 0 : 0) + pointsEarned
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('quickbite_user', JSON.stringify(updatedUser));
      }

      setOrderStatus('confirmed');
      const newOrder: PastOrder = {
        id: Math.random().toString(36).substr(2, 9),
        restaurantName: selectedRestaurant?.name || 'Unknown Restaurant',
        items: [...cart],
        date: new Date(),
        total: finalTotal
      };
      setPastOrders(prev => [newOrder, ...prev]);
      setLastOrderItems([...cart]);
      setLastRestaurant(selectedRestaurant);
      setCart([]);
      setUseLoyaltyPoints(false);
      setTimeout(() => setOrderStatus('delivered'), 15000); // Longer delivery for demo
    }, processingTime);
  };

  const submitReview = (restaurantRating: number, restaurantComment: string, itemRatings: { [key: string]: number }) => {
    const newReviews = [
      {
        id: Math.random().toString(36).substr(2, 9),
        userId: currentUser?.id,
        userName: currentUser?.name,
        rating: restaurantRating,
        comment: restaurantComment,
        timestamp: new Date(),
        restaurantId: lastRestaurant?.id
      },
      ...Object.entries(itemRatings).map(([itemId, rating]) => ({
        id: Math.random().toString(36).substr(2, 9),
        userId: currentUser?.id,
        userName: currentUser?.name,
        rating,
        comment: '',
        timestamp: new Date(),
        menuItemId: itemId
      }))
    ];

    setReviews(prev => [...newReviews, ...prev]);
    setShowReviewModal(false);
    setOrderStatus('idle');
    setMessages([]);
    // Reset temp states
    setTempRestaurantRating(5);
    setTempRestaurantComment('');
    setTempItemRatings({});
  };

  const handleLogin = () => {
    if (loginStep === 'role') {
      setLoginStep('input');
    } else if (loginStep === 'input') {
      if (!authInput.trim()) return;
      setLoginStep('otp');
    } else if (loginStep === 'otp') {
      if (otpInput.length !== 4) return;
      // Simulate successful login
      const user: UserType = {
        id: Math.random().toString(36).substr(2, 9),
        name: authInput.split('@')[0] || 'User',
        email: isEmail ? authInput : undefined,
        phone: !isEmail ? authInput : undefined,
        role: selectedRole,
        loyaltyPoints: 0
      };
      setCurrentUser(user);
      localStorage.setItem('quickbite_user', JSON.stringify(user));
      setLoginStep('role');
      setAuthInput('');
      setOtpInput('');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('quickbite_user');
    setSelectedRestaurant(null);
    setCart([]);
    setOrderStatus('idle');
    setUseLoyaltyPoints(false);
    setIsDashboardOpen(false);
    setIsEditingProfile(false);
  };

  const handleStartEdit = () => {
    setEditName(currentUser?.name || '');
    setEditEmail(currentUser?.email || '');
    setEditPhone(currentUser?.phone || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      name: editName,
      email: editEmail,
      phone: editPhone
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('quickbite_user', JSON.stringify(updatedUser));
    setIsEditingProfile(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          <div className="p-8 md:p-12">
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-orange-200">
                <ShoppingBag size={32} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">QuickBite</h1>
              <p className="text-gray-400 text-sm mt-1">
                {authMode === 'login' ? 'Welcome back!' : 'Create your account'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {loginStep === 'role' && (
                <motion.div 
                  key="role"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <p className="text-center font-bold text-gray-700 mb-6">Choose your role</p>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'customer', label: 'Customer', icon: User, color: 'bg-blue-50 text-blue-600' },
                      { id: 'restaurant', label: 'Restaurant', icon: Store, color: 'bg-orange-50 text-orange-600' },
                      { id: 'courier', label: 'Delivery Partner', icon: Truck, color: 'bg-green-50 text-green-600' }
                    ].map(role => (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(role.id as UserRole)}
                        className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all ${
                          selectedRole === role.id 
                          ? 'border-orange-500 bg-orange-50/30' 
                          : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role.color}`}>
                          <role.icon size={24} />
                        </div>
                        <span className="font-bold text-lg">{role.label}</span>
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setLoginStep('input')}
                    className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg mt-8 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
                  >
                    Continue
                  </button>
                </motion.div>
              )}

              {loginStep === 'input' && (
                <motion.div 
                  key="input"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex bg-gray-100 p-1 rounded-2xl">
                    <button 
                      onClick={() => { setIsEmail(true); setAuthInput(''); }}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${isEmail ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                    >
                      Email
                    </button>
                    <button 
                      onClick={() => { setIsEmail(false); setAuthInput(''); }}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${!isEmail ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                    >
                      Phone
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                      {isEmail ? 'Email Address' : 'Phone Number'}
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {isEmail ? <Mail size={20} /> : <Smartphone size={20} />}
                      </div>
                      <input 
                        type={isEmail ? 'email' : 'tel'}
                        placeholder={isEmail ? 'name@example.com' : '+1 (555) 000-0000'}
                        className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                        value={authInput}
                        onChange={(e) => setAuthInput(e.target.value)}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleLogin}
                    className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
                  >
                    Send OTP
                  </button>

                  <button 
                    onClick={() => setLoginStep('role')}
                    className="w-full text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors"
                  >
                    Change Role
                  </button>
                </motion.div>
              )}

              {loginStep === 'otp' && (
                <motion.div 
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">We've sent a 4-digit code to</p>
                    <p className="font-bold text-orange-500">{authInput}</p>
                  </div>

                  <div className="flex justify-center gap-4">
                    {[0, 1, 2, 3].map((i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength={1}
                        className="w-14 h-16 bg-gray-100 border-none rounded-2xl text-center text-2xl font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={otpInput[i] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.length <= 1) {
                            const newOtp = otpInput.split('');
                            newOtp[i] = val;
                            setOtpInput(newOtp.join(''));
                            if (val && i < 3) {
                              (e.target.nextSibling as HTMLInputElement)?.focus();
                            }
                          }
                        }}
                      />
                    ))}
                  </div>

                  <div className="space-y-4">
                    <button 
                      onClick={handleLogin}
                      className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
                    >
                      Verify & {authMode === 'login' ? 'Login' : 'Sign Up'}
                    </button>
                    <button className="w-full text-orange-500 font-bold text-sm hover:underline">
                      Resend Code
                    </button>
                  </div>

                  <button 
                    onClick={() => setLoginStep('input')}
                    className="w-full text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors"
                  >
                    Back to {isEmail ? 'Email' : 'Phone'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-10 pt-8 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm">
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="ml-2 text-orange-500 font-bold hover:underline"
                >
                  {authMode === 'login' ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (currentUser.role === 'restaurant') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
        {/* Restaurant Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-4 md:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                <Store size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">QuickBite Partner</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                <button 
                  onClick={() => setIsDashboardOpen(true)}
                  className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                    <Store size={18} />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold leading-none">{currentUser.name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">Restaurant Manager</p>
                  </div>
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
                  <h3 className="text-2xl font-bold">$1,284.50</h3>
                </div>
              </div>
              <p className="text-xs text-green-500 font-medium">+12% from last week</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Orders</p>
                  <h3 className="text-2xl font-bold">8 Orders</h3>
                </div>
              </div>
              <p className="text-xs text-blue-500 font-medium">3 ready for pickup</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                  <Star size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg. Rating</p>
                  <h3 className="text-2xl font-bold">4.8 / 5.0</h3>
                </div>
              </div>
              <p className="text-xs text-orange-500 font-medium">Based on 124 reviews</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Menu Management */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">Menu Management</h3>
                <button className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                  <Plus size={18} /> Add Item
                </button>
              </div>
              <div className="space-y-4">
                {RESTAURANTS[0].menu.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 items-center">
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex-1">
                      <h4 className="font-bold">{item.name}</h4>
                      <p className="text-xs text-gray-400">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-500">${item.price}</p>
                      <div className="flex gap-2 mt-1">
                        <button className="text-xs font-bold text-blue-500 hover:underline">Edit</button>
                        <button className="text-xs font-bold text-red-500 hover:underline">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Active Orders & Delivery Status */}
            <section>
              <h3 className="text-2xl font-bold mb-8">Active Orders</h3>
              <div className="space-y-6">
                {[
                  { id: '#ORD-1234', customer: 'John Doe', items: '2x Classic Burger', total: '$28.50', status: 'preparing', payment: 'bKash' },
                  { id: '#ORD-1235', customer: 'Jane Smith', items: '1x Veggie Pizza', total: '$15.99', status: 'pickup', payment: 'COD' },
                  { id: '#ORD-1236', customer: 'Mike Ross', items: '3x Tacos Al Pastor', total: '$34.50', status: 'delivering', payment: 'Nagad' }
                ].map(order => (
                  <div key={order.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-lg">{order.id}</h4>
                        <p className="text-sm text-gray-400">Customer: {order.customer} • <span className="text-orange-500 font-bold">{order.payment}</span></p>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        order.status === 'preparing' ? 'bg-orange-100 text-orange-600' :
                        order.status === 'pickup' ? 'bg-blue-100 text-blue-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {order.status}
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-gray-600 mb-4">{order.items}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">{order.total}</span>
                        <div className="flex gap-2">
                          {order.status === 'preparing' && (
                            <button className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold">
                              Mark Ready
                            </button>
                          )}
                          {order.status === 'pickup' && (
                            <div className="flex items-center gap-2 text-blue-600 text-sm font-bold">
                              <Truck size={18} /> Waiting for Courier
                            </div>
                          )}
                          {order.status === 'delivering' && (
                            <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
                              <Navigation size={18} className="animate-pulse" /> Out for Delivery
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  if (currentUser.role === 'courier') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
        {/* Courier Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-4 md:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white">
                <Truck size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">QuickBite Courier</h1>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsOnline(!isOnline)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                  isOnline ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs font-bold">{isOnline ? 'Online' : 'Offline'}</span>
              </button>
              
              <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                <button 
                  onClick={() => setIsDashboardOpen(true)}
                  className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                    <User size={18} />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold leading-none">{currentUser.name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">Delivery Expert</p>
                  </div>
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Today\'s Earnings', value: '$84.20', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Deliveries', value: '12', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Active Time', value: '5h 20m', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Rating', value: '4.95', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
                  <stat.icon size={18} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-lg font-bold">{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
            {!isOnline && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] rounded-[2rem] flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400">
                  <Truck size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-2">You're currently offline</h3>
                <p className="text-gray-500 max-w-xs">Go online to start receiving new delivery tasks and track your earnings.</p>
                <button 
                  onClick={() => setIsOnline(true)}
                  className="mt-8 bg-green-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-200"
                >
                  Go Online Now
                </button>
              </div>
            )}
            {/* Active Delivery */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Navigation size={20} className="text-orange-500" /> Current Task
              </h3>
              
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 bg-orange-500 text-white flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">Order #ORD-1236</span>
                    <h4 className="text-xl font-bold">Pick up from Burger King</h4>
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">
                    ETA: 8 mins
                  </div>
                </div>
                
                <div className="p-8 space-y-8">
                  <div className="relative pl-8 space-y-10">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-dashed border-l-2 border-dashed border-gray-200"></div>
                    
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-6 h-6 bg-orange-500 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                      <h5 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-1">Pickup</h5>
                      <p className="font-bold">Burger King - Downtown</p>
                      <p className="text-sm text-gray-500">123 Main St, Suite 400</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-6 h-6 bg-gray-200 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                      <h5 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-1">Dropoff</h5>
                      <p className="font-bold">Mike Ross</p>
                      <p className="text-sm text-gray-500">456 Park Avenue, Apt 12B</p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
                      Arrived at Restaurant
                    </button>
                    <button 
                      onClick={() => setIsChatOpen(true)}
                      className="w-14 h-14 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <MessageCircle size={24} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-gray-200 h-64 rounded-[2rem] relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/map/800/400')] bg-cover"></div>
                <div className="relative z-10 bg-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
                  <Navigation size={20} className="text-orange-500 animate-pulse" />
                  <span className="font-bold text-sm">Navigating to Restaurant...</span>
                </div>
              </div>
            </div>

            {/* Available Tasks */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <List size={20} className="text-blue-500" /> Available Tasks
              </h3>
              
              <div className="space-y-4">
                {[
                  { id: '#ORD-1240', restaurant: 'Pizza Hut', dist: '1.2 km', pay: '$6.50', time: '15 min' },
                  { id: '#ORD-1241', restaurant: 'Sushi Zen', dist: '2.8 km', pay: '$9.20', time: '25 min' },
                  { id: '#ORD-1242', restaurant: 'Taco Bell', dist: '0.5 km', pay: '$4.80', time: '10 min' }
                ].map(task => (
                  <div key={task.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-orange-200 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold">{task.restaurant}</h4>
                        <p className="text-xs text-gray-400">{task.id} • {task.dist}</p>
                      </div>
                      <span className="text-green-600 font-bold">{task.pay}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={14} /> {task.time}
                      </div>
                      <button className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-all">
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedRestaurant(null)}>
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
              <ShoppingBag size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">QuickBite</h1>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Search restaurants or cuisines..."
                className="w-full bg-gray-100 border-none rounded-full py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1 text-sm text-gray-500">
              <MapPin size={16} className="text-orange-500" />
              <span>Deliver to: 123 Main St</span>
            </div>
            
            <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
              <button 
                onClick={() => setIsDashboardOpen(true)}
                className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                  <User size={18} />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold leading-none">{currentUser.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-[10px] text-gray-400 font-bold">{currentUser.loyaltyPoints || 0} Points</span>
                  </div>
                </div>
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>

            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ShoppingBag size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        <AnimatePresence mode="wait">
          {!selectedRestaurant ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Hero */}
              <section className="mb-12 rounded-3xl overflow-hidden relative h-[300px] md:h-[400px]">
                <img 
                  src="https://picsum.photos/seed/foodhero/1600/900" 
                  alt="Hero" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center px-8 md:px-16">
                  <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                    Delicious food,<br />delivered to you.
                  </h2>
                  <p className="text-gray-200 text-lg mb-8 max-w-md">
                    Order from your favorite local restaurants with just a few clicks.
                  </p>
                  <button className="bg-orange-500 text-white px-8 py-3 rounded-full font-semibold w-fit hover:bg-orange-600 transition-colors">
                    Order Now
                  </button>
                </div>
              </section>

              {/* Categories */}
              <section className="mb-8 overflow-x-auto no-scrollbar">
                <div className="flex gap-3 pb-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        selectedCategory === cat 
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </section>

              {/* Advanced Filters */}
              <section className="mb-12 flex flex-wrap gap-6 items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Price Range</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(level => (
                      <button
                        key={level}
                        onClick={() => setSelectedPriceLevel(selectedPriceLevel === level ? null : level)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${
                          selectedPriceLevel === level 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {'$'.repeat(level)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-10 w-px bg-gray-100 hidden md:block" />

                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Minimum Rating</p>
                  <div className="flex gap-2">
                    {[3, 4, 4.5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                        className={`px-4 h-10 rounded-xl flex items-center gap-1 font-bold transition-all ${
                          minRating === rating 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <Star size={14} className={minRating === rating ? 'fill-white' : 'fill-gray-500'} />
                        {rating}+
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ml-auto">
                  {(selectedCategory !== 'All' || searchQuery !== '' || selectedPriceLevel !== null || minRating !== 0) && (
                    <button 
                      onClick={() => {
                        setSelectedCategory('All');
                        setSearchQuery('');
                        setSelectedPriceLevel(null);
                        setMinRating(0);
                      }}
                      className="text-orange-500 text-sm font-bold hover:underline"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </section>

              {/* Restaurants Grid */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold">
                    {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'Restaurant' : 'Restaurants'} Found
                  </h3>
                </div>
                {filteredRestaurants.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Search size={48} className="mx-auto text-gray-200 mb-4" />
                    <h4 className="text-xl font-bold mb-2">No restaurants found</h4>
                    <p className="text-gray-400">Try adjusting your filters or search query.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredRestaurants.map(restaurant => (
                      <motion.div
                        key={restaurant.id}
                        whileHover={{ y: -8 }}
                        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                        onClick={() => setSelectedRestaurant(restaurant)}
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img 
                            src={restaurant.image} 
                            alt={restaurant.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-sm font-bold">
                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            {restaurant.rating}
                            <span className="text-[10px] text-gray-400 font-normal">({restaurant.reviewCount})</span>
                          </div>
                          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-xs font-bold">
                            {'$'.repeat(restaurant.priceLevel)}
                          </div>
                        </div>
                        <div className="p-5">
                          <h4 className="text-lg font-bold mb-1">{restaurant.name}</h4>
                          <p className="text-gray-500 text-sm mb-4">{restaurant.categories.join(' • ')}</p>
                          <div className="flex items-center justify-between text-sm font-medium text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock size={16} className="text-orange-500" />
                              {restaurant.deliveryTime}
                            </div>
                            <div>
                              {restaurant.deliveryFee === 0 ? 'Free Delivery' : `$${restaurant.deliveryFee} Delivery`}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="restaurant-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button 
                onClick={() => setSelectedRestaurant(null)}
                className="flex items-center gap-2 text-gray-500 hover:text-orange-500 mb-8 transition-colors font-medium"
              >
                <ArrowLeft size={20} />
                Back to restaurants
              </button>

              <div className="flex flex-col md:flex-row gap-12">
                <div className="flex-1">
                  <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden mb-8">
                    <img 
                      src={selectedRestaurant.image} 
                      alt={selectedRestaurant.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8">
                      <h2 className="text-4xl font-bold text-white mb-2">{selectedRestaurant.name}</h2>
                      <div className="flex items-center gap-4 text-white/90 font-medium">
                        <div className="flex items-center gap-1">
                          <Star size={18} className="text-yellow-400 fill-yellow-400" />
                          {selectedRestaurant.rating}
                          <span className="text-sm opacity-70">({selectedRestaurant.reviewCount} reviews)</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock size={18} />
                          {selectedRestaurant.deliveryTime}
                        </div>
                        <span>•</span>
                        <span>{selectedRestaurant.categories.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-12">
                    {Array.from(new Set(selectedRestaurant.menu.map(m => m.category))).map(category => (
                      <div key={category}>
                        <h3 className="text-2xl font-bold mb-6 border-b border-gray-100 pb-2">{category}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {selectedRestaurant.menu.filter(m => m.category === category).map(item => (
                            <div 
                              key={item.id}
                              className="bg-white p-4 rounded-2xl flex gap-4 hover:shadow-md transition-shadow border border-gray-50"
                            >
                              <div className="flex-1">
                                <h4 className="font-bold text-lg mb-1">{item.name}</h4>
                                <div className="flex items-center gap-1 mb-2">
                                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                  <span className="text-xs font-bold text-gray-600">{item.rating || 4.5}</span>
                                  <span className="text-[10px] text-gray-400">({item.reviewCount || 24})</span>
                                </div>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{item.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-orange-500">${item.price}</span>
                                  <button 
                                    onClick={() => addToCart(item, selectedRestaurant)}
                                    className="bg-orange-100 text-orange-600 p-2 rounded-xl hover:bg-orange-500 hover:text-white transition-all"
                                  >
                                    <Plus size={20} />
                                  </button>
                                </div>
                              </div>
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-24 h-24 rounded-xl object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reviews Section */}
                  <div className="mt-16 pt-12 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold">Customer Reviews</h3>
                      <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-xl">
                        <Star size={20} className="text-orange-500 fill-orange-500" />
                        <span className="font-bold text-orange-700">{selectedRestaurant.rating}</span>
                        <span className="text-orange-400 text-sm">({selectedRestaurant.reviewCount} reviews)</span>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {reviews.filter(r => r.restaurantId === selectedRestaurant.id).length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-3xl">
                          <MessageCircle size={48} className="mx-auto text-gray-200 mb-4" />
                          <p className="text-gray-400">No reviews yet for this restaurant.</p>
                        </div>
                      ) : (
                        reviews.filter(r => r.restaurantId === selectedRestaurant.id).map(review => (
                          <div key={review.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                                  {review.userName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold">{review.userName}</p>
                                  <p className="text-xs text-gray-400">{new Date(review.timestamp).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star 
                                    key={star} 
                                    size={14} 
                                    className={star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} 
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-600 leading-relaxed">{review.comment}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar Cart Preview */}
                <div className="hidden lg:block w-80 shrink-0">
                  <div className="sticky top-32 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold mb-6">Your Order</h3>
                    {cart.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400">Your cart is empty</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                          {cart.map(item => (
                            <div key={item.id} className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{item.name}</p>
                                <p className="text-gray-400 text-xs">${item.price} each</p>
                              </div>
                              <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-lg">
                                <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-orange-500"><Minus size={14} /></button>
                                <span className="text-sm font-bold min-w-[20px] text-center">{item.quantity}</span>
                                <button onClick={() => addToCart(item, selectedRestaurant)} className="text-gray-400 hover:text-orange-500"><Plus size={14} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-gray-100 pt-4 space-y-2 mb-6">
                          {currentUser?.loyaltyPoints && currentUser.loyaltyPoints > 0 && (
                            <div className="bg-orange-50 p-3 rounded-xl mb-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Star size={16} className="text-orange-500 fill-orange-500" />
                                <div className="text-left">
                                  <p className="text-xs font-bold text-orange-700">Redeem Points</p>
                                  <p className="text-[10px] text-orange-600">Save ${(currentUser.loyaltyPoints * POINTS_VALUE).toFixed(2)}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}
                                className={`w-10 h-6 rounded-full transition-all relative ${useLoyaltyPoints ? 'bg-orange-500' : 'bg-gray-300'}`}
                              >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useLoyaltyPoints ? 'left-5' : 'left-1'}`} />
                              </button>
                            </div>
                          )}
                          <div className="flex justify-between text-gray-500 text-sm">
                            <span>Subtotal</span>
                            <span>${cartTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-gray-500 text-sm">
                            <span>Delivery Fee</span>
                            <span>${selectedRestaurant.deliveryFee.toFixed(2)}</span>
                          </div>
                          {useLoyaltyPoints && (
                            <div className="flex justify-between text-green-600 text-sm font-bold">
                              <span>Loyalty Discount</span>
                              <span>-${pointsDiscount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-lg pt-2">
                            <span>Total</span>
                            <span>${finalTotal.toFixed(2)}</span>
                          </div>
                        </div>
                        <button 
                          onClick={handleCheckout}
                          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
                        >
                          Checkout
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Cart Drawer Mobile */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-2xl font-bold">Your Cart</h3>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <ShoppingBag size={80} className="text-gray-100 mb-6" />
                    <h4 className="text-xl font-bold mb-2">Your cart is empty</h4>
                    <p className="text-gray-400 mb-8">Add some delicious items from your favorite restaurants!</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="bg-orange-500 text-white px-8 py-3 rounded-full font-bold"
                    >
                      Browse Restaurants
                    </button>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <img src={item.image} alt={item.name} className="w-20 h-20 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-bold">{item.name}</h4>
                          <span className="font-bold text-orange-500">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{item.restaurantName}</p>
                        <div className="flex items-center gap-4 bg-gray-50 w-fit px-3 py-1.5 rounded-xl">
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-orange-500"><Minus size={16} /></button>
                          <span className="font-bold">{item.quantity}</span>
                          <button onClick={() => addToCart(item, RESTAURANTS.find(r => r.id === item.restaurantId)!)} className="text-gray-400 hover:text-orange-500"><Plus size={16} /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  {/* Payment Method Selection */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Payment Method</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'cod', label: 'Cash on Delivery', icon: Banknote },
                        { id: 'card', label: 'Credit Card', icon: CreditCard },
                        { id: 'paypal', label: 'PayPal', icon: Wallet },
                        { id: 'bkash', label: 'bKash', icon: Wallet, color: 'text-pink-600' },
                        { id: 'nagad', label: 'Nagad', icon: Wallet, color: 'text-orange-600' }
                      ].map(method => (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                            paymentMethod === method.id 
                            ? 'border-orange-500 bg-orange-50/30' 
                            : 'border-white bg-white hover:border-gray-200 shadow-sm'
                          }`}
                        >
                          <method.icon size={18} className={method.color || 'text-gray-600'} />
                          <span className="text-xs font-bold truncate">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Loyalty Points Redemption */}
                  {currentUser?.loyaltyPoints && currentUser.loyaltyPoints > 0 && (
                    <div className="mb-6 bg-orange-50 p-4 rounded-2xl flex items-center justify-between border border-orange-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-sm">
                          <Star size={20} className="fill-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-orange-900">Redeem {currentUser.loyaltyPoints} Points</p>
                          <p className="text-xs text-orange-700">Save ${(currentUser.loyaltyPoints * POINTS_VALUE).toFixed(2)} on this order</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}
                        className={`w-12 h-7 rounded-full transition-all relative ${useLoyaltyPoints ? 'bg-orange-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${useLoyaltyPoints ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Delivery Fee</span>
                      <span>$2.99</span>
                    </div>
                    {useLoyaltyPoints && (
                      <div className="flex justify-between text-green-600 font-bold">
                        <span>Loyalty Discount</span>
                        <span>-${pointsDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xl pt-3 border-t border-gray-200">
                      <span>Total</span>
                      <span>${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
                  >
                    Place Order
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Order Status Overlay */}
      <AnimatePresence>
        {orderStatus !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[60] flex flex-col items-center justify-center p-8 text-center"
          >
            {orderStatus === 'processing' && (
              <div className="space-y-6">
                <div className="w-24 h-24 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <h2 className="text-3xl font-bold">
                  {paymentMethod === 'cod' ? 'Confirming Order...' : 'Processing Payment...'}
                </h2>
                <p className="text-gray-500">
                  {paymentMethod === 'cod' 
                    ? "We're sending your request to the restaurant." 
                    : `Securely processing your ${paymentMethod.toUpperCase()} payment.`}
                </p>
              </div>
            )}
            {orderStatus === 'confirmed' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full flex flex-col"
              >
                {/* Map Simulation */}
                <div className="relative flex-1 bg-[#E5E3DF] overflow-hidden">
                  {/* Grid Pattern for Map-like feel */}
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  
                  {/* Road Path */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <path 
                      d="M 100,200 Q 400,100 700,400 T 1200,200" 
                      fill="none" 
                      stroke="#CBD5E1" 
                      strokeWidth="12" 
                      strokeLinecap="round" 
                    />
                    <motion.path 
                      d="M 100,200 Q 400,100 700,400 T 1200,200" 
                      fill="none" 
                      stroke="#F97316" 
                      strokeWidth="12" 
                      strokeLinecap="round" 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: trackingProgress / 100 }}
                    />
                  </svg>

                  {/* Restaurant Marker */}
                  <div className="absolute left-[100px] top-[200px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="bg-white p-2 rounded-xl shadow-lg border-2 border-orange-500">
                      <ShoppingBag size={20} className="text-orange-500" />
                    </div>
                    <span className="text-xs font-bold mt-1 bg-white/80 px-2 py-0.5 rounded">Restaurant</span>
                  </div>

                  {/* User Marker */}
                  <div className="absolute right-[100px] bottom-[200px] translate-x-1/2 translate-y-1/2 flex flex-col items-center">
                    <div className="bg-white p-2 rounded-xl shadow-lg border-2 border-blue-500">
                      <MapPin size={20} className="text-blue-500" />
                    </div>
                    <span className="text-xs font-bold mt-1 bg-white/80 px-2 py-0.5 rounded">You</span>
                  </div>

                  {/* Courier Marker */}
                  {trackingPhase !== 'preparing' && (
                    <motion.div 
                      className="absolute z-10"
                      style={{ 
                        left: `${100 + (trackingProgress * 10)}px`, // Simplified movement for demo
                        top: `${200 - (trackingProgress * 0.5)}px`,
                        offsetPath: "path('M 100,200 Q 400,100 700,400 T 1200,200')",
                        offsetDistance: `${trackingProgress}%`
                      }}
                    >
                      <div className="bg-orange-500 p-3 rounded-full shadow-2xl text-white border-4 border-white">
                        <Bike size={24} />
                      </div>
                    </motion.div>
                  )}

                  {/* Tracking Status Card */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold">
                            {trackingPhase === 'preparing' && "Preparing your order..."}
                            {trackingPhase === 'pickup' && "Courier at restaurant"}
                            {trackingPhase === 'delivering' && "On the way to you"}
                            {trackingPhase === 'arrived' && "Courier has arrived!"}
                          </h3>
                          <p className="text-gray-500 text-sm">Estimated delivery: 12-15 mins</p>
                        </div>
                        <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg font-bold text-sm">
                          {trackingProgress}%
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 bg-gray-100 rounded-full mb-8 overflow-hidden">
                        <motion.div 
                          className="h-full bg-orange-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${trackingProgress}%` }}
                        />
                      </div>

                      {/* Courier Info */}
                      <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                        <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                          <img src="https://picsum.photos/seed/courier/100/100" alt="Courier" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold">Alex Johnson</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            <span>4.9 • Honda PCX</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-3 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors">
                            <Phone size={20} />
                          </button>
                          <button 
                            onClick={() => setIsChatOpen(true)}
                            className="p-3 bg-orange-500 rounded-xl text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
                          >
                            <MessageSquare size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {orderStatus === 'delivered' && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-6"
              >
                <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag size={64} />
                </div>
                <h2 className="text-4xl font-bold">Enjoy your meal!</h2>
                <p className="text-gray-500 text-lg">Your order has been delivered to your doorstep.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => setShowReviewModal(true)}
                    className="bg-orange-500 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
                  >
                    Leave a Review
                  </button>
                  <button 
                    onClick={() => {
                      setOrderStatus('idle');
                      setMessages([]);
                    }}
                    className="bg-gray-100 text-gray-600 px-12 py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all"
                  >
                    Order Again
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviewModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-2xl font-bold">Review your order</h3>
                  <p className="text-gray-400 text-sm">How was your experience with {lastRestaurant?.name}?</p>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
                {/* Restaurant Review */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md">
                      <img src={lastRestaurant?.image} alt={lastRestaurant?.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold">{lastRestaurant?.name}</h4>
                      <p className="text-gray-400 text-sm">Overall restaurant rating</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        onClick={() => setTempRestaurantRating(star)}
                        className="group"
                      >
                        <Star 
                          size={40} 
                          className={`transition-all ${star <= tempRestaurantRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} group-hover:scale-110`} 
                        />
                      </button>
                    ))}
                  </div>

                  <textarea 
                    placeholder="Share your thoughts about the food and service..."
                    value={tempRestaurantComment}
                    onChange={(e) => setTempRestaurantComment(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 h-32 focus:ring-2 focus:ring-orange-500 transition-all outline-none resize-none"
                  />
                </section>

                {/* Item Reviews */}
                <section className="space-y-6">
                  <h4 className="text-lg font-bold border-t border-gray-100 pt-8">Rate individual items</h4>
                  <div className="space-y-6">
                    {lastOrderItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                          <div>
                            <p className="font-bold text-sm">{item.name}</p>
                            <p className="text-gray-400 text-xs">${item.price}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                              key={star} 
                              className="p-1"
                              onClick={() => setTempItemRatings(prev => ({ ...prev, [item.id]: star }))}
                            >
                              <Star 
                                size={18} 
                                className={(tempItemRatings[item.id] || 5) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                <button 
                  onClick={() => submitReview(tempRestaurantRating, tempRestaurantComment, tempItemRatings)}
                  className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
                >
                  Submit Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Dashboard */}
      <AnimatePresence>
        {isDashboardOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDashboardOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-[#F8F9FA] z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">User Dashboard</h3>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Manage your profile & activity</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDashboardOpen(false)} 
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Profile Section */}
                <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                      <div className="w-32 h-32 bg-gray-100 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl">
                        <img 
                          src={`https://picsum.photos/seed/${currentUser.id}/200/200`} 
                          alt="Profile" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <button className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-2.5 rounded-2xl shadow-lg hover:bg-orange-600 transition-all border-4 border-white">
                        <Smartphone size={16} />
                      </button>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      {isEditingProfile ? (
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                            <input 
                              type="text"
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                            <input 
                              type="email"
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Phone Number</label>
                            <input 
                              type="tel"
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-3 pt-2">
                            <button 
                              onClick={handleSaveProfile}
                              className="bg-orange-500 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
                            >
                              Save Changes
                            </button>
                            <button 
                              onClick={() => setIsEditingProfile(false)}
                              className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                            <h4 className="text-2xl font-bold">{currentUser.name}</h4>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                              currentUser.role === 'customer' ? 'bg-blue-100 text-blue-600' :
                              currentUser.role === 'restaurant' ? 'bg-orange-100 text-orange-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {currentUser.role}
                            </span>
                          </div>
                          <p className="text-gray-500 mb-6 flex items-center justify-center md:justify-start gap-2">
                            <Mail size={16} /> {currentUser.email || 'No email provided'}
                          </p>
                          <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <button 
                              onClick={handleStartEdit}
                              className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
                            >
                              Edit Profile
                            </button>
                            <button 
                              onClick={handleLogout}
                              className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                            >
                              Logout
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </section>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentUser.role === 'customer' && (
                    <>
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center">
                            <Star size={20} className="fill-yellow-600" />
                          </div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loyalty Points</p>
                        </div>
                        <h3 className="text-2xl font-bold">{currentUser.loyaltyPoints || 0}</h3>
                        <p className="text-[10px] text-gray-400 mt-1">Worth approx. ${( (currentUser.loyaltyPoints || 0) * 0.1).toFixed(2)}</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <ShoppingBag size={20} />
                          </div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
                        </div>
                        <h3 className="text-2xl font-bold">24</h3>
                        <p className="text-[10px] text-gray-400 mt-1">Since Jan 2024</p>
                      </div>
                    </>
                  )}
                  {currentUser.role === 'courier' && (
                    <>
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                            <DollarSign size={20} />
                          </div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Earnings</p>
                        </div>
                        <h3 className="text-2xl font-bold">$1,450.00</h3>
                        <p className="text-[10px] text-gray-400 mt-1">This month</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                            <CheckCircle size={20} />
                          </div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed Tasks</p>
                        </div>
                        <h3 className="text-2xl font-bold">156</h3>
                        <p className="text-[10px] text-gray-400 mt-1">98% success rate</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Activity Section / Order History */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-lg font-bold">
                      {currentUser.role === 'customer' ? 'Order History' : 'Recent Activity'}
                    </h4>
                    {currentUser.role === 'customer' && pastOrders.length > 0 && (
                      <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-wider">
                        {pastOrders.length} Orders
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {currentUser.role === 'customer' ? (
                      pastOrders.length > 0 ? (
                        pastOrders.map(order => (
                          <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm group hover:border-orange-200 transition-all">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-orange-500 transition-colors">
                                  <ShoppingBag size={20} />
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{order.restaurantName}</p>
                                  <p className="text-xs text-gray-400">
                                    {order.date.toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric' 
                                    })} • {order.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-sm text-orange-600">${order.total.toFixed(2)}</p>
                                <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Delivered</p>
                              </div>
                            </div>
                            
                            <div className="pl-16 space-y-1">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Items Ordered</p>
                              <div className="flex flex-wrap gap-2">
                                {order.items.map((item, idx) => (
                                  <span key={idx} className="text-[11px] bg-gray-50 text-gray-600 px-2 py-1 rounded-lg border border-gray-100">
                                    {item.quantity}x {item.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                            <ShoppingBag size={32} />
                          </div>
                          <p className="font-bold text-gray-400">No orders yet</p>
                          <p className="text-xs text-gray-300 mt-1">Your past orders will appear here</p>
                        </div>
                      )
                    ) : (
                      [1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-orange-500 transition-colors">
                              {currentUser.role === 'customer' ? <ShoppingBag size={18} /> : <Truck size={18} />}
                            </div>
                            <div>
                              <p className="font-bold text-sm">
                                {currentUser.role === 'customer' ? 'Order from Burger Haven' : 'Delivery to Park Avenue'}
                              </p>
                              <p className="text-xs text-gray-400">March {28 - i}, 2026 • 12:30 PM</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{currentUser.role === 'customer' ? '$24.50' : '+$8.50'}</p>
                            <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Completed</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {currentUser.role === 'customer' && pastOrders.length > 3 && (
                    <button className="w-full py-3 text-gray-400 font-bold text-sm hover:text-orange-500 transition-colors">
                      View All History
                    </button>
                  )}
                </section>

                {/* Security & Settings */}
                <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                  <h4 className="text-lg font-bold">Security & Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400">
                          <Smartphone size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Two-Factor Authentication</p>
                          <p className="text-xs text-gray-400">Secure your account with OTP</p>
                        </div>
                      </div>
                      <div className="w-12 h-6 bg-green-500 rounded-full relative p-1 cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full absolute right-1" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400">
                          <Key size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Change Password</p>
                          <p className="text-xs text-gray-400">Last changed 3 months ago</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-300" />
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full overflow-hidden flex items-center justify-center">
                    {currentUser?.role === 'courier' ? (
                      <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-500">
                        <User size={20} />
                      </div>
                    ) : (
                      trackingPhase === 'preparing' ? (
                        <ShoppingBag size={20} className="text-orange-500" />
                      ) : (
                        <img src="https://picsum.photos/seed/courier/100/100" alt="Courier" className="w-full h-full object-cover" />
                      )
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold">
                      {currentUser?.role === 'courier' ? "Customer (Mike Ross)" : (trackingPhase === 'preparing' ? "Restaurant Support" : "Alex Johnson (Courier)")}
                    </h3>
                    <div className="text-xs text-green-500 font-medium flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      Online
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.map((msg) => {
                  const isMe = (msg.sender === 'user' && currentUser?.role === 'customer') || (msg.sender === 'courier' && currentUser?.role === 'courier');
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                          isMe
                          ? 'bg-orange-500 text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 rounded-tl-none'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${
                          isMe
                          ? 'text-orange-100' 
                          : 'text-gray-400'
                        }`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button 
                    onClick={sendMessage}
                    className="bg-orange-500 text-white p-3 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-20 py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                <ShoppingBag size={18} />
              </div>
              <h1 className="text-lg font-bold tracking-tight">QuickBite</h1>
            </div>
            <p className="text-gray-500 text-sm">
              The fastest food delivery service in town. Fresh meals from your favorite local spots.
            </p>
          </div>
          <div>
            <h5 className="font-bold mb-4">Company</h5>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li className="hover:text-orange-500 cursor-pointer">About Us</li>
              <li className="hover:text-orange-500 cursor-pointer">Careers</li>
              <li className="hover:text-orange-500 cursor-pointer">Blog</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4">Support</h5>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li className="hover:text-orange-500 cursor-pointer">Help Center</li>
              <li className="hover:text-orange-500 cursor-pointer">Safety</li>
              <li className="hover:text-orange-500 cursor-pointer">Terms of Service</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4">Download App</h5>
            <div className="space-y-3">
              <div className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-gray-800 transition-colors">
                <div className="w-6 h-6 bg-white rounded-full" />
                <div className="text-left">
                  <p className="text-[10px] opacity-60 uppercase">Download on the</p>
                  <p className="text-sm font-bold">App Store</p>
                </div>
              </div>
              <div className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-gray-800 transition-colors">
                <div className="w-6 h-6 bg-white rounded-full" />
                <div className="text-left">
                  <p className="text-[10px] opacity-60 uppercase">Get it on</p>
                  <p className="text-sm font-bold">Google Play</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-100 text-center text-gray-400 text-sm">
          © 2026 QuickBite Delivery. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

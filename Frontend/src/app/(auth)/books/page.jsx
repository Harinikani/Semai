"use client";

import { useState } from "react";
import SearchBar from "@/app/components/SearchBar";
import { ShoppingCart, Star, Coins, X } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/Breadcrumb";

const BooksMarketplace = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [userBalance] = useState(0);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const categories = ["All", "Animals", "Heritage", "Folklore"];

  const books = [
    {
      id: 1,
      title: "Kejadian Kolam Air Panas",
      category: ["Folklore"],
      price: 30,
      rating: 4.8,
      reviews: 124,
      coverImage: "/orangaslibook1.png",
    },
    {
      id: 2,
      title: "Pahlawan Orang Asli",
      category: ["Heritage"],
      price: 22,
      rating: 4.9,
      reviews: 89,
      coverImage: "/orangaslibook2.png",
    },
    {
      id: 3,
      title: "Hantu Lipas",
      category: ["Folklore"],
      price: 20,
      rating: 4.7,
      reviews: 156,
      coverImage: "/orangaslibook3.png",
    },
    {
      id: 4,
      title: "Semangat Padi",
      category: ["Heritage"],
      price: 30,
      rating: 4.9,
      reviews: 203,
      coverImage: "/orangaslibook4.png",
    },
    {
      id: 5,
      title: "Kisah Tenung Bangkong",
      category: ["Folklore", "Animals"],
      price: 25,
      rating: 4.6,
      reviews: 92,
      coverImage: "/orangaslibook5.png",
    },
    {
      id: 6,
      title: "Manusia Ular",
      category: ["Folklore"],
      price: 30,
      rating: 4.8,
      reviews: 167,
      coverImage: "/orangaslibook6.png",
    },
    {
      id: 7,
      title: "Sang Kancil Dengan Siput",
      category: ["Animals", "Folklore"],
      price: 20,
      rating: 4.5,
      reviews: 78,
      coverImage: "/orangaslibook7.png",
    },
    {
      id: 8,
      title: "Suara Engkuk",
      category: ["Animals", "Folklore"],
      price: 30,
      rating: 4.9,
      reviews: 145,
      coverImage: "/orangaslibook8.png",
    },
    {
      id: 9,
      title: "Manusia Menjadi Naga",
      category: ["Folklore"],
      price: 25,
      rating: 4.7,
      reviews: 112,
      coverImage: "/orangaslibook9.png",
    },
    {
      id: 10,
      title: "Topeng Siamang",
      category: ["Folklore", "Heritage"],
      price: 30,
      rating: 4.8,
      reviews: 134,
      coverImage: "/orangaslibook10.png",
    },
    {
      id: 11,
      title: "Lagenda Batu Ribti",
      category: ["Folklore"],
      price: 25,
      rating: 4.6,
      reviews: 98,
      coverImage: "/orangaslibook11.png",
    },
    {
      id: 12,
      title: "Perayaan Bering",
      category: ["Heritage"],
      price: 35,
      rating: 4.9,
      reviews: 156,
      coverImage: "/orangaslibook12.png",
    },
  ];

  const filteredBooks = books.filter((book) => {
    const matchesCategory =
      selectedCategory === "All" || book.category.includes(selectedCategory);

    const matchesSearch = book.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const addToCart = (book) => {
    const existing = cartItems.find((item) => item.id === book.id);
    if (existing) {
      setCartItems(
        cartItems.map((item) =>
          item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCartItems([...cartItems, { ...book, quantity: 1 }]);
    }
  };

  const removeFromCart = (bookId) => {
    setCartItems(cartItems.filter((item) => item.id !== bookId));
  };

  const updateQuantity = (bookId, delta) => {
    setCartItems(
      cartItems
        .map((item) => {
          if (item.id === bookId) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const totalCost = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const formatCurrency = (num) => {
    return `RM ${num.toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-md mx-auto min-h-screen pb-20">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/home">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/learn">Learn</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Books</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center space-x-2 px-6 py-2">
          <div className="flex w-full">
            <SearchBar
              placeholder="Search books..."
              onSearch={handleSearch}
              debounceMs={300}
            />
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors relative"
          >
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Categories */}
        <div className="px-6 py-2 overflow-x-auto">
          <div className="flex space-x-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-emerald-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        <div className="px-6 py-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {filteredBooks.length}{" "}
              {filteredBooks.length === 1 ? "Book" : "Books"} Available
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* Square Book Cover */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Book Info */}
                <div className="p-3">
                  <h3 className="font-bold text-sm text-gray-900 mb-2 line-clamp-2 h-10">
                    {book.title}
                  </h3>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {book.category.map((cat) => (
                      <span
                        key={`${book.id}-${cat}`}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-1 mb-2">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-600 font-medium">
                      {book.rating}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({book.reviews})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-emerald-600 text-md">
                        {formatCurrency(book.price)}
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(book)}
                      className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Bottom Sheet */}
        {showCart && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowCart(false)}
          >
            <div
              className="w-full max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out animate-slide-up"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: "85vh" }}
            >
              <div className="flex flex-col h-full">
                {/* Cart Header */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">
                      Shopping Cart
                    </h2>
                    <button
                      onClick={() => setShowCart(false)}
                      className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <p className="text-white/80 text-sm mt-1">
                    {totalItems} items
                  </p>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <ShoppingCart className="w-16 h-16 mb-20" />
                      <p>Your cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                        >
                          <div className="flex space-x-3">
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              <img
                                src={item.coverImage}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                                {item.title}
                              </h3>
                              <div className="flex items-center space-x-1 mb-2">
                                <span className="text-sm font-bold text-emerald-600">
                                  {formatCurrency(item.price * item.quantity)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                                  >
                                    <span className="text-gray-600">−</span>
                                  </button>
                                  <span className="text-sm font-semibold text-gray-900 w-6 text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                                  >
                                    <span className="text-gray-600">+</span>
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-red-500 text-xs font-semibold hover:text-red-600"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cart Footer */}
                {cartItems.length > 0 && (
                  <div className="border-t border-gray-200 px-6 py-4 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-600 font-semibold">
                        Total Cost
                      </span>
                      <span className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(totalCost)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4 text-sm">
                      <span className="text-gray-500">Your Balance</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(userBalance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4 text-sm">
                      <span className="text-gray-500">After Purchase</span>
                      <span
                        className={`font-semibold ${
                          userBalance >= totalCost
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(userBalance - totalCost)}
                      </span>
                    </div>
                    <button
                      disabled={totalCost > userBalance}
                      className={`w-full mb-20 py-3 rounded-xl font-bold text-white transition-colors ${
                        totalCost > userBalance
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm"
                      }`}
                    >
                      {totalCost > userBalance
                        ? "Insufficient Balance"
                        : "Purchase Books"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BooksMarketplace;
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import FooterNav from "../Layout/Footer";
import { ArrowLeft } from "lucide-react";
import ComboCardShimmer from "./ComboCardShimmer";
import type { Category } from "../../types/types";

type ComboOffersPageProps = {
  comboCategories: Category[];
};

export default function ComboOffersPage({ comboCategories }: ComboOffersPageProps) {
  const [cart, setCart] = useState<Record<string, any>>(() => {
    const fromStorage = JSON.parse(localStorage.getItem("cart") || "{}");
    return fromStorage;
  });
  const [showSuccessPop, setShowSuccessPop] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleAddToCart = (combo) => {
    const newItem = {
      _id: combo._id,
      name: combo.name,
      price: combo.comboMeta.discountedPrice,
      quantity: (cart[combo._id]?.quantity || 0) + 1,
      isVegetarian: combo.isVegetarian,
    };
    const newCart = { ...cart, [combo._id]: newItem };
    localStorage.setItem("cart", JSON.stringify(newCart));
    setCart(newCart);
    setShowSuccessPop(true);
    setTimeout(() => setShowSuccessPop(false), 1500);
  };

  const cartCount = Object.values(cart).reduce((sum, item: any) => sum + item.quantity, 0);

  return (
    <div className="bg-[#FAFBF8] min-h-screen pb-32">
      {showSuccessPop && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl shadow-2xl px-10 py-8 flex flex-col items-center animate-in fade-in scale-in">
            <div className="text-green-500 mb-2 animate-bounce">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#22c55e" />
                <path d="M7 13l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-green-600 mb-1">Added to Cart!</h2>
            <p className="text-sm text-gray-600 text-center">Your item was added successfully.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-2 mb-2">
        <button onClick={() => navigate(-1)} className="bg-gray-100 p-2 rounded-full flex items-center justify-center">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 ml-1">
          <span role="img" aria-label="combo" className="text-[22px]">🍽️</span>
          Combo Meals
        </h1>
      </div>

      <div className="space-y-6 px-4 mt-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <ComboCardShimmer key={index} />
          ))
        ) : comboCategories.length > 0 ? (
          comboCategories.map((combo) => (
            <div
              key={combo._id}
              className="bg-white rounded-xl shadow border border-gray-200 px-6 py-5 relative overflow-hidden flex flex-col"
            >
              <h3 className="font-bold text-lg text-gray-900 mb-1">{combo.name}</h3>
              <p className="text-gray-600 mb-2">{combo.comboMeta?.description}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="line-through text-gray-400 text-base">₹{combo.comboMeta?.originalPrice}</span>
                <span className="text-orange-600 text-xl font-bold">₹{combo.comboMeta?.discountedPrice}</span>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 ml-1 rounded-md">
                  Save ₹{combo.comboMeta?.saveAmount}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {combo.isVegetarian ? (
                  <span className="block w-3 h-3 border-2 border-green-600 bg-green-50 rounded-sm flex items-center justify-center">
                    <span className="block w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                  </span>
                ) : (
                  <span className="block w-3 h-3 border-2 border-red-600 bg-red-50 rounded-sm flex items-center justify-center">
                    <span className="block w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                  </span>
                )}
                <button
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded px-4 py-1 transition-all"
                  onClick={() => handleAddToCart(combo)}
                >
                  Add Combo
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="inline-block bg-gray-100 p-4 rounded-full">
              <span role="img" aria-label="sad face" className="text-4xl">😟</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-700">No Combos Available</h2>
            <p className="mt-2 text-gray-500">
              We don't have any special combos at the moment. Please check back later!
            </p>
          </div>
        )}
      </div>
      <FooterNav activeTab="combos" cartCount={cartCount} />
    </div>
  );
}

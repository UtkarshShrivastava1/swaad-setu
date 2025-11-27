import { MdShoppingCart } from "react-icons/md"; // or any icon lib you prefer
import { AnimatePresence, motion } from "framer-motion";


type FloatingCartButtonProps = {
  cartCount: number;
  onClick?: () => void; // to open cart or navigate
};

export default function FloatingCartButton({ cartCount, onClick }: FloatingCartButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="View Cart"
      className="
        fixed bottom-20 right-6 z-100 flex items-center justify-center
        w-10 h-10 rounded-full bg-yellow-600 text-white shadow-lg
        hover:bg-yellow-700 transition-colors duration-300
        focus:outline-none focus:ring-4 focus:ring-yellow-300
      "
    >
      <div className="relative">
        <MdShoppingCart size={28} />
        {cartCount > 0 && (
           <AnimatePresence mode="popLayout">
                    <motion.div
                      key={cartCount}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute -top-1 -right-1"
                    >
                      <div className="relative flex items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex min-w-[16px] h-4 px-[4px] bg-red-500 text-white text-[10px] font-bold rounded-full items-center justify-center shadow-md">
                          {cartCount > 9 ? "9+" : cartCount}
                        </span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
        )}
      </div>
    </button>
  );
}

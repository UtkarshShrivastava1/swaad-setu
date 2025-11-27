import FooterNav from "../Layout/Footer";
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react";

const offers = [
  {
    title: "Welcome Offer",
    description: "20% off on your first order",
    code: "FIRST20",
    minOrder: 300,
    maxDiscount: 100,
  },
  {
    title: "Big Savings",
    description: "₹50 off on orders above ₹500",
    code: "SAVE50",
    minOrder: 500,
    maxDiscount: 50,
  },
  {
    title: "Family Feast",
    description: "15% off on orders above ₹800",
    code: "FAMILY15",
    minOrder: 800,
    maxDiscount: 150,
  },
];

const Offers = () => {
  const navigate = useNavigate();
  const tableId = sessionStorage.getItem('resto_table_id');
  console.log(tableId)

  return (
    <div className="bg-[#FAFBF8] min-h-screen pb-32" > 
    <div className="flex items-center gap-2 px-4 py-2 mb-2">
      <button onClick={() => navigate(-1)} className="bg-gray-100 p-2 rounded-full flex items-center justify-center">
        <ArrowLeft size={22} />
      </button>
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 ml-1">
        <span role="img" aria-label="offer" className="text-[22px]">🎯</span>
        Special Offers
      </h1>
    </div>

          {/* Page header */}
      {/* <div className="flex items-center gap-2 px-4 py-2 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-100 p-2 rounded-full flex items-center justify-center"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 ml-1">
          <span role="img" aria-label="offer" className="text-[22px]">🎯</span>
          Special Offers
        </h1>
      </div> */}

      {/* Offer Cards */}
      <div className="space-y-6 px-4 mt-4">
        {offers.map((offer, i) => (
          <div key={i} className="bg-white rounded-xl shadow border border-gray-200 px-6 py-5 relative overflow-hidden flex flex-col">
            <div className={`absolute left-0 top-0 h-full w-2 rounded-l-xl bg-orange-400`} />
            <h3 className="font-bold text-lg text-gray-900">{offer.title}</h3>
            <p className="text-gray-600 mb-3">{offer.description}</p>
            <div>
              <span className="inline-block bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-md mb-2">
                {offer.code}
              </span>
            </div>
            <div className="text-[13px] text-gray-400 flex flex-col gap-1">
              <div>
                Minimum order: ₹{offer.minOrder} • Maximum discount: ₹{offer.maxDiscount}
              </div>
            </div>
          </div>
        ))}
      </div>
   

    <FooterNav activeTab="offers"  />
    </div>
  )
}

export default Offers

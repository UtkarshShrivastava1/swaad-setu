// BackButton.jsx
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/web")}
      className="flex items-center gap-2 px-4 py-2 mt-20 ml-6
                 bg-white text-gray-800 font-medium 
                 rounded-full shadow hover:shadow-md hover:bg-gray-100 
                 transition absolute"
    >
      <ArrowLeft size={18} />
      Back to Home
    </button>
  );
}

import { useNavigate } from "react-router-dom";

export default function MobileFloatingButton(): JSX.Element {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/select-restaurant")}
      aria-label="Floating action button"
      className="
        fixed bottom-5 right-5 z-50
        md:hidden
        flex items-center justify-center
        w-24 h-14
        rounded-xl
        bg-yellow-400 text-black
        shadow-xl
        transition-transform
        active:scale-95
        hover:scale-105
      "
    >
      Go to app
    </button>
  );
}

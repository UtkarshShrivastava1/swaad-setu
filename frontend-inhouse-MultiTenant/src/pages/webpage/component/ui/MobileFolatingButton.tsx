import { useNavigate } from "react-router-dom";

export default function MobileFloatingButton(): JSX.Element {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/select-restaurant")}
      aria-label="Floating action button"
      className="
        fixed top-20 right-0 z-50
        md:hidden
        flex items-center justify-center
        w-20 h-12
        rounded-l-full
        bg-yellow-400 text-black
        shadow-lg
        transition-all
        active:scale-95
        hover:bg-yellow-500
        font-semibold
        pr-2
      "
    >
      App
    </button>
  );
}

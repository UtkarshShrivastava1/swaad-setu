import { RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  className?: string;
  label?: string;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({
  onClick,
  loading = false,
  className,
  label = "Refresh",
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      variant="ghost"
      size="sm"
      className={cn(
        "relative flex items-center rounded-xl px-3 py-2",
        { "gap-2": label },
        "bg-zinc-900 text-zinc-200",
        "border border-zinc-800",
        "shadow-[0_0_0_0_rgba(255,255,255,0.0)]",
        "transition-all duration-300 ease-out",
        "hover:bg-zinc-800 hover:border-zinc-700",
        "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_30px_-12px_rgba(0,0,0,0.8)]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
    >
      {/* Gradient glow ring */}
      <span
        className={cn(
          "pointer-events-none absolute inset-0 rounded-xl",
          "opacity-0 transition-opacity duration-300",
          "bg-gradient-to-br from-indigo-500/20 via-cyan-500/10 to-transparent",
          loading && "opacity-100"
        )}
      />

      {/* Icon */}
      <RefreshCw
        className={cn(
          "relative h-4 w-4 transition-transform duration-500",
          loading ? "animate-spin text-cyan-400" : "group-hover:rotate-180"
        )}
      />

      {/* Optional label */}
      {label && <span className="relative text-sm font-medium tracking-wide">
        {label}
      </span>}
    </Button>
  );
};

export default RefreshButton;

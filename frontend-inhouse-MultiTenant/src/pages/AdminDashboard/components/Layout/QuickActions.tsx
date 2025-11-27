import { useState } from "react";
import AddMenuItemModal from "../modals/AddMenuItemModal";
import AddOrderModal from "../modals/AddOrderModal";
import AddTableModal from "../modals/AddTableModal";

type QuickActionsProps = {
  onTabChange: (tabId: string) => void;
};

function QuickActions({ onTabChange }: QuickActionsProps) {
  const [modalType, setModalType] = useState<string | null>(null);
  const rid = import.meta.env.VITE_RID;

  return (
    <div className="flex flex-col xl:flex-row gap-3 w-full mb-5">
      <button
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-lg transition cursor-pointer"
        onClick={() => onTabChange("orders")}
      >
        Manage Order
      </button>

      <button
        className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition cursor-pointer"
        onClick={() => onTabChange("menu")}
      >
        Manage Menu Item
      </button>

      <button
        className="w-full bg-white border border-gray-300 hover:border-yellow-400 text-gray-800 font-semibold py-3 rounded-lg transition cursor-pointer"
        onClick={() => onTabChange("tables")}
      >
        Manage Tables
      </button>

      <AddOrderModal
        isOpen={modalType === "order"}
        onClose={() => setModalType(null)}
      />
      <AddMenuItemModal
        isOpen={modalType === "menu"}
        onClose={() => setModalType(null)}
        rid={rid}
        onItemAdded={(newItem) => console.log("Created MenuItem!", newItem)}
      />
      <AddTableModal
        isOpen={modalType === "table"}
        onClose={() => setModalType(null)}
        rid={rid}
        onTableCreated={(table) => console.log("Created Table!", table)}
      />
    </div>
  );
}
export default QuickActions;

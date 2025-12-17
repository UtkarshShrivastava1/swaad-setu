import { LogOut } from "lucide-react";
import { MdOutlineTableBar } from "react-icons/md";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTable } from "../../context/TableContext";
import { useTenant } from "../../context/TenantContext";

const SubHeader: React.FC = () => {
  const { tenant, rid } = useTenant();
  const { table, clearTable } = useTable();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearTable();
    if (rid) {
      navigate(`/t/${rid}`);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex justify-between items-center p-4 bg-gray-800 shadow-md">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-white">
          {tenant?.restaurantName}
        </h1>
      </div>
      <div className="flex items-center">
        {table && (
          <div className="flex items-center mr-4 text-white">
            <MdOutlineTableBar size={20} className="mr-2" />
            <p className="text-lg">{table.tableNumber}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="p-2 bg-yellow-500 text-black rounded-full hover:bg-yellow-600 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
};

export default SubHeader;

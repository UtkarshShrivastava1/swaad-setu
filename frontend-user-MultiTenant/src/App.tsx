import { Route, Routes, Navigate } from "react-router-dom";
import TenantGuard from "./guards/TenantGuard";
import TableSetter from "./guards/TableSetter";
import { TableProvider } from "./context/TableContext";
import HomePage from "./pages/HomePage";
import RootPage from "./pages/RootPage";

function App() {
  return (
    <Routes>
      {/* Route that handles tenant-specific access */}
      <Route
        path="/t/:rid/*"
        element={
          <TenantGuard>
            <TableProvider>
              <Routes>
                {/* QR Code Entry Route */}
                <Route path="table/:tableId" element={<TableSetter />} />

                {/* Main App Routes */}
                <Route path="*" element={<HomePage />} />
              </Routes>
            </TableProvider>
          </TenantGuard>
        }
      />

      {/* Fallback/Default Route */}
      <Route path="/" element={<RootPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

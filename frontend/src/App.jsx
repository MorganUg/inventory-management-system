import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import { RoleRoute } from "./components/shared/RoleRoute.jsx";

import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/DashboardPage.jsx";
import RawMaterialsPage from "./pages/rawMaterials/RawMaterialsPage.jsx";

import { ProtectedRoute } from "./components/shared/ProtectedRoute.jsx";
import CategoriesPage from "./pages/categories/CategoriesPage.jsx";
import SuppliersPage from "./pages/suppliers/SuppliersPage.jsx";
import CustomerPage from "./pages/customers/CustomerPage.jsx";
import RestocksPage from "./pages/restocks/RestocksPage.jsx";
import FinishedGoodsPage from "./pages/finishedGoods/FinishedGoodsPage.jsx";
import BomPage from "./pages/bom/BomPage.jsx";
import BatchesPage from "./pages/batches/BatchesPage.jsx";
import DispatchesPage from "./pages/dispatches/DispatchesPage.jsx";
import StockMovementsPage from "./pages/stockMovements/StockMovementPage.jsx";
import ReportsPage from "./pages/reports/ReportsPage.jsx";
import BatchDetailPage from "./pages/batches/BatchDetailPage.jsx";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="raw-materials" element={<RawMaterialsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route
                path="restocks"
                element={
                  <RoleRoute roles={["admin", "manager"]}>
                    <RestocksPage />
                  </RoleRoute>
                }
              />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="customers" element={<CustomerPage />} />
              <Route path="finished-goods" element={<FinishedGoodsPage />} />
              <Route
                path="bom"
                element={
                  <RoleRoute roles={["admin", "manager"]}>
                    <BomPage />
                  </RoleRoute>
                }
              />
              <Route path="batches" element={<BatchesPage />} />
              <Route path="batches/:id" element={<BatchDetailPage />} />
              <Route
                path="dispatches"
                element={
                  <RoleRoute roles={["admin", "manager"]}>
                    <DispatchesPage />
                  </RoleRoute>
                }
              />
              <Route
                path="stock-movements"
                element={
                  <RoleRoute roles={["admin", "manager"]}>
                    <StockMovementsPage />
                  </RoleRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <RoleRoute roles={["admin", "manager"]}>
                    <ReportsPage />
                  </RoleRoute>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

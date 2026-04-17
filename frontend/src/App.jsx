import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './pages/context/AuthContext.jsx'; 
import { AppLayout } from './components/layout/AppLayout.jsx';


import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/DashboardPage.jsx';
import { ProctectedRoute } from './components/shared/ProtectedRoute.jsx';


const queryClient = new QueryClient();

function App() {
 
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProctectedRoute>
                <AppLayout />
              </ProctectedRoute>
            }>
              <Route index element={<DashboardPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Toaster } from 'sonner';
import { Suspense, lazy } from 'react';
import React from 'react';
import { Home } from './pages/Home';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Search = lazy(() => import('./pages/Search'));
const TribeProfile = lazy(() => import('./pages/TribeProfile'));
const Landing = lazy(() => import('./pages/Landing'));
const DiscoverTribes = lazy(() => import('./pages/DiscoverTribes'));
const Profile = lazy(() => import('./pages/Profile'));
const CreatePostPage = lazy(() => import('./pages/CreatePostPage'));
const Chat = lazy(() => import('./pages/Chat'));

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          }
        >
          <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected routes */}
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Home />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Search />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/discover"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DiscoverTribes />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tribes/:tribeId"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TribeProfile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:userId"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-post"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CreatePostPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Chat />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Catch all other routes and redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Suspense>
        <Toaster position="top-center" />
      </AuthProvider>
    </Router>
  );
}

export default App;
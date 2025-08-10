import { useAuth } from '../../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>; // Atau tampilkan spinner
  }

  return currentUser ? children : <Navigate to="/login" state={{ from: location }} replace />;
}
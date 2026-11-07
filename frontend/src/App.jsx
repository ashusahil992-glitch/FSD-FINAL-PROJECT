import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import SellItem from './pages/SellItem.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Messages from './pages/Messages.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import CampusBoard from './pages/CampusBoard.jsx';
import Services from './pages/Services.jsx';
import VerificationStatus from './pages/VerificationStatus.jsx';
import LocalDeals from './pages/LocalDeals.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Notifications from './pages/Notifications.jsx';
import HostelClearance from './pages/HostelClearance.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/local-deals" element={<LocalDeals />} />
        <Route path="/verification" element={<VerificationStatus />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/hostel-clearance" element={<HostelClearance />} />
        <Route path="/hostel-clearance/new" element={<SellItem hostelClearanceOnly />} />
        <Route path="/services/new" element={<SellItem serviceOnly />} />
        <Route path="/services/:id/edit" element={<SellItem serviceOnly />} />
        <Route path="/sell" element={<SellItem />} />
        <Route path="/listings/:id/edit" element={<SellItem />} />
        <Route path="/listings/:id" element={<ProductDetails />} />
        <Route path="/messages/:conversationId?" element={<Messages />} />
        <Route path="/campus-board" element={<CampusBoard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

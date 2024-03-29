import React from 'react';
import Album from './pages/MainPage';
import Navbar from './modules/views/Navbar';
import Footer from './modules/views/Footer';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { Routes, Route } from 'react-router-dom';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ForgotPassword from './pages/ForgotPassword';
import CreateRecipe from './pages/CreateRecipe';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Album />} />
        <Route path="/signIn" element={<SignIn />} />
        <Route path="/signUp" element={<SignUp />} />
        <Route path="/terms" element={<Privacy />} />
        <Route path="/privacy" element={<Terms />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/recipe/create" element={<CreateRecipe />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;

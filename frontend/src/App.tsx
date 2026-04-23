import Blog from "./Blog.tsx";
import type {} from '@mui/material/themeCssVarsAugmentation';
import {BrowserRouter, HashRouter, Routes, Route} from "react-router";
import SignIn from "./components/SignIn.tsx";
import SignUp from "./components/SignUp.tsx";

const resolveRouter = () => (
  import.meta.env.VITE_ROUTER_MODE === 'hash' ? HashRouter : BrowserRouter
);

function App() {
  const Router = resolveRouter();

  return (
        <Router>
            <Routes>
                <Route path="/" element={<Blog />} />
                <Route path="/signin" element={<SignIn/>}/>
                <Route path="/signup" element={<SignUp/>}/>
            </Routes>
        </Router>
  )
}

export default App

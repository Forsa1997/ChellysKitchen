import Blog from "./Blog.tsx";
import type {} from '@mui/material/themeCssVarsAugmentation';
import {BrowserRouter, Routes, Route} from "react-router";
import SignIn from "./components/SignIn.tsx";
import SignUp from "./components/SignUp.tsx";

function App() {

  return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Blog />} />
                <Route path="/signin" element={<SignIn/>}/>
                <Route path="/signup" element={<SignUp/>}/>
            </Routes>
        </BrowserRouter>
  )
}

export default App

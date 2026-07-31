import { Route, Routes } from "react-router-dom";
import Home from "../../pages/Home";
import About from "../../pages/About";
import Login from "../../pages/Login";
import ChangePassword from "../../pages/ChangePassword";

const AppRoutes = (
  <Routes>
    <Route path="/">
      <Route index element={<Home />} />
      <Route path="about" element={<About />} />
      <Route path="login" element={<Login />} />
      <Route path="change-password" element={<ChangePassword />} />
    </Route>
  </Routes>
);

export default AppRoutes;

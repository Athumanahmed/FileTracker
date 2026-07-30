import { Route, Routes } from "react-router-dom";
import Home from "../../pages/Home";
import About from "../../pages/About";

const AppRoutes = (
  <Routes>
    <Route path="/">
      <Route index element={<Home />} />
      <Route path="about" element={<About />} />
    </Route>
  </Routes>
);

export default AppRoutes;

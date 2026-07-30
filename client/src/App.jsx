import { Toaster } from "react-hot-toast";
import AppRoutes from "./components/layouts/AppRoutes";

const App = () => {
  return (
    <div>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "20px",
            background: "#000",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "400",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      {AppRoutes}
    </div>
  );
};

export default App;

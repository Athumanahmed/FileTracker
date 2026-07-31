import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import AppRoutes from "./components/layouts/AppRoutes";
import useAuthStore from "./store/authStore";

const App = () => {
  const fetchUserProfile = useAuthStore((state) => state.fetchUserProfile);

  // Resolve any existing session once on load (backed by the httpOnly
  // refresh cookie) so a page reload doesn't force a re-login.
  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

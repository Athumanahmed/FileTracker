import { ArrowLeft, Home, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { imageAssets } from "../assets/assets";

const NotAuthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl  overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* LEFT: IMAGE */}
          <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-6">
            <img
              src={imageAssets.un_authorized}
              alt="Not authorized"
              className="w-full max-w-md object-contain"
            />
          </div>

          {/* RIGHT: CONTENT */}
          <div className="md:w-1/2 p-8 sm:p-10 flex flex-col gap-5 justify-center items-center">
            <div className="flex justify-center">
              <div className="bg-red-50 text-red-600 p-4 rounded-full">
                <ShieldAlert size={42} strokeWidth={1.5} />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold  text-gray-800 text-center">
              Access Denied
            </h1>

            <p className="mt-3 text-gray-500 text-sm sm:text-base leading-relaxed text-center">
              You do not have permission to access this page or resource. Please
              go back or return to the homepage.
            </p>

            {/* ACTIONS */}
            <div className="flex mx-auto items-center justify-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
              >
                <ArrowLeft size={18} />
                Go Back
              </button>

              <button
                onClick={() => navigate("/")}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm rounded-full bg-primaryBlue text-white hover:bg-primaryBlue/90 transition shadow-sm"
              >
                <Home size={18} />
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotAuthorized;

import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import DashboardPreview from "./DashboardPreview";
import useAuthStore from "../../store/authStore";
import { getDashboardHomePath } from "../../utils/dashboardHome";

const Hero = () => {
  // Home is public -- useAuthStore is safely readable here even when
  // logged out (user is just null), same pattern as the rest of the app.
  const user = useAuthStore((state) => state.user);
  const basePath = getDashboardHomePath(user);

  return (
    <section className="bg-primaryBlueLight/60">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-20">
        {/* LEFT: COPY */}
        <div>
          <h1 className="text-4xl font-extrabold leading-tight text-primaryBlue sm:text-5xl">
            ELECTRONIC FILE TRACKING &amp; MANAGEMENT SYSTEM
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600">
            Digitizing government file management through secure registration,
            workflow automation, real-time tracking and transparent service
            delivery.
          </p>

          {user && (
            <Link
              to={`${basePath}/search`}
              className="mt-3 inline-flex items-center gap-2 bg-primaryBlue px-6 py-3 rounded-full text-sm text-white font-medium hover:bg-primaryBlueDark transition-colors"
            >
              <Search size={16} />
              Track your File
            </Link>
          )}
        </div>

        {/* RIGHT: DASHBOARD PREVIEW */}
        <div>
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
};

export default Hero;

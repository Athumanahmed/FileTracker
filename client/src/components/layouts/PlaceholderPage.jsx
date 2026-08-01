import { Construction } from "lucide-react";

/** Stand-in for a module whose route/permission/sidebar wiring exists but whose UI isn't built yet. */
const PlaceholderPage = ({ title, description = "This module is coming soon." }) => (
  <div className="flex flex-col items-center justify-center text-center py-24">
    <div className="w-16 h-16 rounded-full bg-primaryBlueLight flex items-center justify-center mb-4">
      <Construction className="text-primaryBlue" size={28} />
    </div>
    <h1 className="text-xl font-bold text-gray-900">{title}</h1>
    <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>
  </div>
);

export default PlaceholderPage;

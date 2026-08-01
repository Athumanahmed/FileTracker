const Tabs = ({ activeTab, setActiveTab, tabs = [] }) => {
  return (
    <div className="mt-5 border-b border-gray-200">
      <div
        className="
          overflow-x-auto
          scrollbar-hide
          [-ms-overflow-style:none]
          scrollbar-none
        "
      >
        <div className="flex min-w-max">
          {tabs.map(({ id, name, icon: Icon }) => {
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex shrink-0 items-center gap-2 px-5 py-3 text-sm font-light whitespace-nowrap transition duration-200 ${
                  isActive
                    ? "text-primary"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {Icon && <Icon className="size-4" />}

                <span>{name}</span>

                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Tabs;

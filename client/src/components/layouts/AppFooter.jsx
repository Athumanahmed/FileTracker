const AppFooter = () => {
  return (
    <footer className="border-t border-gray-200 text-sm text-gray-500 py-2.5 text-center">
      &copy; {new Date().getFullYear()}{" "}
      <span className="font-bold text-primary">E-File</span> — All rights
      reserved.
    </footer>
  );
};

export default AppFooter;

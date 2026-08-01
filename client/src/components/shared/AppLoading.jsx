import React from "react";
import { motion } from "framer-motion";
import { imageAssets } from "../../assets/assets";

const AppLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <motion.div
        className="flex flex-col items-center justify-center bg-white  rounded-4xl border border-gray-100 p-8 w-[90%] max-w-sm h-80"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.img
          src={imageAssets.logo}
          alt="Logo"
          className="w-40 h-40 object-contain mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.05, 1], opacity: 1 }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
        <motion.h1
          className="text-gray-700 text-lg md:text-xl font-semibold tracking-wide text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          E-File <br />
        </motion.h1>
      </motion.div>
      <footer className="py-5 text-center text-sm text-gray-500  backdrop-blur-md border-t border-gray-100">
        © {new Date().getFullYear()} E-File Management System — All Rights
        Reserved
      </footer>
    </div>
  );
};

export default AppLoading;

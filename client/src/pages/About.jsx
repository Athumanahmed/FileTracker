import React from "react";
import Navbar from "../components/layouts/Navbar";
import Footer from "../components/layouts/Footer";
import AboutHero from "../components/about/AboutHero";
import MissionVisionValues from "../components/about/MissionVisionValues";
import ImpactStats from "../components/about/ImpactStats";

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <AboutHero />
      <MissionVisionValues />
      <ImpactStats />
      <Footer />
    </div>
  );
};

export default About;

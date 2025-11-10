import { useEffect } from "react";
import { useLocation } from "wouter";
import "../styles/landing.css"; // We'll create this file next

export default function LandingPage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Load the video
    const video = document.getElementById('bg-video') as HTMLVideoElement;
    if (video) {
      video.play().catch(error => {
        console.error("Video autoplay failed:", error);
      });
    }
    
    // Add a class to the body to remove any default margins/paddings
    document.body.classList.add('landing-page-body');
    
    return () => {
      // Clean up when component unmounts
      document.body.classList.remove('landing-page-body');
    };
  }, []);

  const getStarted = () => {
    navigate("/auth");
  };

  return (
    <div className="landing-page">
      <video autoPlay muted loop id="bg-video" playsInline>
        <source src="/schat_landing_custom_video/assets/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="content">
        <h1>HI!</h1>
        <p>Welcome to <strong>SCHAT World</strong></p>
        <button onClick={getStarted}>GET STARTED</button>
      </div>
    </div>
  );
} 
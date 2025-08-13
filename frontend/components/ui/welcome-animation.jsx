"use client";

import { useState, useEffect } from "react";

export function WelcomeAnimation({
  title,
  subtitle,
  icon = "fa-graduation-cap",
  autoHide = false,
  autoHideDelay = 3000,
  onComplete = null,
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) {
          onComplete();
        }
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onComplete]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onComplete) {
      onComplete();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-indigo-900/90 backdrop-blur-sm z-50 flex items-center justify-center cursor-pointer"
      onClick={handleDismiss}
    >
      <div className="text-center text-white max-w-lg px-8">
        {/* Main Icon with Sparkles */}
        <div className="relative mb-8 animate-scale-in">
          <div className="text-8xl mb-4 relative">
            <i className={`fas ${icon} text-white animate-bounce-slow`}></i>

            {/* Sparkle Effects */}
            <div className="absolute -top-4 -left-4 text-2xl">
              <i
                className="fas fa-sparkles text-yellow-300 animate-ping"
                style={{ animationDelay: "0s" }}
              ></i>
            </div>
            <div className="absolute -top-2 -right-6 text-xl">
              <i
                className="fas fa-star text-yellow-400 animate-ping"
                style={{ animationDelay: "0.5s" }}
              ></i>
            </div>
            <div className="absolute -bottom-2 -left-6 text-lg">
              <i
                className="fas fa-sparkles text-blue-300 animate-ping"
                style={{ animationDelay: "1s" }}
              ></i>
            </div>
            <div className="absolute -bottom-4 -right-2 text-xl">
              <i
                className="fas fa-star text-purple-300 animate-ping"
                style={{ animationDelay: "1.5s" }}
              ></i>
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="animate-slide-up animation-delay-200">
          <h1 className="text-4xl font-bold mb-4 text-white">{title}</h1>
          <p className="text-xl text-blue-100 mb-8">{subtitle}</p>

          {/* Click to Continue */}
          <div className="animate-fade-in animation-delay-500">
            <p className="text-sm text-blue-200 mb-2 flex items-center justify-center">
              <i className="fas fa-mouse-pointer mr-2 animate-bounce"></i>
              Click anywhere to continue
            </p>
            <div className="flex justify-center">
              <div className="w-6 h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="w-full h-full bg-white/60 rounded-full animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

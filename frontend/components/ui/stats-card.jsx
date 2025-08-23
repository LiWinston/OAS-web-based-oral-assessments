import Link from "next/link";
import { Button } from "./button";

export function StatsCard({
  title,
  value,
  icon,
  bgColor,
  shadowColor,
  iconBg,
  hoverEffect,
  warning = null,
  showProgress = false,
  progressValue = 0,
  progressLabel = "",
  index = 0,
  onClick = null,
  actionText = null,
  actionHref = null,
}) {
  return (
    <div
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg 
        transition-all duration-300 transform group
        ${onClick ? "cursor-pointer" : ""}
        ${hoverEffect} ${shadowColor}
        animate-fadeInUp overflow-hidden
      `}
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={onClick}
    >
      {/* Background Gradient Overlay */}
      <div
        className={`
        absolute inset-0 bg-gradient-to-br ${bgColor} opacity-0 
        group-hover:opacity-10 transition-opacity duration-300
      `}
      ></div>

      {/* Decorative Corner */}
      <div
        className={`
        absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br ${bgColor} 
        rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500
      `}
      ></div>

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white group-hover:scale-110 transition-transform inline-block">
            {value}
          </p>
          {warning && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center">
              <i className="fas fa-exclamation-triangle mr-1"></i>
              {warning}
            </p>
          )}
        </div>

        <div
          className={`
          w-14 h-14 rounded-full ${iconBg} flex items-center justify-center
          group-hover:scale-110 group-hover:rotate-12 transition-all duration-300
        `}
        >
          <i
            className={`fas ${icon} text-xl bg-gradient-to-br ${bgColor} bg-clip-text text-transparent`}
          ></i>
        </div>
      </div>

      {/* Optional Progress Bar */}
      {showProgress && (
        <div className="mt-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`
                h-full rounded-full transition-all duration-1000 relative overflow-hidden
                ${
                  progressValue === 100
                    ? "bg-gradient-to-r from-green-400 to-green-600"
                    : progressValue > 50
                    ? "bg-gradient-to-r from-blue-400 to-blue-600"
                    : progressValue > 0
                    ? "bg-gradient-to-r from-amber-400 to-amber-600"
                    : "bg-gray-300"
                }
              `}
              style={{ width: `${Math.min(progressValue, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
            </div>
          </div>
          {progressLabel && (
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{progressLabel}</span>
              <span>{progressValue}%</span>
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      {actionText && actionHref && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link href={actionHref}>
            <Button
              variant="outline"
              size="sm"
              className={`
                w-full text-xs h-8 border-gray-300 dark:border-gray-600 
                hover:border-transparent hover:bg-gradient-to-r 
                hover:${bgColor} hover:text-white hover:shadow-lg 
                transform hover:scale-105 transition-all duration-200 
                font-medium group-hover:border-transparent
                group-hover:bg-gradient-to-r group-hover:${bgColor} 
                group-hover:text-white
              `}
            >
              <i className="fas fa-arrow-right mr-2"></i>
              {actionText}
            </Button>
          </Link>
        </div>
      )}

      {/* Hover Effect Ripple */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`
          w-32 h-32 bg-gradient-to-br ${bgColor} rounded-full 
          opacity-0 group-hover:opacity-20 scale-0 group-hover:scale-150 
          transition-all duration-700 ease-out
        `}
        ></div>
      </div>

      {/* Magical floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`
          absolute top-4 right-8 w-1 h-1 bg-gradient-to-br ${bgColor} rounded-full
          opacity-0 group-hover:opacity-60 group-hover:animate-bounce
          transition-all duration-300
        `}
          style={{ animationDelay: "0s" }}
        ></div>
        <div
          className={`
          absolute top-8 right-4 w-1 h-1 bg-gradient-to-br ${bgColor} rounded-full
          opacity-0 group-hover:opacity-40 group-hover:animate-bounce
          transition-all duration-300
        `}
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className={`
          absolute top-12 right-12 w-1 h-1 bg-gradient-to-br ${bgColor} rounded-full
          opacity-0 group-hover:opacity-50 group-hover:animate-bounce
          transition-all duration-300
        `}
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
    </div>
  );
}

export function StatsCardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

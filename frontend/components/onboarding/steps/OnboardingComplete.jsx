'use client';

import { CheckCircle, ArrowRight } from 'lucide-react';
import OnboardingLayout from '../OnboardingLayout';
import { useEffect, useState } from 'react';

export default function OnboardingComplete({ role, fullName }) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti animation after mount
    setTimeout(() => setShowConfetti(true), 100);
  }, []);

  const getRoleContent = () => {
    switch (role) {
      case 'COURSE_ADMIN':
        return {
          title: 'Welcome Aboard, Course Administrator!',
          message: `Congratulations ${fullName || ''}! Your account has been successfully created.`,
          redirect: 'You will be redirected to your admin dashboard in a moment...',
          emoji: '🎓',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'from-blue-500 to-blue-600'
        };
      
      case 'EXAMINER':
        return {
          title: 'Welcome, Examiner!',
          message: `Great news ${fullName || ''}! Your examiner account is ready.`,
          redirect: 'Taking you to your examiner dashboard...',
          emoji: '📋',
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'from-purple-500 to-purple-600'
        };
      
      case 'STUDENT':
        return {
          title: 'Welcome, Student!',
          message: `Hi ${fullName || ''}! Your student account is all set up.`,
          redirect: 'Redirecting to your student dashboard...',
          emoji: '📚',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'from-green-500 to-green-600'
        };
      
      default:
        return {
          title: 'Account Created Successfully!',
          message: `Welcome ${fullName || ''}! Your account is ready.`,
          redirect: 'Redirecting to your dashboard...',
          emoji: '🎉',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'from-blue-500 to-blue-600'
        };
    }
  };

  const content = getRoleContent();

  return (
    <OnboardingLayout role={role}>
      <div className="flex flex-col items-center text-center relative">
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="animate-confetti-1">🎊</div>
            <div className="animate-confetti-2">🎉</div>
            <div className="animate-confetti-3">✨</div>
            <div className="animate-confetti-4">🎈</div>
          </div>
        )}
        
        {/* Success Icon */}
        <div className="mb-6 relative">
          <div className={`w-24 h-24 bg-gradient-to-br ${content.bgColor} rounded-full flex items-center justify-center shadow-lg animate-scaleIn`}>
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 text-4xl animate-bounce">
            {content.emoji}
          </div>
        </div>
        
        <h1 
          className={`text-3xl font-semibold ${content.color} mb-4 animate-fadeIn`}
          style={{ fontWeight: 500 }}
        >
          {content.title}
        </h1>
        
        <p 
          className="text-gray-600 dark:text-gray-300 text-center mb-6 text-lg leading-relaxed max-w-md animate-fadeIn"
          style={{ fontWeight: 300, animationDelay: '0.2s' }}
        >
          {content.message}
        </p>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 animate-pulse">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>{content.redirect}</span>
        </div>
        
        {/* What's Next Section */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg w-full max-w-md animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
            What happens next?
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left">
            {role === 'COURSE_ADMIN' && (
              <>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Access your admin dashboard to manage courses</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Create oral assessments and configure rubrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Invite students and examiners to your courses</span>
                </li>
              </>
            )}
            {role === 'EXAMINER' && (
              <>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>View your assigned assessments</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Self-assign to available time slots</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Conduct assessments and provide feedback</span>
                </li>
              </>
            )}
            {role === 'STUDENT' && (
              <>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>View your upcoming assessments</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Book your preferred time slot</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Receive results and feedback after assessment</span>
                </li>
              </>
            )}
          </ul>
        </div>
        
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
          🔒 Your account is secure • 📧 Check your email for confirmation
        </p>
      </div>
      
      <style jsx>{`
        @keyframes confetti-1 {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes confetti-2 {
          0% { transform: translate(-100vw, -100vh) rotate(0deg); opacity: 1; }
          100% { transform: translate(100vw, 100vh) rotate(-720deg); opacity: 0; }
        }
        @keyframes confetti-3 {
          0% { transform: translate(100vw, -100vh) rotate(0deg); opacity: 1; }
          100% { transform: translate(-100vw, 100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes confetti-4 {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(-720deg); opacity: 0; }
        }
        .animate-confetti-1 {
          position: absolute;
          left: 10%;
          animation: confetti-1 3s ease-out;
          font-size: 2rem;
        }
        .animate-confetti-2 {
          position: absolute;
          left: 30%;
          animation: confetti-2 3s ease-out 0.2s;
          font-size: 2rem;
        }
        .animate-confetti-3 {
          position: absolute;
          left: 60%;
          animation: confetti-3 3s ease-out 0.4s;
          font-size: 2rem;
        }
        .animate-confetti-4 {
          position: absolute;
          left: 80%;
          animation: confetti-4 3s ease-out 0.6s;
          font-size: 2rem;
        }
      `}</style>
    </OnboardingLayout>
  );
}
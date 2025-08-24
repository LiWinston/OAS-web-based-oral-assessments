'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyOnboardingToken } from '../../../services/onboardingService';
import OnboardingWizard from '../../../components/onboarding/OnboardingWizard';
import OnboardingLayout from '../../../components/onboarding/OnboardingLayout';
import { Spinner } from '../../../components/ui/spinner';
import { Button } from '../../../components/ui/button';
import { AlertCircle, XCircle, UserCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationState, setVerificationState] = useState({
    isLoading: true,
    isValid: false,
    isAlreadyRegistered: false,
    data: null,
    error: null
  });

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setVerificationState({
        isLoading: false,
        isValid: false,
        isAlreadyRegistered: false,
        data: null,
        error: 'No token provided. Please use the link from your invitation email.'
      });
      return;
    }

    verifyToken(token);
  }, [token]);

  const verifyToken = async (token) => {
    try {
      const response = await verifyOnboardingToken(token);
      
      if (response.success) {
        if (response.alreadyRegistered) {
          setVerificationState({
            isLoading: false,
            isValid: false,
            isAlreadyRegistered: true,
            data: response,
            error: null
          });
        } else {
          setVerificationState({
            isLoading: false,
            isValid: true,
            isAlreadyRegistered: false,
            data: response,
            error: null
          });
        }
      } else {
        let errorMessage = 'Invalid or expired token.';
        
        if (response.status === 'expired') {
          errorMessage = 'This invitation link has expired. Please contact your administrator for a new invitation.';
        } else if (response.status === 'used') {
          errorMessage = 'This invitation link has already been used. Please sign in to your account.';
        }
        
        setVerificationState({
          isLoading: false,
          isValid: false,
          isAlreadyRegistered: false,
          data: null,
          error: errorMessage
        });
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      setVerificationState({
        isLoading: false,
        isValid: false,
        isAlreadyRegistered: false,
        data: null,
        error: 'Failed to verify your invitation. Please try again or contact support.'
      });
    }
  };

  // Loading state
  if (verificationState.isLoading) {
    return (
      <OnboardingLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner className="w-12 h-12 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Verifying your invitation link...
          </p>
        </div>
      </OnboardingLayout>
    );
  }

  // Already registered state
  if (verificationState.isAlreadyRegistered) {
    return (
      <OnboardingLayout>
        <div className="flex flex-col items-center text-center py-8">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <UserCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
            You're Already Registered!
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-2 max-w-md">
            Good news! Your account has already been set up.
          </p>
          
          {verificationState.data?.email && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Email: <span className="font-medium">{verificationState.data.email}</span>
            </p>
          )}
          
          <Link href={`/login${verificationState.data?.email ? `?email=${encodeURIComponent(verificationState.data.email)}` : ''}`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2">
              Sign In to Your Account
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
            If you forgot your password, you can reset it on the login page.
          </p>
        </div>
      </OnboardingLayout>
    );
  }

  // Error state
  if (verificationState.error || !verificationState.isValid) {
    const isExpired = verificationState.error?.includes('expired');
    const isUsed = verificationState.error?.includes('already been used');
    
    return (
      <OnboardingLayout>
        <div className="flex flex-col items-center text-center py-8">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              {isExpired ? (
                <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
          
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
            {isExpired ? 'Link Expired' : isUsed ? 'Link Already Used' : 'Invalid Link'}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
            {verificationState.error || 'This invitation link is not valid.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {(isExpired || !token) && (
              <Button
                onClick={() => router.push('/login')}
                variant="outline"
                className="px-6 py-3 rounded-xl"
              >
                Contact Administrator
              </Button>
            )}
            
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                Go to Login
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-w-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Need help?</strong> If you believe this is an error, please contact your course administrator or system support with your invitation email.
            </p>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  // Valid token - show wizard
  return (
    <OnboardingWizard
      token={token}
      verificationData={verificationState.data}
      onError={(error) => {
        setVerificationState(prev => ({
          ...prev,
          isValid: false,
          error
        }));
      }}
    />
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <OnboardingLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner className="w-12 h-12 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Loading onboarding...
          </p>
        </div>
      </OnboardingLayout>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
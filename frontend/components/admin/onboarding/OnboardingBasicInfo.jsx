'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import OnboardingLayout from './OnboardingLayout';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

export default function OnboardingBasicInfo({ data, onUpdate, onNext, onPrev }) {
  const [formData, setFormData] = useState({
    email: data.email || 'your.email@example.com',
    fullName: data.fullName || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      alert('Please enter your full name');
      return;
    }
    onUpdate(formData);
    onNext();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <OnboardingLayout step={0} stepLabel="Account Info">
      <h1 
        className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center"
        style={{ fontWeight: 400 }}
      >
        Confirm Your Email & Insert Your Name
      </h1>
      
      <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
        <div>
          <Label 
            htmlFor="email" 
            className="block text-sm text-gray-500 dark:text-gray-400 mb-1"
          >
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            readOnly
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 font-light focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
            style={{ fontWeight: 300 }}
          />
        </div>
        
        <div>
          <Label 
            htmlFor="fullname" 
            className="block text-sm text-gray-500 dark:text-gray-400 mb-1"
          >
            Full Name
          </Label>
          <Input
            id="fullname"
            name="fullname"
            type="text"
            placeholder="Please enter your full name"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 font-light focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
            style={{ fontWeight: 300 }}
          />
        </div>
        
        <div className="flex justify-between gap-4 mt-2">
          <Button
            type="button"
            onClick={onPrev}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl shadow hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
            style={{ fontWeight: 400 }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
          <Button
            type="submit"
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition font-medium flex items-center justify-center gap-2"
            style={{ fontWeight: 400 }}
          >
            Next<ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
}

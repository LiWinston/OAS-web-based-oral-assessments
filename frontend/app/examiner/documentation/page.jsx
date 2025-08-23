'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

/**
 * ExaminerDocumentation Component
 * 
 * Documentation and help page for examiners with guides,
 * tutorials, and resources for conducting effective assessments.
 */
export default function ExaminerDocumentation() {
  const documentationSections = [
    {
      title: 'Getting Started',
      icon: 'fas fa-play-circle',
      color: 'text-blue-600',
      items: [
        'Quick Start Guide for New Examiners',
        'Understanding the Assessment Interface',
        'Setting Up Your Profile and Preferences',
        'Navigating the Dashboard'
      ]
    },
    {
      title: 'Assessment Guidelines',
      icon: 'fas fa-clipboard-check',
      color: 'text-green-600',
      items: [
        'Best Practices for Oral Assessments',
        'Using Rubrics Effectively',
        'Providing Constructive Feedback',
        'Managing Assessment Time'
      ]
    },
    {
      title: 'Technical Support',
      icon: 'fas fa-tools',
      color: 'text-purple-600',
      items: [
        'Troubleshooting Common Issues',
        'System Requirements',
        'Browser Compatibility',
        'Contact Technical Support'
      ]
    },
    {
      title: 'Policies & Procedures',
      icon: 'fas fa-book',
      color: 'text-orange-600',
      items: [
        'Assessment Policies',
        'Academic Integrity Guidelines',
        'Privacy and Data Protection',
        'Grading Standards'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Documentation & Help
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive guides and resources for effective assessment management
          </p>
        </div>
        <Button>
          <i className="fas fa-headset mr-2"></i>
          Contact Support
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dashboard-card hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <i className="fas fa-video text-3xl text-blue-600 mb-3"></i>
            <h3 className="font-semibold mb-2">Video Tutorials</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Watch step-by-step video guides
            </p>
          </CardContent>
        </Card>
        
        <Card className="dashboard-card hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <i className="fas fa-question-circle text-3xl text-green-600 mb-3"></i>
            <h3 className="font-semibold mb-2">FAQ</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Find answers to common questions
            </p>
          </CardContent>
        </Card>
        
        <Card className="dashboard-card hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <i className="fas fa-download text-3xl text-purple-600 mb-3"></i>
            <h3 className="font-semibold mb-2">Downloads</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Access templates and resources
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Documentation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documentationSections.map((section, index) => (
          <Card key={index} className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className={`${section.icon} ${section.color} mr-3`}></i>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center text-sm">
                    <i className="fas fa-chevron-right text-gray-400 mr-2 text-xs"></i>
                    <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Information */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-envelope text-blue-600 mr-3"></i>
            Need Additional Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Technical Support</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                For technical issues and system problems
              </p>
              <p className="text-sm">
                <i className="fas fa-envelope mr-2"></i>
                support@oas.edu.au
              </p>
              <p className="text-sm">
                <i className="fas fa-phone mr-2"></i>
                +61 3 8344 7000
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Academic Support</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                For assessment policies and academic guidance
              </p>
              <p className="text-sm">
                <i className="fas fa-envelope mr-2"></i>
                academic@oas.edu.au
              </p>
              <p className="text-sm">
                <i className="fas fa-clock mr-2"></i>
                Mon-Fri 9:00 AM - 5:00 PM
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

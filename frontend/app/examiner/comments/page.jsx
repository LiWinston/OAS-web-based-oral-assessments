'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

/**
 * ExaminerComments Component
 * 
 * Comment Library page for examiners to manage pre-defined feedback templates
 * and commonly used assessment comments. This helps streamline the feedback
 * process and ensures consistency across assessments.
 */
export default function ExaminerComments() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock comment categories and templates
  const commentCategories = [
    { id: 'all', name: 'All Comments', count: 24 },
    { id: 'presentation', name: 'Presentation Skills', count: 8 },
    { id: 'technical', name: 'Technical Knowledge', count: 6 },
    { id: 'communication', name: 'Communication', count: 5 },
    { id: 'teamwork', name: 'Teamwork', count: 3 },
    { id: 'critical', name: 'Critical Thinking', count: 2 },
  ];

  const mockComments = [
    {
      id: 1,
      category: 'presentation',
      title: 'Excellent presentation structure',
      text: 'The presentation was well-structured with clear introduction, body, and conclusion. The flow of ideas was logical and easy to follow.',
      type: 'positive',
      usage: 15,
    },
    {
      id: 2,
      category: 'technical',
      title: 'Strong technical understanding',
      text: 'Demonstrated solid understanding of the technical concepts and was able to explain complex ideas clearly.',
      type: 'positive',
      usage: 12,
    },
    {
      id: 3,
      category: 'communication',
      title: 'Needs improvement in clarity',
      text: 'Consider speaking more slowly and clearly. Some technical terms could be better explained for the audience.',
      type: 'improvement',
      usage: 8,
    },
    {
      id: 4,
      category: 'teamwork',
      title: 'Good collaboration evident',
      text: 'Clear evidence of effective teamwork and collaboration. All team members contributed meaningfully to the project.',
      type: 'positive',
      usage: 10,
    },
  ];

  const filteredComments = selectedCategory === 'all' 
    ? mockComments 
    : mockComments.filter(comment => comment.category === selectedCategory);

  const getTypeColor = (type) => {
    switch (type) {
      case 'positive':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'improvement':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'critical':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Comment Library
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your feedback templates and commonly used assessment comments
          </p>
        </div>
        <Button className="mt-4 md:mt-0">
          <i className="fas fa-plus mr-2"></i>
          Add New Comment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {commentCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{category.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {category.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments List */}
        <div className="lg:col-span-3">
          <Card className="dashboard-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">
                  {commentCategories.find(cat => cat.id === selectedCategory)?.name || 'Comments'}
                </CardTitle>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredComments.length} comments
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredComments.map((comment) => (
                  <div key={comment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {comment.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(comment.type)}`}>
                          {comment.type}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Used {comment.usage} times
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {comment.text}
                    </p>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        <i className="fas fa-edit mr-1"></i>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <i className="fas fa-copy mr-1"></i>
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <i className="fas fa-trash mr-1"></i>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredComments.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400 mb-4">
                    <i className="fas fa-comment-dots text-4xl mb-2"></i>
                    <p>No comments found in this category</p>
                  </div>
                  <Button>
                    <i className="fas fa-plus mr-2"></i>
                    Add First Comment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

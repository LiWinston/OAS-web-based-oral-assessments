'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import ResultCard from '../../../components/student/results/ResultCard';
import ResultsEmptyState from '../../../components/student/results/ResultsEmptyState';
import ResultsTable from '../../../components/student/results/ResultsTable';
import { studentResultsService } from '../../../services/studentResultsService';
import { useAuthStore } from '../../../store/authStore';
import { RefreshCw, Search } from 'lucide-react';

/**
 * Student Results Overview Page
 * 
 * Displays all student's assessment results with filtering and search
 */
export default function StudentResults() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'released',
    semester: 'all',
    sort: 'date_desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    pageNum: 0,
    pageSize: 20,
    total: 0
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'

  // Load results
  const loadResults = async (refreshData = false) => {
    try {
      if (!user?.id) return;
      
      if (refreshData) setLoading(true);
      setError(null);

      const response = await studentResultsService.getStudentResults(user.id, {
        ...filters,
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize
      });

      if (response.success) {
        setResults(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0
        }));
      } else {
        throw new Error(response.message || 'Failed to load results');
      }
    } catch (err) {
      console.error('Error loading results:', err);
      setError(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadResults(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, filters.status, filters.semester, filters.sort]);

  // Filter results by search term
  const filteredResults = results.filter(result => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      result.assignmentName.toLowerCase().includes(searchLower) ||
      result.courseCode.toLowerCase().includes(searchLower) ||
      result.courseName.toLowerCase().includes(searchLower)
    );
  });

  // Handle view details
  const handleViewDetails = (assignment) => {
    router.push(`/student/results/${assignment.assignmentId}`);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, pageNum: 0 })); // Reset to first page
  };

  // No overview stats cards per design: keep assignment list only

  return (
    <div className="space-y-6">
      {/* Gradient Header - synced with admin pages */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1 flex items-center">
              <i className="fas fa-award mr-3"></i>
              My Results
            </h1>
            <p className="text-blue-100">View your released assessment results and feedback</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button
              onClick={() => loadResults(true)}
              disabled={loading}
              className={`bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 shadow-lg transform hover:scale-105 transition-all duration-200 ${loading ? 'opacity-80' : ''}`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Intentionally no global stats on overview */}

      {/* Toolbar: view toggle + search + filters - synced with admin */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
          <div className="flex items-center space-x-2 mb-3 md:mb-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mr-4">
              Your Results
            </h2>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  viewMode === 'table'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-list mr-1"></i> Table
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  viewMode === 'card'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-th-large mr-1"></i> Cards
              </button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </span>
              <input
                type="text"
                placeholder="Search assignments, courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64 rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent px-3 py-2 transition-all duration-200 hover:shadow-md"
              />
            </div>

            {/* Status */}
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="appearance-none rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8 py-2 px-3 transition-all duration-200 hover:shadow-md"
              >
                <option value="released">Released Results</option>
                <option value="all">All Results</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
              </div>
            </div>

            {/* Semester */}
            <div className="relative">
              <select
                value={filters.semester}
                onChange={(e) => handleFilterChange('semester', e.target.value)}
                className="appearance-none rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8 py-2 px-3 transition-all duration-200 hover:shadow-md"
              >
                <option value="all">All Semesters</option>
                <option value="current">Current Semester</option>
                <option value="2024 Semester 2">2024 Semester 2</option>
                <option value="2024 Semester 1">2024 Semester 1</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
              </div>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="appearance-none rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8 py-2 px-3 transition-all duration-200 hover:shadow-md"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="grade_desc">Highest Grade</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <i className="fas fa-chevron-down text-gray-400 text-xs"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {/* The view toggle moved to toolbar above */}
        {error && (
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">
                Error loading results: {error}
              </p>
              <Button 
                onClick={() => loadResults(true)}
                variant="outline" 
                size="sm"
                className="mt-2"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && (
          <ResultsEmptyState type="loading" />
        )}

        {!loading && !error && filteredResults.length === 0 && (
          <ResultsEmptyState 
            type={results.length === 0 ? 'no-results' : 'no-results'}
            message={
              results.length === 0 
                ? 'When your assessments are graded and released, they will appear here.'
                : 'No results match your current search and filter criteria.'
            }
          />
        )}

        {!loading && !error && filteredResults.length > 0 && (
          <>
            {viewMode === 'table' ? (
              <ResultsTable results={filteredResults} onViewDetails={handleViewDetails} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredResults.map((assignment) => (
                  <ResultCard 
                    key={assignment.assignmentId}
                    assignment={assignment}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}

            {/* Pagination Info */}
            {pagination.total > pagination.pageSize && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      Showing {filteredResults.length} of {pagination.total} results
                    </span>
                    <span>
                      Page {pagination.pageNum + 1} of {Math.ceil(pagination.total / pagination.pageSize)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

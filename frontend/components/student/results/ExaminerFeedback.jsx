'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Users, MessageSquare, ThumbsUp, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Examiner Feedback Component
 * Displays detailed feedback from examiners
 */
export default function ExaminerFeedback({ feedbackData }) {
  if (!feedbackData?.examinerFeedback) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500 dark:text-gray-400">
            No examiner feedback available
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy \'at\' h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      {/* Consolidated Feedback Summary */}
      {feedbackData.consolidatedFeedback && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <MessageSquare className="w-5 h-5" />
              Overall Feedback Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Strengths */}
            {feedbackData.consolidatedFeedback.strengths?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ThumbsUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-900 dark:text-green-100">
                    Strengths
                  </span>
                </div>
                <div className="space-y-2">
                  {feedbackData.consolidatedFeedback.strengths.map((strength, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg"
                    >
                      <p className="text-sm text-green-900 dark:text-green-100">
                        {strength}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Areas for Improvement */}
            {feedbackData.consolidatedFeedback.improvements?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="font-medium text-orange-900 dark:text-orange-100">
                    Areas for Improvement
                  </span>
                </div>
                <div className="space-y-2">
                  {feedbackData.consolidatedFeedback.improvements.map((improvement, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg"
                    >
                      <p className="text-sm text-orange-900 dark:text-orange-100">
                        {improvement}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Individual Examiner Feedback */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Individual Examiner Feedback
          <Badge variant="outline" className="ml-2">
            {feedbackData.examinerFeedback.length} Examiner{feedbackData.examinerFeedback.length !== 1 ? 's' : ''}
          </Badge>
        </h3>

        {feedbackData.examinerFeedback.map((feedback, index) => (
          <Card key={feedback.examinerId || index} className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {feedback.examinerName?.charAt(0) || 'E'}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      {feedback.examinerName}
                    </CardTitle>
                    {feedback.submittedOn && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        Submitted: {formatDateTime(feedback.submittedOn)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Overall Comment */}
              {feedback.overallComment && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Overall Comments
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {feedback.overallComment}
                  </p>
                </div>
              )}

              {/* Criterion-specific Feedback */}
              {feedback.criterionFeedback?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Criterion-specific Feedback
                  </h4>
                  <div className="space-y-3">
                    {feedback.criterionFeedback.map((criterionFb, idx) => (
                      <div 
                        key={criterionFb.criterionId || idx}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                      >
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                          {criterionFb.criterionName}
                        </h5>
                        
                        {criterionFb.comment && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            {criterionFb.comment}
                          </p>
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Strengths */}
                          {criterionFb.strengths?.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 mb-2">
                                <ThumbsUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                                <span className="text-xs font-medium text-green-900 dark:text-green-100">
                                  Strengths
                                </span>
                              </div>
                              <ul className="space-y-1">
                                {criterionFb.strengths.map((strength, sIdx) => (
                                  <li key={sIdx} className="text-xs text-green-800 dark:text-green-200 flex items-start gap-1">
                                    <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Improvements */}
                          {criterionFb.improvements?.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1 mb-2">
                                <AlertTriangle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                                <span className="text-xs font-medium text-orange-900 dark:text-orange-100">
                                  Improvements
                                </span>
                              </div>
                              <ul className="space-y-1">
                                {criterionFb.improvements.map((improvement, iIdx) => (
                                  <li key={iIdx} className="text-xs text-orange-800 dark:text-orange-200 flex items-start gap-1">
                                    <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
                                    {improvement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
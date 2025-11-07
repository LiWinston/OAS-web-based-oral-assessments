package org.swen90017.oas.service;

public interface NotificationQueueService {
    void enqueueScheduleReleaseToStudents(Long assignmentId, String message);
    void enqueueScheduleReleaseToExaminers(Long assignmentId, String message);
}

package org.swen90017.oas.service.cache;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Component;

@Component
public class AssignmentCacheSupport {

    /**
     * Evict both assignments list and count for a subject.
     */
    @CacheEvict(value = {"subjectAssignments", "subjectAssignmentCount"}, key = "#subjectId")
    public void evictBySubjectId(Long subjectId) {
        // no-op; only used for eviction via AOP proxy
    }
}

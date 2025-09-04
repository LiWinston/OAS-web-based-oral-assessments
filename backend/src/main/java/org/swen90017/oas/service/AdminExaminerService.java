package org.swen90017.oas.service;
import org.swen90017.oas.dto.request.AssignExaminersRequestDTO;
import org.swen90017.oas.dto.response.GetAvailableExaminersResponseDTO;
import org.swen90017.oas.dto.response.TimeSlotDetailDTO;

public interface AdminExaminerService {
    GetAvailableExaminersResponseDTO getAvailableExaminers(Long assignmentId, Long timeSlotId);

    TimeSlotDetailDTO assignExaminersToSlot(Long assignmentId, Long timeSlotId, AssignExaminersRequestDTO request);
}

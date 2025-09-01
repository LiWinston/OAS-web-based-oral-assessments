package org.swen90017.oas.service;

import org.swen90017.oas.dto.request.ExaminerBulkAssignRequestDTO;
import org.swen90017.oas.dto.response.AssignmentResponseDTO;
import org.swen90017.oas.dto.response.ExaminerScheduleDTO;
import org.swen90017.oas.dto.response.ExaminerScheduleResponseDTO;
import org.swen90017.oas.dto.response.PartialAssignmentResultDTO;
import org.swen90017.oas.dto.response.SelectableTimeSlotDTO;
import org.swen90017.oas.dto.response.ExaminerUnassignResponseDTO;

import java.util.List;

public interface ExaminerSelfService {
    List<AssignmentResponseDTO> listAssignmentsAvailable(Long examinerId);
    List<SelectableTimeSlotDTO> listSelectableTimeSlots(Long assignmentId, Long examinerId);
    PartialAssignmentResultDTO bulkAssign(Long assignmentId, ExaminerBulkAssignRequestDTO request);
    ExaminerScheduleDTO getSchedule(Long examinerId, Long assignmentId);

    ExaminerScheduleResponseDTO getScheduleV2(Long examinerId, Long assignmentId);
    ExaminerUnassignResponseDTO unassign(Long assignmentId, Long slotId, Long examinerId);
}



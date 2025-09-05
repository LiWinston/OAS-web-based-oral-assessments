package org.swen90017.oas.service;

import org.swen90017.oas.dto.request.AddAssignmentMemberRequestDTO;
import org.swen90017.oas.dto.response.AssignmentMemberCreateResponseDTO;
import org.swen90017.oas.dto.response.AssignmentMemberListResponseDTO;
import org.swen90017.oas.dto.response.AssignmentMemberRemoveResponseDTO;

public interface AssignmentMemberService {

    AssignmentMemberListResponseDTO listMembers(Long assignmentId, String role, String q, Integer pageNum, Integer pageSize);

    AssignmentMemberCreateResponseDTO addMember(Long assignmentId, AddAssignmentMemberRequestDTO request);

    AssignmentMemberRemoveResponseDTO removeMember(Long assignmentId, Long assignmentUserId);
}



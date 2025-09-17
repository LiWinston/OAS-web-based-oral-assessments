package org.swen90017.oas.service;

import org.swen90017.oas.dto.response.GroupDetailDTO;
import org.swen90017.oas.dto.response.GroupSummaryDTO;

import java.time.ZonedDateTime;
import java.util.List;

public interface StudentGroupQueryService {

    class GroupListResponse {
        private boolean notModified;
        private long total;
        private List<GroupSummaryDTO> data;
        private ZonedDateTime lastModified;

        public boolean isNotModified() { return notModified; }
        public void setNotModified(boolean notModified) { this.notModified = notModified; }
        public long getTotal() { return total; }
        public void setTotal(long total) { this.total = total; }
        public List<GroupSummaryDTO> getData() { return data; }
        public void setData(List<GroupSummaryDTO> data) { this.data = data; }
        public ZonedDateTime getLastModified() { return lastModified; }
        public void setLastModified(ZonedDateTime lastModified) { this.lastModified = lastModified; }
    }

    class GroupDetailResponse {
        private boolean notModified;
        private GroupDetailDTO group;
        private ZonedDateTime lastModified;

        public boolean isNotModified() { return notModified; }
        public void setNotModified(boolean notModified) { this.notModified = notModified; }
        public GroupDetailDTO getGroup() { return group; }
        public void setGroup(GroupDetailDTO group) { this.group = group; }
        public ZonedDateTime getLastModified() { return lastModified; }
        public void setLastModified(ZonedDateTime lastModified) { this.lastModified = lastModified; }
    }

    GroupListResponse listStudentGroups(Long studentId, String status, int pageNum, int pageSize, String sort, String ifModifiedSince);

    GroupDetailResponse getGroupDetail(Long studentId, Long groupId, String ifModifiedSince);
}



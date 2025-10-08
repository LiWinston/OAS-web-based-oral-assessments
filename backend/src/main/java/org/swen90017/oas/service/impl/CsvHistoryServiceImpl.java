package org.swen90017.oas.service.impl;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.swen90017.oas.common.PageResult;
import org.swen90017.oas.dto.request.CsvHistoryQueryDTO;
import org.swen90017.oas.dto.response.CsvImportHistoryDTO;
import org.swen90017.oas.entity.Assignment;
import org.swen90017.oas.entity.CsvImportHistory;
import org.swen90017.oas.entity.Subject;
import org.swen90017.oas.exception.BusinessException;
import org.swen90017.oas.mapper.AssignmentMapper;
import org.swen90017.oas.mapper.CsvImportHistoryMapper;
import org.swen90017.oas.mapper.SubjectMapper;
import org.swen90017.oas.service.CsvHistoryService;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * CSV Import History Service Implementation
 */
@Service
public class CsvHistoryServiceImpl implements CsvHistoryService {

    @Value("${csv.import.storage-path:./csv-imports}")
    private String storagePath;

    @Autowired
    private CsvImportHistoryMapper csvImportHistoryMapper;

    @Autowired
    private AssignmentMapper assignmentMapper;

    @Autowired
    private SubjectMapper subjectMapper;

    @Override
    public CsvImportHistory saveCsvFile(MultipartFile file, String importType, Long assignmentId,
                                        Long importerId, String importerUsername, Integer recordCount) throws IOException {
        return saveCsvFileFromBytes(file.getBytes(), file.getOriginalFilename(), importType, 
                assignmentId, importerId, importerUsername, recordCount);
    }

    @Override
    public CsvImportHistory saveCsvFileFromBytes(byte[] fileBytes, String originalFilename, String importType,
                                                 Long assignmentId, Long importerId, String importerUsername,
                                                 Integer recordCount) throws IOException {
        // Ensure storage directory exists
        Path storageDir = Paths.get(storagePath);
        if (!Files.exists(storageDir)) {
            Files.createDirectories(storageDir);
        }

        // Generate new filename: type_username_timestamp.csv
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String savedFilename = String.format("%s_%s_%s.csv", importType, importerUsername, timestamp);
        String filePath = storagePath + File.separator + savedFilename;

        // Save file to disk
        Path targetPath = Paths.get(filePath);
        Files.write(targetPath, fileBytes);

        // Create history record
        CsvImportHistory history = new CsvImportHistory();
        history.setImportType(importType);
        history.setAssignmentId(assignmentId);
        history.setOriginalFilename(originalFilename);
        history.setSavedFilename(savedFilename);
        history.setFilePath(filePath);
        history.setFileSize((long) fileBytes.length);
        history.setRecordCount(recordCount);
        history.setImportStatus("processing");
        history.setImporterId(importerId);
        history.setImporterUsername(importerUsername);

        csvImportHistoryMapper.insert(history);

        return history;
    }

    @Override
    public void updateHistoryStatus(Long historyId, String status, String errorMessage) {
        CsvImportHistory history = csvImportHistoryMapper.selectById(historyId);
        if (history != null) {
            history.setImportStatus(status);
            history.setErrorMessage(errorMessage);
            csvImportHistoryMapper.updateById(history);
        }
    }

    @Override
    public PageResult<CsvImportHistoryDTO> queryHistory(CsvHistoryQueryDTO queryDTO) {
        QueryWrapper<CsvImportHistory> queryWrapper = new QueryWrapper<>();

        if (queryDTO.getImportType() != null && !queryDTO.getImportType().isEmpty()) {
            queryWrapper.eq("import_type", queryDTO.getImportType());
        }
        if (queryDTO.getAssignmentId() != null) {
            queryWrapper.eq("assignment_id", queryDTO.getAssignmentId());
        }
        if (queryDTO.getImporterId() != null) {
            queryWrapper.eq("importer_id", queryDTO.getImporterId());
        }
        if (queryDTO.getImportStatus() != null && !queryDTO.getImportStatus().isEmpty()) {
            queryWrapper.eq("import_status", queryDTO.getImportStatus());
        }

        queryWrapper.orderByDesc("create_time");

        // Default pagination
        int pageNum = queryDTO.getPageNum() != null ? queryDTO.getPageNum() : 1;
        int pageSize = queryDTO.getPageSize() != null ? queryDTO.getPageSize() : 10;
        Page<CsvImportHistory> page = new Page<>(pageNum, pageSize);

        Page<CsvImportHistory> result = csvImportHistoryMapper.selectPage(page, queryWrapper);

        // Convert to DTO with additional information
        List<CsvImportHistoryDTO> dtoList = result.getRecords().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new PageResult<>(
                (int) result.getCurrent(),
                (int) result.getSize(),
                result.getTotal(),
                dtoList
        );
    }

    @Override
    public CsvImportHistoryDTO getHistoryById(Long id) {
        CsvImportHistory history = csvImportHistoryMapper.selectById(id);
        if (history == null) {
            throw new BusinessException("CSV import history record not found");
        }
        return convertToDTO(history);
    }

    @Override
    public Resource downloadCsvFile(Long id) throws IOException {
        CsvImportHistory history = csvImportHistoryMapper.selectById(id);
        if (history == null) {
            throw new BusinessException("CSV import history record not found");
        }

        File file = new File(history.getFilePath());
        if (!file.exists()) {
            throw new BusinessException("CSV file not found");
        }

        return new FileSystemResource(file);
    }

    @Override
    public void deleteHistory(Long id) {
        CsvImportHistory history = csvImportHistoryMapper.selectById(id);
        if (history != null) {
            // Delete file from disk
            File file = new File(history.getFilePath());
            if (file.exists()) {
                file.delete();
            }
            // Delete record from database
            csvImportHistoryMapper.deleteById(id);
        }
    }

    /**
     * Convert entity to DTO with additional information
     */
    private CsvImportHistoryDTO convertToDTO(CsvImportHistory history) {
        CsvImportHistoryDTO dto = BeanUtil.copyProperties(history, CsvImportHistoryDTO.class);

        // Add assignment and subject information
        if (history.getAssignmentId() != null) {
            Assignment assignment = assignmentMapper.selectById(history.getAssignmentId());
            if (assignment != null) {
                dto.setAssignmentName(assignment.getName());
                if (assignment.getSubjectId() != null) {
                    Subject subject = subjectMapper.selectById(assignment.getSubjectId());
                    if (subject != null) {
                        dto.setSubjectName(subject.getSubjectCode() + " - " + subject.getSubjectName());
                    }
                }
            }
        }

        return dto;
    }
}


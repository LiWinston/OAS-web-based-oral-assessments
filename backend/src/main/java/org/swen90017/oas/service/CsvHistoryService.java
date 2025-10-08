package org.swen90017.oas.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import org.swen90017.oas.common.PageResult;
import org.swen90017.oas.dto.request.CsvHistoryQueryDTO;
import org.swen90017.oas.dto.response.CsvImportHistoryDTO;
import org.swen90017.oas.entity.CsvImportHistory;

import java.io.IOException;

/**
 * CSV Import History Service
 */
public interface CsvHistoryService {

    /**
     * Save CSV file and create history record
     *
     * @param file             CSV file
     * @param importType       import type (student, group, mix, examiner)
     * @param assignmentId     assignment ID
     * @param importerId       importer user ID
     * @param importerUsername importer username
     * @param recordCount      number of records imported
     * @return history record
     */
    CsvImportHistory saveCsvFile(MultipartFile file, String importType, Long assignmentId,
                                 Long importerId, String importerUsername, Integer recordCount) throws IOException;

    /**
     * Save CSV file from bytes and create history record
     *
     * @param fileBytes        CSV file bytes
     * @param originalFilename original filename
     * @param importType       import type (student, group, mix, examiner)
     * @param assignmentId     assignment ID
     * @param importerId       importer user ID
     * @param importerUsername importer username
     * @param recordCount      number of records imported
     * @return history record
     */
    CsvImportHistory saveCsvFileFromBytes(byte[] fileBytes, String originalFilename, String importType, 
                                          Long assignmentId, Long importerId, String importerUsername, 
                                          Integer recordCount) throws IOException;

    /**
     * Update history record status
     *
     * @param historyId    history record ID
     * @param status       import status (success, failed)
     * @param errorMessage error message (if failed)
     */
    void updateHistoryStatus(Long historyId, String status, String errorMessage);

    /**
     * Query history records with pagination
     *
     * @param queryDTO query parameters
     * @return paginated history records
     */
    PageResult<CsvImportHistoryDTO> queryHistory(CsvHistoryQueryDTO queryDTO);

    /**
     * Get history record by ID
     *
     * @param id history record ID
     * @return history record
     */
    CsvImportHistoryDTO getHistoryById(Long id);

    /**
     * Download CSV file by history ID
     *
     * @param id history record ID
     * @return file resource
     */
    Resource downloadCsvFile(Long id) throws IOException;

    /**
     * Delete history record (also deletes the file)
     *
     * @param id history record ID
     */
    void deleteHistory(Long id);
}


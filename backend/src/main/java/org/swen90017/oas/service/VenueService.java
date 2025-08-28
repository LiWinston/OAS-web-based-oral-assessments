package org.swen90017.oas.service;

import org.springframework.web.multipart.MultipartFile;

public interface VenueService {
    void importCsv(MultipartFile file, int batchSizeIgnored);
}

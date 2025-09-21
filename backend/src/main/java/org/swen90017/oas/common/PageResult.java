package org.swen90017.oas.common;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "Paginated result wrapper")
public class PageResult<T> {
    
    @Schema(description = "Current page number", example = "1")
    private Integer pageNum;
    
    @Schema(description = "Page size", example = "20")
    private Integer pageSize;
    
    @Schema(description = "Total number of items", example = "150")
    private Long total;
    
    @Schema(description = "List of items for current page")
    private List<T> items;
    
    public PageResult() {}
    
    public PageResult(Integer pageNum, Integer pageSize, Long total, List<T> items) {
        this.pageNum = pageNum;
        this.pageSize = pageSize;
        this.total = total;
        this.items = items;
    }
    
    public PageResult(Integer pageNum, Integer pageSize, Integer total, List<T> items) {
        this.pageNum = pageNum;
        this.pageSize = pageSize;
        this.total = total.longValue();
        this.items = items;
    }
}

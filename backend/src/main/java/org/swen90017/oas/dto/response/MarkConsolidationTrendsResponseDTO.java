package org.swen90017.oas.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Collections;
import java.util.List;

@Data
@Schema(description = "Mark consolidation trend data")
public class MarkConsolidationTrendsResponseDTO {

    @Schema(description = "Interval granularity", example = "day", allowableValues = {"day", "week"})
    private String interval;

    @Schema(description = "Timezone applied to buckets", example = "Australia/Melbourne")
    private String timezone;

    @Schema(description = "Trend series collection")
    private List<Series> series = Collections.emptyList();

    @Data
    @Schema(description = "Named series of trend data")
    public static class Series {

        @Schema(description = "Human readable name", example = "Examiner submissions")
        private String name;

        @Schema(description = "Unique key identifier", example = "submitted")
        private String key;

        @Schema(description = "Ordered data points")
        private List<Point> points = Collections.emptyList();
    }

    @Data
    @Schema(description = "Trend data point")
    public static class Point {

        @Schema(description = "Bucket identifier (ISO date or ISO week)", example = "2025-08-01")
        private String bucket;

        @Schema(description = "Count for the bucket", example = "12")
        private Integer count;

        @Schema(description = "Cumulative total up to this bucket", example = "30")
        private Integer cumulative;
    }
}

package org.swen90017.oas.dto;

import io.lettuce.core.output.DoubleListOutput;
import lombok.Data;

import java.util.List;

@Data
public class RubricsInfoDto {

    String description;
    Double weight;
    String scaleType;
    List<PerformanceDto> performanceLevel;
}

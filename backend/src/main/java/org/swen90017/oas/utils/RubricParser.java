package org.swen90017.oas.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.swen90017.oas.dto.PerformanceDto;
import org.swen90017.oas.dto.RubricsInfoDto;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Generic parser to normalize rubric JSON into canonical RubricsInfoDto list
 * - Accepts top-level array or object with criteria field
 * - Flexible field names for nested performance levels
 * - Normalizes scaleType: percentage -> points
 */
public class RubricParser {

    public static List<RubricsInfoDto> parseRubricItems(ObjectMapper objectMapper, String raw) throws Exception {
        String s = unwrapIfWrappedString(objectMapper, raw);
        if (s == null || s.trim().isEmpty()) return new ArrayList<>();
        s = stripBOM(s.trim());

        JsonNode root = objectMapper.readTree(s);
        JsonNode arrayNode;
        if (root.isArray()) {
            arrayNode = root;
        } else if (root.isObject() && root.has("criteria")) {
            arrayNode = root.get("criteria");
        } else {
            // last fallback: if it's a JSON string again
            if (root.isTextual()) {
                return parseRubricItems(objectMapper, root.asText());
            }
            // if not recognizable, try parse as list directly
            return objectMapper.readValue(s, new TypeReference<List<RubricsInfoDto>>(){});
        }

        List<RubricsInfoDto> items = new ArrayList<>();
        if (arrayNode != null && arrayNode.isArray()) {
            for (JsonNode n : arrayNode) {
                RubricsInfoDto dto = new RubricsInfoDto();
                dto.setDescription(text(n, "description", "name", "title"));
                dto.setWeight(number(n, "weight", "points"));
                String scaleType = text(n, "scaleType");
                if (scaleType != null && scaleType.equalsIgnoreCase("percentage")) {
                    scaleType = "points";
                }
                dto.setScaleType(scaleType);

                // performance levels (optional)
                JsonNode levels = firstArray(n, "performanceLevel", "performanceLevels", "levels");
                if (levels != null && levels.isArray()) {
                    List<PerformanceDto> lv = new ArrayList<>();
                    Iterator<JsonNode> it = levels.elements();
                    while (it.hasNext()) {
                        JsonNode ln = it.next();
                        PerformanceDto p = new PerformanceDto();
                        p.setDescription(text(ln, "description", "level", "label"));
                        Double start = number(ln, "startPoint", "start", "from", "points", "value");
                        Double end = number(ln, "endPoint", "end", "to", "points", "value");
                        if (start != null && end == null) end = start;
                        if (end != null && start == null) start = end;
                        p.setStartPoint(start);
                        p.setEndPoint(end);
                        lv.add(p);
                    }
                    dto.setPerformanceLevel(lv);
                }
                items.add(dto);
            }
        }
        return items;
    }

    private static String unwrapIfWrappedString(ObjectMapper objectMapper, String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        if ((s.startsWith("\"") && s.endsWith("\"")) || (s.startsWith("'") && s.endsWith("'"))) {
            try {
                return objectMapper.readValue(s, String.class);
            } catch (Exception ignore) {
                return raw;
            }
        }
        return raw;
    }

    private static String stripBOM(String s) {
        if (s != null && !s.isEmpty() && s.charAt(0) == '\uFEFF') return s.substring(1);
        return s;
    }

    private static String text(JsonNode node, String... keys) {
        for (String k : keys) {
            JsonNode v = node.get(k);
            if (v != null && !v.isNull()) return v.asText();
        }
        return null;
    }

    private static Double number(JsonNode node, String... keys) {
        for (String k : keys) {
            JsonNode v = node.get(k);
            if (v != null && v.isNumber()) return v.asDouble();
        }
        return null;
    }

    private static JsonNode firstArray(JsonNode node, String... keys) {
        for (String k : keys) {
            JsonNode v = node.get(k);
            if (v != null && v.isArray()) return v;
        }
        return null;
    }
}



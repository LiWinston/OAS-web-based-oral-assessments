package org.swen90017.oas.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.swen90017.oas.entity.Venue;
import org.swen90017.oas.mapper.VenueMapper;
import org.swen90017.oas.service.VenueService;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;

@Service
public class VenueServiceImpl implements VenueService {
    @Autowired
    private VenueMapper venueMapper;
    // src/main/java/org/swen90017/oas/service/impl/VenueServiceImpl.java
    @Override
    public void importCsv(MultipartFile file, int batchSizeIgnored) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            // 读表头
            String header = br.readLine();
            if (header == null) return;

            String[] heads = normalizeHeader(parseCsvLine(header));
            int idxRoomName = indexOf(heads, "roomname", "room_name", "room name");
            int idxCapacity = indexOf(heads, "capacity");
            int idxBuilding = indexOf(heads, "building");
            int idxRoomUrl  = indexOf(heads, "roomurl", "room_url", "room url");


            // 用 Stream 读剩余所有行 -> 解析 -> 映射成 Venue -> 收集
            List<Venue> venues = br.lines()
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(this::parseCsvLine)         // String -> String[]
                    .map(cols -> {
                        String roomName = clean(get(cols, idxRoomName));
                        String building = clean(get(cols, idxBuilding));
                        String roomUrl  = clean(get(cols, idxRoomUrl));
                        Integer capacity = parseIntOrDefault(get(cols, idxCapacity), 0);

                        if (isAllBlank(roomName, building, roomUrl)) {
                            return null; // 过滤
                        }
                        Venue v = new Venue();
                        v.setRoomName(roomName);
                        v.setBuilding(building);
                        v.setRoomUrl(roomUrl);
                        v.setCapacity(capacity);
                        return v;
                    })
                    .filter(Objects::nonNull)
                    .collect(java.util.stream.Collectors.toList());

            if (!venues.isEmpty()) {
                int affected = venueMapper.upsertBatch(venues);
            }
        } catch (Exception e) {
        }
    }

    /** —— 以下是小工具方法 —— */

// 解析单行 CSV（支持双引号与 "" 转义），返回列数组
    private String[] parseCsvLine(String line) {
        java.util.List<String> out = new java.util.ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    sb.append('"'); // 处理转义 ""
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                out.add(sb.toString());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        out.add(sb.toString());
        return out.toArray(new String[0]);
    }

    private String[] normalizeHeader(String[] heads) {
        String[] norm = new String[heads.length];
        for (int i = 0; i < heads.length; i++) {
            norm[i] = heads[i] == null ? "" :
                    heads[i].trim().toLowerCase(java.util.Locale.ROOT).replaceAll("[\\s_]+", "");
        }
        return norm;
    }

    private int indexOf(String[] heads, String... candidates) {
        java.util.Set<String> set = new java.util.HashSet<>(java.util.Arrays.asList(heads));
        for (String c : candidates) if (set.contains(c)) {
            for (int i = 0; i < heads.length; i++) if (heads[i].equals(c)) return i;
        }
        return -1;
    }

    private static String get(String[] arr, int idx) { return (idx >= 0 && idx < arr.length) ? arr[idx] : null; }
    private static String clean(String s) { if (s == null) return null; String t = s.trim(); return t.isEmpty()? null : t; }
    private static boolean isAllBlank(String... a){ for (String s: a) if (s!=null && !s.isEmpty()) return false; return true; }
    private static Integer parseIntOrDefault(String s, int def){ try{ if (s==null) return def; String t=s.trim(); if (t.isEmpty()) return def; return Integer.parseInt(t);}catch(Exception e){ return def; } }


}

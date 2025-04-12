package org.swen90017.oas.utils;

/**
 * Utility class for string operations.
 * <p>
 * This class extends cn.hutool.core.util.StrUtil and provides additional string utilities.
 * Specifically, it includes a method to convert camelCase strings to underscore_case.
 * <p>
 * Author: Yun
 * Created: 2025-04-12
 */
public class StringUtils extends cn.hutool.core.util.StrUtil{

    /**
     * Converts a camelCase string to an underscore_case string.
     *
     * Example:
     * <pre>
     *   "camelCase" -> "camel_case"
     *   "TestString" -> "test_string"
     * </pre>
     *
     * @param str the camelCase input string.
     * @return the resulting underscore_case string. If the input is null or empty, it returns the input as is.
     */
    public static String camelToUnderscore(String str) {
        if (str == null || str.isEmpty()) return str;
        StringBuilder result = new StringBuilder();
        char[] chars = str.toCharArray();

        for (int i = 0; i < chars.length; i++) {
            char c = chars[i];
            if (Character.isUpperCase(c)) {
                if (i != 0) result.append("_");
                result.append(Character.toLowerCase(c));
            } else {
                result.append(c);
            }
        }
        return result.toString();
    }
}

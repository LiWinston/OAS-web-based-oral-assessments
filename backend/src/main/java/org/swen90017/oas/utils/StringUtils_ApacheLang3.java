package org.swen90017.oas.utils;


import cn.hutool.core.text.StrFormatter;
import org.springframework.util.AntPathMatcher;
import org.swen90017.oas.constant.Constants;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;

/**
 * String Utility Class
 * 
 * @author Yongchun Li
 */
//TODO: Avoid using variable-length arguments (varargs).
//TODO: Utility classes must have a private constructor to prevent instantiation.
//TODO: Some methods do not match their descriptions and need to be updated.
//TODO: The two string utility classes should be merged.
public class StringUtils_ApacheLang3 extends org.apache.commons.lang3.StringUtils
{
    /** Empty String */
    private static final String NULLSTR = "";

    /** Underscore */
    private static final char SEPARATOR = '_';

    /** Asterisk */
    private static final char ASTERISK = '*';

    /**
     * Get non-null parameter value
     * 
     * @param value defaultValue Value to judge
     * @return value Return value
     */
    public static <T> T nvl(T value, T defaultValue)
    {
        return value != null ? value : defaultValue;
    }

    /**
     * Determine if a Collection is empty, including List, Set, Queue
     * 
     * @param coll Collection to judge
     * @return true: empty false: not empty
     */
    public static boolean isEmpty(Collection<?> coll)
    {
        return isNull(coll) || coll.isEmpty();
    }

    /**
     * Determine if a Collection is not empty, including List, Set, Queue
     * 
     * @param coll Collection to judge
     * @return true: not empty false: empty
     */
    public static boolean isNotEmpty(Collection<?> coll)
    {
        return !isEmpty(coll);
    }

    /**
     * Determine if an object array is empty
     * 
     * @param objects Object array to judge
     * @return true: empty false: not empty
     */
    public static boolean isEmpty(Object[] objects)
    {
        return isNull(objects) || (objects.length == 0);
    }

    /**
     * Determine if an object array is not empty
     * 
     * @param objects Object array to judge
     * @return true: not empty false: empty
     */
    public static boolean isNotEmpty(Object[] objects)
    {
        return !isEmpty(objects);
    }

    /**
     * Determine if a Map is empty
     * 
     * @param map Map to judge
     * @return true: empty false: not empty
     */
    public static boolean isEmpty(Map<?, ?> map)
    {
        return isNull(map) || map.isEmpty();
    }

    /**
     * Determine if a Map is not empty
     * 
     * @param map Map to judge
     * @return true: not empty false: empty
     */
    public static boolean isNotEmpty(Map<?, ?> map)
    {
        return !isEmpty(map);
    }

    /**
     * Determine if a string is empty
     * 
     * @param str String
     * @return true: empty false: not empty
     */
    public static boolean isEmpty(String str)
    {
        return isNull(str) || NULLSTR.equals(str.trim());
    }

    /**
     * Determine if a string is not empty
     * 
     * @param str String
     * @return true: not empty false: empty
     */
    public static boolean isNotEmpty(String str)
    {
        return !isEmpty(str);
    }

    /**
     * Determine if an object is null
     * 
     * @param object Object
     * @return true: null false: not null
     */
    public static boolean isNull(Object object)
    {
        return object == null;
    }

    /**
     * Determine if an object is not null
     * 
     * @param object Object
     * @return true: not null false: null
     */
    public static boolean isNotNull(Object object)
    {
        return !isNull(object);
    }

    /**
     * Determine if an object is an array type (Java primitive type array)
     * 
     * @param object Object
     * @return true: is array false: not array
     */
    public static boolean isArray(Object object)
    {
        return isNotNull(object) && object.getClass().isArray();
    }

    /**
     * Trim whitespace
     */
    public static String trim(String str)
    {
        return (str == null ? "" : str.trim());
    }

    /**
     * Replace characters in a specified range of a string with "*"
     *
     * @param str String
     * @param startInclude Start position (inclusive)
     * @param endExclude End position (exclusive)
     * @return Replaced string
     */
    public static String hide(CharSequence str, int startInclude, int endExclude)
    {
        if (isEmpty(str))
        {
            return NULLSTR;
        }
        final int strLength = str.length();
        if (startInclude > strLength)
        {
            return NULLSTR;
        }
        if (endExclude > strLength)
        {
            endExclude = strLength;
        }
        if (startInclude > endExclude)
        {
            // If start position is greater than end position, do not replace
            return NULLSTR;
        }
        final char[] chars = new char[strLength];
        for (int i = 0; i < strLength; i++)
        {
            if (i >= startInclude && i < endExclude)
            {
                chars[i] = ASTERISK;
            }
            else
            {
                chars[i] = str.charAt(i);
            }
        }
        return new String(chars);
    }

    /**
     * Substring
     * 
     * @param str String
     * @param start Start position
     * @return Result
     */
    public static String substring(final String str, int start)
    {
        if (str == null)
        {
            return NULLSTR;
        }

        if (start < 0)
        {
            start = str.length() + start;
        }

        if (start < 0)
        {
            start = 0;
        }
        if (start > str.length())
        {
            return NULLSTR;
        }

        return str.substring(start);
    }

    /**
     * Substring
     * 
     * @param str String
     * @param start Start position
     * @param end End position
     * @return Result
     */
    public static String substring(final String str, int start, int end)
    {
        if (str == null)
        {
            return NULLSTR;
        }

        if (end < 0)
        {
            end = str.length() + end;
        }
        if (start < 0)
        {
            start = str.length() + start;
        }

        if (end > str.length())
        {
            end = str.length();
        }

        if (start > end)
        {
            return NULLSTR;
        }

        if (start < 0)
        {
            start = 0;
        }
        if (end < 0)
        {
            end = 0;
        }

        return str.substring(start, end);
    }

    /**
     * Find the substring between the first occurrence of 'open' and the last occurrence of 'close'
     * 
     * @param str String to extract from
     * @param open Opening string
     * @param close Closing string
     * @return Extracted result
     */
    public static String substringBetweenLast(final String str, final String open, final String close)
    {
        if (isEmpty(str) || isEmpty(open) || isEmpty(close))
        {
            return NULLSTR;
        }
        final int start = str.indexOf(open);
        if (start != INDEX_NOT_FOUND)
        {
            final int end = str.lastIndexOf(close);
            if (end != INDEX_NOT_FOUND)
            {
                return str.substring(start + open.length(), end);
            }
        }
        return NULLSTR;
    }

    /**
     * Check if a string is not empty and contains at least one non-whitespace character
     * 
     * @param str Value to check
     * @return Result
     */
    public static boolean hasText(String str)
    {
        return (str != null && !str.isEmpty() && containsText(str));
    }

    private static boolean containsText(CharSequence str)
    {
        int strLen = str.length();
        for (int i = 0; i < strLen; i++)
        {
            if (!Character.isWhitespace(str.charAt(i)))
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Format text, {} represents placeholders<br>
     * This method simply replaces placeholders {} with parameters in order<br>
     * To output {}, use \\to escape { , to output \ before {}, use double escape \\\\ <br>
     * Example:<br>
     * Normal usage: format("this is {} for {}", "a", "b") -> this is a for b<br>
     * Escape {}: format("this is \\{} for {}", "a", "b") -> this is \{} for a<br>
     * Escape \: format("this is \\\\{} for {}", "a", "b") -> this is \a for b<br>
     * 
     * @param template Text template, parts to be replaced are represented by {}
     * @param params Parameter values
     * @return Formatted text
     */
    public static String format(String template, Object... params)
    {
        if (isEmpty(params) || isEmpty(template))
        {
            return template;
        }
        return StrFormatter.format(template, params);
    }

    /**
     * Check if a string starts with http(s)://
     * 
     * @param link URL link
     * @return Result
     */
    public static boolean ishttp(String link)
    {
        return StringUtils_ApacheLang3.startsWithAny(link, Constants.HTTP, Constants.HTTPS);
    }

    /**
     * Convert string to set
     * 
     * @param str String
     * @param sep Separator
     * @return Set collection
     */
    public static final Set<String> str2Set(String str, String sep)
    {
        return new HashSet<String>(str2List(str, sep, true, false));
    }

    /**
     * Convert string to list
     * 
     * @param str String
     * @param sep Separator
     * @param filterBlank Filter blank strings
     * @param trim Trim leading and trailing whitespace
     * @return List collection
     */
    public static final List<String> str2List(String str, String sep, boolean filterBlank, boolean trim)
    {
        List<String> list = new ArrayList<String>();
        if (StringUtils_ApacheLang3.isEmpty(str))
        {
            return list;
        }

        // Filter blank strings
        if (filterBlank && StringUtils_ApacheLang3.isBlank(str))
        {
            return list;
        }
        String[] split = str.split(sep);
        for (String string : split)
        {
            if (filterBlank && StringUtils_ApacheLang3.isBlank(string))
            {
                continue;
            }
            if (trim)
            {
                string = string.trim();
            }
            list.add(string);
        }

        return list;
    }

    /**
     * Check if the given collection contains any string from the given array
     *
     * @param collection Given collection
     * @param array Given array
     * @return boolean Result
     */
    public static boolean containsAny(Collection<String> collection, String... array)
    {
        if (isEmpty(collection) || isEmpty(array))
        {
            return false;
        }
        else
        {
            for (String str : array)
            {
                if (collection.contains(str))
                {
                    return true;
                }
            }
            return false;
        }
    }

    /**
     * Check if the specified string contains any of the strings in the given list, ignoring case
     *
     * @param cs Specified string
     * @param searchCharSequences Array of strings to check
     * @return Whether it contains any string
     */
    public static boolean containsAnyIgnoreCase(CharSequence cs, CharSequence... searchCharSequences)
    {
        if (isEmpty(cs) || isEmpty(searchCharSequences))
        {
            return false;
        }
        for (CharSequence testStr : searchCharSequences)
        {
            if (containsIgnoreCase(cs, testStr))
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Convert camelCase to under_score naming
     */
    public static String toUnderScoreCase(String str)
    {
        if (str == null)
        {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        // Whether the previous character is uppercase
        boolean preCharIsUpperCase = true;
        // Whether the current character is uppercase
        boolean curreCharIsUpperCase = true;
        // Whether the next character is uppercase
        boolean nexteCharIsUpperCase = true;
        for (int i = 0; i < str.length(); i++)
        {
            char c = str.charAt(i);
            if (i > 0)
            {
                preCharIsUpperCase = Character.isUpperCase(str.charAt(i - 1));
            }
            else
            {
                preCharIsUpperCase = false;
            }

            curreCharIsUpperCase = Character.isUpperCase(c);

            if (i < (str.length() - 1))
            {
                nexteCharIsUpperCase = Character.isUpperCase(str.charAt(i + 1));
            }

            if (preCharIsUpperCase && curreCharIsUpperCase && !nexteCharIsUpperCase)
            {
                sb.append(SEPARATOR);
            }
            else if ((i != 0 && !preCharIsUpperCase) && curreCharIsUpperCase)
            {
                sb.append(SEPARATOR);
            }
            sb.append(Character.toLowerCase(c));
        }

        return sb.toString();
    }

    /**
     * Whether the specified string contains any of the strings in the given array, ignoring case
     *
     * @param str Specified string
     * @param strs Array of strings to check
     * @return Whether it contains any string
     */
    public static boolean inStringIgnoreCase(String str, String... strs)
    {
        if (str != null && strs != null)
        {
            for (String s : strs)
            {
                if (str.equalsIgnoreCase(trim(s)))
                {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Convert camelCase to under_score naming
     * 
     * @param name Original string with camelCase naming
     * @return Converted string with under_score naming
     */
    public static String convertToCamelCase(String name)
    {
        StringBuilder result = new StringBuilder();
        // Quick check
        if (name == null || name.isEmpty())
        {
            // No need to convert
            return "";
        }
        else if (!name.contains("_"))
        {
            // No underscores, just capitalize the first letter
            return name.substring(0, 1).toUpperCase() + name.substring(1);
        }
        // Split the original string by underscores
        String[] camels = name.split("_");
        for (String camel : camels)
        {
            // Skip the original string's leading, trailing underscores or double underscores
            if (camel.isEmpty())
            {
                continue;
            }
            // Capitalize the first letter
            result.append(camel.substring(0, 1).toUpperCase());
            result.append(camel.substring(1).toLowerCase());
        }
        return result.toString();
    }

    /**
     * CamelCase naming
     * 
     * @param s Original string
     * @return CamelCase naming string
     */
    public static String toCamelCase(String s)
    {
        if (s == null)
        {
            return null;
        }
        if (s.indexOf(SEPARATOR) == -1)
        {
            return s;
        }
        s = s.toLowerCase();
        StringBuilder sb = new StringBuilder(s.length());
        boolean upperCase = false;
        for (int i = 0; i < s.length(); i++)
        {
            char c = s.charAt(i);

            if (c == SEPARATOR)
            {
                upperCase = true;
            }
            else if (upperCase)
            {
                sb.append(Character.toUpperCase(c));
                upperCase = false;
            }
            else
            {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    /**
     * Check if the specified string matches any string in the given list
     * 
     * @param str Specified string
     * @param strs Array of strings to check
     * @return Whether it matches
     */
    public static boolean matches(String str, List<String> strs)
    {
        if (isEmpty(str) || isEmpty(strs))
        {
            return false;
        }
        for (String pattern : strs)
        {
            if (isMatch(pattern, str))
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if the specified string matches the given pattern
     * 
     * @param pattern Matching rule
     * @param url URL to match
     * @return Whether it matches
     */
    public static boolean isMatch(String pattern, String url)
    {
        AntPathMatcher matcher = new AntPathMatcher();
        return matcher.match(pattern, url);
    }

    @SuppressWarnings("unchecked")
    public static <T> T cast(Object obj)
    {
        return (T) obj;
    }

    /**
     * Pad a number with zeros to the left to reach the specified length. Note, if the number is converted to a string, and the length is greater than size, only the last size characters are retained.
     * 
     * @param num Number object
     * @param size String specified length
     * @return Return the string format of the number, which is specified length.
     */
    public static final String padl(final Number num, final int size)
    {
        return padl(num.toString(), size, '0');
    }

    /**
     * Left pad a string. If the original string s length is greater than size, only the last size characters are retained.
     * 
     * @param s Original string
     * @param size String specified length
     * @param c Character to pad
     * @return Return the specified length string, obtained by left padding or truncating the original string.
     */
    public static final String padl(final String s, final int size, final char c)
    {
        final StringBuilder sb = new StringBuilder(size);
        if (s != null)
        {
            final int len = s.length();
            if (s.length() <= size)
            {
                for (int i = size - len; i > 0; i--)
                {
                    sb.append(c);
                }
                sb.append(s);
            }
            else
            {
                return s.substring(len - size, len);
            }
        }
        else
        {
            for (int i = size; i > 0; i--)
            {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    /**
     * Convert object to JSON string
     * Convert object to JSON string
     *
     * @param object Object
     * @return JSON string JSON string
     */
    public static String toJsonString(Object object) {
        if (object == null) {
            return EMPTY;
        }
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            return objectMapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            return "{\"error\": \"Failed to convert to JSON\"}";
        }
    }

    public static void main(String[] args) {
        String result = convertToCamelCase("test_string");
        System.out.println(result);
    }
}
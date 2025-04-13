package org.swen90017.oas.constant;

/**
 * HTTP Request Related Constants
 *
 * @author Yongchun Li
 */
public class HttpRequestConstants {
    /**
     * Proxy-related Headers
     */
    public static final String HEADER_X_FORWARDED_FOR = "x-forwarded-for";
    public static final String HEADER_PROXY_CLIENT_IP = "Proxy-Client-IP";
    public static final String HEADER_WL_PROXY_CLIENT_IP = "WL-Proxy-Client-IP";
    public static final String HEADER_X_REAL_IP = "X-Real-IP";
    public static final String HEADER_UNKNOWN = "unknown";

    /**
     * Request-related Headers
     */
    public static final String HEADER_ACCEPT = "Accept";
    public static final String HEADER_USER_AGENT = "User-Agent";
    public static final String HEADER_REFERER = "Referer";
    public static final String HEADER_HOST = "Host";
    public static final String HEADER_ORIGIN = "Origin";
    public static final String HEADER_X_REQUESTED_WITH = "X-Requested-With";
    public static final String HEADER_CONTENT_TYPE = "Content-Type";
    public static final String HEADER_AUTHORIZATION = "Authorization";

    /**
     * Content-Type Types
     */
    public static final String CONTENT_TYPE_JSON = "application/json";
    public static final String CONTENT_TYPE_XML = "application/xml";
    public static final String CONTENT_TYPE_FORM_URLENCODED = "application/x-www-form-urlencoded";
    public static final String CONTENT_TYPE_MULTIPART_FORM_DATA = "multipart/form-data";
    public static final String CONTENT_TYPE_TEXT_PLAIN = "text/plain";
    public static final String CONTENT_TYPE_TEXT_HTML = "text/html";

    /**
     * HTTP Request Methods
     */
    public static final String METHOD_GET = "GET";
    public static final String METHOD_POST = "POST";
    public static final String METHOD_PUT = "PUT";
    public static final String METHOD_DELETE = "DELETE";
    public static final String METHOD_PATCH = "PATCH";
    public static final String METHOD_OPTIONS = "OPTIONS";
    public static final String METHOD_HEAD = "HEAD";

    /**
     * AJAX Request Characteristics
     */
    public static final String XML_HTTP_REQUEST = "XMLHttpRequest";
    public static final String AJAX_REQUEST_PARAM = "__ajax";
} 
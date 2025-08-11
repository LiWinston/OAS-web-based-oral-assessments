package org.swen90017.oas.utils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletRequest;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.swen90017.oas.constant.Constants;
import org.swen90017.oas.constant.HttpRequestConstants;

/**
 * Servlet Utility Class - Handle HTTP requests and responses
 *
 * @author Yongchun Li
 */
public class ServletUtils
{
    /**
     * Get String parameter
     *
     * @param name Parameter name
     * @return Parameter value
     */
    public static String getParameter(String name)
    {
        return getRequest().getParameter(name);
    }

    /**
     * Get String parameter
     *
     * @param name         Parameter name
     * @param defaultValue Default value
     * @return Parameter value
     */
    public static String getParameter(String name, String defaultValue)
    {
        return Convert.toStr(getRequest().getParameter(name), defaultValue);
    }

    /**
     * Get Integer parameter
     *
     * @param name Parameter name
     * @return Parameter value
     */
    public static Integer getParameterToInt(String name)
    {
        return Convert.toInt(getRequest().getParameter(name));
    }

    /**
     * Get Integer parameter
     *
     * @param name         Parameter name
     * @param defaultValue Default value
     * @return Parameter value
     */
    public static Integer getParameterToInt(String name, Integer defaultValue)
    {
        return Convert.toInt(getRequest().getParameter(name), defaultValue);
    }

    /**
     * Get Boolean parameter
     *
     * @param name Parameter name
     * @return Parameter value
     */
    public static Boolean getParameterToBool(String name)
    {
        return Convert.toBool(getRequest().getParameter(name));
    }

    /**
     * Get Boolean parameter
     *
     * @param name         Parameter name
     * @param defaultValue Default value
     * @return Parameter value
     */
    public static Boolean getParameterToBool(String name, Boolean defaultValue)
    {
        return Convert.toBool(getRequest().getParameter(name), defaultValue);
    }

    /**
     * Get request parameters
     *
     * @param request Request object
     * @return Parameters map
     */
    public static Map<String, String[]> getParams(ServletRequest request)
    {
        final Map<String, String[]> map = request.getParameterMap();
        return Collections.unmodifiableMap(map);
    }

    /**
     * Get request parameters
     *
     * @param request Request object
     * @return Parameters map (single value per key)
     */
    public static Map<String, String> getParamMap(ServletRequest request)
    {
        Map<String, String> params = new HashMap<>();
        for (Map.Entry<String, String[]> entry : getParams(request).entrySet())
        {
            params.put(entry.getKey(), StringUtils.join(entry.getValue(), ","));
        }
        return params;
    }

    /**
     * Get current request object
     *
     * @return Request object
     */
    public static HttpServletRequest getRequest()
    {
        return getRequestAttributes().getRequest();
    }

    /**
     * Get current response object
     *
     * @return Response object
     */
    public static HttpServletResponse getResponse()
    {
        return getRequestAttributes().getResponse();
    }

    /**
     * Get current session object
     *
     * @return Session object
     */
    public static HttpSession getSession()
    {
        return getRequest().getSession();
    }

    /**
     * Get request attributes
     *
     * @return Request attributes
     */
    public static ServletRequestAttributes getRequestAttributes()
    {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        return (ServletRequestAttributes) attributes;
    }

    /**
     * Render string to client
     *
     * @param response Response object
     * @param string   String to render
     */
    public static void renderString(HttpServletResponse response, String string)
    {
        try
        {
            response.setStatus(200);
            response.setContentType(HttpRequestConstants.CONTENT_TYPE_JSON);
            response.setCharacterEncoding(Constants.UTF8);
            response.getWriter().print(string);
        }
        catch (IOException e)
        {
            e.printStackTrace();
        }
    }

    /**
     * Check if it's an Ajax asynchronous request
     *
     * @param request Request object
     * @return true if it's an Ajax request
     */
    public static boolean isAjaxRequest(HttpServletRequest request)
    {
        String accept = request.getHeader(HttpRequestConstants.HEADER_ACCEPT);
        if (accept != null && accept.contains(HttpRequestConstants.CONTENT_TYPE_JSON))
        {
            return true;
        }

        String xRequestedWith = request.getHeader(HttpRequestConstants.HEADER_X_REQUESTED_WITH);
        if (xRequestedWith != null && xRequestedWith.contains(HttpRequestConstants.XML_HTTP_REQUEST))
        {
            return true;
        }

        String uri = request.getRequestURI();
        if (StringUtils.inStringIgnoreCase(uri, ".json", ".xml"))
        {
            return true;
        }

        String ajax = request.getParameter(HttpRequestConstants.AJAX_REQUEST_PARAM);
        return StringUtils.inStringIgnoreCase(ajax, "json", "xml");
    }

    /**
     * Content encoding
     *
     * @param str Content
     * @return Encoded content
     */
    public static String urlEncode(String str)
    {
        try
        {
            return URLEncoder.encode(str, Constants.UTF8);
        }
        catch (UnsupportedEncodingException e)
        {
            return StringUtils.EMPTY;
        }
    }

    /**
     * Content decoding
     *
     * @param str Content
     * @return Decoded content
     */
    public static String urlDecode(String str)
    {
        try
        {
            return URLDecoder.decode(str, Constants.UTF8);
        }
        catch (UnsupportedEncodingException e)
        {
            return StringUtils.EMPTY;
        }
    }
    
    /**
     * Get request body content
     *
     * @param request Request object
     * @return Request body content
     */
    public static String getBodyString(HttpServletRequest request) {
        StringBuilder sb = new StringBuilder();
        BufferedReader reader = null;
        try {
            reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (reader != null) {
                try {
                    reader.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        return sb.toString();
    }
    
    /**
     * Get request header information
     *
     * @param request Request object
     * @return Request header information map
     */
    public static Map<String, String> getHeaderMap(HttpServletRequest request) {
        Map<String, String> headerMap = new HashMap<>();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            String headerValue = request.getHeader(headerName);
            headerMap.put(headerName, headerValue);
        }
        return headerMap;
    }
    
    /**
     * Get the complete URL of the request
     *
     * @param request Request object
     * @return Complete URL
     */
    public static String getFullRequestUrl(HttpServletRequest request) {
        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        String requestUri = request.getRequestURI();
        String queryString = request.getQueryString();
        
        StringBuilder url = new StringBuilder();
        url.append(scheme).append("://").append(serverName);
        
        // Add port number if it's not 80 (HTTP default) or 443 (HTTPS default)
        if (("http".equals(scheme) && serverPort != 80)
                || ("https".equals(scheme) && serverPort != 443)) {
            url.append(":").append(serverPort);
        }
        
        url.append(requestUri);
        
        if (queryString != null && !queryString.isEmpty()) {
            url.append("?").append(queryString);
        }
        
        return url.toString();
    }
    
    /**
     * Get client information of the request
     *
     * @param request Request object
     * @return Client information
     */
    public static String getClientInfo(HttpServletRequest request) {
        String userAgent = request.getHeader(HttpRequestConstants.HEADER_USER_AGENT);
        String ipAddr = IpUtils.getIpAddr(request);
        return "IP: " + ipAddr + ", User-Agent: " + userAgent;
    }
    
    /**
     * Get request method
     *
     * @param request Request object
     * @return Request method
     */
    public static String getMethod(HttpServletRequest request) {
        return request.getMethod();
    }
    
    /**
     * Check if the request method is GET
     *
     * @param request Request object
     * @return true if it's GET
     */
    public static boolean isGet(HttpServletRequest request) {
        return HttpRequestConstants.METHOD_GET.equalsIgnoreCase(getMethod(request));
    }
    
    /**
     * Check if the request method is POST
     *
     * @param request Request object
     * @return true if it's POST
     */
    public static boolean isPost(HttpServletRequest request) {
        return HttpRequestConstants.METHOD_POST.equalsIgnoreCase(getMethod(request));
    }
    
    /**
     * Check if the request method is PUT
     *
     * @param request Request object
     * @return true if it's PUT
     */
    public static boolean isPut(HttpServletRequest request) {
        return HttpRequestConstants.METHOD_PUT.equalsIgnoreCase(getMethod(request));
    }
    
    /**
     * Check if the request method is DELETE
     *
     * @param request Request object
     * @return true if it's DELETE
     */
    public static boolean isDelete(HttpServletRequest request) {
        return HttpRequestConstants.METHOD_DELETE.equalsIgnoreCase(getMethod(request));
    }
    
    /**
     * Check if it's a Multipart request (file upload)
     *
     * @param request Request object
     * @return true if it's a Multipart request
     */
    public static boolean isMultipart(HttpServletRequest request) {
        String contentType = request.getContentType();
        return contentType != null && contentType.toLowerCase().startsWith(HttpRequestConstants.CONTENT_TYPE_MULTIPART_FORM_DATA);
    }
    
    /**
     * Set JSON content type for response
     *
     * @param response Response object
     */
    public static void setJsonContentType(HttpServletResponse response) {
        response.setContentType(HttpRequestConstants.CONTENT_TYPE_JSON);
        response.setCharacterEncoding(Constants.UTF8);
    }
    
    /**
     * Set HTML content type for response
     *
     * @param response Response object
     */
    public static void setHtmlContentType(HttpServletResponse response) {
        response.setContentType(HttpRequestConstants.CONTENT_TYPE_TEXT_HTML);
        response.setCharacterEncoding(Constants.UTF8);
    }
    
    /**
     * Set plain text content type for response
     *
     * @param response Response object
     */
    public static void setTextContentType(HttpServletResponse response) {
        response.setContentType(HttpRequestConstants.CONTENT_TYPE_TEXT_PLAIN);
        response.setCharacterEncoding(Constants.UTF8);
    }

    /**
     * Set cross-origin access control headers.
     * Recommended to use CorsConfig instead of this manual method.
     *
     * @param response Response object
     */
    public static void setCorsHeaders(HttpServletResponse response) {
        setCorsHeaders(response, "*");
    }

    /**
     * Set cross-origin access control headers for a specific origin.
     *
     * @param response Response object
     * @param origin Allowed origin
     */
    public static void setCorsHeaders(HttpServletResponse response, String origin) {
        response.setHeader("Access-Control-Allow-Origin", origin);
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD");
        response.setHeader("Access-Control-Max-Age", "3600");
        response.setHeader("Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Requested-With, Accept, Origin, " +
                        "Access-Control-Request-Method, Access-Control-Request-Headers, X-Trace-ID, X-CSRF-TOKEN");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Expose-Headers",
                "Authorization, Content-Disposition, X-Trace-ID, Access-Control-Allow-Origin, Access-Control-Allow-Credentials");
    }

    /**
     * Set cross-origin access control headers for preflight (OPTIONS) requests.
     *
     * @param response Response object
     * @param request Request object
     */
    public static void handlePreflightRequest(HttpServletResponse response, HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin != null) {
            setCorsHeaders(response, origin);
        } else {
            setCorsHeaders(response);
        }
        response.setStatus(HttpServletResponse.SC_OK);
    }
}

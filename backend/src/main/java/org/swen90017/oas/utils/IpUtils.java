package org.swen90017.oas.utils;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.http.HttpServletRequest;

import org.swen90017.oas.constant.HttpRequestConstants;

/**
 * IP Address Utility Class
 *
 * @author Yongchun Li
 */
public class IpUtils
{
    /**
     * IP address regex pattern
     */
    public final static String REGX_0_255 = "(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d)";
    public final static String REGX_IP = "((" + REGX_0_255 + "\\.){3}" + REGX_0_255 + ")";
    public final static String REGX_IP_WILDCARD = "(((\\*\\.){3}\\*)|(" + REGX_0_255 + "(\\.\\*){3})|(" + REGX_0_255 
            + "\\." + REGX_0_255 + ")(\\.\\*){2}" + "|((" + REGX_0_255 + "\\.){3}\\*))";
    public final static String REGX_IP_SEG = "(" + REGX_IP + "\\-" + REGX_IP + ")";

    /**
     * Constants for internal IP address ranges
     */
    private static final byte SECTION_1 = 0x0A;     // 10.x.x.x/8
    private static final byte SECTION_2 = (byte) 0xAC; // 172.16.x.x/12
    private static final byte SECTION_3 = (byte) 0x10; // 172.16.x.x/12
    private static final byte SECTION_4 = (byte) 0x1F; // 172.16.x.x/12 - 172.31.x.x
    private static final byte SECTION_5 = (byte) 0xC0; // 192.168.x.x/16
    private static final byte SECTION_6 = (byte) 0xA8; // 192.168.x.x/16

    private static final String LOCAL_IP = "127.0.0.1";
    private static final String LOCAL_IPV6 = "0:0:0:0:0:0:0:1";

    /**
     * Get the client IP address of the current request
     *
     * @return IP address
     */
    public static String getIpAddr()
    {
        return getIpAddr(ServletUtils.getRequest());
    }

    /**
     * Get the client IP address of the specified request
     *
     * @param request HttpServletRequest object
     * @return IP address
     */
    public static String getIpAddr(HttpServletRequest request)
    {
        if (request == null)
        {
            return HttpRequestConstants.HEADER_UNKNOWN;
        }

        String ip = null;
        
        // Try to get IP address from various proxy headers
        ip = request.getHeader(HttpRequestConstants.HEADER_X_FORWARDED_FOR);
        if (isUnknown(ip))
        {
            ip = request.getHeader(HttpRequestConstants.HEADER_PROXY_CLIENT_IP);
        }
        if (isUnknown(ip))
        {
            ip = request.getHeader(HttpRequestConstants.HEADER_X_FORWARDED_FOR);
        }
        if (isUnknown(ip))
        {
            ip = request.getHeader(HttpRequestConstants.HEADER_WL_PROXY_CLIENT_IP);
        }
        if (isUnknown(ip))
        {
            ip = request.getHeader(HttpRequestConstants.HEADER_X_REAL_IP);
        }
        if (isUnknown(ip))
        {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (isUnknown(ip))
        {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        
        // If no IP information in the above proxy headers, get the directly connected remote address
        if (isUnknown(ip))
        {
            ip = request.getRemoteAddr();
            if (LOCAL_IP.equals(ip) || LOCAL_IPV6.equals(ip))
            {
                // If it's local access, try to get the real IP address of the local machine
                try
                {
                    InetAddress inetAddress = InetAddress.getLocalHost();
                    ip = inetAddress.getHostAddress();
                }
                catch (UnknownHostException e)
                {
                    // Ignore exceptions, return local IP
                }
            }
        }

        // Handle multi-level proxy scenarios
        return LOCAL_IPV6.equals(ip) ? LOCAL_IP : getMultistageReverseProxyIp(ip);
    }

    /**
     * Get the first non-unknown IP address from multi-level reverse proxy
     *
     * @param ip IP address obtained
     * @return The first non-unknown IP address
     */
    public static String getMultistageReverseProxyIp(String ip)
    {
        // Multi-level reverse proxy detection
        if (ip != null && ip.indexOf(",") > 0)
        {
            final String[] ips = ip.trim().split(",");
            for (String subIp : ips)
            {
                if (!isUnknown(subIp))
                {
                    ip = subIp;
                    break;
                }
            }
        }
        return ip;
    }

    /**
     * Check if it's an internal IP address
     *
     * @param ip IP address
     * @return true if it's an internal IP
     */
    public static boolean internalIp(String ip)
    {
        byte[] addr = textToNumericFormatV4(ip);
        return internalIp(addr) || LOCAL_IP.equals(ip);
    }

    /**
     * Check if it's an internal IP address
     *
     * @param addr byte address
     * @return true if it's an internal IP
     */
    private static boolean internalIp(byte[] addr)
    {
        if (StringUtils.isNull(addr) || addr.length < 2)
        {
            return true;
        }
        final byte b0 = addr[0];
        final byte b1 = addr[1];
        
        // 10.x.x.x/8
        if (b0 == SECTION_1)
        {
            return true;
        }
        
        // 172.16.x.x/12 - 172.31.x.x
        if (b0 == SECTION_2)
        {
            if (b1 >= SECTION_3 && b1 <= SECTION_4)
            {
                return true;
            }
        }
        
        // 192.168.x.x/16
        if (b0 == SECTION_5 && b1 == SECTION_6)
        {
            return true;
        }
        
        return false;
    }

    /**
     * Convert IPv4 address to bytes
     *
     * @param text IPv4 address
     * @return byte array
     */
    public static byte[] textToNumericFormatV4(String text)
    {
        if (text.length() == 0)
        {
            return null;
        }

        byte[] bytes = new byte[4];
        String[] elements = text.split("\\.", -1);
        try
        {
            long l;
            int i;
            switch (elements.length)
            {
                case 1:
                    l = Long.parseLong(elements[0]);
                    if (l < 0L || l > 4294967295L)
                    {
                        return null;
                    }
                    bytes[0] = (byte) (int) (l >> 24 & 0xFF);
                    bytes[1] = (byte) (int) ((l & 0xFFFFFF) >> 16 & 0xFF);
                    bytes[2] = (byte) (int) ((l & 0xFFFF) >> 8 & 0xFF);
                    bytes[3] = (byte) (int) (l & 0xFF);
                    break;
                case 2:
                    l = Integer.parseInt(elements[0]);
                    if (l < 0L || l > 255L)
                    {
                        return null;
                    }
                    bytes[0] = (byte) (int) (l & 0xFF);
                    l = Integer.parseInt(elements[1]);
                    if (l < 0L || l > 16777215L)
                    {
                        return null;
                    }
                    bytes[1] = (byte) (int) (l >> 16 & 0xFF);
                    bytes[2] = (byte) (int) ((l & 0xFFFF) >> 8 & 0xFF);
                    bytes[3] = (byte) (int) (l & 0xFF);
                    break;
                case 3:
                    for (i = 0; i < 2; ++i)
                    {
                        l = Integer.parseInt(elements[i]);
                        if (l < 0L || l > 255L)
                        {
                            return null;
                        }
                        bytes[i] = (byte) (int) (l & 0xFF);
                    }
                    l = Integer.parseInt(elements[2]);
                    if (l < 0L || l > 65535L)
                    {
                        return null;
                    }
                    bytes[2] = (byte) (int) (l >> 8 & 0xFF);
                    bytes[3] = (byte) (int) (l & 0xFF);
                    break;
                case 4:
                    for (i = 0; i < 4; ++i)
                    {
                        l = Integer.parseInt(elements[i]);
                        if (l < 0L || l > 255L)
                        {
                            return null;
                        }
                        bytes[i] = (byte) (int) (l & 0xFF);
                    }
                    break;
                default:
                    return null;
            }
        }
        catch (NumberFormatException e)
        {
            return null;
        }
        return bytes;
    }

    /**
     * Get local IP address
     *
     * @return Local IP address
     */
    public static String getHostIp()
    {
        try
        {
            return InetAddress.getLocalHost().getHostAddress();
        }
        catch (UnknownHostException e)
        {
            // Ignore exceptions, return local IP
        }
        return LOCAL_IP;
    }

    /**
     * Get hostname
     *
     * @return Local hostname
     */
    public static String getHostName()
    {
        try
        {
            return InetAddress.getLocalHost().getHostName();
        }
        catch (UnknownHostException e)
        {
            // Ignore exceptions, return "Unknown"
        }
        return "Unknown";
    }

    /**
     * Check if the given string is "unknown"
     *
     * @param checkString String to check
     * @return true if it's unknown
     */
    public static boolean isUnknown(String checkString)
    {
        return StringUtils.isEmpty(checkString) || HttpRequestConstants.HEADER_UNKNOWN.equalsIgnoreCase(checkString);
    }

    /**
     * Check if it's a valid IP address
     *
     * @param ip IP address
     * @return true if it's a valid IP address
     */
    public static boolean isIP(String ip)
    {
        return StringUtils.isNotEmpty(ip) && ip.matches(REGX_IP);
    }

    /**
     * Check if it's an IP wildcard
     *
     * @param ip IP wildcard
     * @return true if it's an IP wildcard
     */
    public static boolean isIpWildCard(String ip)
    {
        return StringUtils.isNotEmpty(ip) && ip.matches(REGX_IP_WILDCARD);
    }

    /**
     * Check if the IP is within the wildcard range
     *
     * @param ipWildCard IP wildcard
     * @param ip         IP to check
     * @return true if it's within the wildcard range
     */
    public static boolean ipIsInWildCardNoCheck(String ipWildCard, String ip)
    {
        String[] s1 = ipWildCard.split("\\.");
        String[] s2 = ip.split("\\.");
        boolean isMatchedSeg = true;
        for (int i = 0; i < s1.length && !s1[i].equals("*"); i++)
        {
            if (!s1[i].equals(s2[i]))
            {
                isMatchedSeg = false;
                break;
            }
        }
        return isMatchedSeg;
    }

    /**
     * Check if it's an IP segment
     *
     * @param ipSeg IP segment
     * @return true if it's an IP segment
     */
    public static boolean isIPSegment(String ipSeg)
    {
        return StringUtils.isNotEmpty(ipSeg) && ipSeg.matches(REGX_IP_SEG);
    }

    /**
     * Check if the IP is within the specified IP segment
     *
     * @param iparea IP segment
     * @param ip     IP to check
     * @return true if it's within the IP segment
     */
    public static boolean ipIsInNetNoCheck(String iparea, String ip)
    {
        int idx = iparea.indexOf('-');
        String[] sips = iparea.substring(0, idx).split("\\.");
        String[] sipe = iparea.substring(idx + 1).split("\\.");
        String[] sipt = ip.split("\\.");
        long ips = 0L, ipe = 0L, ipt = 0L;
        for (int i = 0; i < 4; ++i)
        {
            ips = ips << 8 | Integer.parseInt(sips[i]);
            ipe = ipe << 8 | Integer.parseInt(sipe[i]);
            ipt = ipt << 8 | Integer.parseInt(sipt[i]);
        }
        if (ips > ipe)
        {
            long t = ips;
            ips = ipe;
            ipe = t;
        }
        return ips <= ipt && ipt <= ipe;
    }

    /**
     * Check if the IP matches the specified filter rule
     *
     * @param filter Filter rule
     * @param ip     IP to check
     * @return true if it matches
     */
    public static boolean isMatchedIp(String filter, String ip)
    {
        if (filter.equals(ip))
        {
            return true;
        }
        if (isIpWildCard(filter) && ipIsInWildCardNoCheck(filter, ip))
        {
            return true;
        }
        if (isIPSegment(filter) && ipIsInNetNoCheck(filter, ip))
        {
            return true;
        }
        return false;
    }
    
    /**
     * Check if the IP address format is valid
     *
     * @param ip IP address
     * @return true if it's valid
     */
    public static boolean isValidIpFormat(String ip)
    {
        if (StringUtils.isEmpty(ip))
        {
            return false;
        }
        
        // Use regex to validate IPv4 format
        String ipv4Regex = "^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$";
        Pattern pattern = Pattern.compile(ipv4Regex);
        Matcher matcher = pattern.matcher(ip);
        return matcher.matches();
    }
    
    /**
     * Parse IP address range in CIDR notation
     *
     * @param cidr CIDR notation, e.g., 192.168.1.0/24
     * @return true if it's a valid CIDR notation
     */
    public static boolean isValidCidr(String cidr)
    {
        if (StringUtils.isEmpty(cidr))
        {
            return false;
        }
        
        // Validate CIDR format
        String cidrRegex = "^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/([0-9]|[1-2][0-9]|3[0-2])$";
        Pattern pattern = Pattern.compile(cidrRegex);
        Matcher matcher = pattern.matcher(cidr);
        return matcher.matches();
    }
    
    /**
     * Check if the IP is within the CIDR range
     *
     * @param cidr CIDR notation, e.g., 192.168.1.0/24
     * @param ip   IP to check
     * @return true if it's within the CIDR range
     */
    public static boolean ipIsInCidr(String cidr, String ip)
    {
        if (!isValidCidr(cidr) || !isValidIpFormat(ip))
        {
            return false;
        }
        
        String[] parts = cidr.split("/");
        String cidrIp = parts[0];
        int prefixLength = Integer.parseInt(parts[1]);
        
        byte[] cidrIpBytes = textToNumericFormatV4(cidrIp);
        byte[] ipBytes = textToNumericFormatV4(ip);
        
        if (cidrIpBytes == null || ipBytes == null)
        {
            return false;
        }
        
        int mask = -1 << (32 - prefixLength);
        int cidrIpInt = ((cidrIpBytes[0] & 0xFF) << 24) | 
                        ((cidrIpBytes[1] & 0xFF) << 16) | 
                        ((cidrIpBytes[2] & 0xFF) << 8) | 
                        (cidrIpBytes[3] & 0xFF);
        int ipInt = ((ipBytes[0] & 0xFF) << 24) | 
                    ((ipBytes[1] & 0xFF) << 16) | 
                    ((ipBytes[2] & 0xFF) << 8) | 
                    (ipBytes[3] & 0xFF);
        
        return (cidrIpInt & mask) == (ipInt & mask);
    }
}
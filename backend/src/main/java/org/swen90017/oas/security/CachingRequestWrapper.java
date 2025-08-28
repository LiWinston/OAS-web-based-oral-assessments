package org.swen90017.oas.security;

import java.io.*;
import java.nio.charset.StandardCharsets;
import javax.servlet.ReadListener;
import javax.servlet.ServletInputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

/**
 * 支持多次读取请求体的Request Wrapper
 * 解决在同一请求中多次调用getInputStream()或getReader()的问题
 *
 * @author Yongchun Li
 */
public class CachingRequestWrapper extends HttpServletRequestWrapper {
    
    private byte[] cachedBody;
    private boolean bodyRead = false;
    
    public CachingRequestWrapper(HttpServletRequest request) {
        super(request);
    }
    
    @Override
    public ServletInputStream getInputStream() throws IOException {
        if (!bodyRead) {
            cacheRequestBody();
        }
        return new CachedBodyServletInputStream(cachedBody);
    }
    
    @Override
    public BufferedReader getReader() throws IOException {
        if (!bodyRead) {
            cacheRequestBody();
        }
        return new BufferedReader(new InputStreamReader(
                new CachedBodyServletInputStream(cachedBody), StandardCharsets.UTF_8));
    }
    
    /**
     * 获取缓存的请求体内容（字符串格式）
     */
    public String getCachedBody() {
        try {
            if (!bodyRead) {
                cacheRequestBody();
            }
            return cachedBody != null ? new String(cachedBody, StandardCharsets.UTF_8) : "";
        } catch (IOException e) {
            return "";
        }
    }
    
    /**
     * 设置缓存的请求体内容（用于XSS过滤后的内容）
     */
    public void setCachedBody(String body) {
        this.cachedBody = body != null ? body.getBytes(StandardCharsets.UTF_8) : new byte[0];
        this.bodyRead = true;
    }
    
    /**
     * 缓存请求体内容
     */
    private void cacheRequestBody() throws IOException {
        if (bodyRead) {
            return;
        }
        
        try (InputStream inputStream = super.getInputStream();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            
            byte[] buffer = new byte[1024];
            int len;
            while ((len = inputStream.read(buffer)) > -1) {
                baos.write(buffer, 0, len);
            }
            baos.flush();
            cachedBody = baos.toByteArray();
            bodyRead = true;
        }
    }
    
    /**
     * 自定义ServletInputStream实现，支持从缓存的字节数组读取
     */
    private static class CachedBodyServletInputStream extends ServletInputStream {
        
        private final InputStream sourceStream;
        
        public CachedBodyServletInputStream(byte[] cachedBody) {
            this.sourceStream = new ByteArrayInputStream(cachedBody != null ? cachedBody : new byte[0]);
        }
        
        @Override
        public boolean isFinished() {
            try {
                return sourceStream.available() == 0;
            } catch (IOException e) {
                return true;
            }
        }
        
        @Override
        public boolean isReady() {
            return true;
        }
        
        @Override
        public void setReadListener(ReadListener readListener) {
            throw new UnsupportedOperationException("ReadListener is not supported");
        }
        
        @Override
        public int read() throws IOException {
            return sourceStream.read();
        }
        
        @Override
        public int read(byte[] b) throws IOException {
            return sourceStream.read(b);
        }
        
        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            return sourceStream.read(b, off, len);
        }
        
        @Override
        public void close() throws IOException {
            sourceStream.close();
        }
    }
}

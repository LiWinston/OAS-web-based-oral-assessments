package org.swen90017.oas.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MybatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        
        // Optimistic locker - must be added before the pagination interceptor
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
        
        // Pagination interceptor
        PaginationInnerInterceptor p = new PaginationInnerInterceptor(DbType.MYSQL);
        p.setMaxLimit(100L);   // Align with your upper limit for page size
        p.setOverflow(true);   // When page number overflows, go to the last page
        interceptor.addInnerInterceptor(p);
        
        return interceptor;
    }
}
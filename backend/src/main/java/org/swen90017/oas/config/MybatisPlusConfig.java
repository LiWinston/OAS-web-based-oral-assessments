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
        
        // 乐观锁插件 - 必须在分页插件之前添加
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
        
        // 分页插件
        PaginationInnerInterceptor p = new PaginationInnerInterceptor(DbType.MYSQL);
        p.setMaxLimit(100L);   // 结合你的 limit 上限
        p.setOverflow(true);   // 页码溢出时回到最后一页
        interceptor.addInnerInterceptor(p);
        
        return interceptor;
    }
}
package org.swen90017.oas.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

/**
 * AOP Configuration
 *
 * @author Yongchun Li
 */
@Configuration
@EnableAspectJAutoProxy(proxyTargetClass = true)
public class AopConfig {
    // AOP configuration, enable AOP proxy
} 
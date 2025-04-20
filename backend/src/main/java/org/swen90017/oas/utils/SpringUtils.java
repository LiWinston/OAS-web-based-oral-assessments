package org.swen90017.oas.utils;

import org.springframework.aop.framework.AopContext;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.stereotype.Component;

/**
 * Spring tool class used to obtain beans
 */
@Component
public final class SpringUtils implements BeanFactoryPostProcessor {
    /**
     * Bean factory
     */
    private static ConfigurableListableBeanFactory beanFactory;

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        SpringUtils.beanFactory = beanFactory;
    }

    /**
     * Get bean
     *
     * @param <T>  Bean type
     * @param name Bean name
     * @return Bean
     */
    @SuppressWarnings("unchecked")
    public static <T> T getBean(String name) throws BeansException {
        return (T) beanFactory.getBean(name);
    }

    /**
     * Get bean
     *
     * @param <T>      Bean type
     * @param beanType Bean class
     * @return Bean
     */
    public static <T> T getBean(Class<T> beanType) throws BeansException {
        return beanFactory.getBean(beanType);
    }

    /**
     * Check if contains bean
     *
     * @param name Bean name
     * @return true if contains, false otherwise
     */
    public static boolean containsBean(String name) {
        return beanFactory.containsBean(name);
    }

    /**
     * Check if bean is singleton
     *
     * @param name Bean name
     * @return true if singleton, false otherwise
     */
    public static boolean isSingleton(String name) throws NoSuchBeanDefinitionException {
        return beanFactory.isSingleton(name);
    }

    /**
     * Get bean type
     *
     * @param name Bean name
     * @return Class of bean
     */
    public static Class<?> getType(String name) throws NoSuchBeanDefinitionException {
        return beanFactory.getType(name);
    }

    /**
     * Get the proxy object of the current bean
     *
     * @param invoker Bean
     * @return Proxy bean
     */
    @SuppressWarnings("unchecked")
    public static <T> T getAopProxy(T invoker) {
        return (T) AopContext.currentProxy();
    }
} 
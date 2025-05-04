package org.swen90017.oas;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;

@SpringBootTest
public class RedisTestApplicationTest {

    @Autowired
    private StringRedisTemplate redisTemplate;

//    @Test
//    public void testRedisSetAndGet() {
//        String key = "testKey";
//        String value = "Hello, Redis!";
//
//        redisTemplate.opsForValue().set(key, value);
//        String retrievedValue = redisTemplate.opsForValue().get(key);
//
//        assertEquals(value, retrievedValue);
//    }
}
package org.swen90017.oas;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.swen90017.oas.mapper.TestMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
public class TestMapperTest {

    @Autowired
    private TestMapper testMapper;

    @Test
    public void testMyBatisIntegration() {
        Integer result = testMapper.testQuery();
        System.out.println("Test Query Result: " + result);
        assertEquals(1, result, "MyBatis test fail");
    }
}

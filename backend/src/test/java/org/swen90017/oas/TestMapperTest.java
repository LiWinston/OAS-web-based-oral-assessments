package org.swen90017.oas;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.swen90017.oas.entity.TestE;
import org.swen90017.oas.mapper.TestEMapper;
import org.swen90017.oas.mapper.TestMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
public class TestMapperTest {

    @Autowired
    private TestMapper testMapper;
    @Autowired
    private TestEMapper testEMapper;

    @Test
    public void testMyBatisIntegration() {
        Integer result = testMapper.testQuery();
        System.out.println("Test Query Result: " + result);
        assertEquals(1, result, "MyBatis test fail");
    }
    @Test
    public void testInsert() {
        TestE testE = new TestE();
        int rowsInserted = testEMapper.insert(testE);
        System.out.println("Rows inserted: " + rowsInserted);
        Assertions.assertEquals(1, rowsInserted, "Insert failed");
    }
    @Test
    public void testSelectById() {
        TestE testE = testEMapper.selectById(1);
        System.out.println(testE);
        Assertions.assertNotNull(testE);
    }

}

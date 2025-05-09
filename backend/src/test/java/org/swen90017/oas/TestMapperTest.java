package org.swen90017.oas;

import org.junit.jupiter.api.Assertions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.swen90017.oas.entity.Test;
import org.swen90017.oas.mapper.TestEMapper;
import org.swen90017.oas.mapper.TestMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
public class TestMapperTest {

    @Autowired
    private TestMapper testMapper;
    @Autowired
    private TestEMapper testEMapper;

    @org.junit.jupiter.api.Test
    public void testInsert() {
        Test test = new Test();
        int rowsInserted = testEMapper.insert(test);
        System.out.println("Rows inserted: " + rowsInserted);
        Assertions.assertEquals(1, rowsInserted, "Insert failed");
    }
    @org.junit.jupiter.api.Test
    public void testSelectById() {
        Test test = testEMapper.selectById(1);
        System.out.println(test);
        Assertions.assertNotNull(test);
    }

}

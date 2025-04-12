package org.swen90017.oas;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.swen90017.oas.mapper.TestMapper;
import org.swen90017.oas.query.TestQuery;
import org.swen90017.oas.utils.QueryWrapperUtil;

import java.util.List;

@SpringBootTest
public class QueryWrapperUtilTest {
    @Autowired
    private TestMapper testMapper;
    @Test
    public void testBuildQueryWrapper() {
        TestQuery query = new TestQuery();
        query.setName("example");
        query.setMinAge(20);
        query.setMaxAge(30);

        QueryWrapper<org.swen90017.oas.entity.Test> wrapper = QueryWrapperUtil.build(query, org.swen90017.oas.entity.Test.class);

        String sqlSegment = wrapper.getSqlSegment();

        System.out.println("SQL Segment: " + sqlSegment);

        List<org.swen90017.oas.entity.Test> results = testMapper.selectList(wrapper);

        System.out.println("Results: " + results);

    }
}

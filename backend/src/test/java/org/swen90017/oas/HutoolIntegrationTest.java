package org.swen90017.oas;

import cn.hutool.core.util.StrUtil;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class HutoolIntegrationTest {

    @Test
    public void testHutoolStrUtil() {
        String original = "hello hutool";
        String result = StrUtil.upperFirst(original);
        System.out.println("Hutool Test Result: " + result);
        assertEquals("Hello hutool", result);
    }
}
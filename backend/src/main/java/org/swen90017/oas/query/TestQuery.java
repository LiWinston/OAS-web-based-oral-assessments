package org.swen90017.oas.query;

import org.swen90017.oas.annotation.QueryField;
import org.swen90017.oas.enums.QueryType;
public class TestQuery {
    @QueryField(type = QueryType.LIKE)
    private String name;
    @QueryField(column = "age", type = QueryType.GREATER_THAN_OR_EQUAL_TO)
    private Integer minAge;
    @QueryField(column = "age", type = QueryType.LESS_THAN)
    private Integer maxAge;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getMinAge() {
        return minAge;
    }

    public void setMinAge(Integer minAge) {
        this.minAge = minAge;
    }

    public Integer getMaxAge() {
        return maxAge;
    }

    public void setMaxAge(Integer maxAge) {
        this.maxAge = maxAge;
    }
}

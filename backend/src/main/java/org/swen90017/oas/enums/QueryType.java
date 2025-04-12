package org.swen90017.oas.enums;

public enum QueryType {
    EQUAL(" = "),
    NOT_EQUAL(" != "),
    LIKE(" LIKE "),
    NOT_LIKE(" NOT LIKE "),
    GREATER_THAN(" > "),
    GREATER_THAN_OR_EQUAL_TO(" >= "),
    LESS_THAN(" < "),
    LESS_THAN_OR_EQUAL_TO(" <= ");
    private final String symbol;

    QueryType(String symbol) {
        this.symbol = symbol;
    }

    public String getSymbol() {
        return symbol;
    }
}

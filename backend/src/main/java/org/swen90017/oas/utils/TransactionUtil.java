package org.swen90017.oas.utils;

import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.DefaultTransactionDefinition;

import java.util.Objects;
import java.util.function.Supplier;
@Slf4j
public class TransactionUtil {

    private TransactionUtil() {
    }

    @SneakyThrows
    public static <T> T doTransactionWithRequired(Supplier<T> supplier) {
        PlatformTransactionManager transactionManager = SpringUtils
                .getBean(PlatformTransactionManager.class);
        TransactionStatus status = transactionManager.getTransaction(new DefaultTransactionDefinition());

        T result = null;
        Throwable executeException = null;
        try {
            result = supplier.get();
        } catch (Throwable tr1) {
            executeException = tr1;
        }

        if (! Objects.isNull(executeException)) {
            try {
                transactionManager.rollback(status);
            } catch (Throwable tr2) {
                log.error("database roll back fail！", tr2);
            }
            throw executeException;
        } else {
            transactionManager.commit(status);
        }
        return result;
    }
}

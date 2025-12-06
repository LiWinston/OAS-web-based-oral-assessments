# OAS 口语评估 · CSV导入导出与Canvas集成

## 1. 核心设计思想：策略模式与适配器
本模块负责处理系统与外部数据源（特别是 Canvas LMS）的交互。由于导入对象多样（学生、考官、分组），且导出格式需兼容不同系统，我们采用了 **策略模式 (Strategy Pattern)** 来解耦解析逻辑，并使用 **适配器思想** 来处理 Canvas 特有的 CSV 格式（如 BOM 头、特定列名）。

### 1.1 策略模式架构
为了避免在 Controller 层出现大量的 `if-else` 判断文件类型，我们定义了统一的导入策略接口。

*   **接口定义**: `CsvImportStrategy<T>`
    *   `List<T> parse(InputStream is)`: 解析流。
    *   `void validate(List<T> data)`: 业务校验（查重、格式检查）。
    *   `void persist(List<T> data)`: 持久化逻辑。
*   **具体策略**:
    *   `StudentImportStrategy`: 处理学生名单，包含学号、邮箱校验。
    *   `ExaminerImportStrategy`: 处理考官名单，自动生成初始凭证。
    *   `GroupImportStrategy`: 处理分组信息，关联学生与组别。
*   **工厂类**: `CsvStrategyFactory` 根据上传的 `type` 参数（枚举）分发对应的策略实现类。

## 2. 关键技术实现

### 2.1 事务一致性 (Transactional Import)
导入操作通常涉及批量插入。为了保证数据的一致性（例如：不能导入了一半学生报错了，导致数据脏乱），我们在 Service 层使用了声明式事务。

*   **机制**: `@Transactional(rollbackFor = Exception.class)`
*   **逻辑**:
    1.  **解析阶段**: 读取 CSV，映射为 POJO。此阶段不开启事务，减少数据库连接占用。
    2.  **校验阶段**: 批量查询 DB 检查重复（如 Email 冲突）。
    3.  **持久化阶段**: 开启事务，执行 `saveBatch`。如果任一数据插入失败，全量回滚。

### 2.2 Canvas LMS 兼容性处理
Canvas 导出的 CSV 文件通常带有 **UTF-8 BOM (Byte Order Mark)** 头，且列名可能包含空格或特殊字符。

*   **BOM 处理**: 使用 `Apache Commons IO` 的 `BOMInputStream` 自动剔除文件头的 BOM 字节，防止解析第一列（如 `Student Name`）时出现乱码或无法识别的问题。
*   **模糊匹配**: 在表头映射时，采用归一化处理（去除空格、转小写），以兼容 "Student Name", "StudentName", "student_name" 等不同变体。

### 2.3 大文件导出与流式处理 (ZIP Streaming)
在导出全量反馈（包含生成的 PDF/Word 报告）时，数据量可能非常大。为了避免将所有文件加载到内存中导致 OOM (Out Of Memory)，我们采用了 **流式压缩**。

*   **技术**: `ZipOutputStream` 包装 `HttpServletResponse.getOutputStream()`。
*   **流程**:
    1.  设置响应头 `Content-Type: application/zip`。
    2.  遍历学生列表，逐个生成反馈文件。
    3.  将生成的文件字节流直接写入 `ZipOutputStream` 的 `ZipEntry`。
    4.  **关键点**: 每写入一个文件后调用 `flush()`，并不在内存中持有完整 ZIP 包。

## 3. 业务流程与异常处理

### 3.1 导入流程
1.  **上传**: 管理员上传 CSV 文件。
2.  **预检查**: 检查文件扩展名、MIME 类型。
3.  **策略分发**: `CsvStrategyFactory` 获取对应 Processor。
4.  **解析与校验**:
    *   *Fail-Fast 机制*: 如果发现格式错误（如缺少必填列），立即抛出 `CsvValidationException`，停止处理。
    *   *业务校验*: 检查数据库中是否存在冲突记录（如重复学号）。
5.  **入库**: 批量插入数据库。
6.  **反馈**: 返回成功条数或具体的错误行号及原因。

### 3.2 导出流程 (Canvas 成绩册)
*   **目标**: 生成可直接导入 Canvas Gradebook 的 CSV。
*   **格式**: 必须包含 `SIS User ID` 或 `Student ID`，以及对应的 `Assignment Name` 列。
*   **数据源**: 聚合 `Assessment` 表（分数）与 `Student` 表（标识符）。

## 4. 常见问题与面试点
*   **Q: 如何处理 10万行级别的超大 CSV 导入？**
    *   A: 当前使用 `OpenCSV` 或 `EasyExcel` 的监听器模式（SAX 风格），逐行读取处理，配合 `MyBatis-Plus` 的 `saveBatch` 分批提交（如每 1000 条提交一次），避免一次性加载所有对象到内存。
*   **Q: 导入过程中发生异常如何定位？**
    *   A: 我们在解析时维护了一个 `ErrorLog` 列表，记录出错的行号和具体错误信息（如 "第 5 行：邮箱格式不正确"），最终一次性返回给前端展示，而不是遇到第一个错误就崩溃。
*   **Q: 为什么导出文件打开是乱码？**
    *   A: Excel 默认以 ANSI 编码打开 CSV。我们在写入响应流时，显式写入了 UTF-8 BOM 头 (`0xEF, 0xBB, 0xBF`)，提示 Excel 使用 UTF-8 编码打开。

## 5. 检索关键词
CSV Import, Strategy Pattern, Transactional Batch Insert, Canvas LMS Integration, BOM Handling, ZipOutputStream, Large File Export.

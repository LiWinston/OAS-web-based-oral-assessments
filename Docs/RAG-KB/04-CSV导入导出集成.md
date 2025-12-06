# OAS 口语评估 · CSV 导入导出集成

## 目的与范围
基于 `CsvController` 与相关服务实现，描述 CSV 文件的预览、导入与导出流程，包括表头规范、导入历史记录管理与邮件通知机制；重点说明混合作业（MIX）导出时的 ZIP 打包行为。

## 能力概览（接口叙述）
- 预览：`POST /api/csv/preview`，参数：`file`（Multipart）、`type`（student/group/mix/examiner）。返回解析后的数据预览（学生/小组/考官）。
- 导入：`POST /api/csv/import`，参数：`file`、其余导入 DTO（含 `type` 与 `assignmentId`）。
  - 读取并解析 CSV；
  - 记录并保存导入文件（`csv_import_history`），含条目计数与导入者信息；
  - 创建用户数据并发送激活邮件（学生/小组/考官）；
  - 对已注册用户的考官，发送课程加入通知；
  - 根据结果更新导入历史记录状态（success/failed）。
- 成绩导出：`GET /api/csv/export/grades?assignmentId=...&type=...`
  - individual：导出个人成绩 CSV；
  - group：导出小组成绩 CSV；
  - mixed（或不传 `type` 且作业为混合）：返回 ZIP，内含个人与小组两份 CSV。
- 教师评分明细：`GET /api/csv/export/teacher-scoring-details?assignmentId=...`，导出教师评分细节 CSV。

## 解析与表头规范
- 类型分派：`student` → 学生；`group`/`mix` → 小组（混合场景一并适配）；`examiner` → 考官。
- 严格校验：预览阶段严格检查必需表头（Canvas 风格），对异常行执行可读性清洗与校验提示。

## 导入历史记录与通知
- 历史记录：保存导入文件、条目计数、导入者 ID/用户名、作业 ID、类型与状态；失败时写入错误消息。
- 激活邮件：对新创建用户（学生/考官）发送激活邮件；小组导入也会触发被邀请学生的激活邮件。
- 课程加入通知：对已注册考官发送课程加入提醒（导入阶段），学生的课程加入邮件在“发布到学生”阶段统一发送。

## 导出格式与 ZIP（混合作业）
- 个人与小组 CSV 列对齐 Canvas；小组导出包含组内成员的逐人行。
- 混合作业导出时返回 ZIP，文件名含时间戳与类型后缀：`*_individual.csv` / `*_group.csv`。

## 相关表与实体
- `csv_import_history`：导入文件元信息与状态记录。
- `sys_student`、`sys_examiner`、`sys_user`：用户与角色。
- `assignment`、`assessment_submission`：作业与评分数据（用于导出）。

## 相关实现（映射提示）
- 控制器：`CsvController`（预览/导入、成绩与教师评分明细导出、ZIP 打包）。
- 服务：`CsvService`（解析与邀请理由构造）、`CsvHistoryService`（保存与状态更新）、`EmailService`（激活邮件与课程加入通知）、`GradesExportService`（导出数据集）。

## 检索关键词
OAS 口语评估、CSV 导入、CSV 导出、预览、表头校验、导入历史、激活邮件、课程加入通知、ZIP、Canvas。
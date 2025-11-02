
# 🎞️ Cyber Poster Wall

> 一个 **U 盘插拔式的观影海报墙网站** —— 无需服务器、无需数据库、可离线运行。
> 只需导入 JSON，即可开始使用；使用完毕导出 JSON 并清空浏览器缓存即可。
> A **U-disk-style, plug-and-play** movie poster wall — fully offline, portable, and self-contained.
> Import a JSON file, edit locally, export your posters, and unplug — all data stays in one file.



# Demo
🔗 [Live Site →](https://zhenrys.github.io/cyber-poster-wall/)

<div align="center">
  <img src="https://github.com/user-attachments/assets/4880e2d3-59f2-4734-a019-f6d78e57dbef" width="60%" />
  <img src="https://github.com/user-attachments/assets/1156777b-9bc8-4f34-ae19-5fb66e98317c" width="34%" />
</div>

---

## 🧭 使用流程 | Typical Workflow

| 步骤  | 操作        | 说明                   |
| --- | --------- | -------------------- |
| 1️⃣ | 导入 JSON   | 上传 `posters.json` 文件 |
| 2️⃣ | 添加 / 编辑海报 | 粘贴或上传图片、填写短评         |
| 3️⃣ | 导出 JSON   | 下载更新后的收藏             |
| 4️⃣ | 清除本地存储    | 重置使用环境（U 盘拔出）        |

| Step | Action             | Description                    |
| ---- | ------------------ | ------------------------------ |
| 1️⃣  | Import JSON        | Upload existing `posters.json` |
| 2️⃣  | Add / Edit Posters | Paste or upload new posters    |
| 3️⃣  | Export JSON        | Download updated collection    |
| 4️⃣  | Clear Storage      | Reset for next session         |

---

## 🧩 数据格式 | Data Format

示例 `posters.json` 内容：
Example of a portable JSON file:

```json
[
  {
    "id": "blade-runner-2049-1730560220000",
    "title": "Blade Runner 2049",
    "posterUrl": "data:image/jpeg;base64,...",
    "review": "Hypnotic neon-noir that meditates on memory and meaning."
  },
  {
    "id": "akira-1988-1730560332000",
    "title": "AKIRA",
    "posterUrl": "data:image/jpeg;base64,...",
    "review": "Boiling energy and dystopian grit."
  }
]
```

✅ 图片以 Base64 格式直接存储在 `posterUrl` 字段中。
This makes `posters.json` fully portable — your wall travels with you like a U-disk.

---

# ⚖️ License

MIT License — free for personal and educational use.
© 2025 Henry Zhang. All rights reserved.
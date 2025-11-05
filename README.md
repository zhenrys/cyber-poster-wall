
# 🎞️ Cyber Poster Wall

> 一个 **U 盘插拔式的海报墙网站** —— `.JSON` 文件==U盘。
>
> 导入 `.JSON` 即可展示海报；可添加/删除/编辑海报；使用完毕导出 `.JSON` 文件；如果是常用浏览器，无需拔出U盘。

> A USB-style poster wall website — where your .JSON file is the USB drive.
>
> Import your .JSON to instantly load your posters; freely add, edit, or delete them;
> export the updated .JSON when you’re done.
> With modern browsers, no real USB is needed — everything runs locally and offline.


# Demo
🔗 [Live Site →](https://zhenrys.github.io/cyber-poster-wall/)
<img width="1393" height="784" alt="2A7240C1-E1F8-44E0-BADE-BE452432B5DF" src="https://github.com/user-attachments/assets/c8ec9ff7-e592-4cc1-88a9-9680665ed5c9" />
<img width="1641" height="796" alt="BCB3ADC7-9B2C-4FDF-AE19-B2FAC7F35BA6" src="https://github.com/user-attachments/assets/f19a7acf-a930-47ec-b1b2-1565359d63e1" />


---

## 🧭 使用流程 | Typical Workflow

| 步骤  | 操作        | 说明                   |
| --- | --------- | -------------------- |
| 1️⃣ | 导入 JSON   | 上传 `posters.json` 文件 |
| 2️⃣ | 添加 / 编辑海报 | 粘贴或上传图片、填写短评         |
| 3️⃣ | 导出 JSON   | 下载更新后的收藏             |
| 4️⃣ | 清除本地存储(可选)    | 重置使用环境（U 盘拔出）        |

| Step | Action             | Description                    |
| ---- | ------------------ | ------------------------------ |
| 1️⃣  | Import JSON        | Upload existing `posters.json` |
| 2️⃣  | Add / Edit Posters | Paste or upload new posters    |
| 3️⃣  | Export JSON        | Download updated collection    |
| 4️⃣  | Clear Storage(optional)       | Reset for next session         |

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

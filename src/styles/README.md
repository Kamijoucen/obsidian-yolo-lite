# `src/styles/` 组织约定

## 1. 按职责分目录，不按"哪里先用"

Popover、dropdown 和滚动条等共享视觉规则应放在专用目录，避免以首个调用者
命名，导致后续组件依赖无关功能模块。

**新增样式时的判断顺序：**
1. 它属于某个跨组件的**视觉系统**（popover、按钮、表单等）→ 找/建独立目录
   （现有：`popover/`）。
2. 它属于某个**功能模块**（chat 下的具体面板）→ 放进对应子目录。
3. 通用样式不要放进单个功能模块的样式文件。

## 2. 命名前缀

- 新增 CSS class → 一律 `yolo-` 前缀。
- 存量 `yolo-*` → 不做大规模重命名（外部主题 / CSS snippet 可能 target）。
- 旧组件被新抽象**完全替代**时，顺手删掉相关 `yolo-*` 死代码（删除而非改名）。

## 3. Popover / Dropdown 专项约定

详见 [`popover/surface.css`](./popover/surface.css) 文件头注释 ——
包含视觉/尺寸分离、变体文件归属、新增弹窗 checklist 等。
改弹窗或新增弹窗前请先读那段注释。

## 4. 编译

`styles.css` 是 PostCSS 从 `index.css` 编译产物，**不要直接编辑**。
改完源文件运行 `npm run styles:build`（或 `npm run styles:watch`）。

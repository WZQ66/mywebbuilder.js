# WebBuilder.js

IoT 可视化编辑器库 - 基于网格布局的拖拽式页面构建器

中文 | [English](README_EN.md)

## 特性

- 📱 固定手机比例画布（375×812）
- 📐 网格布局，单元格 1:1 正方形
- 🖱️ 拖拽添加、移动组件
- ⌨️ Delete/Backspace键删除选中组件
- ⚙️ 属性面板，实时预览
- 💾 JSONB 格式保存/加载
- 🎨 自定义组件支持
- 🔔 变化回调通知

## 项目结构

```
.
├── js/lib/webbuilder/        # 核心库（你需要引入的）
│   ├── webbuilder.js         # 主文件
│   └── types/                # 内部模块
├── editor.html               # 示例编辑器
├── js/editor/editor.js      # 示例编辑器逻辑
├── css/editor.css           # 示例编辑器样式
├── README.md                # 中文文档
└── README_EN.md            # English
```

> **注意**: `editor.html` 和 `js/editor/` 是示例代码，展示如何使用本库。
> 实际使用时只需引入 `js/lib/webbuilder/webbuilder.js`，然后自行实现编辑器逻辑。

## 快速开始

### 1. 引入文件

```html
<script src="js/lib/webbuilder/webbuilder.js"></script>
```

### 2. 创建容器

```html
<div id="editor" style="width: 100%; height: 600px;"></div>
```

### 3. 初始化编辑器

```javascript
webbuilder.init('#editor');
```

### 4. 注册组件

```javascript
webbuilder.define('gauge', {
    type: 'gauge',
    label: '仪表盘',
    icon: '📊',
    defaultColumnSpan: 6,
    defaultRowSpan: 6,
    defaultProps: {
        label: '温度',
        value: 25,
        unit: '°C'
    },
    traits: [
        { type: 'text', name: 'label', label: '标签' },
        { type: 'number', name: 'value', label: '值' },
        { type: 'text', name: 'unit', label: '单位' }
    ],
    render: function(props) {
        var el = document.createElement('div');
        el.className = 'my-gauge';
        el.innerHTML = '<div class="value">' + props.value + props.unit + '</div>' +
                       '<div class="label">' + props.label + '</div>';
        return el;
    }
});
```

## API 文档

### 初始化

```javascript
webbuilder.init(containerSelector)
```

| 参数 | 类型 | 说明 |
|------|------|------|
| containerSelector | string/HTMLElement | 容器选择器或元素 |

### 注册组件

```javascript
webbuilder.define(name, definition)
```

| 参数 | 类型 | 说明 |
|------|------|------|
| name | string | 组件唯一标识 |
| definition | object | 组件定义对象 |

**definition 结构：**

```javascript
{
    type: 'component-type',           // 组件类型
    label: '组件名称',                 // 显示名称
    icon: '📊',                       // 工具箱图标
    defaultColumnSpan: 6,             // 默认跨列数
    defaultRowSpan: 4,                // 默认跨行数
    defaultProps: { ... },            // 默认属性
    traits: [ ... ],                 // 属性定义（用于属性面板）
    render: function(props) { ... }   // 渲染函数，返回 DOM 元素
}
```

### 注册变化回调

```javascript
webbuilder.onChanged(function(action, data) {
    // action: 'add' | 'delete' | 'move' | 'update' | 'load' | 'clear'
    // data: 相关数据（组件实例、组件ID等）
});
```

| action | 说明 | data |
|--------|------|------|
| add | 添加组件 | 组件实例对象 |
| delete | 删除组件 | { id: 组件ID } |
| move | 移动组件 | 组件实例对象 |
| update | 属性面板修改属性 | 组件实例对象 |
| load | 加载JSONB | { count: 组件数量 } |
| clear | 清空画布 | null |

### 导出 JSONB

```javascript
var jsonb = webbuilder.toJSONB();
```

返回格式：

```javascript
{
    version: '1.0',
    layouts: {
        phone: {
            canvas: {
                width: 375,
                height: 812,
                columns: 24,
                cellSize: 13.5,
                rows: 52,
                gap: 2,
                background: '#f5f5f5'
            },
            components: [
                {
                    id: 'gauge-1',
                    type: 'gauge',
                    grid: {
                        startCell: 0,
                        colSpan: 6,
                        rowSpan: 6
                    },
                    props: { ... }
                }
            ]
        },
        computer: null
    }
}
```

### 加载 JSONB

```javascript
webbuilder.fromJSONB(jsonb);
```

### 渲染到容器

```javascript
var components = webbuilder.renderToDiv(container);
```

返回组件列表：

```javascript
[
    {
        element: HTMLElement,   // 组件 DOM 元素
        wrapper: HTMLElement,   // 包装容器
        props: { ... },          // 组件属性（深拷贝）
        id: 'gauge-1',
        type: 'gauge'
    }
]
```

### 其他方法

```javascript
// 获取画布配置
webbuilder.getCanvasConfig();

// 获取所有组件
webbuilder.getComponents();

// 清空画布
webbuilder.clear();
```

## 组件定义规范

### traits 属性定义

用于生成属性面板：

```javascript
traits: [
    { type: 'text', name: 'label', label: '标签', default: '' },
    { type: 'number', name: 'value', label: '值', default: 0 },
    { type: 'checkbox', name: 'state', label: '状态', default: false }
]
```

| type | 说明 |
|------|------|
| text | 文本输入框 |
| number | 数字输入框 |
| checkbox | 复选框 |

### render 函数

必须返回 DOM 元素：

```javascript
render: function(props) {
    var el = document.createElement('div');
    el.textContent = props.label;
    return el;
}
```

## 网格系统

- **画布宽度**：375px（固定）
- **列数**：24列
- **单元格大小**：约 13.5px × 13.5px（正方形）
- **组件位置**：通过 `startCell`（起始格子编号）+ `colSpan`（跨列数）+ `rowSpan`（跨行数）定义

格子编号从 0 开始，按行递增：

```
0   1   2   3   ... 23
24  25  26  27  ... 47
48  49  50  51  ... 71
...
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 许可证

MIT

---

*参考项目：[webbuilder.js](https://github.com/qrailibs/webbuilder.js)*

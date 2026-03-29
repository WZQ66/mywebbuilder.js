# IoT 可视化编辑器 TODO

## 目标

基于 webbuilder.js 改造，实现支持网格布局的 IoT 可视化编辑器。

## 技术方案

- **布局方式**：CSS Grid 网格布局（24列）
- **单元格比例**：1:1（正方形）
- **画布尺寸**：固定手机宽度（375px），高度自适应
- **存储格式**：JSONB，预留多端接口（phone/computer）
- **前端技术栈**：纯 HTML + CSS + JavaScript（禁止 npm）

---

## 一、核心框架修改

### 1.1 webbuilder.js 主模块

- [x] 初始化时接收容器元素（div）
- [x] 移除组件类型限制（element/container）
- [x] 添加画布配置（列数、行高、间距）
- [x] 添加 `getCanvasConfig()` 方法
- [x] 添加 `setCanvasConfig(config)` 方法
- [x] 添加 `toJSONB()` 方法 - 导出为 JSONB
- [x] 添加 `fromJSONB(jsonb)` 方法 - 从 JSONB 加载
- [x] 添加 `toHTML()` 方法 - 生成 HTML 代码

### 1.2 Component.js 组件类

- [x] 添加 `id` 属性（唯一标识）
- [x] 添加 `props` 属性（组件自定义属性）
- [x] 添加 `style` 属性（组件样式）
- [x] 添加 `gridPosition` 属性（网格位置）
  
  ```javascript
  gridPosition: {
      column: 1,      // 起始列
      row: 1,         // 起始行
      columnSpan: 3,  // 跨列数
      rowSpan: 2      // 跨行数
  }
  ```
- [x] 添加 `toJSONB()` 方法
- [x] 添加 `fromJSONB(jsonb)` 静态方法
- [x] 添加 `toHTML()` 方法

### 1.3 BuilderContainer.js 容器类

- [x] 修改为 Grid 容器
- [x] 添加网格配置（columns、rowHeight、gap）
- [x] 修改拖放逻辑：计算目标行列位置
- [x] 添加组件拖拽移动功能（在画布内移动）
- [x] 添加组件选中/取消选中功能
- [x] 添加组件删除功能
- [ ] 添加网格辅助线显示

### 1.4 BuilderToolbox.js 工具箱类

- [x] 添加组件分类支持
- [x] 添加组件预览图标
- [ ] 添加搜索/过滤功能
- [ ] 按分类组织：数据展示类、控制输入类、布局容器类

---

## 二、编辑器功能

### 2.1 画布编辑

- [x] 画布尺寸配置（支持手机/电脑端预览切换）
- [x] 手机端：375x812，24列网格
- [x] 电脑端：1200x800，24列网格
- [ ] 网格线显示/隐藏
- [x] 组件吸附到网格
- [x] 组件拖拽调整位置
- [ ] 组件拖拽调整大小（跨列/跨行）
- [ ] 组件右键菜单（删除、复制、置顶/置底）

### 2.2 组件选中

- [x] 点击选中组件
- [x] 选中高亮边框
- [ ] 显示调整大小手柄
- [x] 点击空白处取消选中

### 2.3 属性面板

- [x] 选中组件时显示属性面板
- [x] 显示组件基础属性（位置、大小）
- [x] 显示组件自定义属性
- [x] 实时更新组件

### 2.4 工具栏

- [x] 保存按钮
- [x] 预览按钮
- [ ] 撤销/重做按钮（可选）
- [x] 清空画布按钮

---

## 三、JSONB 存储结构

### 3.1 输出格式

```json
{
    "version": "1.0",
    "layouts": {
        "phone": {
            "canvas": {
                "width": 375,
                "height": 812,
                "columns": 24,
                "rowHeight": 30,
                "gap": 8,
                "background": "#f5f5f5"
            },
            "components": [
                {
                    "id": "gauge-001",
                    "type": "gauge",
                    "grid": {
                        "startCell": 0,
                        "colSpan": 6,
                        "rowSpan": 6
                    },
                    "props": {
                        "label": "温度",
                        "value": 25,
                        "unit": "°C"
                    }
                }
            ]
        },
        "computer": null
    }
}
```

### 3.2 加载功能

- [x] 从 JSONB 恢复画布配置
- [x] 从 JSONB 恢复所有组件
- [x] 从 JSONB 恢复组件位置和属性

---

## 四、HTML 生成

### 4.1 生成规则

- [x] 根据 JSONB 生成完整的 HTML 结构
- [x] 生成内联 CSS 样式
- [ ] 生成组件初始化脚本

### 4.2 输出格式

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        .iot-canvas {
            width: 375px;
            height: 812px;
            display: grid;
            grid-template-columns: repeat(24, 1fr);
            grid-auto-rows: 30px;
            gap: 8px;
            background: #f5f5f5;
            padding: 8px;
        }
    </style>
</head>
<body>
    <div class="iot-canvas">
        <div id="gauge-001" class="iot-component" style="grid-column: 1 / span 6; grid-row: 1 / span 6;">
            <!-- 组件内容 -->
        </div>
    </div>
</body>
</html>
```

---

## 五、组件接口规范

框架不实现具体组件，只提供接口规范，使用者按规范自定义组件。

### 5.1 组件注册接口

```javascript
// 注册自定义组件
webbuilder.define('my-component', {
    // 组件唯一标识
    type: 'my-component',

    // 默认属性
    defaultProps: {
        label: '默认文本',
        value: 0
    },

    // 属性定义（用于属性面板）
    traits: [
        { type: 'text', name: 'label', label: '标签' },
        { type: 'number', name: 'value', label: '值' },
        { type: 'device-selector', name: 'deviceId', label: '绑定设备' }
    ],

    // 编辑器中的渲染函数
    render: function(props) {
        return '<div class="my-component">' + props.label + '</div>';
    },

    // 预览图标（可选）
    icon: '📊'
});
```

### 5.2 组件接口要求

每个组件必须实现：
- `type` - 组件类型标识
- `defaultProps` - 默认属性对象
- `render(props)` - 返回 HTML 字符串

可选实现：
- `traits` - 属性定义数组，用于属性面板
- `icon` - 工具箱中显示的图标
- `onSelect()` - 选中时的回调
- `onDrop()` - 拖放完成后的回调
- `onDestroy()` - 销毁时的回调
---

## 六、显示端适配

### 6.1 手机端

- [x] 渲染在固定手机比例的 div 中
- [x] 使用 24 列网格
- [x] 组件位置和大小按比例显示

### 6.2 电脑端（预留）

- [ ] 未来扩展，暂不实现
- [ ] JSONB 格式已预留 computer 接口
---

## 七、文件结构

```
.
├── editor.html                 # 编辑器入口
├── css/
│   └── editor.css              # 编辑器样式
├── js/
│   ├── editor/
│   │   └── editor.js           # 编辑器主逻辑
│   └── lib/
│       └── webbuilder/         # 修改后的 webbuilder
│           ├── webbuilder.js
│           └── LICENSE
```

---

## 八、开发顺序

### 第一阶段：核心框架 ✅
1. ✅ 修改 webbuilder.js 核心类
2. ✅ 实现网格布局容器
3. ✅ 实现组件拖放定位

### 第二阶段：编辑器功能 ✅
4. ✅ 实现组件选中
5. ✅ 实现属性面板
6. ✅ 实现保存/加载

### 第三阶段：组件接口 ✅
7. ✅ 定义组件接口规范
8. ✅ 提供组件注册示例

### 第四阶段：完善功能
9. ✅ 实现 HTML 生成
10. ✅ 实现响应式适配
11. 实现显示页面
---

## 九、已确认事项

| 事项 | 决定 |
|------|------|
| 画布宽度 | 固定 375px |
| 画布高度 | 自适应（根据行数计算） |
| 网格粒度 | 24列 |
| 单元格比例 | 1:1（正方形） |
| 多端适配 | 仅支持手机端，电脑端预留接口 |
| 组件位置 | 使用 startCell + colSpan + rowSpan |
| 组件开发 | 框架只提供接口，使用者自定义实现 |
| 折线图 | 使用 Chart.js（使用者自行集成） |

---

*最后更新: 2026-03-29*
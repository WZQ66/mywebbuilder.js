# WebBuilder.js

IoT Visual Editor Library - Grid-based Drag & Drop Page Builder

[中文文档](README.md) | English

## Features

- 📱 Fixed mobile canvas (375×812)
- 📐 Grid layout with 1:1 square cells
- 🖱️ Drag & drop to add and move components
- ⚙️ Property panel with real-time preview
- 💾 JSONB format save/load
- 🎨 Custom component support

## Project Structure

```
.
├── js/lib/webbuilder/        # Core library (what you need to include)
│   ├── webbuilder.js         # Main file
│   └── types/                # Internal modules
├── editor.html               # Example editor
├── js/editor/editor.js       # Example editor logic
├── css/editor.css            # Example editor styles
├── README.md                 # Chinese
└── README_EN.md              # English
```

> **Note**: `editor.html` and `js/editor/` are example code showing how to use this library.
> For actual use, you only need to include `js/lib/webbuilder/webbuilder.js` and implement your own editor logic.

## Quick Start

### 1. Include the library

```html
<script src="js/lib/webbuilder/webbuilder.js"></script>
```

### 2. Create container

```html
<div id="editor" style="width: 100%; height: 600px;"></div>
```

### 3. Initialize editor

```javascript
webbuilder.init('#editor');
```

### 4. Register components

```javascript
webbuilder.define('gauge', {
    type: 'gauge',
    label: 'Gauge',
    icon: '📊',
    defaultColumnSpan: 6,
    defaultRowSpan: 6,
    defaultProps: {
        label: 'Temperature',
        value: 25,
        unit: '°C'
    },
    traits: [
        { type: 'text', name: 'label', label: 'Label' },
        { type: 'number', name: 'value', label: 'Value' },
        { type: 'text', name: 'unit', label: 'Unit' }
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

## API Reference

### Initialize

```javascript
webbuilder.init(containerSelector)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| containerSelector | string/HTMLElement | Container selector or element |

### Register component

```javascript
webbuilder.define(name, definition)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| name | string | Unique component identifier |
| definition | object | Component definition object |

**definition structure:**

```javascript
{
    type: 'component-type',           // Component type
    label: 'Component Name',          // Display name
    icon: '📊',                       // Toolbox icon
    defaultColumnSpan: 6,             // Default column span
    defaultRowSpan: 4,                // Default row span
    defaultProps: { ... },            // Default properties
    traits: [ ... ],                  // Property definitions (for property panel)
    render: function(props) { ... }   // Render function, returns DOM element
}
```

### Export JSONB

```javascript
var jsonb = webbuilder.toJSONB();
```

Return format:

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

### Load JSONB

```javascript
webbuilder.fromJSONB(jsonb);
```

### Render to container

```javascript
var components = webbuilder.renderToDiv(container);
```

Returns component list:

```javascript
[
    {
        element: HTMLElement,   // Component DOM element
        wrapper: HTMLElement,   // Wrapper container
        props: { ... },         // Component properties (deep copy)
        id: 'gauge-1',
        type: 'gauge'
    }
]
```

### Other methods

```javascript
// Get canvas config
webbuilder.getCanvasConfig();

// Get all components
webbuilder.getComponents();

// Clear canvas
webbuilder.clear();
```

## Component Definition Specification

### traits - Property definitions

Used to generate property panel:

```javascript
traits: [
    { type: 'text', name: 'label', label: 'Label', default: '' },
    { type: 'number', name: 'value', label: 'Value', default: 0 },
    { type: 'checkbox', name: 'state', label: 'State', default: false }
]
```

| type | Description |
|------|-------------|
| text | Text input |
| number | Number input |
| checkbox | Checkbox |

### render function

Must return a DOM element:

```javascript
render: function(props) {
    var el = document.createElement('div');
    el.textContent = props.label;
    return el;
}
```

## Grid System

- **Canvas width**: 375px (fixed)
- **Columns**: 24
- **Cell size**: ~13.5px × 13.5px (square)
- **Component position**: Defined by `startCell` (starting cell index) + `colSpan` (column span) + `rowSpan` (row span)

Cell index starts from 0 and increases row by row:

```
0   1   2   3   ... 23
24  25  26  27  ... 47
48  49  50  51  ... 71
...
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## License

MIT

---

*Based on [webbuilder.js](https://github.com/qrailibs/webbuilder.js) by qrai*
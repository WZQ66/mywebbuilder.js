/**
 * IoT 可视化编辑器初始化脚本
 * 仅支持手机端布局
 */

// 未保存标记
var isDirty = false;

// 初始化编辑器
function initEditor() {
    // 初始化 webbuilder
    webbuilder.init('#editor');

    // 注册示例组件
    registerComponents();

    // 绑定事件
    bindEvents();

    // 注册变化回调
    webbuilder.onChanged(function(action, data) {
        isDirty = true;
    });
}

/**
 * 注册示例组件
 */
function registerComponents() {
    // 仪表盘组件
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
            { type: 'text', name: 'label', label: '标签', default: '温度' },
            { type: 'number', name: 'value', label: '值', default: 25 },
            { type: 'text', name: 'unit', label: '单位', default: '°C' }
        ],
        render: function(props) {
            var el = document.createElement('div');
            el.className = 'iot-gauge';

            var valueEl = document.createElement('div');
            valueEl.className = 'value';
            valueEl.textContent = props.value + props.unit;

            var labelEl = document.createElement('div');
            labelEl.className = 'label';
            labelEl.textContent = props.label;

            el.appendChild(valueEl);
            el.appendChild(labelEl);

            return el;
        }
    });

    // 开关组件
    webbuilder.define('switch', {
        type: 'switch',
        label: '开关',
        icon: '🔘',
        defaultColumnSpan: 4,
        defaultRowSpan: 3,
        defaultProps: {
            label: '开关',
            state: false
        },
        traits: [
            { type: 'text', name: 'label', label: '标签', default: '开关' },
            { type: 'checkbox', name: 'state', label: '状态', default: false }
        ],
        render: function(props) {
            var el = document.createElement('div');
            el.className = 'iot-switch';

            var switchEl = document.createElement('div');
            switchEl.className = 'switch' + (props.state ? ' active' : '');

            var labelEl = document.createElement('div');
            labelEl.className = 'label';
            labelEl.textContent = props.label;

            el.appendChild(switchEl);
            el.appendChild(labelEl);

            return el;
        }
    });

    // 滑块组件
    webbuilder.define('slider', {
        type: 'slider',
        label: '滑块',
        icon: '🎚️',
        defaultColumnSpan: 8,
        defaultRowSpan: 3,
        defaultProps: {
            label: '亮度',
            value: 50,
            min: 0,
            max: 100
        },
        traits: [
            { type: 'text', name: 'label', label: '标签', default: '亮度' },
            { type: 'number', name: 'value', label: '值', default: 50 },
            { type: 'number', name: 'min', label: '最小值', default: 0 },
            { type: 'number', name: 'max', label: '最大值', default: 100 }
        ],
        render: function(props) {
            var el = document.createElement('div');
            el.className = 'iot-slider';

            var labelEl = document.createElement('div');
            labelEl.className = 'label';
            labelEl.textContent = props.label + ': ' + props.value;

            var inputEl = document.createElement('input');
            inputEl.type = 'range';
            inputEl.min = props.min;
            inputEl.max = props.max;
            inputEl.value = props.value;

            el.appendChild(labelEl);
            el.appendChild(inputEl);

            return el;
        }
    });

    // 按钮组件
    webbuilder.define('button', {
        type: 'button',
        label: '按钮',
        icon: '🔘',
        defaultColumnSpan: 4,
        defaultRowSpan: 2,
        defaultProps: {
            text: '点击'
        },
        traits: [
            { type: 'text', name: 'text', label: '文本', default: '点击' }
        ],
        render: function(props) {
            var el = document.createElement('div');
            el.className = 'iot-button';
            el.textContent = props.text;
            return el;
        }
    });

    // 数值显示组件
    webbuilder.define('value-display', {
        type: 'value-display',
        label: '数值显示',
        icon: '📈',
        defaultColumnSpan: 4,
        defaultRowSpan: 3,
        defaultProps: {
            label: '湿度',
            value: 65,
            unit: '%'
        },
        traits: [
            { type: 'text', name: 'label', label: '标签', default: '湿度' },
            { type: 'number', name: 'value', label: '值', default: 65 },
            { type: 'text', name: 'unit', label: '单位', default: '%' }
        ],
        render: function(props) {
            var el = document.createElement('div');
            el.className = 'iot-value-display';

            var valueEl = document.createElement('div');
            valueEl.className = 'value';
            valueEl.textContent = props.value + props.unit;

            var labelEl = document.createElement('div');
            labelEl.className = 'label';
            labelEl.textContent = props.label;

            el.appendChild(valueEl);
            el.appendChild(labelEl);

            return el;
        }
    });
}

/**
 * 绑定事件
 */
function bindEvents() {
    // 保存 JSONB
    document.getElementById('btn-save').addEventListener('click', function() {
        var jsonb = webbuilder.toJSONB();
        var jsonStr = JSON.stringify(jsonb, null, 2);
        downloadFile('canvas-config.json', jsonStr, 'application/json');
        isDirty = false;
    });

    // 加载 JSONB
    document.getElementById('btn-load').addEventListener('click', function() {
        if (isDirty && !confirm('当前有未保存的更改，确定要加载新文件吗？')) {
            return;
        }
        document.getElementById('file-input').click();
    });

    document.getElementById('file-input').addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var jsonb = JSON.parse(e.target.result);
                webbuilder.fromJSONB(jsonb);
                isDirty = false;
            } catch (err) {
                alert('加载失败：' + err.message);
            }
        };
        reader.readAsText(file);

        // 清空文件输入
        this.value = '';
    });

    // 导出 HTML
    document.getElementById('btn-export').addEventListener('click', function() {
        // 创建一个临时 div 来渲染
        var tempDiv = document.createElement('div');
        document.body.appendChild(tempDiv);

        // 调用 renderToDiv 获取组件列表
        var components = webbuilder.renderToDiv(tempDiv);

        // 生成 HTML
        var config = webbuilder.getCanvasConfig();
        var html = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n';
        html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
        html += '<title>IoT 仪表盘</title>\n';
        html += '<style>\n';
        html += '* { margin: 0; padding: 0; box-sizing: border-box; }\n';
        html += 'body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f2f5; }\n';
        html += '.iot-canvas { width: ' + config.width + 'px; height: ' + config.height + 'px; ';
        html += 'display: grid; grid-template-columns: repeat(' + config.columns + ', ' + config.cellSize + 'px); ';
        html += 'grid-auto-rows: ' + config.cellSize + 'px; gap: ' + config.gap + 'px; ';
        html += 'background: ' + config.background + '; padding: ' + config.gap + 'px; box-sizing: border-box; }\n';
        html += '</style>\n</head>\n<body>\n';
        html += tempDiv.outerHTML;
        html += '\n<script>\n';
        html += '// 组件列表（包含每个组件的元素和属性）\n';
        html += 'var components = ' + JSON.stringify(components.map(function(c) {
            return { id: c.id, type: c.type, props: c.props };
        }), null, 2) + ';\n';
        html += '</script>\n';
        html += '</body>\n</html>';

        // 移除临时 div
        document.body.removeChild(tempDiv);

        showPreview(html);
    });

    // 清空画布
    document.getElementById('btn-clear').addEventListener('click', function() {
        if (isDirty && !confirm('当前有未保存的更改，确定要清空画布吗？')) {
            return;
        }
        if (confirm('确定要清空画布吗？')) {
            webbuilder.clear();
            isDirty = true;
        }
    });

    // 预览弹窗关闭
    document.querySelector('.modal-close').addEventListener('click', function() {
        document.getElementById('preview-modal').style.display = 'none';
    });

    // 复制代码
    document.getElementById('btn-copy').addEventListener('click', function() {
        var code = document.getElementById('preview-code').textContent;
        navigator.clipboard.writeText(code).then(function() {
            alert('已复制到剪贴板');
        });
    });

    // 下载文件
    document.getElementById('btn-download').addEventListener('click', function() {
        var code = document.getElementById('preview-code').textContent;
        downloadFile('page.html', code, 'text/html');
    });

    // 页面离开提示
    window.addEventListener('beforeunload', function(e) {
        if (isDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

/**
 * 显示预览弹窗
 */
function showPreview(code) {
    document.getElementById('preview-code').textContent = code;
    document.getElementById('preview-modal').style.display = 'flex';
}

/**
 * 下载文件
 */
function downloadFile(filename, content, type) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initEditor);
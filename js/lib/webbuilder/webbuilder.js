/**
 * WebBuilder - IoT 可视化编辑器
 * 仅支持手机端布局
 * 单元格比例 1:1（正方形）
 */

var webbuilder = {
    // 编辑器容器
    container: null,

    // 手机画布配置
    phoneConfig: {
        width: 375,
        height: 812,
        columns: 24,
        gap: 2,
        background: '#f5f5f5'
    },

    // 计算得出的单元格大小（1:1比例）
    cellSize: 0,
    rows: 0,

    // 已注册的组件类型
    componentTypes: {},

    // 画布上的组件实例
    componentInstances: [],

    // 当前选中的组件
    selectedComponent: null,

    // 拖拽状态
    draggingComponent: null,
    draggingType: null,

    // 拖拽时鼠标相对于组件的偏移
    dragOffset: { x: 0, y: 0 },

    // 唯一ID计数器
    idCounter: 0,

    // 变化回调函数
    onChangedCallback: null,

    // 尺寸控制柄相关状态
    resizeHandles: null,
    isResizing: false,
    resizeDirection: null,
    resizeStartPos: { x: 0, y: 0 },
    resizeStartSize: { colSpan: 0, rowSpan: 0 },

    /**
     * 计算单元格大小和行数
     */
    _calculateGrid: function() {
        var config = this.phoneConfig;

        // 计算列宽（单元格大小）
        // 列宽 = (画布宽度 - (列数 + 1) * gap) / 列数
        this.cellSize = (config.width - (config.columns + 1) * config.gap) / config.columns;

        // 计算行数
        // 画布高度 = 行数 * 单元格大小 + (行数 + 1) * gap
        // 812 = 行数 * cellSize + (行数 + 1) * gap
        // 812 = 行数 * cellSize + 行数 * gap + gap
        // 812 - gap = 行数 * (cellSize + gap)
        // 行数 = (812 - gap) / (cellSize + gap)
        this.rows = Math.floor((config.height - config.gap) / (this.cellSize + config.gap));

        // 调整画布高度以精确适配行数
        this.phoneConfig.height = this.rows * this.cellSize + (this.rows + 1) * config.gap;
    },

    /**
     * 初始化编辑器
     * @param {string|HTMLElement} containerSelector - 容器选择器或元素
     */
    init: function(containerSelector) {
        // 获取容器元素
        if (typeof containerSelector === 'string') {
            this.container = document.querySelector(containerSelector);
        } else {
            this.container = containerSelector;
        }

        if (!this.container) {
            throw new Error('Container element not found');
        }

        // 计算网格
        this._calculateGrid();

        // 创建编辑器结构
        this._createEditorStructure();

        // 初始化画布
        this._initCanvas();

        // 初始化工具箱
        this._initToolbox();

        // 初始化键盘事件
        this._initKeyboardEvents();

        // 初始化尺寸控制柄事件
        this._initResizeEvents();

        return this;
    },

    /**
     * 创建编辑器结构
     */
    _createEditorStructure: function() {
        this.container.innerHTML = '';
        this.container.classList.add('webbuilder-editor');

        // 工具箱容器
        this.toolboxEl = document.createElement('div');
        this.toolboxEl.className = 'webbuilder-toolbox';
        this.container.appendChild(this.toolboxEl);

        // 画布容器
        this.canvasWrapperEl = document.createElement('div');
        this.canvasWrapperEl.className = 'webbuilder-canvas-wrapper';
        this.container.appendChild(this.canvasWrapperEl);

        // 属性面板容器
        this.propertyPanelEl = document.createElement('div');
        this.propertyPanelEl.className = 'webbuilder-property-panel';
        this.container.appendChild(this.propertyPanelEl);
    },

    /**
     * 初始化画布
     */
    _initCanvas: function() {
        var config = this.phoneConfig;

        // 创建画布
        this.canvasEl = document.createElement('div');
        this.canvasEl.className = 'webbuilder-canvas';
        this.canvasEl.style.width = config.width + 'px';
        this.canvasEl.style.height = config.height + 'px';
        this.canvasEl.style.display = 'grid';
        this.canvasEl.style.gridTemplateColumns = `repeat(${config.columns}, ${this.cellSize}px)`;
        this.canvasEl.style.gridAutoRows = `${this.cellSize}px`;
        this.canvasEl.style.gap = `${config.gap}px`;
        this.canvasEl.style.background = config.background;
        this.canvasEl.style.position = 'relative';
        this.canvasEl.style.padding = `${config.gap}px`;
        this.canvasEl.style.boxSizing = 'border-box';
        this.canvasWrapperEl.appendChild(this.canvasEl);

        // 画布点击取消选中
        var self = this;
        this.canvasEl.addEventListener('click', (e) => {
            if (e.target === self.canvasEl) {
                self._deselectAll();
            }
        });

        // 拖放事件
        this.canvasEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            self.canvasEl.classList.add('dropping');
        });

        this.canvasEl.addEventListener('dragleave', (e) => {
            self.canvasEl.classList.remove('dropping');
        });

        this.canvasEl.addEventListener('drop', (e) => {
            e.preventDefault();
            self.canvasEl.classList.remove('dropping');

            if (self.draggingType) {
                // 从工具箱拖入新组件
                var gridPos = self._calculateGridPosition(e);
                self._addComponentToCanvas(self.draggingType, gridPos);
                self.draggingType = null;
            } else if (self.draggingComponent) {
                // 在画布上移动组件
                var gridPos = self._calculateGridPosition(e);
                self._moveComponent(self.draggingComponent, gridPos);
                self.draggingComponent = null;
            }
        });
    },

    /**
     * 初始化工具箱
     */
    _initToolbox: function() {
        this.toolboxEl.innerHTML = '<div class="webbuilder-toolbox-title">组件库</div>';
        this.toolboxListEl = document.createElement('div');
        this.toolboxListEl.className = 'webbuilder-toolbox-list';
        this.toolboxEl.appendChild(this.toolboxListEl);
    },

    /**
     * 初始化键盘事件
     */
    _initKeyboardEvents: function() {
        var self = this;
        document.addEventListener('keydown', (e) => {
            // 如果焦点在输入框中，不处理删除操作
            var target = e.target;
            var isInputElement = target.tagName === 'INPUT' || 
                               target.tagName === 'TEXTAREA' || 
                               target.tagName === 'SELECT' ||
                               target.isContentEditable;
            
            if (isInputElement) {
                return;
            }
            
            // Delete键删除选中的组件
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (self.selectedComponent) {
                    e.preventDefault();
                    self._deleteComponent(self.selectedComponent);
                }
            }
        });
    },

    /**
     * 初始化尺寸控制柄事件
     */
    _initResizeEvents: function() {
        var self = this;
        
        // 鼠标移动事件
        document.addEventListener('mousemove', (e) => {
            if (self.isResizing && self.selectedComponent) {
                e.preventDefault();
                self._handleResizeMove(e);
            }
        });
        
        // 鼠标释放事件
        document.addEventListener('mouseup', (e) => {
            if (self.isResizing) {
                e.preventDefault();
                self._handleResizeEnd(e);
            }
        });
    },

    /**
     * 注册变化回调
     * @param {function} callback - 回调函数，签名：callback(action, data)
     *   action: 'add' | 'delete' | 'move' | 'update' | 'load' | 'clear'
     *   data: 相关数据（组件实例、组件ID等）
     */
    onChanged: function(callback) {
        this.onChangedCallback = callback;
    },

    /**
     * 触发变化回调
     */
    _notifyChanged: function(action, data) {
        if (typeof this.onChangedCallback === 'function') {
            this.onChangedCallback(action, data);
        }
    },

    /**
     * 计算网格位置
     */
    _calculateGridPosition: function(e) {
        var rect = this.canvasEl.getBoundingClientRect();
        var config = this.phoneConfig;

        // 计算鼠标相对于画布的位置，减去偏移量
        var x = e.clientX - rect.left - config.gap - this.dragOffset.x;
        var y = e.clientY - rect.top - config.gap - this.dragOffset.y;

        // 计算列和行
        var col = Math.floor(x / (this.cellSize + config.gap)) + 1;
        var row = Math.floor(y / (this.cellSize + config.gap)) + 1;

        // 边界约束
        col = Math.max(1, Math.min(config.columns, col));
        row = Math.max(1, Math.min(this.rows, row));

        return { column: col, row: row };
    },

    /**
     * 添加组件到画布
     */
    _addComponentToCanvas: function(componentType, gridPos) {
        var typeDef = this.componentTypes[componentType];
        if (!typeDef) {
            console.error('Component type not found:', componentType);
            return;
        }

        // 生成唯一ID
        var id = componentType + '-' + (++this.idCounter);

        // 计算 startCell
        var startCell = (gridPos.row - 1) * this.phoneConfig.columns + (gridPos.column - 1);

        // 创建组件实例
        var instance = {
            id: id,
            type: componentType,
            grid: {
                startCell: startCell,
                colSpan: typeDef.defaultColumnSpan || 6,
                rowSpan: typeDef.defaultRowSpan || 4
            },
            props: JSON.parse(JSON.stringify(typeDef.defaultProps || {}))
        };

        // 渲染组件
        this._renderComponent(instance);

        // 添加到实例列表
        this.componentInstances.push(instance);

        // 选中新添加的组件
        this._selectComponent(instance.id);

        // 触发回调
        this._notifyChanged('add', instance);
    },

    /**
     * 渲染组件到画布（编辑器内部使用）
     */
    _renderComponent: function(instance) {
        var typeDef = this.componentTypes[instance.type];
        if (!typeDef) return;

        // 计算行列位置
        var columns = this.phoneConfig.columns;
        var startCol = instance.grid.startCell % columns;
        var startRow = Math.floor(instance.grid.startCell / columns);

        // 边界约束
        var colSpan = Math.min(instance.grid.colSpan, columns - startCol);
        var rowSpan = instance.grid.rowSpan;

        // 创建组件容器元素
        var el = document.createElement('div');
        el.className = 'webbuilder-component';
        el.setAttribute('data-id', instance.id);
        el.setAttribute('data-type', instance.type);
        el.style.gridColumn = `${startCol + 1} / span ${colSpan}`;
        el.style.gridRow = `${startRow + 1} / span ${rowSpan}`;
        el.style.position = 'relative';
        el.style.overflow = 'visible';

        // 渲染组件内容 - render 函数返回 HTML 元素对象
        if (typeDef.render) {
            var content = typeDef.render(instance.props);
            // 如果返回的是字符串，保持兼容
            if (typeof content === 'string') {
                el.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                // 如果返回的是 DOM 元素，直接添加
                el.appendChild(content);
            }
        }

        // 创建尺寸控制柄容器
        var handlesContainer = document.createElement('div');
        handlesContainer.className = 'resize-handles-container';
        handlesContainer.style.display = 'none';
        handlesContainer.style.position = 'absolute';
        handlesContainer.style.top = '0';
        handlesContainer.style.left = '0';
        handlesContainer.style.width = '100%';
        handlesContainer.style.height = '100%';
        handlesContainer.style.pointerEvents = 'none';
        el.appendChild(handlesContainer);

        // 创建8个控制柄
        var directions = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
        var self = this;
        
        directions.forEach((direction) => {
            var handle = document.createElement('div');
            handle.className = `resize-handle resize-handle-${direction}`;
            handle.setAttribute('data-direction', direction);
            handle.style.pointerEvents = 'auto';
            
            // 控制柄位置
            switch(direction) {
                case 'nw':
                    handle.style.top = '-4px';
                    handle.style.left = '-4px';
                    handle.style.cursor = 'nwse-resize';
                    break;
                case 'n':
                    handle.style.top = '-4px';
                    handle.style.left = '50%';
                    handle.style.transform = 'translateX(-50%)';
                    handle.style.cursor = 'ns-resize';
                    break;
                case 'ne':
                    handle.style.top = '-4px';
                    handle.style.right = '-4px';
                    handle.style.cursor = 'nesw-resize';
                    break;
                case 'w':
                    handle.style.top = '50%';
                    handle.style.left = '-4px';
                    handle.style.transform = 'translateY(-50%)';
                    handle.style.cursor = 'ew-resize';
                    break;
                case 'e':
                    handle.style.top = '50%';
                    handle.style.right = '-4px';
                    handle.style.transform = 'translateY(-50%)';
                    handle.style.cursor = 'ew-resize';
                    break;
                case 'sw':
                    handle.style.bottom = '-4px';
                    handle.style.left = '-4px';
                    handle.style.cursor = 'nesw-resize';
                    break;
                case 's':
                    handle.style.bottom = '-4px';
                    handle.style.left = '50%';
                    handle.style.transform = 'translateX(-50%)';
                    handle.style.cursor = 'ns-resize';
                    break;
                case 'se':
                    handle.style.bottom = '-4px';
                    handle.style.right = '-4px';
                    handle.style.cursor = 'nwse-resize';
                    break;
            }
            
            // 鼠标按下事件
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                self._handleResizeStart(e, instance.id, direction);
            });
            
            handlesContainer.appendChild(handle);
        });

        // 使组件可拖拽
        el.setAttribute('draggable', true);
        el.addEventListener('dragstart', (e) => {
            // 如果正在调整大小，不允许拖拽
            if (self.isResizing) {
                e.preventDefault();
                return;
            }
            
            e.stopPropagation();
            self.draggingComponent = instance.id;
            el.style.opacity = '0.5';
            // 计算鼠标相对于组件的偏移
            var rect = el.getBoundingClientRect();
            self.dragOffset.x = e.clientX - rect.left;
            self.dragOffset.y = e.clientY - rect.top;
        });
        el.addEventListener('dragend', (e) => {
            el.style.opacity = '1';
            self.draggingComponent = null;
        });

        // 点击选中
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            self._selectComponent(instance.id);
        });

        // 存储元素引用
        instance.element = el;
        instance.handlesContainer = handlesContainer;

        // 添加到画布
        this.canvasEl.appendChild(el);
    },

    /**
     * 处理尺寸调整开始
     */
    _handleResizeStart: function(e, componentId, direction) {
        var instance = this._findInstance(componentId);
        if (!instance) return;
        
        this.isResizing = true;
        this.resizeDirection = direction;
        this.resizeStartPos = { x: e.clientX, y: e.clientY };
        this.resizeStartSize = { 
            colSpan: instance.grid.colSpan, 
            rowSpan: instance.grid.rowSpan,
            startCell: instance.grid.startCell
        };
        
        // 禁用画布的拖拽
        this.canvasEl.style.pointerEvents = 'none';
    },

    /**
     * 处理尺寸调整移动
     */
    _handleResizeMove: function(e) {
        var instance = this._findInstance(this.selectedComponent);
        if (!instance) return;
        
        var config = this.phoneConfig;
        var cellSize = this.cellSize;
        var gap = config.gap;
        
        // 计算鼠标移动的距离
        var deltaX = e.clientX - this.resizeStartPos.x;
        var deltaY = e.clientY - this.resizeStartPos.y;
        
        // 计算列和行的变化量
        var colDelta = Math.round(deltaX / (cellSize + gap));
        var rowDelta = Math.round(deltaY / (cellSize + gap));
        
        // 获取起始状态
        var startCol = this.resizeStartSize.startCell % config.columns;
        var startRow = Math.floor(this.resizeStartSize.startCell / config.columns);
        var origColSpan = this.resizeStartSize.colSpan;
        var origRowSpan = this.resizeStartSize.rowSpan;
        
        // 计算新的尺寸和位置
        var newColSpan = origColSpan;
        var newRowSpan = origRowSpan;
        var newStartCol = startCol;
        var newStartRow = startRow;
        
        switch(this.resizeDirection) {
            case 'se': // 右下角 - 只改变大小，不改变位置
                newColSpan = Math.max(1, origColSpan + colDelta);
                newRowSpan = Math.max(1, origRowSpan + rowDelta);
                break;
                
            case 'e': // 右边 - 只改变宽度，不改变位置
                newColSpan = Math.max(1, origColSpan + colDelta);
                break;
                
            case 's': // 下边 - 只改变高度，不改变位置
                newRowSpan = Math.max(1, origRowSpan + rowDelta);
                break;
                
            case 'w': // 左边 - 改变宽度，同时改变左边位置，右边保持不变
                newColSpan = Math.max(1, origColSpan - colDelta);
                newStartCol = startCol + (origColSpan - newColSpan);
                // 边界检查：确保不超出画布左边界
                if (newStartCol < 0) {
                    newStartCol = 0;
                    newColSpan = origColSpan + startCol;
                }
                break;
                
            case 'sw': // 左下角 - 改变宽度和高度，左边位置改变，下边位置不变
                newColSpan = Math.max(1, origColSpan - colDelta);
                newStartCol = startCol + (origColSpan - newColSpan);
                newRowSpan = Math.max(1, origRowSpan + rowDelta);
                // 边界检查：确保不超出画布左边界
                if (newStartCol < 0) {
                    newStartCol = 0;
                    newColSpan = origColSpan + startCol;
                }
                break;
                
            case 'n': // 上边 - 改变高度，同时改变上边位置，下边保持不变
                newRowSpan = Math.max(1, origRowSpan - rowDelta);
                newStartRow = startRow + (origRowSpan - newRowSpan);
                // 边界检查：确保不超出画布上边界
                if (newStartRow < 0) {
                    newStartRow = 0;
                    newRowSpan = origRowSpan + startRow;
                }
                break;
                
            case 'ne': // 右上角 - 改变宽度和高度，右边位置不变，上边位置改变
                newColSpan = Math.max(1, origColSpan + colDelta);
                newRowSpan = Math.max(1, origRowSpan - rowDelta);
                newStartRow = startRow + (origRowSpan - newRowSpan);
                // 边界检查：确保不超出画布上边界
                if (newStartRow < 0) {
                    newStartRow = 0;
                    newRowSpan = origRowSpan + startRow;
                }
                break;
                
            case 'nw': // 左上角 - 改变宽度和高度，左边和上边位置都改变
                newColSpan = Math.max(1, origColSpan - colDelta);
                newStartCol = startCol + (origColSpan - newColSpan);
                newRowSpan = Math.max(1, origRowSpan - rowDelta);
                newStartRow = startRow + (origRowSpan - newRowSpan);
                // 边界检查：确保不超出画布左边界和上边界
                if (newStartCol < 0) {
                    newStartCol = 0;
                    newColSpan = origColSpan + startCol;
                }
                if (newStartRow < 0) {
                    newStartRow = 0;
                    newRowSpan = origRowSpan + startRow;
                }
                break;
        }
        
        // 边界约束：确保不超出画布右边界和下边界
        newColSpan = Math.min(newColSpan, config.columns - newStartCol);
        newRowSpan = Math.min(newRowSpan, this.rows - newStartRow);
        
        // 最终安全检查：确保尺寸至少为1
        newColSpan = Math.max(1, newColSpan);
        newRowSpan = Math.max(1, newRowSpan);
        
        // 更新组件实例
        instance.grid.startCell = newStartRow * config.columns + newStartCol;
        instance.grid.colSpan = newColSpan;
        instance.grid.rowSpan = newRowSpan;
        
        // 更新样式
        instance.element.style.gridColumn = `${newStartCol + 1} / span ${newColSpan}`;
        instance.element.style.gridRow = `${newStartRow + 1} / span ${newRowSpan}`;
        
        // 更新属性面板
        if (this.selectedComponent === instance.id) {
            this._showPropertyPanel(instance);
        }
    },

    /**
     * 处理尺寸调整结束
     */
    _handleResizeEnd: function(e) {
        this.isResizing = false;
        this.resizeDirection = null;
        
        // 恢复画布的拖拽
        this.canvasEl.style.pointerEvents = 'auto';
        
        // 触发回调
        var instance = this._findInstance(this.selectedComponent);
        if (instance) {
            this._notifyChanged('update', instance);
        }
    },

    /**
     * 显示尺寸控制柄
     */
    _showResizeHandles: function(instance) {
        if (!instance || !instance.handlesContainer) return;
        instance.handlesContainer.style.display = 'block';
    },

    /**
     * 隐藏尺寸控制柄
     */
    _hideResizeHandles: function(instance) {
        if (!instance || !instance.handlesContainer) return;
        instance.handlesContainer.style.display = 'none';
    },

    /**
     * 将组件渲染到指定的 div 容器
     * @param {HTMLElement} container - 目标容器
     * @returns {Array} 组件列表，每个元素包含 { element, props, id, type }
     */
    renderToDiv: function(container) {
        var self = this;
        var result = [];

        // 清空容器
        container.innerHTML = '';

        // 创建画布样式
        container.style.width = `${this.phoneConfig.width}px`;
        container.style.height = `${this.phoneConfig.height}px`;
        container.style.display = 'grid';
        container.style.gridTemplateColumns = `repeat(${this.phoneConfig.columns}, ${this.cellSize}px)`;
        container.style.gridAutoRows = `${this.cellSize}px`;
        container.style.gap = `${this.phoneConfig.gap}px`;
        container.style.background = this.phoneConfig.background;
        container.style.padding = `${this.phoneConfig.gap}px`;
        container.style.boxSizing = 'border-box';

        var columns = this.phoneConfig.columns;

        // 遍历所有组件实例
        this.componentInstances.forEach((instance) => {
            var typeDef = self.componentTypes[instance.type];
            if (!typeDef || !typeDef.render) return;

            // 计算行列位置
            var startCol = instance.grid.startCell % columns;
            var startRow = Math.floor(instance.grid.startCell / columns);
            var colSpan = Math.min(instance.grid.colSpan, columns - startCol);
            var rowSpan = instance.grid.rowSpan;

            // 创建组件容器
            var wrapper = document.createElement('div');
            wrapper.style.gridColumn = `${startCol + 1} / span ${colSpan}`;
            wrapper.style.gridRow = `${startRow + 1} / span ${rowSpan}`;
            wrapper.style.overflow = 'hidden';

            // 调用 render 函数获取组件元素
            var componentElement = typeDef.render(instance.props);

            // 如果返回的是字符串，保持兼容
            if (typeof componentElement === 'string') {
                wrapper.innerHTML = componentElement;
                componentElement = wrapper.firstChild;
            } else if (componentElement instanceof HTMLElement) {
                wrapper.appendChild(componentElement);
            }

            // 添加到容器
            container.appendChild(wrapper);

            // 添加到结果列表
            result.push({
                element: componentElement,  // 控件本身的 HTML 元素对象
                wrapper: wrapper,            // 包装容器
                props: JSON.parse(JSON.stringify(instance.props)),  // 自定义组件属性（深拷贝）
                id: instance.id,
                type: instance.type
            });
        });

        return result;
    },

    /**
     * 移动组件
     */
    _moveComponent: function(componentId, gridPos) {
        var instance = this._findInstance(componentId);
        if (!instance) return;

        // 更新 startCell
        instance.grid.startCell = (gridPos.row - 1) * this.phoneConfig.columns + (gridPos.column - 1);

        // 重新计算行列位置
        var columns = this.phoneConfig.columns;
        var startCol = instance.grid.startCell % columns;
        var startRow = Math.floor(instance.grid.startCell / columns);
        var colSpan = Math.min(instance.grid.colSpan, columns - startCol);

        // 更新样式
        instance.element.style.gridColumn = `${startCol + 1} / span ${colSpan}`;
        instance.element.style.gridRow = `${startRow + 1} / span ${instance.grid.rowSpan}`;

        // 更新属性面板
        if (this.selectedComponent === componentId) {
            this._showPropertyPanel(instance);
        }

        // 触发回调
        this._notifyChanged('move', instance);
    },

    /**
     * 选中组件
     */
    _selectComponent: function(componentId) {
        // 取消之前的选中
        this._deselectAll();

        var instance = this._findInstance(componentId);
        if (!instance) return;

        this.selectedComponent = componentId;
        instance.element.classList.add('selected');

        // 显示尺寸控制柄
        this._showResizeHandles(instance);

        // 显示属性面板
        this._showPropertyPanel(instance);
    },

    /**
     * 取消所有选中
     */
    _deselectAll: function() {
        this.selectedComponent = null;
        var selected = this.canvasEl.querySelectorAll('.selected');
        selected.forEach((el) => {
            el.classList.remove('selected');
        });
        
        // 隐藏所有尺寸控制柄
        this.componentInstances.forEach((instance) => {
            if (instance.handlesContainer) {
                instance.handlesContainer.style.display = 'none';
            }
        });
        
        this.propertyPanelEl.innerHTML = '';
    },

    /**
     * 显示属性面板
     */
    _showPropertyPanel: function(instance) {
        var typeDef = this.componentTypes[instance.type];
        var self = this;
        var columns = this.phoneConfig.columns;

        // 计算当前行列
        var startCol = instance.grid.startCell % columns;
        var startRow = Math.floor(instance.grid.startCell / columns);

        var html = `<div class="property-title">${typeDef.label || instance.type}</div>`;

        // 基础属性
        html += '<div class="property-section">';
        html += '<div class="property-section-title">位置大小</div>';
        html += `<div class="property-row"><label>起始列:</label><input type="number" data-prop="startCol" value="${startCol + 1}" min="1" max="${columns}"></div>`;
        html += `<div class="property-row"><label>起始行:</label><input type="number" data-prop="startRow" value="${startRow + 1}" min="1"></div>`;
        html += `<div class="property-row"><label>跨列数:</label><input type="number" data-prop="colSpan" value="${instance.grid.colSpan}" min="1" max="${columns}"></div>`;
        html += `<div class="property-row"><label>跨行数:</label><input type="number" data-prop="rowSpan" value="${instance.grid.rowSpan}" min="1"></div>`;
        html += '</div>';

        // 自定义属性
        if (typeDef.traits && typeDef.traits.length > 0) {
            html += '<div class="property-section">';
            html += '<div class="property-section-title">组件属性</div>';
            typeDef.traits.forEach((trait) => {
                var value = instance.props[trait.name] !== undefined ? instance.props[trait.name] : (trait.default || '');
                html += '<div class="property-row">';
                html += `<label>${trait.label}:</label>`;
                if (trait.type === 'number') {
                    html += `<input type="number" data-trait="${trait.name}" value="${value}">`;
                } else if (trait.type === 'checkbox') {
                    html += `<input type="checkbox" data-trait="${trait.name}"${value ? ' checked' : ''}>`;
                } else {
                    html += `<input type="text" data-trait="${trait.name}" value="${value}">`;
                }
                html += '</div>';
            });
            html += '</div>';
        }

        // 删除按钮
        html += '<div class="property-section">';
        html += '<button class="btn-delete" data-action="delete">删除组件</button>';
        html += '</div>';

        this.propertyPanelEl.innerHTML = html;

        // 绑定事件
        this.propertyPanelEl.querySelectorAll('input').forEach((input) => {
            input.addEventListener('change', () => {
                var prop = input.getAttribute('data-prop');
                var trait = input.getAttribute('data-trait');

                if (prop) {
                    // 更新网格位置
                    var value = parseInt(input.value, 10) || 1;
                    if (prop === 'startCol') {
                        var currentRow = Math.floor(instance.grid.startCell / columns);
                        instance.grid.startCell = currentRow * columns + (value - 1);
                    } else if (prop === 'startRow') {
                        var currentCol = instance.grid.startCell % columns;
                        instance.grid.startCell = (value - 1) * columns + currentCol;
                    } else if (prop === 'colSpan') {
                        instance.grid.colSpan = value;
                    } else if (prop === 'rowSpan') {
                        instance.grid.rowSpan = value;
                    }

                    // 重新计算位置
                    var startCol = instance.grid.startCell % columns;
                    var startRow = Math.floor(instance.grid.startCell / columns);
                    var colSpan = Math.min(instance.grid.colSpan, columns - startCol);

                    instance.element.style.gridColumn = `${startCol + 1} / span ${colSpan}`;
                    instance.element.style.gridRow = `${startRow + 1} / span ${instance.grid.rowSpan}`;
                } else if (trait) {
                    // 更新组件属性
                    var typeDef = self.componentTypes[instance.type];
                    var traitDef = typeDef.traits.find((t) => t.name === trait);

                    if (input.type === 'checkbox') {
                        instance.props[trait] = input.checked;
                    } else if (traitDef && traitDef.type === 'number') {
                        instance.props[trait] = parseFloat(input.value) || 0;
                    } else {
                        instance.props[trait] = input.value;
                    }

                    // 重新渲染组件内容
                    if (typeDef.render) {
                        var content = typeDef.render(instance.props);
                        instance.element.innerHTML = '';
                        if (typeof content === 'string') {
                            instance.element.innerHTML = content;
                        } else if (content instanceof HTMLElement) {
                            instance.element.appendChild(content);
                        }
                        
                        // 重新添加尺寸控制柄容器
                        var handlesContainer = document.createElement('div');
                        handlesContainer.className = 'resize-handles-container';
                        handlesContainer.style.display = 'block';
                        handlesContainer.style.position = 'absolute';
                        handlesContainer.style.top = '0';
                        handlesContainer.style.left = '0';
                        handlesContainer.style.width = '100%';
                        handlesContainer.style.height = '100%';
                        handlesContainer.style.pointerEvents = 'none';
                        instance.element.appendChild(handlesContainer);
                        instance.handlesContainer = handlesContainer;
                        
                        // 重新创建控制柄
                        self._recreateResizeHandles(instance);
                    }
                }

                // 触发属性更新回调
                self._notifyChanged('update', instance);
            });
        });

        // 删除按钮
        var deleteBtn = this.propertyPanelEl.querySelector('[data-action="delete"]');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                self._deleteComponent(instance.id);
            });
        }
    },

    /**
     * 重新创建尺寸控制柄
     */
    _recreateResizeHandles: function(instance) {
        if (!instance || !instance.handlesContainer) return;
        
        var self = this;
        var directions = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
        
        // 清空控制柄容器
        instance.handlesContainer.innerHTML = '';
        
        // 重新创建8个控制柄
        directions.forEach((direction) => {
            var handle = document.createElement('div');
            handle.className = `resize-handle resize-handle-${direction}`;
            handle.setAttribute('data-direction', direction);
            handle.style.pointerEvents = 'auto';
            
            // 控制柄位置
            switch(direction) {
                case 'nw':
                    handle.style.top = '-4px';
                    handle.style.left = '-4px';
                    handle.style.cursor = 'nwse-resize';
                    break;
                case 'n':
                    handle.style.top = '-4px';
                    handle.style.left = '50%';
                    handle.style.transform = 'translateX(-50%)';
                    handle.style.cursor = 'ns-resize';
                    break;
                case 'ne':
                    handle.style.top = '-4px';
                    handle.style.right = '-4px';
                    handle.style.cursor = 'nesw-resize';
                    break;
                case 'w':
                    handle.style.top = '50%';
                    handle.style.left = '-4px';
                    handle.style.transform = 'translateY(-50%)';
                    handle.style.cursor = 'ew-resize';
                    break;
                case 'e':
                    handle.style.top = '50%';
                    handle.style.right = '-4px';
                    handle.style.transform = 'translateY(-50%)';
                    handle.style.cursor = 'ew-resize';
                    break;
                case 'sw':
                    handle.style.bottom = '-4px';
                    handle.style.left = '-4px';
                    handle.style.cursor = 'nesw-resize';
                    break;
                case 's':
                    handle.style.bottom = '-4px';
                    handle.style.left = '50%';
                    handle.style.transform = 'translateX(-50%)';
                    handle.style.cursor = 'ns-resize';
                    break;
                case 'se':
                    handle.style.bottom = '-4px';
                    handle.style.right = '-4px';
                    handle.style.cursor = 'nwse-resize';
                    break;
            }
            
            // 鼠标按下事件
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                self._handleResizeStart(e, instance.id, direction);
            });
            
            instance.handlesContainer.appendChild(handle);
        });
    },

    /**
     * 删除组件
     */
    _deleteComponent: function(componentId) {
        var index = -1;
        for (var i = 0; i < this.componentInstances.length; i++) {
            if (this.componentInstances[i].id === componentId) {
                index = i;
                break;
            }
        }

        if (index === -1) return;

        var instance = this.componentInstances[index];

        // 从DOM移除
        if (instance.element) {
            instance.element.remove();
        }

        // 从数组移除
        this.componentInstances.splice(index, 1);

        // 取消选中
        this._deselectAll();

        // 触发回调
        this._notifyChanged('delete', { id: componentId });
    },

    /**
     * 查找组件实例
     */
    _findInstance: function(componentId) {
        for (var i = 0; i < this.componentInstances.length; i++) {
            if (this.componentInstances[i].id === componentId) {
                return this.componentInstances[i];
            }
        }
        return null;
    },

    /**
     * 注册组件类型
     * @param {string} name - 组件名称
     * @param {object} definition - 组件定义
     */
    define: function(name, definition) {
        if (this.componentTypes[name]) {
            console.warn('Component type already defined:', name);
            return;
        }

        this.componentTypes[name] = definition;

        // 添加到工具箱
        this._addToToolbox(name, definition);
    },

    /**
     * 添加组件到工具箱
     */
    _addToToolbox: function(name, definition) {
        var self = this;

        var item = document.createElement('div');
        item.className = 'webbuilder-toolbox-item';
        item.setAttribute('draggable', true);
        item.setAttribute('data-type', name);

        var icon = definition.icon || '📦';
        var label = definition.label || name;

        item.innerHTML = `<span class="icon">${icon}</span><span class="label">${label}</span>`;

        // 拖拽事件
        item.addEventListener('dragstart', () => {
            self.draggingType = name;
            item.style.opacity = '0.5';
        });
        item.addEventListener('dragend', () => {
            item.style.opacity = '1';
            self.draggingType = null;
        });

        this.toolboxListEl.appendChild(item);
    },

    /**
     * 导出为JSONB
     * 返回格式: { version, layouts: { phone: {...}, computer: null } }
     */
    toJSONB: function() {
        var components = this.componentInstances.map((instance) => {
            return {
                id: instance.id,
                type: instance.type,
                grid: {
                    startCell: instance.grid.startCell,
                    colSpan: instance.grid.colSpan,
                    rowSpan: instance.grid.rowSpan
                },
                props: JSON.parse(JSON.stringify(instance.props))
            };
        });

        return {
            version: '1.0',
            layouts: {
                phone: {
                    canvas: {
                        width: this.phoneConfig.width,
                        height: this.phoneConfig.height,
                        columns: this.phoneConfig.columns,
                        cellSize: this.cellSize,
                        rows: this.rows,
                        gap: this.phoneConfig.gap,
                        background: this.phoneConfig.background
                    },
                    components: components
                },
                computer: null
            }
        };
    },

    /**
     * 从JSONB加载
     */
    fromJSONB: function(jsonb) {
        // 清空画布
        this.canvasEl.innerHTML = '';
        this.componentInstances = [];
        this.selectedComponent = null;

        // 获取手机布局
        var phoneLayout = jsonb.layouts && jsonb.layouts.phone;
        if (!phoneLayout) {
            console.warn('No phone layout found');
            return;
        }

        // 渲染组件
        if (phoneLayout.components) {
            var self = this;
            phoneLayout.components.forEach((comp) => {
                var typeDef = self.componentTypes[comp.type];
                if (!typeDef) {
                    console.warn('Component type not found:', comp.type);
                    return;
                }

                var instance = {
                    id: comp.id,
                    type: comp.type,
                    grid: {
                        startCell: comp.grid.startCell,
                        colSpan: comp.grid.colSpan,
                        rowSpan: comp.grid.rowSpan
                    },
                    props: comp.props || {}
                };

                self._renderComponent(instance);
                self.componentInstances.push(instance);
            });

            // 更新ID计数器
            var maxId = 0;
            this.componentInstances.forEach((inst) => {
                var match = inst.id.match(/-(\d+)$/);
                if (match) {
                    maxId = Math.max(maxId, parseInt(match[1], 10));
                }
            });
            this.idCounter = maxId;
        }

        // 触发回调
        this._notifyChanged('load', { count: this.componentInstances.length });
    },

    /**
     * 获取画布配置
     */
    getCanvasConfig: function() {
        return {
            width: this.phoneConfig.width,
            height: this.phoneConfig.height,
            columns: this.phoneConfig.columns,
            cellSize: this.cellSize,
            rows: this.rows,
            gap: this.phoneConfig.gap,
            background: this.phoneConfig.background
        };
    },

    /**
     * 获取所有组件实例
     */
    getComponents: function() {
        return JSON.parse(JSON.stringify(this.componentInstances));
    },

    /**
     * 清空画布
     */
    clear: function() {
        this.canvasEl.innerHTML = '';
        this.componentInstances = [];
        this.selectedComponent = null;
        this.propertyPanelEl.innerHTML = '';

        // 触发回调
        this._notifyChanged('clear', null);
    }
};
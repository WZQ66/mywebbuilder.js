class BuilderContainer {
    constructor(containerElQuery) {
        // Set element from query
        this.el = document.querySelector(containerElQuery);

        // Check if not found
        if (this.el === undefined) {
            throw new Error('Container element cannot be undefined');
        }
        // Define drop area
        else {
            var dropTarget = undefined;

            // When component over
            this.el.addEventListener('dragover', function(e) {
                e.preventDefault();

                dropTarget = e.target;
                if (dropTarget.hasAttribute('root') || dropTarget.hasAttribute('container'))
                    dropTarget.setAttribute('dropping', true);
            }, false);

            // When component leaves
            var dragleave = function (e) {
                e.preventDefault();
                if (dropTarget && dropTarget.hasAttribute('dropping')) 
                    dropTarget.removeAttribute('dropping');
            }
            this.el.addEventListener('dragleave', dragleave, false);
            this.el.addEventListener('dragend', dragleave, false);

            // When component being dropped
            this.el.addEventListener('drop', function(e) {
                dragleave(e);

                // Get dragged
                var draggedEl = webbuilder.draggingComponent;
                if (!draggedEl) return;
                
                var componentName = draggedEl.getAttribute('component-name');
                var component = webbuilder.findComponent(componentName);
                
                // Get drop area
                var dropareaEl = e.target;

                // If drop area == root container
                // Or           == container component
                if (dropareaEl.hasAttribute('root') || dropareaEl.hasAttribute('container')) {
                    // Produce
                    dropareaEl.appendChild(component.produceRealEl());
                }

                dropTarget = undefined;
            }, false);
        }
    }
}
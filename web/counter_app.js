import { RgthreeLabelWidget, RgthreeBetterButtonWidget } from './widgets.js'; // Import the necessary widgets from your code.

export class CounterApp {
    constructor() {
        this.count = 0; // Initialize the counter
        this.labelWidget = new RgthreeLabelWidget("Counter", { align: "center", size: 20 });
        this.buttonWidget = new RgthreeBetterButtonWidget("Increase", this.incrementCounter.bind(this));
    }

    incrementCounter(event, pos, node) {
        this.count += 1; // Increment the count
        this.updateLabel(); // Update the label with the new count
    }

    updateLabel() {
        this.labelWidget.value = `Count: ${this.count}`;
    }

    draw(ctx, node, width, y, height) {
        // Draw the label and button
        this.labelWidget.draw(ctx, node, width, y, height);
        this.buttonWidget.draw(ctx, node, width, y + height + 10, 40); // Adjust button position below the label
    }

    mouse(event, pos, node) {
        // Handle mouse events for the button widget
        this.buttonWidget.mouse(event, pos, node);
    }
}

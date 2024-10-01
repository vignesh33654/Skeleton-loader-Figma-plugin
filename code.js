"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(() => __awaiter(void 0, void 0, void 0, function* () {
    // Helper function to check if a node is a valid target
    function isTargetNode(node) {
        return (node.type === "FRAME" ||
            node.type === "GROUP" ||
            node.type === "COMPONENT" ||
            node.type === "INSTANCE" ||
            node.type === "VECTOR");
    }
    // Helper function to check if a node has opacity (type narrowing)
    function hasOpacity(node) {
        return 'opacity' in node;
    }
    // Helper function to create a skeleton rectangle and maintain its original position
    function createSkeletonRectangle(node, parent, offsetX, offsetY) {
        // Skip nodes that are hidden, locked, or have opacity of zero
        if (!node.visible || node.locked || (hasOpacity(node) && node.opacity === 0)) {
            return;
        }
        if ('width' in node && 'height' in node) {
            const skeleton = figma.createRectangle();
            skeleton.resize(node.width, node.height);
            skeleton.cornerRadius = 6; // 6px corner radius
            skeleton.fills = [
                {
                    type: "SOLID", // Use solid color instead of gradient
                    color: { r: 0.949, g: 0.949, b: 0.949 } // #F2F2F2 in RGB
                }
            ];
            // Use absoluteTransform to maintain the node's absolute position relative to the new frame
            const absoluteTransform = node.absoluteTransform;
            const x = absoluteTransform[0][2] - offsetX; // Relative X to the new frame
            const y = absoluteTransform[1][2] - offsetY; // Relative Y to the new frame
            // Preserve the absolute positioning
            skeleton.x = x;
            skeleton.y = y;
            parent.appendChild(skeleton);
        }
    }
    // Helper function to check if a node contains exactly one VECTOR
    function containsExactlyOneVector(node) {
        if ('children' in node) {
            const vectorChildren = node.children.filter(child => child.type === "VECTOR");
            return vectorChildren.length === 1; // Return true if exactly one VECTOR child exists
        }
        return false;
    }
    // Helper function to traverse the node tree and apply skeleton to valid nodes
    function traverseNode(node, parent, offsetX, offsetY) {
        // Skip hidden nodes, locked nodes, or nodes with opacity of zero
        if (!node.visible || node.locked || (hasOpacity(node) && node.opacity === 0)) {
            return;
        }
        // If the node's name contains "button" (case-insensitive), apply a skeleton and stop traversal
        if (node.name.toLowerCase().includes("button")) {
            createSkeletonRectangle(node, parent, offsetX, offsetY);
            return; // Do not traverse further if it's a button
        }
        // If this node contains exactly one VECTOR, apply the skeleton loader to the parent
        if (containsExactlyOneVector(node)) {
            createSkeletonRectangle(node, parent, offsetX, offsetY);
            return; // Stop further traversal for this node's children
        }
        // Traverse the children if no VECTOR condition is met
        if ('children' in node && isTargetNode(node)) {
            node.children.forEach((child) => {
                if (isTargetNode(child)) {
                    traverseNode(child, parent, offsetX, offsetY);
                }
                else if (child.type === "RECTANGLE" || child.type === "TEXT" || child.type === "ELLIPSE") {
                    createSkeletonRectangle(child, parent, offsetX, offsetY);
                }
            });
        }
    }
    // Start the plugin logic
    const selectedNodes = figma.currentPage.selection;
    // Check if user selected a node
    if (selectedNodes.length === 0) {
        figma.notify("Please select a frame or group to generate a skeleton loader.");
        figma.closePlugin();
        return;
    }
    const selectedNode = selectedNodes[0];
    // Validate the selected node
    if (!isTargetNode(selectedNode)) {
        figma.notify("Selected node must be a Frame, Group, Component, or Instance.");
        figma.closePlugin();
        return;
    }
    // Create a new frame for the skeleton loader and offset it 250px to the right of the selected frame
    const skeletonFrame = figma.createFrame();
    skeletonFrame.resize(selectedNode.width, selectedNode.height);
    skeletonFrame.x = selectedNode.x + selectedNode.width + 250; // Move it 250px to the right
    skeletonFrame.y = selectedNode.y; // Keep the same vertical position
    // Calculate offset based on the original frame's position
    const offsetX = selectedNode.absoluteTransform[0][2];
    const offsetY = selectedNode.absoluteTransform[1][2];
    // Set up the frame's layout and properties
    skeletonFrame.name = `${selectedNode.name} - Skeleton Loader`;
    skeletonFrame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]; // White background
    figma.currentPage.appendChild(skeletonFrame);
    // Traverse the selected node and create skeleton rectangles in the skeletonFrame
    traverseNode(selectedNode, skeletonFrame, offsetX, offsetY);
    // Notify the user of success
    figma.notify("Skeleton loader created successfully!");
    figma.closePlugin();
}))();

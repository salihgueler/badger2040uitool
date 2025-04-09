# Badger2040 UI Design Tool

A web-based UI design tool for the [Badger2040](https://learn.pimoroni.com/article/getting-started-with-badger-2040#micropython-and-badger-2040) e-ink display (296x128 pixels). Built fully with Amazon [Q Dev CLI](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-installing.html?trk=8d3c54c2-d407-4b0c-b4b4-9e0c388fe771&sc_channel=el)'s chat capability.

## Features

### Canvas Drawing Tools
- Freehand drawing with adjustable line thickness
- Line, rectangle, and circle shape tools
- Text insertion with configurable font size
- Black and white color options (1-bit display)
- Undo/redo functionality

### Image Handling
- Upload and import images
- Automatic resizing to fit the 296x128 canvas
- Conversion to 1-bit (black and white) format
- Center positioning on the canvas

### Profile Generator
- QR code generation from a connection URL (left side)
- Name, company, and title fields (right side)
- Social media handle option
- Professional badge layout with dividing line

### Company Badge Generator
- Company name at the top
- Employee name prominently displayed in the center
- Two customizable detail fields (e.g., Department, ID)
- Company logo upload and display on the right side
- Layout matching the official Badger2040 badge example

### Python Code Generation
- Generate Python code compatible with the Badger2040 SDK
- Include proper initialization and display setup
- Implement drawing commands for the created design
- Add button handling and power management code
- Option to download the generated code as a .py file

## Usage

1. Open `index.html` in your web browser
2. Use the tabs to switch between different tools
3. Design your UI using the available tools
4. Generate Python code for your design
5. Download the code and transfer it to your Badger2040 device

## Development

This tool runs entirely in the browser without server-side components. The generated Python code can be directly transferred to the Badger2040 device.

## Prompt

## Overview
Create a web-based UI design tool for the Badger2040 e-ink display (296x128 
pixels). The tool should run entirely in the browser without server-side 
components and generate Python code that can be directly transferred to the 
Badger2040 device.

## Core Features

### 1. HTML/CSS Structure
• Create a responsive single-page application with tabs for different tools
• Include a header with the title "Badger2040 UI Design Tool"
• Create tabs for: Drawing Canvas, Profile Generator, Badge Generator, and 
Code Preview
• Style the UI with a clean, modern interface using CSS
• Ensure all interactive elements have proper hover states and feedback

### 2. Canvas Drawing Tools
• Implement a 296x128 pixel canvas matching the Badger2040 display dimensions
• Add drawing tools: pencil, line, rectangle, circle, and text
• Include color options for black and white (1-bit display)
• Implement adjustable line thickness with a slider (1-10px)
• Add font size adjustment for text tool
• Include undo/redo functionality using a stack-based approach
• Add a clear canvas button
• Implement proper mouse and touch event handling

### 3. Image Handling
• Allow users to upload and import images
• Automatically resize images to fit the 296x128 canvas
• Convert images to 1-bit (black and white) format using threshold-based pixel
manipulation
• Center position images on the canvas
• Implement proper error handling for invalid file types

### 4. Profile Generator
• Create a form with fields for: name, company, title, social media handle, 
and connection URL
• Generate a QR code from the connection URL (left side)
• Display name, company, title, and social media handle on the right side
• Add a dividing line at x=130 to separate QR code and text
• Implement a preview canvas showing the generated profile
• Add a button to generate Python code for the profile

### 5. Company Badge Generator
• Create a form with fields for: company name, employee name, title, and email
• Allow uploading a company logo image
• Display company name at the top with black background and white text
• Show employee name prominently in the center with automatic scaling
• Display title and email at the bottom
• Show company logo on the right side
• Match the layout of the official Badger2040 badge example
• Implement a preview canvas showing the generated badge
• Add a button to generate Python code for the badge

### 6. Python Code Generation
• Generate Python code compatible with the Badger2040 SDK
• Include proper initialization and display setup
• Implement drawing commands that match the created design
• For canvas drawings, use line and rectangle commands to efficiently 
represent the design
• For profile generator, include QR code generation and text positioning
• For badge generator, include logo drawing using pixel or line commands
• Add button handling and power management code
• Include option to download the generated code as a .py file
• Add a copy to clipboard button

### 7. Technical Implementation Details
• Use vanilla JavaScript without external libraries (except for QR code 
generation)
• Implement the QR code generator using a lightweight library
• Use the HTML5 Canvas API for all drawing operations
• Use the FileReader API for image handling
• Store canvas states for undo/redo functionality
• Implement efficient algorithms for converting canvas drawings to Python code
• For complex images, use horizontal line commands instead of individual 
pixels
• Ensure the generated Python code is optimized for the Badger2040's limited 
resources

## Specific Requirements

1. For the drawing canvas:
   • Implement proper line thickness in both the UI and generated code
   • Use efficient line drawing algorithms to reduce code size
   • Handle edge cases like drawing at canvas boundaries

2. For the profile generator:
   • Ensure the QR code is properly centered in its area
   • Scale text appropriately to fit available space
   • Implement proper error handling for invalid URLs

3. For the badge generator:
   • Scale the employee name based on its length to fit the available space
   • Truncate text fields if they're too long
   • Process uploaded logos to generate efficient drawing commands
   • Implement adaptive drawing strategies based on logo complexity

4. For the code generation:
   • Match the Badger2040 SDK's API exactly
   • Include proper error handling and comments
   • Ensure the code is well-formatted and readable
   • Optimize drawing commands to reduce code size and improve performance

## Deliverables
1. A single HTML file with embedded CSS and JavaScript
2. A README.md file explaining the tool's features and usage
3. A development notes document explaining implementation details

The tool should be fully functional in modern browsers and generate Python 
code that works directly on the Badger2040 device without modification.

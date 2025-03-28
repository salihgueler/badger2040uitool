document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show selected tab pane
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            
            // Update code preview when switching to code tab
            if (tabId === 'code') {
                updateCodePreview();
            }
        });
    });

    // Initialize drawing canvas
    initDrawingCanvas();
    
    // Initialize profile generator
    initProfileGenerator();
    
    // Initialize badge generator
    initBadgeGenerator();
    
    // Initialize code generator
    initCodeGenerator();
});

// Canvas Drawing Functionality
let drawingCanvas, drawingCtx;
let currentTool = 'pencil';
let lineThickness = 2;
let currentColor = 'black';
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let undoStack = [];
let redoStack = [];

function initDrawingCanvas() {
    drawingCanvas = document.getElementById('drawing-canvas');
    drawingCtx = drawingCanvas.getContext('2d');
    
    // Set initial canvas state
    drawingCtx.fillStyle = 'white';
    drawingCtx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    
    // Save initial state
    saveCanvasState();
    
    // Set up event listeners for drawing
    setupDrawingListeners();
    
    // Set up tool buttons
    setupToolButtons();
}

function setupDrawingListeners() {
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);
    
    // Touch support
    drawingCanvas.addEventListener('touchstart', handleTouch);
    drawingCanvas.addEventListener('touchmove', handleTouch);
    drawingCanvas.addEventListener('touchend', stopDrawing);
}

function setupToolButtons() {
    // Drawing tools
    document.getElementById('pencil-tool').addEventListener('click', () => setTool('pencil'));
    document.getElementById('line-tool').addEventListener('click', () => setTool('line'));
    document.getElementById('rect-tool').addEventListener('click', () => setTool('rect'));
    document.getElementById('circle-tool').addEventListener('click', () => setTool('circle'));
    document.getElementById('text-tool').addEventListener('click', () => setTool('text'));
    
    // Color options
    document.getElementById('color-black').addEventListener('click', () => setColor('black'));
    document.getElementById('color-white').addEventListener('click', () => setColor('white'));
    
    // Line thickness
    const thicknessSlider = document.getElementById('line-thickness');
    const thicknessValue = document.getElementById('thickness-value');
    thicknessSlider.addEventListener('input', () => {
        lineThickness = thicknessSlider.value;
        thicknessValue.textContent = lineThickness + 'px';
    });
    
    // Font size
    const fontSizeSlider = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    fontSizeSlider.addEventListener('input', () => {
        fontSizeValue.textContent = fontSizeSlider.value + 'px';
    });
    
    // Action buttons
    document.getElementById('undo-btn').addEventListener('click', undo);
    document.getElementById('redo-btn').addEventListener('click', redo);
    document.getElementById('clear-btn').addEventListener('click', clearCanvas);
    document.getElementById('generate-drawing-code-btn').addEventListener('click', function() {
        const code = generateDrawingCode();
        document.getElementById('python-code').textContent = code;
        
        // Switch to code tab
        const codeTabBtn = document.querySelector('[data-tab="code"]');
        codeTabBtn.click();
    });
    
    // Image upload
    document.getElementById('image-upload').addEventListener('change', handleImageUpload);
}

function setTool(tool) {
    currentTool = tool;
    
    // Update active tool button
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tool + '-tool').classList.add('active');
    
    // Show/hide text options
    const textOptions = document.getElementById('text-options');
    textOptions.style.display = tool === 'text' ? 'flex' : 'none';
}

function setColor(color) {
    currentColor = color;
    
    // Update active color button
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('color-' + color).classList.add('active');
}

function startDrawing(e) {
    isDrawing = true;
    const pos = getCanvasPosition(e);
    lastX = pos.x;
    lastY = pos.y;
    
    if (currentTool === 'text') {
        const text = prompt('Enter text:');
        if (text) {
            drawText(text, pos.x, pos.y);
            saveCanvasState();
        }
        isDrawing = false;
    }
}

function draw(e) {
    if (!isDrawing) return;
    
    const pos = getCanvasPosition(e);
    
    drawingCtx.lineWidth = lineThickness;
    drawingCtx.lineCap = 'round';
    drawingCtx.strokeStyle = currentColor;
    drawingCtx.fillStyle = currentColor;
    
    // Create a temporary canvas for shape preview
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = drawingCanvas.width;
    tempCanvas.height = drawingCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Copy current canvas state to temp canvas
    tempCtx.drawImage(drawingCanvas, 0, 0);
    
    switch (currentTool) {
        case 'pencil':
            drawingCtx.beginPath();
            drawingCtx.moveTo(lastX, lastY);
            drawingCtx.lineTo(pos.x, pos.y);
            drawingCtx.stroke();
            lastX = pos.x;
            lastY = pos.y;
            break;
            
        case 'line':
            // Restore the canvas to its state before drawing the line
            if (undoStack.length > 0) {
                const img = new Image();
                img.onload = function() {
                    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                    drawingCtx.drawImage(img, 0, 0);
                    
                    // Draw the new line
                    drawingCtx.beginPath();
                    drawingCtx.moveTo(lastX, lastY);
                    drawingCtx.lineTo(pos.x, pos.y);
                    drawingCtx.stroke();
                };
                img.src = undoStack[undoStack.length - 1];
            }
            break;
            
        case 'rect':
            // Restore the canvas to its state before drawing the rectangle
            if (undoStack.length > 0) {
                const img = new Image();
                img.onload = function() {
                    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                    drawingCtx.drawImage(img, 0, 0);
                    
                    // Draw the new rectangle
                    const width = pos.x - lastX;
                    const height = pos.y - lastY;
                    drawingCtx.strokeRect(lastX, lastY, width, height);
                };
                img.src = undoStack[undoStack.length - 1];
            }
            break;
            
        case 'circle':
            // Restore the canvas to its state before drawing the circle
            if (undoStack.length > 0) {
                const img = new Image();
                img.onload = function() {
                    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                    drawingCtx.drawImage(img, 0, 0);
                    
                    // Draw the new circle
                    const radius = Math.sqrt(Math.pow(pos.x - lastX, 2) + Math.pow(pos.y - lastY, 2));
                    drawingCtx.beginPath();
                    drawingCtx.arc(lastX, lastY, radius, 0, 2 * Math.PI);
                    drawingCtx.stroke();
                };
                img.src = undoStack[undoStack.length - 1];
            }
            break;
    }
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveCanvasState();
    }
}

function getCanvasPosition(e) {
    const rect = drawingCanvas.getBoundingClientRect();
    let x, y;
    
    if (e.type.includes('touch')) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }
    
    return {
        x: Math.round(x),
        y: Math.round(y)
    };
}

function handleTouch(e) {
    e.preventDefault();
    
    if (e.type === 'touchstart') {
        startDrawing(e);
    } else if (e.type === 'touchmove') {
        draw(e);
    }
}

function drawText(text, x, y) {
    const fontSize = document.getElementById('font-size').value;
    drawingCtx.font = `${fontSize}px sans-serif`;
    drawingCtx.fillStyle = currentColor;
    drawingCtx.fillText(text, x, y);
}

function saveCanvasState() {
    undoStack.push(drawingCanvas.toDataURL());
    redoStack = [];
}

function undo() {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        const img = new Image();
        img.onload = function() {
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            drawingCtx.drawImage(img, 0, 0);
        };
        img.src = undoStack[undoStack.length - 1];
    }
}

function redo() {
    if (redoStack.length > 0) {
        const img = new Image();
        img.onload = function() {
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            drawingCtx.drawImage(img, 0, 0);
            undoStack.push(redoStack.pop());
        };
        img.src = redoStack[redoStack.length - 1];
    }
}

function clearCanvas() {
    drawingCtx.fillStyle = 'white';
    drawingCtx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    saveCanvasState();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Calculate dimensions to fit the canvas while maintaining aspect ratio
                const scale = Math.min(
                    drawingCanvas.width / img.width,
                    drawingCanvas.height / img.height
                );
                const width = img.width * scale;
                const height = img.height * scale;
                
                // Center the image on the canvas
                const x = (drawingCanvas.width - width) / 2;
                const y = (drawingCanvas.height - height) / 2;
                
                // Draw the image
                drawingCtx.drawImage(img, x, y, width, height);
                saveCanvasState();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Profile Generator Functionality
let profileCanvas, profileCtx;

function initProfileGenerator() {
    profileCanvas = document.getElementById('profile-canvas');
    profileCtx = profileCanvas.getContext('2d');
    
    // Set initial canvas state
    profileCtx.fillStyle = 'white';
    profileCtx.fillRect(0, 0, profileCanvas.width, profileCanvas.height);
    
    // Set up event listeners
    document.getElementById('generate-profile-btn').addEventListener('click', generateProfile);
    document.getElementById('generate-profile-code-btn').addEventListener('click', function() {
        generateProfile();
        const code = generateProfileCode();
        document.getElementById('python-code').textContent = code;
        
        // Switch to code tab
        const codeTabBtn = document.querySelector('[data-tab="code"]');
        codeTabBtn.click();
    });
}

function generateProfile() {
    // Clear canvas
    profileCtx.fillStyle = 'white';
    profileCtx.fillRect(0, 0, profileCanvas.width, profileCanvas.height);
    
    // Get form values
    const name = document.getElementById('profile-name').value || 'John Doe';
    const company = document.getElementById('profile-company').value || 'ACME Inc.';
    const title = document.getElementById('profile-title').value || 'Software Engineer';
    const social = document.getElementById('profile-social').value || '@johndoe';
    const url = document.getElementById('profile-url').value || 'https://example.com';
    
    // Draw dividing line
    profileCtx.strokeStyle = 'black';
    profileCtx.lineWidth = 2;
    profileCtx.beginPath();
    profileCtx.moveTo(130, 10);
    profileCtx.lineTo(130, 118);
    profileCtx.stroke();
    
    // Generate QR code (left side) - centered in its area
    const qrSize = 110;
    const qrX = Math.floor((130 - qrSize) / 2);
    const qrY = Math.floor((profileCanvas.height - qrSize) / 2);
    generateQRCode(url, qrX, qrY, qrSize);
    
    // Draw profile info (right side)
    profileCtx.fillStyle = 'black';
    
    // Calculate text starting position (with some padding from the divider)
    const textX = 140;
    
    // Name (larger font)
    profileCtx.font = '16px sans-serif';
    profileCtx.fillText(name, textX, 30);
    
    // Company
    profileCtx.font = '14px sans-serif';
    profileCtx.fillText(company, textX, 55);
    
    // Title
    profileCtx.font = '12px sans-serif';
    profileCtx.fillText(title, textX, 80);
    
    // Social handle
    profileCtx.font = '12px sans-serif';
    profileCtx.fillText(social, textX, 105);
    
    // Update code preview
    updateCodePreview();
}

function generateQRCode(data, x, y, size) {
    // Use qrcode-generator library
    const qr = qrcode(0, 'L');
    qr.addData(data);
    qr.make();
    
    // Calculate module size
    const moduleCount = qr.getModuleCount();
    const moduleSize = Math.floor(size / moduleCount);
    
    // Center the QR code in its area
    const actualSize = moduleSize * moduleCount;
    const offsetX = Math.floor((size - actualSize) / 2) + x;
    const offsetY = Math.floor((size - actualSize) / 2) + y;
    
    // Draw QR code
    profileCtx.fillStyle = 'black';
    
    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
                profileCtx.fillRect(
                    offsetX + col * moduleSize,
                    offsetY + row * moduleSize,
                    moduleSize,
                    moduleSize
                );
            }
        }
    }
}

// Badge Generator Functionality
let badgeCanvas, badgeCtx;

function initBadgeGenerator() {
    badgeCanvas = document.getElementById('badge-canvas');
    badgeCtx = badgeCanvas.getContext('2d');
    
    // Set initial canvas state
    badgeCtx.fillStyle = 'white';
    badgeCtx.fillRect(0, 0, badgeCanvas.width, badgeCanvas.height);
    
    // Set up event listeners
    document.getElementById('generate-badge-btn').addEventListener('click', generateBadge);
    document.getElementById('badge-logo').addEventListener('change', handleBadgeLogo);
    document.getElementById('generate-badge-code-btn').addEventListener('click', function() {
        generateBadge();
        const code = generateBadgeCode();
        document.getElementById('python-code').textContent = code;
        
        // Switch to code tab
        const codeTabBtn = document.querySelector('[data-tab="code"]');
        codeTabBtn.click();
    });
}

let badgeLogo = null;

function handleBadgeLogo(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                badgeLogo = img;
                generateBadge();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function generateBadge() {
    // Clear canvas
    badgeCtx.fillStyle = 'white';
    badgeCtx.fillRect(0, 0, badgeCanvas.width, badgeCanvas.height);
    
    // Get form values
    const company = document.getElementById('badge-company').value || 'ACME Inc.';
    const name = document.getElementById('badge-name').value || 'John Doe';
    const title = document.getElementById('badge-detail1-text').value || 'Software Engineer';
    const email = document.getElementById('badge-detail2-text').value || 'john.doe@example.com';
    
    // Constants based on badge.py example
    const IMAGE_WIDTH = 104;
    const COMPANY_HEIGHT = 30;
    const DETAILS_HEIGHT = 20;
    const NAME_HEIGHT = badgeCanvas.height - COMPANY_HEIGHT - (DETAILS_HEIGHT * 2) - 2;
    const TEXT_WIDTH = badgeCanvas.width - IMAGE_WIDTH - 1;
    
    // Draw black background for company name
    badgeCtx.fillStyle = 'black';
    badgeCtx.fillRect(0, 0, TEXT_WIDTH, COMPANY_HEIGHT);
    
    // Draw company name at top
    badgeCtx.fillStyle = 'white';
    badgeCtx.font = '14px serif';
    badgeCtx.fillText(company, 5, COMPANY_HEIGHT / 2 + 5);
    
    // Draw white background for name
    badgeCtx.fillStyle = 'white';
    badgeCtx.fillRect(1, COMPANY_HEIGHT + 1, TEXT_WIDTH, NAME_HEIGHT);
    
    // Draw name (centered and scaled)
    badgeCtx.fillStyle = 'black';
    badgeCtx.font = '24px sans-serif';
    let nameWidth = badgeCtx.measureText(name).width;
    
    // Scale down if name is too long
    let fontSize = 24;
    while (nameWidth > TEXT_WIDTH - 20 && fontSize > 10) {
        fontSize -= 2;
        badgeCtx.font = `${fontSize}px sans-serif`;
        nameWidth = badgeCtx.measureText(name).width;
    }
    
    const finalNameWidth = badgeCtx.measureText(name).width;
    badgeCtx.fillText(name, (TEXT_WIDTH - finalNameWidth) / 2, COMPANY_HEIGHT + NAME_HEIGHT / 2 + 8);
    
    // Draw white backgrounds for details
    badgeCtx.fillStyle = 'white';
    badgeCtx.fillRect(1, badgeCanvas.height - DETAILS_HEIGHT * 2, TEXT_WIDTH, DETAILS_HEIGHT - 1);
    badgeCtx.fillRect(1, badgeCanvas.height - DETAILS_HEIGHT, TEXT_WIDTH, DETAILS_HEIGHT - 1);
    
    // Draw details
    badgeCtx.fillStyle = 'black';
    badgeCtx.font = '12px sans-serif';
    
    // Title
    badgeCtx.fillText(title, 5, badgeCanvas.height - DETAILS_HEIGHT * 1.5);
    
    // Email
    badgeCtx.fillText(email, 5, badgeCanvas.height - DETAILS_HEIGHT / 2);
    
    // Draw logo area border
    badgeCtx.strokeStyle = 'black';
    badgeCtx.lineWidth = 1;
    badgeCtx.strokeRect(badgeCanvas.width - IMAGE_WIDTH, 0, IMAGE_WIDTH, badgeCanvas.height);
    
    // Draw logo if available
    if (badgeLogo) {
        // Calculate dimensions to fit the logo area while maintaining aspect ratio
        const scale = Math.min(
            IMAGE_WIDTH / badgeLogo.width,
            badgeCanvas.height / badgeLogo.height
        );
        const width = badgeLogo.width * scale;
        const height = badgeLogo.height * scale;
        
        // Center the logo in the logo area
        const x = badgeCanvas.width - IMAGE_WIDTH + (IMAGE_WIDTH - width) / 2;
        const y = (badgeCanvas.height - height) / 2;
        
        badgeCtx.drawImage(badgeLogo, x, y, width, height);
    } else {
        // Draw placeholder text if no logo
        badgeCtx.fillStyle = 'black';
        badgeCtx.font = '16px sans-serif';
        badgeCtx.fillText("LOGO", badgeCanvas.width - IMAGE_WIDTH + 30, badgeCanvas.height / 2);
    }
    
    // Update code preview
    updateCodePreview();
}

// Code Generator Functionality
function initCodeGenerator() {
    document.getElementById('download-code-btn').addEventListener('click', downloadCode);
    document.getElementById('copy-code-btn').addEventListener('click', copyCode);
    
    // Initial code preview
    updateCodePreview();
}

function updateCodePreview() {
    // Get the active tab
    const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
    
    let pythonCode = '';
    
    // Generate code based on active tab
    if (activeTab === 'drawing') {
        pythonCode = generateDrawingCode();
    } else if (activeTab === 'profile') {
        pythonCode = generateProfileCode();
    } else if (activeTab === 'badge') {
        pythonCode = generateBadgeCode();
    } else if (activeTab === 'code') {
        // If we're already on the code tab, don't change anything
        return;
    }
    
    // Update code display
    document.getElementById('python-code').textContent = pythonCode;
}

function generateDrawingCode() {
    // Get the canvas data
    const imageData = drawingCtx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
    const data = imageData.data;
    
    let code = `import badger2040

# Initialize display
display = badger2040.Badger2040()
display.set_update_speed(badger2040.UPDATE_NORMAL)
display.set_thickness(${lineThickness})  # Match the thickness used in the UI

# Clear the display
display.set_pen(15)  # White
display.clear()

# Drawing code generated from canvas
display.set_pen(0)  # Black
`;
    
    // Analyze the canvas data and generate drawing commands
    // Find horizontal lines for more efficient drawing
    let lines = [];
    
    for (let y = 0; y < drawingCanvas.height; y++) {
        let lineStart = -1;
        
        for (let x = 0; x <= drawingCanvas.width; x++) {
            if (x < drawingCanvas.width) {
                const index = (y * drawingCanvas.width + x) * 4;
                // Check if pixel is black (RGB values close to 0)
                const isBlack = data[index] < 50 && data[index + 1] < 50 && data[index + 2] < 50;
                
                // If this is a black pixel and we haven't started a line, start one
                if (isBlack && lineStart === -1) {
                    lineStart = x;
                }
                // If this is a white pixel and we have started a line, end it
                else if ((!isBlack || x === drawingCanvas.width) && lineStart !== -1) {
                    lines.push({
                        y: y,
                        x1: lineStart,
                        x2: x - 1
                    });
                    lineStart = -1;
                }
            }
            // If we're at the edge and have an open line, close it
            else if (lineStart !== -1) {
                lines.push({
                    y: y,
                    x1: lineStart,
                    x2: x - 1
                });
                lineStart = -1;
            }
        }
    }
    
    // Generate line drawing commands
    if (lineThickness === 1) {
        // For thin lines, use individual line commands
        for (const line of lines) {
            code += `display.line(${line.x1}, ${line.y}, ${line.x2}, ${line.y})\n`;
        }
    } else {
        // For thicker lines, use rectangles to match the thickness
        for (const line of lines) {
            const halfThickness = Math.floor(lineThickness / 2);
            const y1 = Math.max(0, line.y - halfThickness);
            const height = Math.min(drawingCanvas.height - y1, lineThickness);
            code += `display.rectangle(${line.x1}, ${y1}, ${line.x2 - line.x1 + 1}, ${height})\n`;
        }
    }
    
    code += `
# Update the display
display.update()

while True:
    # Keep the device powered on
    display.keepalive()
    
    # If on battery, halt the Badger to save power
    # It will wake up if any of the front buttons are pressed
    display.halt()`;
    
    return code;
}

function generateProfileCode() {
    const name = document.getElementById('profile-name').value || 'John Doe';
    const company = document.getElementById('profile-company').value || 'ACME Inc.';
    const title = document.getElementById('profile-title').value || 'Software Engineer';
    const social = document.getElementById('profile-social').value || '@johndoe';
    const url = document.getElementById('profile-url').value || 'https://example.com';
    
    return `import badger2040
import qrcode

# Initialize display
display = badger2040.Badger2040()
display.set_update_speed(badger2040.UPDATE_NORMAL)
display.set_thickness(2)

# Clear the display
display.set_pen(15)  # White
display.clear()

# Draw dividing line
display.set_pen(0)  # Black
display.line(130, 10, 130, 118)

# Generate QR code
def measure_qr_code(size, code):
    w, h = code.get_size()
    module_size = int(size / w)
    return module_size * w, module_size

def draw_qr_code(data, x, y, size):
    code = qrcode.QRCode()
    code.set_text(data)
    size, module_size = measure_qr_code(size, code)
    
    # Center the QR code in its area
    qr_x = int((130 - size) / 2)
    qr_y = int((128 - size) / 2)
    
    for qr_x_pos in range(code.get_size()[0]):
        for qr_y_pos in range(code.get_size()[1]):
            if code.get_module(qr_x_pos, qr_y_pos):
                display.rectangle(qr_x + qr_x_pos * module_size, qr_y + qr_y_pos * module_size, module_size, module_size)

# Draw QR code
display.set_pen(0)  # Black
draw_qr_code("${url}", 0, 0, 110)

# Draw profile info
display.set_pen(0)  # Black

# Name
display.set_font("sans")
display.text("${name}", 140, 30, scale=0.8)

# Company
display.text("${company}", 140, 55, scale=0.7)

# Title
display.text("${title}", 140, 80, scale=0.6)

# Social handle
display.text("${social}", 140, 105, scale=0.6)

# Update the display
display.update()

while True:
    # Keep the device powered on
    display.keepalive()
    
    # If on battery, halt the Badger to save power
    # It will wake up if any of the front buttons are pressed
    display.halt()`;
}

function generateBadgeCode() {
    const company = document.getElementById('badge-company').value || 'ACME Inc.';
    const name = document.getElementById('badge-name').value || 'John Doe';
    const title = document.getElementById('badge-detail1-text').value || 'Software Engineer';
    const email = document.getElementById('badge-detail2-text').value || 'john.doe@example.com';
    
    // Check if a logo has been uploaded
    const hasLogo = badgeLogo !== null;
    
    // Generate code for logo handling
    let logoCode;
    if (hasLogo) {
        // Create a temporary canvas to process the logo
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Set canvas size to match the logo area
        const logoWidth = 104;
        const logoHeight = 128;
        tempCanvas.width = logoWidth;
        tempCanvas.height = logoHeight;
        
        // Draw and resize the logo to fit the area
        const scale = Math.min(
            logoWidth / badgeLogo.width,
            logoHeight / badgeLogo.height
        );
        const width = badgeLogo.width * scale;
        const height = badgeLogo.height * scale;
        
        // Center the logo in the area
        const x = (logoWidth - width) / 2;
        const y = (logoHeight - height) / 2;
        
        // Draw the logo on the temp canvas
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, logoWidth, logoHeight);
        tempCtx.drawImage(badgeLogo, x, y, width, height);
        
        // Convert to 1-bit (black and white)
        const imageData = tempCtx.getImageData(0, 0, logoWidth, logoHeight);
        const data = imageData.data;
        
        // Generate drawing code for the logo using a more efficient approach
        // We'll use a combination of horizontal lines and rectangles
        
        // First, prepare the logo area
        logoCode = `
# Draw company logo area (white background)
display.set_pen(15)  # White
display.rectangle(WIDTH - IMAGE_WIDTH + 1, 1, IMAGE_WIDTH - 2, HEIGHT - 2)

# Draw the uploaded logo
display.set_pen(0)  # Black
`;
        
        // Process the image to find horizontal lines of black pixels
        const threshold = 128;
        let blackPixels = [];
        
        // Collect all black pixels
        for (let y = 0; y < logoHeight; y++) {
            for (let x = 0; x < logoWidth; x++) {
                const idx = (y * logoWidth + x) * 4;
                const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                
                if (gray < threshold) {
                    blackPixels.push({x, y});
                }
            }
        }
        
        // If there are too many black pixels, use a more efficient approach
        if (blackPixels.length > 500) {
            // Find horizontal lines
            let lines = [];
            for (let y = 0; y < logoHeight; y++) {
                let lineStart = -1;
                
                for (let x = 0; x <= logoWidth; x++) {
                    if (x < logoWidth) {
                        const idx = (y * logoWidth + x) * 4;
                        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                        
                        if (gray < threshold && lineStart === -1) {
                            lineStart = x;
                        } else if ((gray >= threshold || x === logoWidth) && lineStart !== -1) {
                            lines.push({y, x1: lineStart, x2: x - 1});
                            lineStart = -1;
                        }
                    } else if (lineStart !== -1) {
                        lines.push({y, x1: lineStart, x2: x - 1});
                        lineStart = -1;
                    }
                }
            }
            
            // Generate code for horizontal lines
            for (const line of lines) {
                logoCode += `display.line(WIDTH - IMAGE_WIDTH + ${line.x1}, ${line.y}, WIDTH - IMAGE_WIDTH + ${line.x2}, ${line.y})\n`;
            }
        } else {
            // For simpler logos, just draw individual pixels
            for (const pixel of blackPixels) {
                logoCode += `display.pixel(WIDTH - IMAGE_WIDTH + ${pixel.x}, ${pixel.y})\n`;
            }
        }
    } else {
        logoCode = `
# No logo was selected, drawing a placeholder
display.set_pen(15)  # White
display.rectangle(WIDTH - IMAGE_WIDTH + 1, 1, IMAGE_WIDTH - 2, HEIGHT - 2)
display.set_pen(0)  # Black
display.text("LOGO", WIDTH - IMAGE_WIDTH + 20, HEIGHT // 2, WIDTH, 1.0)`;
    }
    
    return `import badger2040

# Initialize display
display = badger2040.Badger2040()
display.led(128)
display.set_update_speed(badger2040.UPDATE_NORMAL)
display.set_thickness(2)

# Constants
WIDTH = badger2040.WIDTH
HEIGHT = badger2040.HEIGHT
IMAGE_WIDTH = 104
COMPANY_HEIGHT = 30
DETAILS_HEIGHT = 20
NAME_HEIGHT = HEIGHT - COMPANY_HEIGHT - (DETAILS_HEIGHT * 2) - 2
TEXT_WIDTH = WIDTH - IMAGE_WIDTH - 1
COMPANY_TEXT_SIZE = 0.6
DETAILS_TEXT_SIZE = 0.5
LEFT_PADDING = 5
NAME_PADDING = 20
DETAIL_SPACING = 10

# Utility function to truncate text to fit width
def truncatestring(text, text_size, width):
    while True:
        length = display.measure_text(text, text_size)
        if length > 0 and length > width:
            text = text[:-1]
        else:
            text += ""
            return text

# Clear the display with black background for company name
display.set_pen(0)
display.clear()

${logoCode}

# Draw a border around the image
display.set_pen(0)
display.line(WIDTH - IMAGE_WIDTH, 0, WIDTH - 1, 0)
display.line(WIDTH - IMAGE_WIDTH, 0, WIDTH - IMAGE_WIDTH, HEIGHT - 1)
display.line(WIDTH - IMAGE_WIDTH, HEIGHT - 1, WIDTH - 1, HEIGHT - 1)
display.line(WIDTH - 1, 0, WIDTH - 1, HEIGHT - 1)

# Draw the company
company_text = truncatestring("${company}", COMPANY_TEXT_SIZE, TEXT_WIDTH)
display.set_pen(15)  # White text on black background
display.set_font("serif")
display.text(company_text, LEFT_PADDING, (COMPANY_HEIGHT // 2) + 1, WIDTH, COMPANY_TEXT_SIZE)

# Draw a white background behind the name
display.set_pen(15)
display.rectangle(1, COMPANY_HEIGHT + 1, TEXT_WIDTH, NAME_HEIGHT)

# Draw the name, scaling it based on the available width
display.set_pen(0)
display.set_font("sans")
name_text = "${name}"
name_size = 2.0  # A sensible starting scale
while True:
    name_length = display.measure_text(name_text, name_size)
    if name_length >= (TEXT_WIDTH - NAME_PADDING) and name_size >= 0.1:
        name_size -= 0.01
    else:
        display.text(name_text, (TEXT_WIDTH - name_length) // 2, (NAME_HEIGHT // 2) + COMPANY_HEIGHT + 1, WIDTH, name_size)
        break

# Draw white backgrounds behind the details
display.set_pen(15)
display.rectangle(1, HEIGHT - DETAILS_HEIGHT * 2, TEXT_WIDTH, DETAILS_HEIGHT - 1)
display.rectangle(1, HEIGHT - DETAILS_HEIGHT, TEXT_WIDTH, DETAILS_HEIGHT - 1)

# Draw the title
display.set_pen(0)
display.set_font("sans")
title_text = truncatestring("${title}", DETAILS_TEXT_SIZE, TEXT_WIDTH)
display.text(title_text, LEFT_PADDING, HEIGHT - ((DETAILS_HEIGHT * 3) // 2), WIDTH, DETAILS_TEXT_SIZE)

# Draw the email
email_text = truncatestring("${email}", DETAILS_TEXT_SIZE, TEXT_WIDTH)
display.text(email_text, LEFT_PADDING, HEIGHT - (DETAILS_HEIGHT // 2), WIDTH, DETAILS_TEXT_SIZE)

# Update the display
display.update()

while True:
    # Sometimes a button press or hold will keep the system
    # powered *through* HALT, so latch the power back on.
    display.keepalive()
    
    # If on battery, halt the Badger to save power
    # It will wake up if any of the front buttons are pressed
    display.halt()`;
}

function downloadCode() {
    const code = document.getElementById('python-code').textContent;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'badger2040_design.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Copy code to clipboard functionality
document.getElementById('copy-code-btn').addEventListener('click', copyCode);
function copyCode() {
    const codeElement = document.getElementById('python-code');
    const code = codeElement.textContent;
    
    // Create a temporary textarea element to copy from
    const textarea = document.createElement('textarea');
    textarea.value = code;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    
    // Select and copy the text
    textarea.select();
    document.execCommand('copy');
    
    // Remove the temporary element
    document.body.removeChild(textarea);
    
    // Provide visual feedback
    const copyBtn = document.getElementById('copy-code-btn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    copyBtn.style.backgroundColor = '#27ae60';
    
    // Reset button after 2 seconds
    setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.backgroundColor = '#3498db';
    }, 2000);
}

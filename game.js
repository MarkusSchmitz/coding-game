// FarmBot - A programming game inspired by "The Farmer Was Replaced"

// Code Templates
const CODE_TEMPLATES = {
    basic: `// Basic: Plant and harvest a single crop
plant();

// Water 3 times to grow
for (let i = 0; i < 3; i++) {
    water();
    wait(1);
}

// Harvest when ready
if (canHarvest()) {
    harvest();
    log("Harvested! Money: $" + getMoney());
}`,

    row: `// Intermediate: Farm a whole row
for (let x = 0; x < 8; x++) {
    if (getMoney() >= 10) {
        plant();

        // Water 3 times
        for (let i = 0; i < 3; i++) {
            water();
            wait(1);
        }

        if (canHarvest()) {
            harvest();
        }
    }

    // Move to next cell
    if (x < 7) move("right");
}

log("Row complete! Total harvested: " + harvested);`,

    grid: `// Advanced: Farm the entire grid
while (getMoney() >= 10) {
    plant();

    // Water 3 times to grow crop
    for (let i = 0; i < 3; i++) {
        water();
        wait(1);
    }

    if (canHarvest()) {
        harvest();
    }

    // Move right, and go to next row at edge
    move("right");
    if (getX() >= 7) {
        move("down");
        // Move back to left side
        while (getX() > 0) {
            move("left");
        }
    }

    // Check if we're at the bottom right
    if (getX() === 7 && getY() === 7) {
        log("Grid complete!");
        break;
    }
}

log("Farming done! Money: $" + getMoney());`,

    efficient: `// Expert: Optimized for maximum profit
// Plant all cells first, then water and harvest
log("Starting optimized farming...");

// Phase 1: Plant everything
for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
        if (getMoney() >= 10) {
            plant();
        }
        if (x < 7) move("right");
    }
    if (y < 7) {
        move("down");
        // Return to left side
        for (let x = 0; x < 7; x++) {
            move("left");
        }
    }
}

log("All planted! Now watering...");

// Phase 2: Water everything 3 times
for (let cycle = 0; cycle < 3; cycle++) {
    // Reset to top-left
    while (getY() > 0) move("up");
    while (getX() > 0) move("left");

    // Water all crops
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            water();
            if (x < 7) move("right");
        }
        if (y < 7) {
            move("down");
            for (let x = 0; x < 7; x++) {
                move("left");
            }
        }
    }
    wait(1);
}

log("All watered! Now harvesting...");

// Phase 3: Harvest everything
while (getY() > 0) move("up");
while (getX() > 0) move("left");

for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
        if (canHarvest()) {
            harvest();
        }
        if (x < 7) move("right");
    }
    if (y < 7) {
        move("down");
        for (let x = 0; x < 7; x++) {
            move("left");
        }
    }
}

log("Complete! Total: $" + getMoney() + ", Harvested: " + harvested);`,

    blank: `// Write your farming code here!
// Available commands:
//   move(direction) - "up", "down", "left", "right"
//   plant() - plant a seed ($10)
//   water() - water the crop (needs 3 times)
//   harvest() - harvest mature crop ($50)
//   canHarvest() - check if crop is ready
//   getMoney() - get current money
//   getX() / getY() - get bot position
//   wait(cycles) - wait for N cycles
//   log(message) - print to console

`
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 8;
        this.cellSize = this.canvas.width / this.gridSize;

        // Game state
        this.money = 100;
        this.harvested = 0;
        this.cycle = 0;
        this.running = false;
        this.speed = 50;

        // Bot state
        this.botX = 0;
        this.botY = 0;

        // Grid state - each cell can have a crop
        this.grid = [];
        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = null; // null or {stage: 0-3, type: 'wheat'}
            }
        }

        // Code execution
        this.userCode = '';
        this.codeGenerator = null;
        this.waitCounter = 0;

        // Console output
        this.consoleOutput = [];

        this.initializeUI();
        this.showWelcomeModal();
        this.render();
    }

    initializeUI() {
        // Buttons
        document.getElementById('runBtn').addEventListener('click', () => this.runCode());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopCode());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('stepBtn').addEventListener('click', () => this.step());
        document.getElementById('clearConsole').addEventListener('click', () => this.clearConsole());

        // Template selector
        document.getElementById('codeTemplate').addEventListener('change', (e) => {
            const template = e.target.value;
            if (template && CODE_TEMPLATES[template]) {
                this.loadTemplate(template);
            }
            e.target.value = ''; // Reset selector
        });

        // Welcome modal
        document.getElementById('startTutorial').addEventListener('click', () => {
            this.hideWelcomeModal();
            this.loadTemplate('basic');
            this.showFeedback('Try running this basic example! Click "Run Code" or press Space.', 'info');
        });

        document.getElementById('skipTutorial').addEventListener('click', () => {
            this.hideWelcomeModal();
            this.loadTemplate('blank');
            this.showFeedback('Ready to code! Start writing your farming automation.', 'success');
        });

        // Speed control
        document.getElementById('speed').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            document.getElementById('speedValue').textContent = this.speed;
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                this.runCode();
            }
            if (e.code === 'Escape') {
                e.preventDefault();
                this.stopCode();
            }
            if (e.code === 'KeyS' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                this.step();
            }
        });

        // Save code to localStorage
        const savedCode = localStorage.getItem('farmbot_code');
        if (savedCode) {
            document.getElementById('codeEditor').value = savedCode;
        }

        document.getElementById('codeEditor').addEventListener('input', (e) => {
            localStorage.setItem('farmbot_code', e.target.value);
        });
    }

    showWelcomeModal() {
        const dontShowAgain = localStorage.getItem('farmbot_skip_welcome');
        if (dontShowAgain === 'true') {
            return;
        }

        const modal = document.getElementById('welcomeModal');
        modal.classList.add('show');

        const checkbox = document.getElementById('dontShowAgain');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                localStorage.setItem('farmbot_skip_welcome', 'true');
            } else {
                localStorage.removeItem('farmbot_skip_welcome');
            }
        });
    }

    hideWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        modal.classList.remove('show');
    }

    loadTemplate(templateName) {
        if (CODE_TEMPLATES[templateName]) {
            document.getElementById('codeEditor').value = CODE_TEMPLATES[templateName];
            localStorage.setItem('farmbot_code', CODE_TEMPLATES[templateName]);
            this.log(`Loaded template: ${templateName}`);
        }
    }

    reset() {
        this.stopCode();
        this.money = 100;
        this.harvested = 0;
        this.cycle = 0;
        this.botX = 0;
        this.botY = 0;

        // Clear grid
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = null;
            }
        }

        this.updateStats();
        this.updateStatus('Ready', 'ready');
        this.render();
        this.log('🔄 Farm reset! Starting fresh with $100.');
        this.showFeedback('Farm reset successfully!', 'success');
    }

    runCode() {
        if (this.running) return;

        const code = document.getElementById('codeEditor').value.trim();
        if (!code) {
            this.showFeedback('⚠️ No code to run! Write some code first.', 'error');
            return;
        }

        this.userCode = code;
        this.running = true;
        this.cycle = 0;
        this.updateButtonStates();
        this.updateStatus('Running', 'running');
        this.log('▶️ Starting code execution...');
        this.showFeedback('Code is running...', 'info');

        // Create code generator
        try {
            this.codeGenerator = this.createCodeGenerator();
            this.gameLoop();
        } catch (error) {
            this.handleError('Syntax Error', error);
            this.running = false;
            this.updateButtonStates();
            this.updateStatus('Error', 'error');
        }
    }

    stopCode() {
        if (!this.running) return;

        this.running = false;
        this.codeGenerator = null;
        this.updateButtonStates();
        this.updateStatus('Stopped', 'ready');
        this.log('⏸️ Code execution stopped.');
        this.showFeedback('Execution stopped by user.', 'info');
    }

    step() {
        if (this.running) return;

        const code = document.getElementById('codeEditor').value.trim();
        if (!code) {
            this.showFeedback('⚠️ No code to run! Write some code first.', 'error');
            return;
        }

        if (!this.codeGenerator) {
            this.userCode = code;
            try {
                this.codeGenerator = this.createCodeGenerator();
                this.log('⏭️ Starting step-by-step execution...');
                this.showFeedback('Step mode: Click "Step" to execute one action at a time.', 'info');
            } catch (error) {
                this.handleError('Syntax Error', error);
                return;
            }
        }

        this.executeNextStep();
    }

    createCodeGenerator() {
        const game = this;
        const generatorCode = `
            (function* () {
                const move = (dir) => { game.botMove(dir); return true; };
                const plant = () => game.botPlant();
                const water = () => game.botWater();
                const harvest = () => game.botHarvest();
                const canHarvest = () => game.botCanHarvest();
                const getMoney = () => game.money;
                const getX = () => game.botX;
                const getY = () => game.botY;
                const wait = function*(cycles) {
                    for(let i = 0; i < cycles; i++) yield;
                };
                const log = (msg) => game.log('📝 ' + msg);
                const harvested = game.harvested; // Read-only access

                ${this.userCode}
            })()
        `;

        return eval(generatorCode);
    }

    gameLoop() {
        if (!this.running) return;

        this.executeNextStep();

        const delay = Math.max(10, 1000 - (this.speed * 10));
        setTimeout(() => this.gameLoop(), delay);
    }

    executeNextStep() {
        if (!this.codeGenerator) return;

        try {
            const result = this.codeGenerator.next();

            if (result.done) {
                this.log('✅ Code execution completed successfully!');
                this.log(`📊 Final Stats - Money: $${this.money}, Harvested: ${this.harvested}`);
                this.showFeedback(`Completed! Money: $${this.money}, Crops: ${this.harvested}`, 'success');
                this.running = false;
                this.codeGenerator = null;
                this.updateButtonStates();
                this.updateStatus('Completed', 'ready');
            } else {
                this.cycle++;
                this.updateStats();
                this.render();
            }
        } catch (error) {
            this.handleError('Runtime Error', error);
            this.running = false;
            this.codeGenerator = null;
            this.updateButtonStates();
            this.updateStatus('Error', 'error');
        }
    }

    handleError(type, error) {
        let errorMsg = `❌ ${type}: ${error.message}`;
        let tips = '';

        // Provide helpful tips based on common errors
        if (error.message.includes('move')) {
            tips = '\n💡 Tip: move() requires a direction: "up", "down", "left", or "right"';
        } else if (error.message.includes('undefined')) {
            tips = '\n💡 Tip: Check your variable names and function calls';
        } else if (error.message.includes('Not enough money')) {
            tips = '\n💡 Tip: Check your money with getMoney() before planting';
        }

        this.log(errorMsg + tips);
        this.showFeedback(errorMsg, 'error');
    }

    // Bot actions
    botMove(direction) {
        const oldX = this.botX;
        const oldY = this.botY;

        switch (direction.toLowerCase()) {
            case 'up':
                this.botY = Math.max(0, this.botY - 1);
                break;
            case 'down':
                this.botY = Math.min(this.gridSize - 1, this.botY + 1);
                break;
            case 'left':
                this.botX = Math.max(0, this.botX - 1);
                break;
            case 'right':
                this.botX = Math.min(this.gridSize - 1, this.botX + 1);
                break;
            default:
                this.log(`⚠️ Invalid direction: "${direction}". Use: up, down, left, right`);
                return false;
        }

        if (oldX !== this.botX || oldY !== this.botY) {
            this.render();
        }
        return true;
    }

    botPlant() {
        if (this.money < 10) {
            this.log('❌ Not enough money to plant! Need $10, have $' + this.money);
            this.showFeedback('Not enough money to plant!', 'error');
            return false;
        }

        if (this.grid[this.botY][this.botX] !== null) {
            this.log('⚠️ Cannot plant - cell already has a crop!');
            return false;
        }

        this.money -= 10;
        this.grid[this.botY][this.botX] = { stage: 0, type: 'wheat' };
        this.updateStats();
        this.render();
        return true;
    }

    botWater() {
        const crop = this.grid[this.botY][this.botX];

        if (!crop) {
            this.log('⚠️ No crop to water at position (' + this.botX + ', ' + this.botY + ')');
            return false;
        }

        if (crop.stage < 3) {
            crop.stage++;
            if (crop.stage === 3) {
                this.log('🌾 Crop is now mature and ready to harvest!');
            }
            this.render();
            return true;
        }

        return false;
    }

    botHarvest() {
        const crop = this.grid[this.botY][this.botX];

        if (!crop) {
            this.log('⚠️ No crop to harvest at position (' + this.botX + ', ' + this.botY + ')');
            return false;
        }

        if (crop.stage < 3) {
            this.log('⚠️ Crop not ready! Water ' + (3 - crop.stage) + ' more time(s).');
            return false;
        }

        this.money += 50;
        this.harvested++;
        this.grid[this.botY][this.botX] = null;
        this.updateStats();
        this.render();

        if (this.harvested % 10 === 0) {
            this.log(`🎉 Milestone! ${this.harvested} crops harvested!`);
        }

        return true;
    }

    botCanHarvest() {
        const crop = this.grid[this.botY][this.botX];
        return crop !== null && crop.stage >= 3;
    }

    // Rendering
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        ctx.strokeStyle = '#7cb342';
        ctx.lineWidth = 1;

        for (let y = 0; y <= this.gridSize; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.cellSize);
            ctx.lineTo(this.canvas.width, y * this.cellSize);
            ctx.stroke();
        }

        for (let x = 0; x <= this.gridSize; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.cellSize, 0);
            ctx.lineTo(x * this.cellSize, this.canvas.height);
            ctx.stroke();
        }

        // Draw crops
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const crop = this.grid[y][x];
                if (crop) {
                    this.drawCrop(x, y, crop);
                }
            }
        }

        // Draw bot
        this.drawBot(this.botX, this.botY);
    }

    drawCrop(x, y, crop) {
        const ctx = this.ctx;
        const centerX = x * this.cellSize + this.cellSize / 2;
        const centerY = y * this.cellSize + this.cellSize / 2;

        // Different visuals based on growth stage
        if (crop.stage === 0) {
            // Seed
            ctx.fillStyle = '#8d6e63';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (crop.stage === 1) {
            // Sprout
            ctx.fillStyle = '#aed581';
            ctx.fillRect(centerX - 3, centerY - 5, 6, 10);
            ctx.fillStyle = '#7cb342';
            ctx.fillRect(centerX - 8, centerY - 8, 4, 6);
            ctx.fillRect(centerX + 4, centerY - 8, 4, 6);
        } else if (crop.stage === 2) {
            // Growing
            ctx.fillStyle = '#9ccc65';
            ctx.fillRect(centerX - 4, centerY - 15, 8, 20);
            ctx.fillStyle = '#7cb342';
            ctx.fillRect(centerX - 12, centerY - 12, 6, 10);
            ctx.fillRect(centerX + 6, centerY - 12, 6, 10);
            ctx.fillRect(centerX - 10, centerY - 5, 6, 8);
            ctx.fillRect(centerX + 4, centerY - 5, 6, 8);
        } else if (crop.stage >= 3) {
            // Mature (ready to harvest)
            ctx.fillStyle = '#fdd835';
            ctx.fillRect(centerX - 5, centerY - 20, 10, 25);

            // Wheat head
            ctx.fillStyle = '#f9a825';
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(centerX - 8 + i * 4, centerY - 22, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Glow effect for mature crops
            ctx.strokeStyle = '#ffeb3b';
            ctx.lineWidth = 2;
            ctx.strokeRect(x * this.cellSize + 5, y * this.cellSize + 5,
                           this.cellSize - 10, this.cellSize - 10);
        }
    }

    drawBot(x, y) {
        const ctx = this.ctx;
        const centerX = x * this.cellSize + this.cellSize / 2;
        const centerY = y * this.cellSize + this.cellSize / 2;

        // Bot body
        ctx.fillStyle = '#2196f3';
        ctx.fillRect(centerX - 20, centerY - 20, 40, 40);

        // Bot outline
        ctx.strokeStyle = '#1976d2';
        ctx.lineWidth = 3;
        ctx.strokeRect(centerX - 20, centerY - 20, 40, 40);

        // Bot eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(centerX - 12, centerY - 10, 8, 8);
        ctx.fillRect(centerX + 4, centerY - 10, 8, 8);

        // Bot pupils
        ctx.fillStyle = '#000';
        ctx.fillRect(centerX - 10, centerY - 8, 4, 4);
        ctx.fillRect(centerX + 6, centerY - 8, 4, 4);

        // Bot antenna
        ctx.strokeStyle = '#1976d2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 20);
        ctx.lineTo(centerX, centerY - 28);
        ctx.stroke();

        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 28, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // UI Updates
    updateStats() {
        document.getElementById('money').textContent = '$' + this.money;
        document.getElementById('harvested').textContent = this.harvested;
        document.getElementById('cycle').textContent = this.cycle;
    }

    updateStatus(text, state) {
        const statusText = document.getElementById('status');
        const statusDot = document.querySelector('.status-dot');

        statusText.textContent = text;
        statusDot.className = 'status-dot';

        if (state === 'running') {
            statusDot.classList.add('running');
        } else if (state === 'error') {
            statusDot.classList.add('error');
        }
    }

    updateButtonStates() {
        const runBtn = document.getElementById('runBtn');
        const stopBtn = document.getElementById('stopBtn');
        const stepBtn = document.getElementById('stepBtn');
        const resetBtn = document.getElementById('resetBtn');

        if (this.running) {
            runBtn.disabled = true;
            stopBtn.disabled = false;
            stepBtn.disabled = true;
            resetBtn.disabled = true;
        } else {
            runBtn.disabled = false;
            stopBtn.disabled = true;
            stepBtn.disabled = false;
            resetBtn.disabled = false;
        }
    }

    showFeedback(message, type) {
        const feedback = document.getElementById('actionFeedback');
        feedback.textContent = message;
        feedback.className = 'action-feedback ' + type;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (feedback.textContent === message) {
                feedback.textContent = '';
                feedback.className = 'action-feedback';
            }
        }, 5000);
    }

    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.consoleOutput.push(`[${timestamp}] ${message}`);
        if (this.consoleOutput.length > 100) {
            this.consoleOutput.shift();
        }

        const consoleDiv = document.getElementById('console');
        consoleDiv.textContent = this.consoleOutput.join('\n');
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
    }

    clearConsole() {
        this.consoleOutput = [];
        document.getElementById('console').textContent = '';
        this.log('Console cleared.');
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    game = new Game();
});

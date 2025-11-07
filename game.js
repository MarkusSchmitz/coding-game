// FarmBot - A programming game inspired by "The Farmer Was Replaced"

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
        this.render();
    }

    initializeUI() {
        // Buttons
        document.getElementById('runBtn').addEventListener('click', () => this.runCode());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopCode());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('stepBtn').addEventListener('click', () => this.step());
        document.getElementById('clearConsole').addEventListener('click', () => this.clearConsole());

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
        this.render();
        this.log('Farm reset!');
    }

    runCode() {
        if (this.running) return;

        this.userCode = document.getElementById('codeEditor').value;
        this.running = true;
        this.cycle = 0;
        this.log('Starting code execution...');

        // Create code generator
        try {
            this.codeGenerator = this.createCodeGenerator();
            this.gameLoop();
        } catch (error) {
            this.log('Error: ' + error.message);
            this.running = false;
        }
    }

    stopCode() {
        this.running = false;
        this.codeGenerator = null;
        this.log('Code execution stopped.');
    }

    step() {
        if (this.running) return;

        if (!this.codeGenerator) {
            this.userCode = document.getElementById('codeEditor').value;
            try {
                this.codeGenerator = this.createCodeGenerator();
                this.log('Starting step-by-step execution...');
            } catch (error) {
                this.log('Error: ' + error.message);
                return;
            }
        }

        this.executeNextStep();
    }

    createCodeGenerator() {
        const game = this;
        const generatorCode = `
            (function* () {
                const move = (dir) => game.botMove(dir);
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
                const log = (msg) => game.log(msg);

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
                this.log('Code execution completed!');
                this.running = false;
                this.codeGenerator = null;
            } else {
                this.cycle++;
                this.updateStats();
                this.render();
            }
        } catch (error) {
            this.log('Runtime Error: ' + error.message);
            this.running = false;
            this.codeGenerator = null;
        }
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
        }

        if (oldX !== this.botX || oldY !== this.botY) {
            this.render();
        }
    }

    botPlant() {
        if (this.money < 10) {
            this.log('Not enough money to plant! Need $10');
            return false;
        }

        if (this.grid[this.botY][this.botX] !== null) {
            this.log('Cannot plant - cell already has a crop!');
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
            this.log('No crop to water at this position!');
            return false;
        }

        if (crop.stage < 3) {
            crop.stage++;
            this.render();
            return true;
        }

        return false;
    }

    botHarvest() {
        const crop = this.grid[this.botY][this.botX];

        if (!crop) {
            this.log('No crop to harvest!');
            return false;
        }

        if (crop.stage < 3) {
            this.log('Crop not ready! Water it more.');
            return false;
        }

        this.money += 50;
        this.harvested++;
        this.grid[this.botY][this.botX] = null;
        this.updateStats();
        this.render();
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

    log(message) {
        this.consoleOutput.push(message);
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
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    game = new Game();
});

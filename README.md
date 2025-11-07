# 🤖 FarmBot - Automate Your Farm!

A 2D programming game inspired by "The Farmer Was Replaced". Write JavaScript code to automate your farming operations and maximize profit!

## 🎮 How to Play

1. Open `index.html` in your web browser
2. Write JavaScript code in the editor to automate your farm
3. Click "Run Code" or press Space to execute your code
4. Watch your bot farm automatically!

## 🌾 Game Mechanics

- **Grid-based Farm**: 8x8 grid where you can plant and harvest crops
- **Bot Control**: Program a bot to move around and perform farming tasks
- **Economics**: Seeds cost $10, mature crops sell for $50 (profit: $40 per crop)
- **Crop Growth**: Crops need to be watered 3 times to reach maturity

## 📝 Available Commands

```javascript
move(direction)     // Move bot: "up", "down", "left", "right"
plant()            // Plant a seed (costs $10)
water()            // Water the current crop (grows it)
harvest()          // Harvest mature crop (earns $50)
canHarvest()       // Returns true if crop is ready to harvest
getMoney()         // Get current money amount
getX() / getY()    // Get bot's current position
wait(cycles)       // Wait for N cycles
log(message)       // Print message to console
```

## 💡 Example Code

```javascript
// Simple farming loop
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

    // Move to next position
    move("right");
    if (getX() >= 7) {
        move("down");
        while (getX() > 0) {
            move("left");
        }
    }
}
```

## 🎯 Tips for Success

- Optimize your code to farm as many crops as possible
- Use loops to avoid repetitive code
- Plan your bot's movement pattern for efficiency
- The code saves automatically to your browser's localStorage

## 🎨 Features

- **2D Graphics**: Beautiful visual representation of your farm
- **Real-time Execution**: Watch your code run in real-time
- **Speed Control**: Adjust execution speed to your liking
- **Step-by-Step Mode**: Debug your code one step at a time
- **Console Output**: See logs and debug information
- **Keyboard Shortcuts**:
  - `Space`: Run code
  - `Esc`: Stop execution
  - `S`: Step through code

## 🚀 Getting Started

No installation required! Just open `index.html` in a modern web browser and start coding.

Have fun automating your farm! 🌾🤖
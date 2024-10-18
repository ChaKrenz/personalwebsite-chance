class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.snake = [{ x: 50, y: 50 }]; // Snake starts as a single block
        this.direction = { x: 10, y: 0 }; // Initial movement to the right
        this.blockSize = 10;
        this.speed = 100; // Lower is faster
        this.isGameOver = false;

        // Generate the first apple
        this.apple = this.generateApple();

        // Handle keyboard input
        document.addEventListener('keydown', (e) => this.handleInput(e));

        // Start the game loop
        this.gameLoop();
    }

    handleInput(e) {
        // Prevent reverse movement
        if (e.key === 'ArrowUp' && this.direction.y === 0) {
            this.direction = { x: 0, y: -this.blockSize };
        } else if (e.key === 'ArrowDown' && this.direction.y === 0) {
            this.direction = { x: 0, y: this.blockSize };
        } else if (e.key === 'ArrowLeft' && this.direction.x === 0) {
            this.direction = { x: -this.blockSize, y: 0 };
        } else if (e.key === 'ArrowRight' && this.direction.x === 0) {
            this.direction = { x: this.blockSize, y: 0 };
        }
    }

    gameLoop() {
        if (this.isGameOver) {
            this.displayGameOver();
            return;
        }

        this.update();
        this.redraw();

        setTimeout(() => this.gameLoop(), this.speed);
    }

    update() {
        // Move the snake
        const newHead = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        // Check collision with walls or self
        if (this.checkCollisionWithWalls(newHead) || this.checkCollisionWithSelf(newHead)) {
            this.isGameOver = true;
        }

        this.snake.unshift(newHead); // Add the new head to the front

        // Check if snake eats the apple
        if (this.checkCollision(newHead, this.apple)) {
            this.score++;
            this.apple = this.generateApple(); // Generate new apple position
        } else {
            this.snake.pop(); // Remove the tail if no apple is eaten
        }
    }

    redraw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw the snake
        for (const segment of this.snake) {
            this.ctx.fillStyle = 'green';
            this.ctx.fillRect(segment.x, segment.y, this.blockSize, this.blockSize);
        }

        // Draw the apple
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(this.apple.x, this.apple.y, this.blockSize, this.blockSize);

        // Display the score
        this.ctx.fillStyle = 'black';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 20);
    }

    generateApple() {
        let applePosition;

        // Keep generating a new apple position until it doesn't collide with the snake
        while (true) {
            const x = Math.floor(Math.random() * (this.canvas.width / this.blockSize)) * this.blockSize;
            const y = Math.floor(Math.random() * (this.canvas.height / this.blockSize)) * this.blockSize;

            applePosition = { x, y };

            // Ensure the apple does not spawn on the snake
            if (!this.snake.some(segment => segment.x === x && segment.y === y)) {
                break; // Exit the loop if apple is not on the snake
            }
        }

        console.log(`Generated new apple at: (${applePosition.x}, ${applePosition.y})`); // Debugging log to check apple position

        return applePosition;
    }

    checkCollision(obj1, obj2) {
        // Check if two objects (snake head and apple) collide
        return obj1.x === obj2.x && obj1.y === obj2.y;
    }

    checkCollisionWithWalls(head) {
        // Check if the snake's head hits the walls
        return head.x < 0 || head.y < 0 || head.x >= this.canvas.width || head.y >= this.canvas.height;
    }

    checkCollisionWithSelf(head) {
        // Check if the snake's head collides with its body
        return this.snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
    }

    displayGameOver() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'red';
        this.ctx.font = '40px Arial';
        this.ctx.fillText('Game Over', 100, 200);

        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, 130, 240);
    }
}

// Initialize the game
document.myGame = new Game();
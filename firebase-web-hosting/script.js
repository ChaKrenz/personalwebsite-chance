/*
Comments were requested, here we go :)

Here's the rundown:

This script creates a grid of cells and a separate layer of particles that
float on top of the grid. Each cell of the grid holds X and Y velocity 
(direction and magnitude) values and a pressure value. 

Whenever the user holds down and moves their mouse over the canvas, the velocity 
of the mouse is calculated and is used to influence the velocity and pressure in 
each cell that was within the defined range of the mouse coordinates. Then, the 
pressure change is communicated to all of the neighboring cells of those affected, 
adjusting their velocity and pressure, and this is repeated over and over until
the change propogates to all of the cells in the path of the direction of movement.

The particles are randomly placed on the canvas and move according to the 
velocity of the grid cells below, similar to grass seed floating on the surface 
of water as it's moving. Whenever the particles move off the edge of the canvas,
they are "dropped" back on to the canvas in a random position. The velocity, 
however, is "wrapped" around to the opposite edge of the canvas. The slowing 
down of the movement is simulated viscosity, which is basically frictional drag
in the liquid.


Let's get started:
--------

This is a self-invoking function. Basically, that means that it runs itself 
automatically. The reason for wrapping the script in this is to isolate the 
majority of the variables that I define inside from the global scope and 
only reveal specific functions and values. It looks like this:

(function(argument) {

    alert(argument);

})("Yo.");

and it does the same thing as this:

function thing(argument) {

    alert(argument);

}

thing("Yo.");

*/
(function(w) {

    var canvas, ctx;
    
    /* 
    This is an associative array to hold the status of the mouse cursor
    Whenever the mouse is moved or pressed, there are event handlers that
    update the values in this array.
    */
    var mouse = {
        x: 0,
        y: 0,
        px: 0,
        py: 0,
        down: false
    };

    /*
    These are the variable definitions for the values that will be used 
    throughout the rest of the script.
    */
    var resolution = 30; // Width and height of each cell in the grid.

// Get window dimensions and adjust for any padding/margins if needed
var canvas_width = window.innerWidth; 
var canvas_height = window.innerHeight;

// If you want to leave some margin, you could do something like:
// var canvas_width = window.innerWidth - 40;  // 20px margin on each side
// var canvas_height = window.innerHeight - 40; // 20px margin on top and bottom

// Round down to nearest multiple of resolution to ensure even grid
canvas_width = Math.floor(canvas_width / resolution) * resolution;
canvas_height = Math.floor(canvas_height / resolution) * resolution;

var pen_size = 60; // Radius around the mouse cursor coordinates to reach when stirring

var num_cols = canvas_width / resolution; // This value is the number of columns in the grid.
var num_rows = canvas_height / resolution; // This is number of rows.

// Optional: Add event listener to handle window resizing
window.addEventListener('resize', function() {
    canvas_width = Math.floor(window.innerWidth / resolution) * resolution;
    canvas_height = Math.floor(window.innerHeight / resolution) * resolution;
    num_cols = canvas_width / resolution;
    num_rows = canvas_height / resolution;
    
    // You'll need to call your canvas resize function here
    // For example: resizeCanvas(canvas_width, canvas_height);
});
    var speck_count = 25000; //This determines how many particles will be made.
    
    var vec_cells = []; //The array that will contain the grid cells
    var particles = []; //The array that will contain the particles


    /*
    This is the main function. It is triggered to start the process of constructing the
    the grid and creating the particles, attaching event handlers, and starting the
    animation loop.
    */
    function init() {
        
        //These lines get the canvas DOM element and canvas context, respectively.
        canvas = document.getElementById("c");
        ctx = canvas.getContext("2d");

        //These two set the width and height of the canvas to the defined values.
        canvas.width = canvas_width;
        canvas.height = canvas_height;

        /*
        This loop begins at zero and counts up to the defined number of particles,
        less one, because array elements are numbered beginning at zero.
        */
        for (i = 0; i < speck_count; i++) {
            /*
            This calls the function particle() with random X and Y values. It then
            takes the returned object and pushes it into the particles array at the
            end.
            */
            particles.push(new particle(Math.random() * canvas_width, Math.random() * canvas_height));
        }

        //This loops through the count of columns.
        for (col = 0; col < num_cols; col++) { 
            
            //This defines the array element as another array.
            vec_cells[col] = [];

            //This loops through the count of rows.
            for (row = 0; row < num_rows; row++) { 
                
                /*
                This line calls the cell() function, which creates an individual grid cell
                and returns it as an object. The X and Y values are multiplied by the
                resolution so that when the loops are referring to "column 2, row 2", the
                width and height of "column 1, row 1" are counted in so that the top-left
                corner of the new grid cell is at the bottom right of the other cell.
                */
                var cell_data = new cell(col * resolution, row * resolution, resolution)

                //This pushes the cell object into the grid array.
                vec_cells[col][row] = cell_data;

                /*
                These two lines set the object's column and row values so the object knows
                where in the grid it is positioned.                
                */
                vec_cells[col][row].col = col;
                vec_cells[col][row].row = row;

            }
        }
        

        /*
        These loops move through the rows and columns of the grid array again and set variables 
        in each cell object that will hold the directional references to neighboring cells. 
        For example, let's say the loop is currently on this cell:

        OOOOO
        OOOXO
        OOOOO
        
        These variables will hold the references to neighboring cells so you only need to
        use "up" to refer to the cell above the one you're currently on.
        */
        for (col = 0; col < num_cols; col++) { 
            
            for (row = 0; row < num_rows; row++) { 

                /*
                This variable holds the reference to the current cell in the grid. When you
                refer to an element in an array, it doesn't copy that value into the new
                variable; the variable stores a "link" or reference to that spot in the array.
                If the value in the array is changed, the value of this variable would change
                also, and vice-versa.
                */
                var cell_data = vec_cells[col][row];

                /*
                Each of these lines has a ternary expression. A ternary expression is similar 
                to an if/then clause and is represented as an expression (e.g. row - 1 >= 0) 
                which is evaluated to either true or false. If it's true, the first value after
                the question mark is used, and if it's false, the second value is used instead.

                If you're on the first row and you move to the row above, this wraps the row 
                around to the last row. This is done so that momentum that is pushed to the edge 
                of the canvas is "wrapped" to the opposite side.
                */
                var row_up = (row - 1 >= 0) ? row - 1 : num_rows - 1;
                var col_left = (col - 1 >= 0) ? col - 1 : num_cols - 1;
                var col_right = (col + 1 < num_cols) ? col + 1 : 0;

                //Get the reference to the cell on the row above.
                var up = vec_cells[col][row_up];
                var left = vec_cells[col_left][row];
                var up_left = vec_cells[col_left][row_up];
                var up_right = vec_cells[col_right][row_up];
                
                /*
                Set the current cell's "up", "left", "up_left" and "up_right" attributes to the 
                respective neighboring cells.
                */
                cell_data.up = up;
                cell_data.left = left;
                cell_data.up_left = up_left;
                cell_data.up_right = up_right;

                /*
                Set the neighboring cell's opposite attributes to point to the current cell.
                */
                up.down = vec_cells[col][row];
                left.right = vec_cells[col][row];
                up_left.down_right = vec_cells[col][row];
                up_right.down_left = vec_cells[col][row];

            }
        }

      
        /*
        These lines create triggers that fire when certain events happen. For
        instance, when you move your mouse, the mouse_move_handler() function 
        will run and will be passed the event object reference into it's "e" 
        variable. Something to note, the mousemove event doesn't necessarily 
        fire for *every* mouse coordinate position; the mouse movement is 
        sampled at a certain rate, meaning that it's checked periodically, and 
        if the mouse has moved, the event is fired and the current coordinates 
        are sent. That's why you'll see large jumps from one pair of coordinates
        to the next if you move your mouse very fast across the screen. That's
        also how I measure the mouse's velocity.
        */
        w.addEventListener("mousedown", mouse_down_handler);
        w.addEventListener("touchstart", touch_start_handler);

        w.addEventListener("mouseup", mouse_up_handler);
        w.addEventListener("touchend", touch_end_handler);

        canvas.addEventListener("mousemove", mouse_move_handler);
        canvas.addEventListener("touchmove", touch_move_handler);

        //When the page is finished loading, run the draw() function.
        w.onload = draw;

    }

  
    /*
    This function updates the position of the particles according to the velocity
    of the cells underneath, and also draws them to the canvas.
    */
    function update_particle() {
        for (i = 0; i < particles.length; i++) {
            var p = particles[i];
    
            if (p.x >= 0 && p.x < canvas_width && p.y >= 0 && p.y < canvas_height) {
                var col = parseInt(p.x / resolution);
                var row = parseInt(p.y / resolution);
                var cell_data = vec_cells[col][row];
                
                var ax = (p.x % resolution) / resolution;
                var ay = (p.y % resolution) / resolution;
                
                // Slower velocity changes for smoother transitions
                p.xv += (1 - ax) * cell_data.xv * 0.03;  // Reduced from 0.05
                p.yv += (1 - ay) * cell_data.yv * 0.03;
                
                p.xv += ax * cell_data.right.xv * 0.03;
                p.yv += ax * cell_data.right.yv * 0.03;
                
                p.xv += ay * cell_data.down.xv * 0.03;
                p.yv += ay * cell_data.down.yv * 0.03;
                
                // Update position
                p.x += p.xv;
                p.y += p.yv;
                
                var dx = p.px - p.x;
                var dy = p.py - p.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                
                // Calculate velocity-based color every frame
                var speed = Math.sqrt(p.xv * p.xv + p.yv * p.yv);
                
                // Smoother speed tracking with momentum
                if (!p.currentSpeed) p.currentSpeed = speed;
                p.currentSpeed = p.currentSpeed * 0.95 + speed * 0.05; // Smooth speed transitions
                
                // Map speed to color spectrum
                var maxSpeed = 1.5;
                var speedRatio = Math.min(p.currentSpeed / maxSpeed, 1);
                
                // Create rainbow color spectrum
                var hue;
                if (p.currentSpeed < 0.1) { // Very slow or at rest
                    p.color = 'rgb(0, 0, 0)'; // Black
                } else {
                    // Map speed to hue (red=0, blue=240)
                    // Reverse the hue mapping so red is fast and blue is slow
                    hue = 240 - (speedRatio * 240);
                    // Add saturation and brightness for more vibrant colors
                    var saturation = 1000;
                    var brightness = Math.min(40 + speedRatio * 60, 100); // Brighter at higher speeds
                    
                    // Convert HSV to RGB
                    function hsvToRgb(h, s, v) {
                        s = s / 100;
                        v = v / 100;
                        let c = v * s;
                        let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
                        let m = v - c;
                        let r, g, b;
                        
                        if (h < 60) { r = c; g = x; b = 0; }
                        else if (h < 120) { r = x; g = c; b = 0; }
                        else if (h < 180) { r = 0; g = c; b = x; }
                        else if (h < 240) { r = 0; g = x; b = c; }
                        else if (h < 300) { r = x; g = 0; b = c; }
                        else { r = c; g = 0; b = x; }
                        
                        return {
                            r: Math.round((r + m) * 255),
                            g: Math.round((g + m) * 255),
                            b: Math.round((b + m) * 255)
                        };
                    }
                    
                    let rgb = hsvToRgb(hue, saturation, brightness);
                    p.color = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                }
                
                var limit = Math.random() * 0.5;
                
                // Draw the particle
                if (dist > limit) {
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = p.color;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.px, p.py);
                    ctx.stroke();
                } else {
                    ctx.strokeStyle = p.color;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + limit, p.y + limit);
                    ctx.stroke();
                }
                
                p.px = p.x;
                p.py = p.y;
            }
            else {
                // Reset particle
                p.x = p.px = Math.random() * canvas_width;
                p.y = p.py = Math.random() * canvas_height;
                p.xv = 0;
                p.yv = 0;
                p.currentSpeed = 0;
                p.color = 'rgb(0, 0, 0)';
            }
            
            // Slightly slower velocity dampening for more persistent movements
            p.xv *= 0.6; // Increased from 0.5
            p.yv *= 0.6;
        }
    }
    
    function draw() {
        var mouse_xv = mouse.x - mouse.px;
        var mouse_yv = mouse.y - mouse.py;
        
        for (i = 0; i < vec_cells.length; i++) {
            var cell_datas = vec_cells[i];
            for (j = 0; j < cell_datas.length; j++) {
                var cell_data = cell_datas[j];
                change_cell_velocity(cell_data, mouse_xv, mouse_yv, pen_size);
                update_pressure(cell_data);
            }
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        update_particle();
        
        for (i = 0; i < vec_cells.length; i++) {
            var cell_datas = vec_cells[i];
            for (j = 0; j < cell_datas.length; j++) {
                update_velocity(cell_datas[j]);
            }
        }
        
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        
        requestAnimationFrame(draw);
    }

  
    /*
    This function changes the cell velocity of an individual cell by first determining whether the cell is 
    close enough to the mouse cursor to be affected, and then if it is, by calculating the effect that mouse velocity
    has on the cell's velocity.
    */
    function change_cell_velocity(cell_data, mvelX, mvelY, pen_size) {
        //This gets the distance between the cell and the mouse cursor.
        var dx = cell_data.x - mouse.x;
        var dy = cell_data.y - mouse.y;
        var dist = Math.sqrt(dy * dy + dx * dx);
        
        //If the distance is less than the radius...
        if (dist < pen_size) {

            //If the distance is very small, set it to the pen_size.
            if (dist < 4) {
                dist = pen_size;
            }
            
            //Calculate the magnitude of the mouse's effect (closer is stronger)
            var power = pen_size / dist;

            /*
            Apply the velocity to the cell by multiplying the power by the mouse velocity and adding it to the cell velocity
            */
            cell_data.xv += mvelX * power;
            cell_data.yv += mvelY * power;
        }
    }
    
  
    /*
    This function updates the pressure value for an individual cell using the 
    pressures of neighboring cells.
    */
    function update_pressure(cell_data) {

        //This calculates the collective pressure on the X axis by summing the surrounding velocities
        var pressure_x = (
            cell_data.up_left.xv * 0.5 //Divided in half because it's diagonal
            + cell_data.left.xv
            + cell_data.down_left.xv * 0.5 //Same
            - cell_data.up_right.xv * 0.5 //Same
            - cell_data.right.xv
            - cell_data.down_right.xv * 0.5 //Same
        );
        
        //This does the same for the Y axis.
        var pressure_y = (
            cell_data.up_left.yv * 0.5
            + cell_data.up.yv
            + cell_data.up_right.yv * 0.5
            - cell_data.down_left.yv * 0.5
            - cell_data.down.yv
            - cell_data.down_right.yv * 0.5
        );
        
        //This sets the cell pressure to one-fourth the sum of both axis pressure.
        cell_data.pressure = (pressure_x + pressure_y) * 0.25;
    }
    
  
    /*
    This function updates the velocity value for an individual cell using the 
    velocities of neighboring cells.
    */
    function update_velocity(cell_data) {

        /*
        This adds one-fourth of the collective pressure from surrounding cells to the 
        cell's X axis velocity.
        */
        cell_data.xv += (
            cell_data.up_left.pressure * 0.5
            + cell_data.left.pressure
            + cell_data.down_left.pressure * 0.5
            - cell_data.up_right.pressure * 0.5
            - cell_data.right.pressure
            - cell_data.down_right.pressure * 0.5
        ) * 0.25;
        
        //This does the same for the Y axis.
        cell_data.yv += (
            cell_data.up_left.pressure * 0.5
            + cell_data.up.pressure
            + cell_data.up_right.pressure * 0.5
            - cell_data.down_left.pressure * 0.5
            - cell_data.down.pressure
            - cell_data.down_right.pressure * 0.5
        ) * 0.25;
        
        /*
        This slowly decreases the cell's velocity over time so that the fluid stops
        if it's left alone.
        */
        cell_data.xv *= 0.97;
        cell_data.yv *= 0.97;
    }

  
    //This function is used to create a cell object.
    function cell(x, y, res) {

        //This stores the position to place the cell on the canvas
        this.x = x;
        this.y = y;
        
        //This is the width and height of the cell
        this.r = res;

        //These are the attributes that will hold the row and column values
        this.col = 0;
        this.row = 0;
        
        //This stores the cell's velocity
        this.xv = 0;
        this.yv = 0;

        //This is the pressure attribute
        this.pressure = 0;

    }

  
    //This function is used to create a particle object.
    function particle(x, y) {
        this.x = this.px = x;
        this.y = this.py = y;
        this.xv = this.yv = 0;
    }

  
    /*
    This function is called whenever the mouse button is pressed. The event object is passed to 
    this function when it's called.
    */
    function mouse_down_handler(e) {
        e.preventDefault(); //Prevents the default action from happening (e.g. navigation)
        mouse.down = true; //Sets the mouse object's "down" value to true
    }

  
    //This function is called whenever the mouse button is released.    
    function mouse_up_handler() {
        mouse.down = false; 
    }
    
    
    //This function is called whenever a touch is registered.
    function touch_start_handler(e) {
        e.preventDefault(); //Prevents the default action from happening (e.g. navigation)
        var rect = canvas.getBoundingClientRect();
        mouse.x = mouse.px = e.touches[0].pageX - rect.left; //Set both previous and current coordinates
        mouse.y = mouse.py = e.touches[0].pageY - rect.top;
        mouse.down = true; //Sets the mouse object's "down" value to true
    }
  
    //This function is called whenever a touch point is removed from the screen.
    function touch_end_handler(e) {
        if (!e.touches) mouse.down = false; //If there are no more touches on the screen, sets "down" to false.
    }

  
    /*
    This function is called whenever the mouse coordinates have changed. The coordinates are checked by the 
    browser at intervals.
    */
    function mouse_move_handler(e) {
        e.preventDefault(); //Prevents the default action from happening
        //Saves the previous coordinates
        mouse.px = mouse.x;
        mouse.py = mouse.y;

        //Sets the new coordinates
        mouse.x = e.offsetX || e.layerX;
        mouse.y = e.offsetY || e.layerY;
    }

  
    /*
    This function is called whenever one of the coordinates have changed. The coordinates are checked by the 
    browser at intervals.
    */
    function touch_move_handler(e) {
        e.preventDefault(); //Prevents the default action from happening
        mouse.px = mouse.x;
        mouse.py = mouse.y;

        //This line gets the coordinates for where the canvas is positioned on the screen.
        var rect = canvas.getBoundingClientRect();

        /*
        And this sets the mouse coordinates to where the first touch is. Since we're using pageX
        and pageY, we need to subtract the top and left offset of the canvas so the values are correct.
        */
        mouse.x = e.touches[0].pageX - rect.left;
        mouse.y = e.touches[0].pageY - rect.top;
    }

  
    /*
    And this line attaches an object called "Fluid" to the global scope. "window" was passed into
    the self-invoking function as "w", so setting "w.Fluid" adds it to "window".
    */
    w.Fluid = {
        initialize: init
    }

}(window)); //Passes "window" into the self-invoking function.


/*
Request animation frame polyfill. This enables you to use "requestAnimationFrame" 
regardless of the browser the script is running in.
*/
window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;


//And this line calls the init() function defined above to start the script.
Fluid.initialize();
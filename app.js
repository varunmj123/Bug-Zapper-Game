//Initialize Shaders 
var vertexShaderText = [
    'attribute vec3 vertPosition;',
    '',
    'void main() {',
    '	gl_Position = vec4(vertPosition, 1.0);',
    '}'
].join('\n');

var fragmentShaderText = [
    'precision mediump float;',
    'uniform vec4 vertColor;',
    '',
    'void main()',
    '{',
    ' gl_FragColor = vertColor;',
    '}'
].join('\n');

var main = function() {
    //////////////////////////////////
    //       initialize WebGL       //
    //////////////////////////////////

    console.log('this is working');
    // Creating a WebGL Context Canvas
    var canvas = document.getElementById('gameSurface');
    var gl = canvas.getContext('webgl');

    if (!gl) {
        console.log('webgl not supported, falling back on experimental-webgl');
        gl = canvas.getContext('experimental-webgl');
    }
    if (!gl) {
        alert('your browser does not support webgl');
    }
    //canvas.width = window.innerWidth;
    //canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);


    //////////////////////////////////
    // create/compile/link shaders  //
    //////////////////////////////////

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Error compiling vertex shader!', gl.getShaderInfoLog(vertexShader))
        return;
    }
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Error compiling vertex shader!', gl.getShaderInfoLog(fragmentShader))
        return;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error linking program!', gl.getProgramInfo(program));
        return;
    }
    gl.useProgram(program);

    var textCanvas = document.getElementById('text');
    var ctx = textCanvas.getContext('2d')

    var particlesCanvas = document.getElementById('particles');
    var pCtx = particlesCanvas.getContext('2d')

    //////////////////////////////////
    //        create buffer         //
    //////////////////////////////////

    // Create an empty buffer object
    var vertex_buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer)

    // Get the attribute and uniform location
    var coord = gl.getAttribLocation(program, "vertPosition");
    var vertColor = gl.getUniformLocation(program, "vertColor");

    // Point an attribute to the currently bound VBO and enable the attribute
    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);
	gl.enable(gl.DEPTH_TEST);

    //////////////////////////////////
    //        draw circle           //
    //////////////////////////////////
	var r = 0.8;
    var i = 0.5;
    function draw_circle(x, y, r, color) {

        var vertices = [];
        for (let i = 1; i <= 360; i++) {
            var y1 = r * Math.sin(i) + y;
            var x1 = r * Math.cos(i) + x;

            var y2 = r * Math.sin(i + 1) + y;
            var x2 = r * Math.cos(i + 1) + x;

            vertices.push(x);
            vertices.push(y);
            vertices.push(0);

            vertices.push(x1);
            vertices.push(y1);
            vertices.push(0);
            vertices.push(x2);
            vertices.push(y2);
            vertices.push(0);
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.uniform4f(vertColor, color[0], color[1], color[2], color[3]);
        gl.clearColor(0, 1, 0, 0.9);
        gl.drawArrays(gl.TRIANGLES, 0, 360 * 3);
    }
    // ONClick function
	var winKillAmt = 5;
	var bacLeft = winKillAmt;
	var success_clicks = [];
	var missClicks = 0;
    function click(e, canvas) {
        let x = e.clientX;
        let y = e.clientY;
        let start = y;
        let mouse_hit = false;
        let point_increment = 0;
        const rect = e.target.getBoundingClientRect();
        x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
        y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
        for (let i in bacArr) {
            if (object_overlap(x, y, 0, bacArr[i].x, bacArr[i].y, bacArr[i].r)) {
                point_increment = Math.round(1 / bacArr[i].r);
                object_particle_effect(bacArr[i]);
                score += point_increment;
                bacArr[i].destroy(i);			
                mouse_hit = true;
                success_clicks.push({
                    pts: "+" + point_increment,
                    x: e.clientX,
                    y: e.clientY,
                    dY: 0,
                    color: "rgba(200,200,1,"  });  
                break;
            }
        }
        if (!mouse_hit && bacLeft != 0) { 
            missClicks++;
            success_clicks.push({
                pts: -50 - missClicks,
                x: e.clientX,
                y: e.clientY,
                dY: 0,
                color: "rgba(255,0,0,"  });
            score -= (50 + missClicks);
        }
    }
	//////////////////////////////////
    //          math things         //
    //////////////////////////////////

    function object_overlap(x1, y1, r1, x2, y2, r2) {
        var xDist = x2 - x1;
        var yDist = y2 - y1;
        var totDist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));

        if (object_distance(x1, y1, x2, y2) - (r1 + r2) < 0) {
            return true;
        }

        return false;
    }

    // object_distance formula
    function object_distance(x1, y1, x2, y2) {
        var xDist = x2 - x1;
        var yDist = y2 - y1;
        return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
    }
    // Normailize formula
    function normalize(x1, y1, x2, y2) {
        let m = object_distance(x1, y1, x2, y2);
        return [(x2 - x1) / m, (y2 - y1) / m];
    }

	canvas.onmousedown = function(e, canvas) {
        click(e, gameSurface);
    };

    function sign_random(n) {
        if (Math.random() >= 0.5) {
            n = n * -1;
        }
        return n;
    }
	//////////////////////////////////
    //        Particle effect       //
    //////////////////////////////////
	var particles = [];
	var reduVar = 200;
    function object_particle_effect(bac) {
        let xcoord = (bac.x + 2/75 + 1) * 300;
        let ycoord = -1 * (bac.y - 1) * 300- 8	;
        let r = (((bac.x + bac.r) + 2 / 75 + 1) * 300) - xcoord;
        let num = 0;     
        for (let x = 0; x < r; x++) {
            for (let y = 0; y < r; y++) {
                if (num % reduVar == 0) {
                    let ppX = xcoord + x;
                    let ppY = ycoord + y;
                    let npX = xcoord - x;
                    let npY = ycoord - y;
                    let particle = new Particle(ppX, ppY, 5);
                    particles.push(particle);
                    particle = new Particle(npX, npY, 5);
                    particles.push(particle);
                    particle = new Particle(ppX, npY, 5);
                    particles.push(particle);
                    particle = new Particle(npX, ppY, 5);
                    particles.push(particle);
                }
                num++;
            }
        }
    }
	var totBac = 10;
    var bacArr = [];
    var rAngle = 0;
    var XY = [];
	var new_bacteria = 0;	
	//////////////////////////////////
    //        Bacteria class        //
    //////////////////////////////////
    class Bacteria {
        constructor(id) {
            this.id = id;
            this.consuming = [];
        }
        spawn() {
            this.random_data();
            this.circ_point();
            var attempt_number = 0;
            for (var i = 0; i < bacArr.length; i++) {
                if (attempt_number > 500) {
                    break;
                }
                if (object_overlap(this.x, this.y, 0.06, bacArr[i].x, bacArr[i].y, bacArr[i].r)) {
                    this.random_data();
                    this.circ_point();
                    attempt_number++;
                    i = -1;
                }
            }
            this.r = 0.07;
            this.color = [Math.random() * (0.7), Math.random() * (0.7), Math.random() * (0.7), 0.75];
            this.alive = true;
            this.consuming = [];           
        }
        update() {
            if (this.alive) {
                if (this.r > 0.25) {
                    lives_left--;
                    this.destroy(bacArr.indexOf(this));
                } else {
                    this.r += 0.0005;
                    this.color[3] += 0.0005;         
                }
                // Draw
                draw_circle(this.x, this.y, this.r, this.color);
            }
        }
        destroy(index) { 
            bacArr.splice(index, 1);
            if (bacLeft >= totBac) {
                bacArr.push(new Bacteria(new_bacteria));
                bacArr[totBac - 2].spawn();
            }
        }
        random_data() {
            this.angle = Math.random();
            this.spawnRadX = sign_random(0.75);
            this.spawnRadY = sign_random(0.75);

            if (Math.random() >= 0.7) {
                this.trig = "sin";
            } else {
                this.trig = "cos";
            }
        }
        circ_point() {
            var X, Y;
            if (this.trig == "sin") {
                this.x = this.spawnRadX * Math.sin(this.angle);
                this.y = this.spawnRadY * Math.cos(this.angle);
            } else {
                this.x = this.spawnRadX * Math.cos(this.angle);
                this.y = this.spawnRadY * Math.sin(this.angle);
            }
        }
    } 
	//////////////////////////////////
    //        Particle class        //
    //////////////////////////////////
    class Particle {
        constructor(x, y, r, color) {
            this.x = x;
            this.y = y;
            this.r = r + Math.random() * 10;
            this.speed = {
                x: -1 + Math.random() * 2,
                y: -1 + Math.random() * 2
            }
            this.life = 30 + Math.random() * 5;
        }
        draw() {
            if (this.life > 0 && this.r > 0) {
                pCtx.beginPath();
                pCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                pCtx.fillStyle = this.color;
                pCtx.fill();

                this.life--;
                this.r -= 0.25;
                this.x += this.speed.x;
                this.y += this.speed.y;
            }
        }
    } 
	    var score = 0;
		var lives_left = 2;
    for (var i = 0; i < totBac; i++) {
        bacArr.push(new Bacteria(new_bacteria));
        bacArr[i].spawn();
    }
    function win() {
        if (lives_left > 0 && bacLeft <= 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            success_clicks = [];
            particles = [];
            ctx.fillStyle = "rgba(255, 100, 100, 1.0)";
            ctx.fillText("You win!", 300, 300);
            return true;
        }
        return false;
    }
    function lose() {
        if (lives_left <= 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "black";
            ctx.fillText("Game over", 300, 300);
            return true;
        }
        return false;
    }
	//////////////////////////////////
    //        Game Loop             //
    //////////////////////////////////
    function gameLoop() {
        document.getElementById('scoreDisplay').innerHTML = score;
        if (!win() && lives_left > 0) {
            for (let i in bacArr) {
                bacArr[i].update();
                if (lose()) {
                    bacLeft = 0;
                    break;
                }
            }			
            pCtx.clearRect(0, 0, canvas.width, canvas.height);
            for (i in particles) {
                particles[i].draw();
            }
            lose();
        }
        draw_circle(0, 0, 0.8, [0.05, 0.1, 0.05, 0.5]);
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
}
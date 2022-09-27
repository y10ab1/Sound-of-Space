

// how much wiggle-room is allowed when
// matching the color?
let tolerance = 5;

// color to look for (set with mouse click)
let colorToMatch;

let video;

let osc, fft;



function setup() {
    createCanvas(windowWidth, windowHeight);

    // an initial color to look for
    colorToMatch = color(0, 0, 0);

    // webcam capture
    video = createCapture(VIDEO);
    video.size(800, 800);
    video.hide();

    carrier = new p5.Oscillator(); // connects to master output by default
    carrier.start();
    carrier.freq(340);
    carrier.amp(0);
    // carrier's amp is 0 by default, giving our modulator total control


    modulator = new p5.Oscillator('triangle');
    modulator.disconnect();  // disconnect the modulator from master output
    modulator.start();
    modulator.freq(5);
    modulator.amp(0);

    // Modulate the carrier's amplitude with the modulator
    reverb = new p5.Reverb();

    carrier.amp(modulator);
    reverb.process(carrier, 4, 0.2);

    reverb.amp(4); // turn it up!

    // create an fft to analyze the audio
    fft = new p5.FFT();


}


function draw() {
    translate(video.width, 0);
    //then scale it by -1 in the x-axis
    //to flip the image
    scale(-1, 1);
    image(video, 0, 0);
    filter(POSTERIZE, 5);
    // get the first matching pixel
    // in the image
    let firstPx = findColor(video, colorToMatch, tolerance);

    // if we got a result (is not undefined)
    // then draw a circle in that location
    if (firstPx !== undefined) {
        fill(colorToMatch);
        stroke(255);
        strokeWeight(2);
        circle(firstPx.x, firstPx.y, 100);

        let waveform = fft.waveform(); // analyze the waveform
        beginShape();
        fill(colorToMatch[0], colorToMatch[1], colorToMatch[2], 50);
        stroke(3);
        strokeWeight(2);
        for (var i = 0; i < waveform.length; i++) {
            var x = map(i, 0, waveform.length, 0, width);
            var y = map(waveform[i], -1, 1, -height / 2, height / 2);
            vertex(x, y + height / 2);
        }
        endShape();

        colorfreq = colorToMatch[0] + colorToMatch[1] + colorToMatch[2]
        let freq = map(firstPx.x / 2 + colorfreq / 5, 0, width, 40, 880);
        modulator.freq(freq);

        let amp = map(firstPx.y, 0, height, 1, 0.01);
        modulator.amp(amp, 0.01);
    }


}


// use the mouse to select a color to track
function mousePressed() {
    loadPixels();
    colorToMatch = get(mouseX, mouseY);

    // note we use get() here, which is probably
    // ok since it's one pixel – could def do this
    // with pixels[index] too
}


// find the first instance of a color 
// in an image and return the location
function findColor(input, c, tolerance) {

    // if we don't have video yet (ie the sketch
    // just started), then return undefined
    if (input.width === 0 || input.height === 0) {
        return undefined;
    }

    // grab rgb from color to match
    let matchR = c[0];
    let matchG = c[1];
    let matchB = c[2];

    // look for the color!
    // in this case, we look across each row 
    // working our way down the image – depending 
    // on your project, you might want to scan 
    // across instead
    input.loadPixels();

    for (let y = 0; y < input.height; y++) {
        for (let x = 0; x < input.width; x++) {

            // current pixel color
            let index = (y * video.width + x) * 4;
            let r = video.pixels[index];
            let g = video.pixels[index + 1];
            let b = video.pixels[index + 2];

            // if our color detection has no wiggle-room 
            // (either the color matches perfectly or isn't 
            // seen at all) then it won't work very well in 
            // real-world conditions to overcome this, we 
            // check if the rgb values are within a certain 
            // range – if they are, we consider it a match
            if (r >= matchR - tolerance && r <= matchR + tolerance &&
                g >= matchG - tolerance && g <= matchG + tolerance &&
                b >= matchB - tolerance && b <= matchB + tolerance) {

                // send back the x/y location immediately
                // (faster, since we stop the loop)
                return createVector(x, y);
            }
        }
    }

    // if no match was found, return 'undefined'
    return undefined;
}


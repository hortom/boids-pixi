/**
 * This is a Boids simulation, based on Daniel Shiffman's CodingTrain video: https://www.youtube.com/watch?v=mhjuuHl6qHM
 * 
 * It uses:
 *   Pixi.js for rendering (WebGL)
 *   Victor.js for vector calculation
 *   random.js is small random generation by me 
 *   space_subdiv.js is a basic space subdivision library by me
 */

// Global variables - START ====
let DEBUG = true;
let ACCURATE = false; // If this is `false` then we are using `maxNearCount` to reduce calculation.

const width = 1000;
const height = 700;

const flock = [];
const flockPool = [];
// Agent count
let count = 2000;
const maxCount = 10000;
// Maximum number which is used for one agent to steer to. Statistically, it is correct and a good optimisation.
// On a 2016 MacBook Pro, 5000 agents are still 20 FPS.
const maxFlockCount = 100;

// Also good for speed up things, if we reduce the radius, but let leave it at 100.
const perceptionRadius = 100;
const maxForce = 0.2;
const maxSpeed = 4;

let alignSlider, cohesionSlider, separationSlider, countSlider;
let alignValue, cohesionValue, separationValue, countValue;

/**
 * Basic space subdivision - it is helpful above ~500 agent at the start when they are evenly distributed.
 * The 3rd parameter is important to use the right size buckets. So, 9 buckets will have every near agent.
 */
const subdiv = new SubDiv(width, height, perceptionRadius);
// Global variables - END =====

function random(min = 0, max = 1) {
	return Math.random() * max + min;
}


//Create a Pixi Application
const app = new PIXI.Application({
	width: width,
	height: height,
	antialias: true,
	transparent: false,
	resolution: window.devicePixelRatio || 1,
	autoDensity: true,
	backgroundColor: 0x404040
});

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

for (let i = 0; i < maxCount; i++) {
	flockPool.push(new Agent());
}

updateCount(count);

let aSliderValue = 1;
let sSliderValue = 1;
let cSliderValue = 1;

// UI - start =========
createDiv('Alignment:', 'sliderLabel');
alignSlider = createSlider(0, 5, aSliderValue, 0.1, 'slider');
alignSlider.oninput = () => dispaySliderValue(alignSlider, alignValue);
alignValue = createDiv(aSliderValue, 'sliderValue');

createDiv('Cohesion:', 'sliderLabel');
cohesionSlider = createSlider(0, 5, cSliderValue, 0.1, 'slider');
cohesionSlider.oninput = () => dispaySliderValue(cohesionSlider, cohesionValue);
cohesionValue = createDiv(cSliderValue, 'sliderValue');

createDiv('Separation:', 'sliderLabel');
separationSlider = createSlider(0, 5, sSliderValue, 0.1, 'slider');
separationSlider.oninput = () => dispaySliderValue(separationSlider, separationValue);
separationValue = createDiv(sSliderValue, 'sliderValue');

const dbgCheckbox = createCheckbox('Debug', DEBUG, 'checkbox');
dbgCheckbox.changed(() => DEBUG = dbgCheckbox.checked());

const accCheckbox = createCheckbox('Accurate', ACCURATE, 'checkbox');
accCheckbox.changed(() => ACCURATE = accCheckbox.checked());

document.body.appendChild(document.createElement('br'));

createDiv('Agent count:', 'sliderLabel agent');
countSlider = createSlider(100, maxCount, count, 100, 'slider');
countSlider.oninput = () => dispaySliderValue(countSlider, countValue);
countValue = createDiv(count, 'sliderValue');
// UI - end ==========

app.ticker.add(delta => gameLoop(delta));

function dispaySliderValue(slider, val) {
	val.innerHTML = slider.value;

	// update all values
	aSliderValue = parseFloat(alignSlider.value);
	sSliderValue = parseFloat(separationSlider.value);
	cSliderValue = parseFloat(cohesionSlider.value);

	updateCount(parseFloat(countSlider.value));
}

function updateCount(c) {
	if (c === flock.length) return;

	count = c;

	if (flock.length < count) {
		while (flock.length < count) {
			app.stage.addChild(flockPool[flock.length].shape);
			flock.push(flockPool[flock.length]);
		}
	} else {
		while (flock.length > count) {
			app.stage.removeChild(flock.pop().shape);
		}
	}
}

function gameLoop(delta) {
	const deltaV = new Victor(delta, delta);

	flock.forEach(agent => {
		agent.update(deltaV);
	})

	// DEBUG
	subdiv.debugGrid();
	if (DEBUG) {
		subdiv.getNearItems(flock[0], true);
	} 
}

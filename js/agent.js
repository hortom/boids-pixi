class Agent {
	static lineWidth = [1, 2, 1, 1];
	static lineColor = [0xdddddd, 0xffff00, 0xff00ff, 0x00ff00];
	static fillColor = [0, 0, 0, 0];

	static average = new Victor();

	constructor() {
		const angle = random(0, Math.PI * 2);
		const r = random(maxSpeed / 2, maxSpeed);

		this.position = new Victor(random(0, width), random(0, height));
		this.velocity = new Victor(Math.cos(angle) * r, Math.sin(angle) * r);
		this.acceleration = new Victor(0, 0);

		this.isNear = false; // near to the first agent
		
		subdiv.update(this); // update the item in the buckets

		this.show();
	}

	getNearAgents() {
		const as = []; // Agents
		const dsq = []; // Distances
		const r2 = perceptionRadius * perceptionRadius;
		const near = subdiv.getNearItems(this);

		let nearLength = 0;
		near.forEach(a => nearLength += a.length);
		// Limit the max agent which will be used for steering.
		const step = nearLength > maxFlockCount && !ACCURATE ? nearLength / maxFlockCount : 1;

		near.forEach(arr => {
			for (let i = 0; i < arr.length; i += step) {
				const a = arr[Math.floor(i)];
				const d = this.position.distanceSq(a.position);
				if (a !== this && d < r2) {
					as.push(a);
					dsq.push(d);

					a.isNear |= this.debug;
				}
			};
		});	
		
		return [as, dsq];
	}

	limitAvgForce(avg) {
		// set length/mangnitude
		avg.norm();
		avg.x *= maxSpeed;
		avg.y *= maxSpeed;

		avg.subtract(this.velocity);
		// limit
		if (avg.lengthSq() > maxForce * maxForce) {
			avg.norm();
			avg.x *= maxForce;
			avg.y *= maxForce;
		}
	}

	separation(agents, dsq) {
		// Do not create a new vector
		const avg = Agent.average;
		avg.x = avg.y = 0;
		
		if (agents.length == 0) return avg;

		let diff = new Victor();
		
		agents.forEach((a, i) => {
			diff.x = this.position.x - a.position.x;
			diff.y = this.position.y - a.position.y;
			
			if (dsq[i] > 0) {
				diff.x /= dsq[i];
				diff.y /= dsq[i];
			}
			avg.add(diff);
		});

		avg.x /= agents.length;
		avg.y /= agents.length;

		this.limitAvgForce(avg);

		return avg;
	}

	cohesion(agents) {
		// Do not create a new vector
		const avg = Agent.average;
		avg.x = avg.y = 0;
		
		if (agents.length == 0) return avg;

		agents.forEach(a => {
			avg.add(a.position);
		});

		avg.x /= agents.length;
		avg.y /= agents.length;
		avg.subtract(this.position);

		this.limitAvgForce(avg);

		return avg;
	}

	align(agents) {
		// Do not create a new vector
		const avg = Agent.average;
		avg.x = avg.y = 0;
		
		if (agents.length == 0) return avg;

		agents.forEach(a => {
			avg.add(a.velocity);
		});

		avg.x /= agents.length;
		avg.y /= agents.length;

		this.limitAvgForce(avg);

		return avg;
	}

	flocking() {
		const [ agents, distancesSq ] = this.getNearAgents();

		this.acceleration.x = this.acceleration.y = 0;

		const sV = this.separation(agents, distancesSq);
		sV.x *= sSliderValue
		sV.y *= sSliderValue;
		this.acceleration.add(sV);

		const cV = this.cohesion(agents);
		cV.x *= cSliderValue;
		cV.y *= cSliderValue;
		this.acceleration.add(cV);

		const aV = this.align(agents);
		aV.x *= aSliderValue;
		aV.y *= aSliderValue;
		this.acceleration.add(aV);
	}

	update(dv) {
		this.debug = DEBUG && flock[0] === this; // only for the first element

		this.flocking();

		this.position.add(this.velocity);//.clone().multiply(dv));
		// `width` and `height` is from the index.js
		if (this.position.x < 0) this.position.x += width;
		else if (this.position.x >= width) this.position.x -= width;
		if (this.position.y < 0) this.position.y += height;
		else if (this.position.y >= height) this.position.y -= height;

		subdiv.update(this);

		this.velocity.add(this.acceleration);//.clone().multiply(dv));
		// Limit the velocity
		if (this.velocity.lengthSq() > maxSpeed * maxSpeed) {
			this.velocity.norm();
			this.velocity.x *= maxSpeed;
			this.velocity.y *= maxSpeed;
		}

		this.show();

		this.isNear = false;
	}

	show() {
		this.drawShape();

		this.shape.x = this.position.x;
		this.shape.y = this.position.y;
		this.shape.rotation = this.velocity.angle();
	}
	
	drawShape() {
		if (this.shape === undefined) {
			this.shape = new PIXI.Graphics();
			// app.stage.addChild(this.shape);
		}

		const sState = (this.debug ? 1 : 0) + (this.isNear ? 2 : 0);
		if (this.shapeState !== sState) {
			this.shapeState = sState;

			this.shape.clear();
			this.shape.lineStyle(
				Agent.lineWidth[sState],
				Agent.lineColor[sState],
				!this.debug ? 0.5 : 1
			);
			// this.shape.beginFill(0, 0.1);
			this.shape.moveTo(6, 0);
			this.shape.lineTo(-6, -4);
			this.shape.lineTo(-6, 4);
			this.shape.lineTo(6, 0);
			// this.shape.endFill();

			if (this.debug) {
				this.shape.lineStyle(1, 0x00ffff, 1);
				this.shape.drawCircle(0, 0, perceptionRadius);
			}
		}
	}
}


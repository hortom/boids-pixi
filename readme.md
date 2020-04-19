# Boids - Flocking Simulation

This implementation is based on Daniel Shiffman's CodingTrain [video](https://www.youtube.com/watch?v=mhjuuHl6qHM).
  
There are some minor optimisations to get a higher number (1000+) agents to be handled.
* Avoid creating new Vector object if possible.
* Avoid `sqrt` calculation when possible.
* Cache distance values.
* After a certain amount of nearby agent, just 100 (`maxNearCount`) are used to calculate the alignment, cohesion and separation. Statistically, it should be ok.
  
The used [pixi.js](https://www.pixijs.com) is more performant than p5.js but has less built in features. That is why there are a few additional small JS libs in this repo.

[Victor.js](http://victorjs.org) is used for vector implementation.

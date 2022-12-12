# Raycaster Demo using HTML5 Canvas

[Lodev's raycasting tutorial](https://lodev.org/cgtutor/raycasting.html) was referenced **heavily** and helped me understand the maths behind raycasting engines.

This demo is very simple with just textured walls for now. 

TODO:
- floors/ceiling rendering
- lighting? a few ideas
  - lighting value per grid space, affects sprites, walls. light values stored in array. precalculate flood-fill lighting from "light sources"?
  - "real" lighting model based on the dot product of the normal of where the ray hit https://learnopengl.com/Lighting/Basic-Lighting

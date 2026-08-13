import * as THREE from "three";

export const trackPoints = [
  new THREE.Vector3(-14.0, 0.0, 9.6),
  new THREE.Vector3(-9.5, 0.0, 5.5),
  new THREE.Vector3(-6.0, 0.0, 1.0),
  new THREE.Vector3(-2.0, 0.0, -2.0),
  new THREE.Vector3(2.0, 0.0, -5.0),
  new THREE.Vector3(5.5, 0.0, -9.0),
  new THREE.Vector3(7.5, 0.0, -8.0),
  new THREE.Vector3(9.5, 0.0, -11.0),
  new THREE.Vector3(12.0, 0.0, -15.0),
  new THREE.Vector3(9.0, 0.0, -18.0),
  new THREE.Vector3(5.0, 0.0, -16.0),
  new THREE.Vector3(1.0, 0.0, -13.0),
  new THREE.Vector3(-3.0, 0.0, -9.0),
  new THREE.Vector3(-7.0, 0.0, -4.0),
  new THREE.Vector3(-11.0, 0.0, 2.0),
  new THREE.Vector3(-13.0, 0.0, 6.0),
];

export const trackCurve = new THREE.CatmullRomCurve3(trackPoints, true);

// Sample 200 points along the curve for smooth 3D line drawing
export const trackSampled = trackCurve.getPoints(200);

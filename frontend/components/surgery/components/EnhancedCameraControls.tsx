'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, Vector2 } from 'three';

interface EnhancedCameraControlsProps {
  enabled: boolean;
  minDistance?: number;
  maxDistance?: number;
  target?: Vector3;
}

export function EnhancedCameraControls({
  enabled = true,
  minDistance = 2,
  maxDistance = 20,
  target = new Vector3(0, 1, 0)
}: EnhancedCameraControlsProps) {
  const { camera, gl } = useThree();
  const [isPanning, setIsPanning] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [touches, setTouches] = useState<Touch[]>([]);
  const lastTouchDistance = useRef<number>(0);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const cameraTarget = useRef(target.clone());
  const cameraDistance = useRef(8);
  const cameraRotation = useRef({ theta: Math.PI / 4, phi: Math.PI / 3 });

  // Update camera position based on spherical coordinates
  const updateCameraPosition = () => {
    const { theta, phi } = cameraRotation.current;
    const distance = cameraDistance.current;

    camera.position.x = cameraTarget.current.x + distance * Math.sin(phi) * Math.cos(theta);
    camera.position.y = cameraTarget.current.y + distance * Math.cos(phi);
    camera.position.z = cameraTarget.current.z + distance * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(cameraTarget.current);
  };

  // Handle mouse events
  useEffect(() => {
    if (!enabled) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click for rotation
        setIsRotating(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      } else if (e.button === 2) { // Right click for panning
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;

      if (isRotating) {
        // Rotate camera around target
        cameraRotation.current.theta -= deltaX * 0.005;
        cameraRotation.current.phi -= deltaY * 0.005;
        
        // Clamp phi to prevent flipping
        cameraRotation.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraRotation.current.phi));
        
        updateCameraPosition();
      } else if (isPanning) {
        // Pan camera
        const right = new Vector3();
        const up = new Vector3(0, 1, 0);
        camera.getWorldDirection(right);
        right.cross(up).normalize();
        up.copy(camera.up);

        const panSpeed = 0.005 * cameraDistance.current;
        cameraTarget.current.add(right.multiplyScalar(-deltaX * panSpeed));
        cameraTarget.current.add(up.multiplyScalar(deltaY * panSpeed));
        
        updateCameraPosition();
      }

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsRotating(false);
      setIsPanning(false);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Zoom in/out
      const zoomSpeed = 0.1;
      cameraDistance.current += e.deltaY * zoomSpeed * 0.01;
      cameraDistance.current = Math.max(minDistance, Math.min(maxDistance, cameraDistance.current));
      
      updateCameraPosition();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    gl.domElement.addEventListener('mousedown', handleMouseDown);
    gl.domElement.addEventListener('mousemove', handleMouseMove);
    gl.domElement.addEventListener('mouseup', handleMouseUp);
    gl.domElement.addEventListener('wheel', handleWheel, { passive: false });
    gl.domElement.addEventListener('contextmenu', handleContextMenu);

    return () => {
      gl.domElement.removeEventListener('mousedown', handleMouseDown);
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
      gl.domElement.removeEventListener('mouseup', handleMouseUp);
      gl.domElement.removeEventListener('wheel', handleWheel);
      gl.domElement.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [enabled, camera, gl, isRotating, isPanning, minDistance, maxDistance]);

  // Handle touch events for mobile
  useEffect(() => {
    if (!enabled) return;

    const getTouchDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touch1: Touch, touch2: Touch) => {
      return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touchArray = Array.from(e.touches);
      setTouches(touchArray);

      if (touchArray.length === 2) {
        // Two-finger touch: prepare for pinch zoom and pan
        lastTouchDistance.current = getTouchDistance(touchArray[0], touchArray[1]);
        const center = getTouchCenter(touchArray[0], touchArray[1]);
        lastMousePos.current = center;
        setIsPanning(true);
      } else if (touchArray.length === 1) {
        // Single touch: rotation
        lastMousePos.current = { x: touchArray[0].clientX, y: touchArray[0].clientY };
        setIsRotating(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touchArray = Array.from(e.touches);

      if (touchArray.length === 2) {
        // Two-finger gesture
        const currentDistance = getTouchDistance(touchArray[0], touchArray[1]);
        const center = getTouchCenter(touchArray[0], touchArray[1]);

        // Pinch to zoom
        if (lastTouchDistance.current > 0) {
          const distanceDelta = currentDistance - lastTouchDistance.current;
          const zoomSpeed = 0.02;
          cameraDistance.current -= distanceDelta * zoomSpeed;
          cameraDistance.current = Math.max(minDistance, Math.min(maxDistance, cameraDistance.current));
        }
        lastTouchDistance.current = currentDistance;

        // Pan with two fingers
        const deltaX = center.x - lastMousePos.current.x;
        const deltaY = center.y - lastMousePos.current.y;

        const right = new Vector3();
        const up = new Vector3(0, 1, 0);
        camera.getWorldDirection(right);
        right.cross(up).normalize();
        up.copy(camera.up);

        const panSpeed = 0.005 * cameraDistance.current;
        cameraTarget.current.add(right.multiplyScalar(-deltaX * panSpeed));
        cameraTarget.current.add(up.multiplyScalar(deltaY * panSpeed));

        lastMousePos.current = center;
        updateCameraPosition();
      } else if (touchArray.length === 1 && isRotating) {
        // Single finger rotation
        const deltaX = touchArray[0].clientX - lastMousePos.current.x;
        const deltaY = touchArray[0].clientY - lastMousePos.current.y;

        cameraRotation.current.theta -= deltaX * 0.005;
        cameraRotation.current.phi -= deltaY * 0.005;
        cameraRotation.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraRotation.current.phi));

        lastMousePos.current = { x: touchArray[0].clientX, y: touchArray[0].clientY };
        updateCameraPosition();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchArray = Array.from(e.touches);
      setTouches(touchArray);

      if (touchArray.length < 2) {
        setIsPanning(false);
        lastTouchDistance.current = 0;
      }

      if (touchArray.length === 0) {
        setIsRotating(false);
      }
    };

    gl.domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    gl.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    gl.domElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      gl.domElement.removeEventListener('touchstart', handleTouchStart);
      gl.domElement.removeEventListener('touchmove', handleTouchMove);
      gl.domElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, camera, gl, isRotating, minDistance, maxDistance]);

  // Update camera each frame
  useFrame(() => {
    if (enabled) {
      camera.lookAt(cameraTarget.current);
    }
  });

  return null;
}

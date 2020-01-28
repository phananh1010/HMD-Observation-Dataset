// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* global mat4, WGLUProgram */

/*
TODO: create 1 cube, rotate that cube around. Speed very low, let user focus on that cube
*/
window.VRCubeIsland = (function () {
  "use strict";

  var cubeIslandVS = [
    "uniform mat4 projectionMat;",
    "uniform mat4 modelViewMat;",
    "attribute vec3 position;",
    "attribute vec2 texCoord;",
    "attribute vec3 normal;",
    "varying vec2 vTexCoord;",
    "varying vec3 vLight;",

    "const vec3 lightDir = vec3(0.75, 0.5, 1.0);",
    "const vec3 ambientColor = vec3(0.5, 0.5, 0.5);",
    "const vec3 lightColor = vec3(0.75, 0.75, 0.75);",

    "void main() {",
    "  float lightFactor = max(dot(normalize(lightDir), normal), 0.0);",
    "  vLight = ambientColor + (lightColor * lightFactor);",
    "  vTexCoord = texCoord;",
    "  gl_Position = projectionMat * modelViewMat * vec4( position, 1.0 );",
    "}",
  ].join("\n");

  var cubeIslandFS = [
    "precision mediump float;",
    "uniform sampler2D diffuse;",
    "varying vec2 vTexCoord;",
    "varying vec3 vLight;",

    "void main() {",
    "  gl_FragColor = vec4(vLight, 1.0) * texture2D(diffuse, vTexCoord);",
    "}",
  ].join("\n");

  var CubeIsland = function (gl, texture, width, depth) {
    this.gl = gl;

    this.statsMat = mat4.create();
    //Attributes for rotation cubes
    this.normalMat = mat3.create();        //normal matrix?
    this.heroRotationMat = mat4.create();  //apply rotation to model
    this.heroModelViewMat = mat4.create(); //model view is a list of vertices?
    this.autoRotationMat = mat4.create();  // what is the differences between autoRotMat & heroRotMat?
    this.cubesModelViewMat = mat4.create();//view matrix (camera coordinate)
    this.autorotate = false;  
    

    this.texture = texture;

    this.program = new WGLUProgram(gl);
    this.program.attachShaderSource(cubeIslandVS, gl.VERTEX_SHADER);
    this.program.attachShaderSource(cubeIslandFS, gl.FRAGMENT_SHADER);
    this.program.bindAttribLocation({
      position: 0,
      texCoord: 1,
      normal: 2
    });
    this.program.link();

    this.vertBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();

    this.resize(width, depth);
      
    
  };

  CubeIsland.prototype.resize = function (width, depth) {
    var gl = this.gl;

    this.width = width;
    this.depth = depth;

    var cubeVerts = [];
    var cubeIndices = [];

    // Build a single box.
    function appendBox (left, bottom, back, right, top, front) {
      // Bottom
      var idx = cubeVerts.length / 8.0;
      cubeIndices.push(idx, idx + 1, idx + 2);
      cubeIndices.push(idx, idx + 2, idx + 3);

      cubeVerts.push(left, bottom, back, 0.0, 1.0, 0.0, -1.0, 0.0);
      cubeVerts.push(right, bottom, back, 1.0, 1.0, 0.0, -1.0, 0.0);
      cubeVerts.push(right, bottom, front, 1.0, 0.0, 0.0, -1.0, 0.0);
      cubeVerts.push(left, bottom, front, 0.0, 0.0, 0.0, -1.0, 0.0);

      // Top
      idx = cubeVerts.length / 8.0;
      cubeIndices.push(idx, idx + 2, idx + 1);
      cubeIndices.push(idx, idx + 3, idx + 2);

      cubeVerts.push(left, top, back, 0.0, 0.0, 0.0, 1.0, 0.0);
      cubeVerts.push(right, top, back, 1.0, 0.0, 0.0, 1.0, 0.0);
      cubeVerts.push(right, top, front, 1.0, 1.0, 0.0, 1.0, 0.0);
      cubeVerts.push(left, top, front, 0.0, 1.0, 0.0, 1.0, 0.0);

      // Left
      idx = cubeVerts.length / 8.0;
      cubeIndices.push(idx, idx + 2, idx + 1);
      cubeIndices.push(idx, idx + 3, idx + 2);

      cubeVerts.push(left, bottom, back, 0.0, 1.0, -1.0, 0.0, 0.0);
      cubeVerts.push(left, top, back, 0.0, 0.0, -1.0, 0.0, 0.0);
      cubeVerts.push(left, top, front, 1.0, 0.0, -1.0, 0.0, 0.0);
      cubeVerts.push(left, bottom, front, 1.0, 1.0, -1.0, 0.0, 0.0);

      // Right
      idx = cubeVerts.length / 8.0;
      cubeIndices.push(idx, idx + 1, idx + 2);
      cubeIndices.push(idx, idx + 2, idx + 3);

      cubeVerts.push(right, bottom, back, 1.0, 1.0, 1.0, 0.0, 0.0);
      cubeVerts.push(right, top, back, 1.0, 0.0, 1.0, 0.0, 0.0);
      cubeVerts.push(right, top, front, 0.0, 0.0, 1.0, 0.0, 0.0);
      cubeVerts.push(right, bottom, front, 0.0, 1.0, 1.0, 0.0, 0.0);

      // Back
      idx = cubeVerts.length / 8.0;
      cubeIndices.push(idx, idx + 2, idx + 1);
      cubeIndices.push(idx, idx + 3, idx + 2);

      cubeVerts.push(left, bottom, back, 1.0, 1.0, 0.0, 0.0, -1.0);
      cubeVerts.push(right, bottom, back, 0.0, 1.0, 0.0, 0.0, -1.0);
      cubeVerts.push(right, top, back, 0.0, 0.0, 0.0, 0.0, -1.0);
      cubeVerts.push(left, top, back, 1.0, 0.0, 0.0, 0.0, -1.0);

      // Front
      idx = cubeVerts.length / 8.0;
      cubeIndices.push(idx, idx + 1, idx + 2);
      cubeIndices.push(idx, idx + 2, idx + 3);

      cubeVerts.push(left, bottom, front, 0.0, 1.0, 0.0, 0.0, 1.0);
      cubeVerts.push(right, bottom, front, 1.0, 1.0, 0.0, 0.0, 1.0);
      cubeVerts.push(right, top, front, 1.0, 0.0, 0.0, 0.0, 1.0);
      cubeVerts.push(left, top, front, 0.0, 0.0, 0.0, 0.0, 1.0);
    }

    // Appends a cube with the given centerpoint and size.
    function appendCube (x, y, z, size) {
      var halfSize = size * 0.5;
      appendBox(x - halfSize, y - halfSize, z - halfSize,
                x + halfSize, y + halfSize, z + halfSize);
    }

    // Main "island", covers where the user can safely stand. Top of the cube
    // (the ground the user stands on) should be at Y=0 to align with users
    // floor. X=0 and Z=0 should be at the center of the users play space.
    appendBox(-width * 0.5, -width, -depth * 0.5, width * 0.5, 0, depth * 0.5);

    // A sprinkling of other cubes to make things more visually interesting.
    appendCube(1.1, 0.3, (-depth * 0.5) - 0.8, 0.5);
    appendCube(-0.5, 1.0, (-depth * 0.5) - 0.9, 0.75);
    appendCube(0.6, 1.5, (-depth * 0.5) - 0.6, 0.4);
    appendCube(-1.0, 0.5, (-depth * 0.5) - 0.5, 0.2);

    appendCube((-width * 0.5) - 0.8, 0.3, -1.1, 0.5);
    appendCube((-width * 0.5) - 0.9, 1.0, 0.5, 0.75);
    appendCube((-width * 0.5) - 0.6, 1.5, -0.6, 0.4);
    appendCube((-width * 0.5) - 0.5, 0.5, 1.0, 0.2);

    appendCube((width * 0.5) + 0.8, 0.3, 1.1, 0.5);
    appendCube((width * 0.5) + 0.9, 1.0, -0.5, 0.75);
    appendCube((width * 0.5) + 0.6, 1.5, 0.6, 0.4);
    appendCube((width * 0.5) + 0.5, 0.5, -1.0, 0.2);

    appendCube(1.1, 1.4, (depth * 0.5) + 0.8, 0.5);
    appendCube(-0.5, 1.0, (depth * 0.5) + 0.9, 0.75);
    appendCube(0.6, 0.4, (depth * 0.5) + 0.6, 0.4);
      
    this.indexCount = cubeIndices.length;
    
    this.heroOffset = cubeIndices.length;  
    var heroSIZE = 0.01;
    var heroY    = -0.25;
    appendCube(0,    heroY, -0.8, heroSIZE);
    this.heroCount = cubeIndices.length - this.heroOffset;


    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVerts), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);



  };

  CubeIsland.prototype.render = function (projectionMat, modelViewMat, stats, timestamp) {
    var gl = this.gl;
    var program = this.program;

    program.use();
    
    if (this.autorotate && timestamp) {
        mat4.fromRotation(this.autoRotationMat, timestamp / 500, [0, -1, 0]);//create rotation matrix, rad=time/500, axis=[0,-1,0]
        //mat4.multiply(this.heroModelViewMat, modelViewMat, this.heroRotationMat);//rotat model view?
        mat4.multiply(this.cubesModelViewMat, modelViewMat, this.autoRotationMat);
        mat3.fromMat4(this.normalMat, this.autoRotationMat); //why normal mat is a upper left of autorotation, what for?
    }
    else {
      this.cubesModelViewMat = modelViewMat;
      mat3.identity(this.normalMat);             //why we need a normalMat & cubeModelViewMat
    }
      

    gl.uniformMatrix4fv(program.uniform.projectionMat, false, projectionMat);
    //gl.uniformMatrix4fv(program.uniform.modelViewMat, false, modelViewMat);
    gl.uniformMatrix4fv(program.uniform.modelViewMat, false, this.cubesModelViewMat);
    gl.uniformMatrix3fv(program.uniform.normalMat, false, this.normalMat);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    gl.enableVertexAttribArray(program.attrib.position);
    gl.enableVertexAttribArray(program.attrib.texCoord);
    gl.enableVertexAttribArray(program.attrib.normal);

    gl.vertexAttribPointer(program.attrib.position, 3, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(program.attrib.texCoord, 2, gl.FLOAT, false, 32, 12);
    gl.vertexAttribPointer(program.attrib.normal, 3, gl.FLOAT, false, 32, 20);


    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(this.program.uniform.diffuse, 0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
      
    if (timestamp) {
      mat4.fromRotation(this.heroRotationMat, timestamp / 8000, [0, 1, 0]);
      mat4.multiply(this.heroModelViewMat, modelViewMat, this.heroRotationMat);
      gl.uniformMatrix4fv(program.uniform.modelViewMat, false, this.heroModelViewMat);

      // We know that the additional model matrix is a pure rotation,
      // so we can just use the non-position parts of the matrix
      // directly, this is cheaper than the transpose+inverse that
      // normalFromMat4 would do.
      mat3.fromMat4(this.normalMat, this.heroRotationMat);
      gl.uniformMatrix3fv(program.uniform.normalMat, false, this.normalMat);
      gl.drawElements(gl.TRIANGLES, this.heroCount, gl.UNSIGNED_SHORT, this.heroOffset * 2);
    }

    if (stats) {
      // To ensure that the FPS counter is visible in VR mode we have to
      // render it as part of the scene.
      mat4.fromTranslation(this.statsMat, [0, 1.5, -this.depth * 0.5]);
      mat4.scale(this.statsMat, this.statsMat, [0.5, 0.5, 0.5]);
      mat4.rotateX(this.statsMat, this.statsMat, -0.75);
      mat4.multiply(this.statsMat, modelViewMat, this.statsMat);
      stats.render(projectionMat, this.statsMat);
    }
  };

  return CubeIsland;
})();

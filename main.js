const vertStr = `
attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

varying highp vec3 vLighting;
  
void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

  highp vec3 ambientLight = vec3(0.6, 0.6, 0.6);
  highp vec3 directionalLightColor = vec3(0.5, 0.5, 0.75);
  highp vec3 directionalVector = vec3(0.0, 0.0, 0.75);

  highp vec4 transformedNormal = uNMatrix * vec4(normalize(aVertexNormal), 1.0);

  highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
  vLighting = ambientLight + (directionalLightColor * directional);
}`;

const fragStr = `
varying highp vec3 vLighting;

void main(void) {
  gl_FragColor = vec4(vLighting, 1.0);
}`;

let canvas;
let gl;

let needsRender = false;

let vertCount = null;

let taskMeshes = [];


class Vector3 {
  constructor(obj) {
    if (obj) {
      this.x = obj.x;
      this.y = obj.y;
      this.z = obj.z;
    } else {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }
  }

  clone() {
    return new Vector3({
      x: this.x,
      y: this.y,
      z: this.z
    });
  }

  add(other) {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;

    return this;
  }

  multiplyScalar(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;

    return this;
  }
}


function loadCell() {
  let cellMin = new Vector3(tasks.root.min);
  let cellMax = new Vector3(tasks.root.min);

  let cellCenter = cellMax.clone().add(cellMin).multiplyScalar(1/2);

  function getMeshData(url, offset) {
    return fetch(url)
      .then((res) => {
        if (res.status >= 400) {
          throw "404";
        }
        return res.arrayBuffer();
      }).then((res) => {
        let data = new Float32Array(res);

        for (let i = 0; i < data.length; i+=6) {
          data[i+0] = (data[i+0] / 2 + offset.x - cellCenter.x) / 256;
          data[i+1] = (data[i+1] / 2 + offset.y - cellCenter.y) / 256;
          data[i+2] = (data[i+2] / 2 + offset.z - cellCenter.z) / 256;
        }

        return data;
      });
  }


  function loadMeshData(data) {
    let buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    taskMeshes.push({
      vertCount: data.length / 6,
      buffer: buffer,
      inGPU: true,
    });

    console.log('loaded mesh!');
  }

  const baseURL = 'https://storage.googleapis.com/overview_meshes/meshes/143/';

  // tasks.tasks = tasks.tasks.slice(0, 10);

  for (let task of tasks.tasks) {
    getMeshData(`${baseURL}${task.id}/3.dstrip`, task.bounds.min)
      .then((data) => {
        loadMeshData(data);
        needsRender = true;
      });
  }
}

function start() {
  canvas = document.getElementById("glcanvas");

  initWebGL(canvas);      // Initialize the GL context
  // Only continue if WebGL is available and working

  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    gl.disable(gl.CULL_FACE);

    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.

    initShaders();

    let USAGE_TYPE = gl.STATIC_READ;

    bigBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bigBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 128 * 1024 * 1024, USAGE_TYPE);

    function renderLoop () {
      if (needsRender) {
        needsRender = false;
        drawScene();
      }
      requestAnimationFrame(renderLoop);
    }
    renderLoop();

    loadCell();
  }
}

function initWebGL() {
  gl = canvas.getContext('webgl2', {
    alpha: false
  });
}

let vertexPositionAttribute;
let vertexNormalAttribute;

function initShaders() {
  let vertexShader = getShader(gl, vertStr, gl.VERTEX_SHADER);
  let fragmentShader = getShader(gl, fragStr, gl.FRAGMENT_SHADER);
  
  // Create the shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shader));
  }

  gl.useProgram(shaderProgram);

  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  
  gl.enableVertexAttribArray(vertexPositionAttribute);
  gl.enableVertexAttribArray(vertexNormalAttribute);
}

function getShader(gl, str, type) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

function drawScene() {
  // Clear the canvas before we start drawing on it.
  // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); not needed because we don't preserve drawing buffer?



  mat4.perspective(pMatrix, 45, 640.0 / 480.0, 0.1, 100.0);

  mat4.identity(mvMatrix);
  mat4.translate(mvMatrix, mvMatrix, [-0.0, 0.0, -zoom / 100]);
  mat4.rotateY(mvMatrix, mvMatrix, rotation);

  mat4.invert(nMatrix, mvMatrix);
  mat4.transpose(nMatrix, nMatrix);

  setMatrixUniforms();



  let totalVertCount = 0;
  // let memory = 0;

  for (let {vertCount, buffer} of taskMeshes) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(vertexNormalAttribute, 3, gl.FLOAT, false, 24, 12);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertCount);
    totalVertCount += vertCount;
  }

  window.RENDER_STATS.VC = totalVertCount;
  window.RENDER_STATS.MEMORY = (totalVertCount * 4 * 6) / (1024 * 1024);

  document.getElementById('memory').innerHTML = window.RENDER_STATS.MEMORY;
}

window.RENDER_STATS = {
  VC: 0,
  MEMORY: 0
};

let mvMatrix = mat4.create();
let pMatrix = mat4.create();
let nMatrix = mat4.create();

function setMatrixUniforms() {
  // var start1 = Date.now();
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, pMatrix);

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, mvMatrix);

  var nUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  gl.uniformMatrix4fv(nUniform, false, nMatrix);
}





let zoom = 2000;
let rotation = 0;

window.addEventListener('wheel', (e) => {
  e.preventDefault();

  zoom = Math.max(0, zoom - e.deltaY);

  needsRender = true;
});

window.addEventListener('mousemove', (e) => {
  e.preventDefault();

  if (e.buttons === 1) {
    rotation += e.movementX / 100;
    needsRender = true;
  } 
});

window.addEventListener('keypress', (e) => {
  console.log('key', e.key);
});

let canvas = document.createElement('canvas');

let gl = canvas.getContext('webgl2');

let buffer = null;


const BUFFER_LENGTH = 1024 * 1024 * 256;

const MOVE_LENGTH = 1024 * 1024 * 80;

let arr = new Uint8Array(BUFFER_LENGTH);

for (let i = 0; i < arr.length; i++) {
	arr[i] = i;
}

let otherMesh = new Uint8Array(1024 * 1024 * 10);

const otherMeshOffset = 1024 * 1024 * 100;

for (let i = 0; i < otherMesh.length; i++) {
	otherMesh[i] = i;
}

function sendOtherMesh() {
	let start = Date.now();
	gl.bufferSubData(gl.ARRAY_BUFFER, otherMeshOffset, otherMesh, 0, otherMesh.byteLength);
	let mp1 = Date.now();
	gl.getBufferSubData(gl.ARRAY_BUFFER, otherMeshOffset, otherMesh, 0, otherMesh.byteLength);
	console.log('OM', mp1 - start, Date.now() - mp1);
}

// var meshes = [];

function newMesh() {
	let mesh = new Uint8Array(1024 * 1024 * 10);

	let start = Date.now();

	let offset = Math.floor(Math.random() * 200) * 1024 * 1024;

	gl.bufferSubData(gl.ARRAY_BUFFER, offset, mesh, 0, mesh.byteLength);
	let mp1 = Date.now();
	gl.getBufferSubData(gl.ARRAY_BUFFER, offset, mesh, 0, mesh.byteLength);
	console.log('NM', offset / (1024 * 1024), mp1 - start, Date.now() - mp1);
}


const USAGE_TYPE = gl.STATIC_READ; // These are questions that can only be answered with careful profiling. And even then, the answer will only be accurate for that particular driver version from that particular hardware vendor.
// I DON'T SEE A LOT OF DIFFERENCE BETWEEN THE WEBGL2 OPTIONS 

buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, BUFFER_LENGTH, USAGE_TYPE);

// setInterval(() => {
// 	let start = Date.now();
// 	gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr, 0, MOVE_LENGTH);
// 	let mp1 = Date.now();
// 	gl.getBufferSubData(gl.ARRAY_BUFFER, 0, arr, 0, MOVE_LENGTH);
// 	console.log('gpu time', mp1 - start, Date.now() - mp1);
// }, 1000);


// function sendToGPU() {
	
// 	gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_READ);
// 	arr = null;
// }

// sendToGPU();

// function readFromGPU() {
// 	let start = Date.now();
// 	// gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
// 	arr = new Uint8Array(ARRAY_LENGTH);
// 	gl.getBufferSubData(gl.ARRAY_BUFFER, 0, arr);
// 	console.log('gpu read time', Date.now() - start);

// 	// gl.deleteBuffer(buffer);

// 	return arr;
// }
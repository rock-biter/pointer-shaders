import { EffectComposer, RenderPass, ShaderPass } from 'postprocessing'
import './style.css'
import * as THREE from 'three'
// __controls_import__
// __gui_import__

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Pane } from 'tweakpane'
import shardVertex from './shaders/shard/vertex.glsl'
import shardFragment from './shaders/shard/fragment.glsl'
import trailVertex from './shaders/trail/vertex.glsl'
import trailFragment from './shaders/trail/fragment.glsl'

/**
 * Debug
 */
// __gui__
const config = {
	size: 12,
	shardStep: 12,
	color: new THREE.Color(0.45, 0.45, 0.45),
	color2: new THREE.Color(0xff5307),
	color3: new THREE.Color(0x7e8bff),
	noiseScale: 30,
	edge1: 0.33,
	edge2: 0.66,
}
const pane = new Pane()

pane
	.addBinding(config, 'size', {
		min: 1,
		max: 50,
		step: 1,
	})
	.on('change', (ev) => {
		shardMaterial.uniforms.uSize.value = ev.value
	})

pane
	.addBinding(config, 'shardStep', {
		min: 4,
		max: 36,
		step: 1,
	})
	.on('change', (ev) => {
		shardMaterial.uniforms.uShardStep.value = ev.value
	})

pane.addBinding(config, 'color', {
	color: { type: 'float' },
})

pane.addBinding(config, 'color2', {
	color: { type: 'float' },
})

pane.addBinding(config, 'color3', {
	color: { type: 'float' },
})

pane
	.addBinding(config, 'noiseScale', {
		min: 1,
		max: 100,
		step: 0.1,
	})
	.on('change', (ev) => {
		shardMaterial.uniforms.uNoiseScale.value = ev.value
	})

pane
	.addBinding(config, 'edge1', {
		min: 0,
		max: 1,
		step: 0.01,
	})
	.on('change', (ev) => {
		shardMaterial.uniforms.uEdge1.value = ev.value
	})

pane
	.addBinding(config, 'edge2', {
		min: 0,
		max: 1,
		step: 0.01,
	})
	.on('change', (ev) => {
		shardMaterial.uniforms.uEdge2.value = ev.value
	})

/**
 * Scene
 */
const scene = new THREE.Scene()
// scene.background = new THREE.Color(0xdedede)

// __box__
/**
 * BOX
 */
// const material = new THREE.MeshNormalMaterial()
const material = new THREE.MeshStandardMaterial({ color: 'coral' })
const geometry = new THREE.TorusKnotGeometry(1.5, 0.6, 128, 32)
const mesh = new THREE.Mesh(geometry, material)
// mesh.position.y += 0.5
scene.add(mesh)

/**
 * render sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}

/**
 * Camera
 */
const fov = 60
const camera = new THREE.PerspectiveCamera(fov, sizes.width / sizes.height, 0.1)
camera.position.set(0, 0, 6)
camera.lookAt(new THREE.Vector3(0, 2.5, 0))

/**
 * Show the axes of coordinates system
 */
// __helper_axes__
// const axesHelper = new THREE.AxesHelper(3)
// scene.add(axesHelper)

/**
 * renderer
 */
const renderer = new THREE.WebGLRenderer({
	antialias: window.devicePixelRatio < 2,
})
document.body.appendChild(renderer.domElement)

const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)

composer.addPass(renderPass)

/**
 * Basic Shard pass
 */
const shardMaterial = new THREE.ShaderMaterial({
	vertexShader: shardVertex,
	fragmentShader: shardFragment,
	uniforms: {
		tDiffuse: new THREE.Uniform(),
		tTrail: new THREE.Uniform(),
		uSize: new THREE.Uniform(config.size),
		uResolution: new THREE.Uniform(
			new THREE.Vector2(sizes.width, sizes.height)
		),
		uShardStep: new THREE.Uniform(config.shardStep),
		uColor: new THREE.Uniform(config.color),
		uColor2: new THREE.Uniform(config.color2),
		uColor3: new THREE.Uniform(config.color3),
		uNoiseScale: new THREE.Uniform(config.noiseScale),
		uEdge1: new THREE.Uniform(config.edge1),
		uEdge2: new THREE.Uniform(config.edge2),
	},
	transparent: true,
})

const shardPass = new ShaderPass(shardMaterial, 'tDiffuse')
composer.addPass(shardPass)

/**
 * Cursor trail
 */

const sceneTrail = new THREE.Scene()

const triangleGeometry = new THREE.BufferGeometry()
triangleGeometry.setAttribute(
	'position',
	new THREE.BufferAttribute(
		new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]),
		3
	)
)
triangleGeometry.setAttribute(
	'uv',
	new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2)
)

const trailMaterial = new THREE.ShaderMaterial({
	vertexShader: trailVertex,
	fragmentShader: trailFragment,
	uniforms: {
		uResolution: new THREE.Uniform(
			new THREE.Vector2(sizes.width * 0.25, sizes.height * 0.25)
		),
		uMap: new THREE.Uniform(),
		uPointer: new THREE.Uniform(new THREE.Vector2(0, 0)),
		uDt: new THREE.Uniform(0.0),
		uSpeed: new THREE.Uniform(0),
		uTime: new THREE.Uniform(0),
	},
})
const trailMesh = new THREE.Mesh(triangleGeometry, trailMaterial)
sceneTrail.add(trailMesh)

const pointer = new THREE.Vector2()
window.addEventListener('pointermove', (ev) => {
	pointer.x = (ev.clientX / sizes.width) * 2 - 1
	pointer.y = -(ev.clientY / sizes.height) * 2 + 1
})

let trailScaleRes = 0.25

function createRenderTarget() {
	return new THREE.WebGLRenderTarget(
		sizes.width * trailScaleRes,
		sizes.height * trailScaleRes,
		{
			type: THREE.HalfFloatType,
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			depthBuffer: false,
		}
	)
}

let rt1 = createRenderTarget()
let rt2 = createRenderTarget()

let inputRT = rt1
let outputRT = rt2

handleResize()

/**
 * OrbitControls
 */
// __controls__
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
const directionalLight = new THREE.DirectionalLight(0xffffff, 4.5)
directionalLight.position.set(3, 10, 7)
scene.add(directionalLight)

/**
 * Three js Clock
 */
// __clock__
const clock = new THREE.Clock()
let time = 0

/**
 * frame loop
 */
function tic() {
	/**
	 * tempo trascorso dal frame precedente
	 */
	const dt = clock.getDelta()
	time += dt
	/**
	 * tempo totale trascorso dall'inizio
	 */
	// const time = clock.getElapsedTime()

	// __controls_update__
	controls.update(dt)

	trailMaterial.uniforms.uTime.value = time
	const prevPointer = trailMaterial.uniforms.uPointer.value

	trailMaterial.uniforms.uSpeed.value = THREE.MathUtils.lerp(
		trailMaterial.uniforms.uSpeed.value,
		Math.sqrt(
			(pointer.x - prevPointer.x) ** 2 + (pointer.y - prevPointer.y) ** 2
		),
		dt * 3
	)

	trailMaterial.uniforms.uPointer.value.lerp(pointer, dt * 15)
	trailMaterial.uniforms.uDt.value = dt

	renderer.setRenderTarget(outputRT)
	renderer.render(sceneTrail, camera)

	renderer.setRenderTarget(null)

	shardMaterial.uniforms.tTrail.value = outputRT.texture
	trailMaterial.uniforms.uMap.value = outputRT.texture

	// renderer.render(scene, camera)
	composer.render()

	const temp = inputRT
	inputRT = outputRT
	outputRT = temp

	requestAnimationFrame(tic)
}

requestAnimationFrame(tic)

window.addEventListener('resize', handleResize)

function handleResize() {
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	camera.aspect = sizes.width / sizes.height

	// camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix()

	renderer.setSize(sizes.width, sizes.height)

	const pixelRatio = Math.min(window.devicePixelRatio, 2)
	renderer.setPixelRatio(pixelRatio)

	const res = new THREE.Vector2()
	renderer.getDrawingBufferSize(res)
	composer.setSize(res.x, res.y)
	shardMaterial.uniforms.uResolution.value = res
	trailMaterial.uniforms.uResolution.value.set(
		res.x * trailScaleRes,
		res.y * trailScaleRes
	)

	rt1.setSize(res.x * trailScaleRes, res.y * trailScaleRes)
	rt2.setSize(res.x * trailScaleRes, res.y * trailScaleRes)
}

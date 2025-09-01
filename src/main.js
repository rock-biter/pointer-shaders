import { EffectComposer, RenderPass, ShaderPass } from 'postprocessing'
import './style.css'
import * as THREE from 'three'
// __controls_import__
// __gui_import__

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Pane } from 'tweakpane'
import shardVertex from './shaders/shard/vertex.glsl'
import shardFragment from './shaders/shard/fragment.glsl'

/**
 * Debug
 */
// __gui__
const config = {
	size: 12,
	shardStep: 12,
	color: new THREE.Color(0.45, 0.45, 0.45),
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
mesh.position.y += 0.5
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
camera.position.set(0, 0, 8)
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
		uSize: new THREE.Uniform(config.size),
		uResolution: new THREE.Uniform(
			new THREE.Vector2(sizes.width, sizes.height)
		),
		uShardStep: new THREE.Uniform(config.shardStep),
		uColor: new THREE.Uniform(config.color),
	},
	transparent: true,
})

const shardPass = new ShaderPass(shardMaterial, 'tDiffuse')
composer.addPass(shardPass)

/**
 * Cursor trail
 */
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
// const clock = new THREE.Clock()

/**
 * frame loop
 */
function tic() {
	/**
	 * tempo trascorso dal frame precedente
	 */
	// const deltaTime = clock.getDelta()
	/**
	 * tempo totale trascorso dall'inizio
	 */
	// const time = clock.getElapsedTime()

	// __controls_update__
	controls.update()

	// renderer.render(scene, camera)
	composer.render()

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
}

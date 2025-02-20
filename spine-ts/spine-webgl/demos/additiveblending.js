var additiveBlendingDemo = function (canvas, bgColor) {
	var COLOR_INNER = new spine.Color(0.8, 0, 0, 0.5);
	var COLOR_OUTER = new spine.Color(0.8, 0, 0, 0.8);
	var COLOR_INNER_SELECTED = new spine.Color(0.0, 0, 0.8, 0.5);
	var COLOR_OUTER_SELECTED = new spine.Color(0.0, 0, 0.8, 0.8);
	var HANDLE_SIZE = 0.10;

	var gl, renderer, input, assetManager;
	var skeleton, state, bounds;
	var timeKeeper;
	var target = null;
	var dragging = false;
	var handle = new spine.Vector2();
	var coords = new spine.Vector3(), temp = new spine.Vector3(), temp2 = new spine.Vector2(), temp3 = new spine.Vector3();
	var isPlaying = true;

	var left, right, up, down;
	var cursor;

	var clientMouseX = 0, clientMouseY = 0, mouseMoved;

	if (!bgColor) bgColor = new spine.Color(235 / 255, 239 / 255, 244 / 255, 1);

	function isMobileDevice() {
		return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
	};

	function init() {
		gl = canvas.context.gl;
		renderer = new spine.SceneRenderer(canvas, gl);
		assetManager = new spine.AssetManager(gl, spineDemos.path, spineDemos.downloader);
		assetManager.loadTextureAtlas("atlas2.atlas");
		assetManager.loadJson("demos.json");
		timeKeeper = new spine.TimeKeeper();

		cursor = document.getElementById("cursor");
	}

	function loadingComplete() {
		var atlasLoader = new spine.AtlasAttachmentLoader(assetManager.get("atlas2.atlas"));
		var skeletonJson = new spine.SkeletonJson(atlasLoader);
		var skeletonData = skeletonJson.readSkeletonData(assetManager.get("demos.json").owl);
		skeleton = new spine.Skeleton(skeletonData);
		state = new spine.AnimationState(new spine.AnimationStateData(skeleton.data));

		state.setAnimation(0, "idle", true);
		state.setAnimation(1, "blink", true);
		left = state.setAnimation(2, "left", true);
		right = state.setAnimation(3, "right", true);
		up = state.setAnimation(4, "up", true);
		down = state.setAnimation(5, "down", true);
		left.mixBlend = spine.MixBlend.add;
		right.mixBlend = spine.MixBlend.add;
		up.mixBlend = spine.MixBlend.add;
		down.mixBlend = spine.MixBlend.add;
		left.alpha = 0;
		right.alpha = 0;
		up.alpha = 0;
		down.alpha = 0;

		state.apply(skeleton);
		skeleton.updateWorldTransform(spine.Physics.update);
		var offset = new spine.Vector2();
		bounds = new spine.Vector2();
		skeleton.getBounds(offset, bounds, []);

		renderer.camera.position.x = offset.x + bounds.x / 2;
		renderer.camera.position.y = offset.y + bounds.y / 2;

		renderer.skeletonDebugRenderer.drawMeshHull = false;
		renderer.skeletonDebugRenderer.drawMeshTriangles = false;

		setupInput();
	}

	function calculateBlend(x, y, isPageCoords) {
		var canvasBounds = canvas.getBoundingClientRect();
		var centerX = canvasBounds.x + canvasBounds.width / 2;
		var centerY = canvasBounds.y + canvasBounds.height / 2;
		right.alpha = x < centerX ? 1 - x / centerX : 0;
		left.alpha = x > centerX ? (x - centerX) / (window.innerWidth - centerX) : 0;
		up.alpha = y < centerY ? 1 - y / centerY : 0;
		down.alpha = y > centerY ? (y - centerY) / (window.innerHeight - centerY) : 0;
	}

	function setupInput() {
		if (!isMobileDevice()) {
			document.addEventListener("mousemove", function (event) {
				clientMouseX = event.clientX;
				clientMouseY = event.clientY;
				mouseMoved = true;
			}, false);
		} else {
			var input = new spine.Input(canvas);
			input.addListener({
				down: function (x, y) {
					renderer.camera.screenToWorld(coords.set(x, y, 0), canvas.clientWidth, canvas.clientHeight);
					if (temp.set(handle.x, handle.y, 0).distance(coords) < canvas.width * HANDLE_SIZE) {
						dragging = true;
					}
				},
				up: function (x, y) {
					dragging = false;
				},
				dragged: function (x, y) {
					if (dragging && x > 0 && x < canvas.width && y > 0 && y < canvas.height) {
						renderer.camera.screenToWorld(coords.set(x, y, 0), canvas.clientWidth, canvas.clientHeight);
						handle.x = coords.x;
						handle.y = coords.y;
						calculateBlend(x, y, false);
					}
				}
			});
		}
	}

	function render() {
		if (!isMobileDevice() && mouseMoved) calculateBlend(clientMouseX, clientMouseY, true);

		timeKeeper.update();
		var delta = timeKeeper.delta;

		state.update(delta);
		state.apply(skeleton);
		skeleton.updateWorldTransform(spine.Physics.update);

		renderer.camera.viewportWidth = bounds.x * 1.4;
		renderer.camera.viewportHeight = bounds.y * 1.4;
		renderer.resize(spine.ResizeMode.Fit);

		gl.clearColor(bgColor.r, bgColor.g, bgColor.b, bgColor.a);
		gl.clear(gl.COLOR_BUFFER_BIT);

		renderer.begin();
		renderer.drawSkeleton(skeleton, true);

		if (isMobileDevice()) {
			gl.lineWidth(2);
			renderer.circle(true, handle.x, handle.y, canvas.width * HANDLE_SIZE, COLOR_INNER);
			renderer.circle(false, handle.x, handle.y, canvas.width * HANDLE_SIZE, COLOR_OUTER);
			gl.lineWidth(1);
		}

		renderer.end();
	}

	init();
	additiveBlendingDemo.assetManager = assetManager;
	additiveBlendingDemo.loadingComplete = loadingComplete;
	additiveBlendingDemo.render = render;
};